import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '@/lib/firebase';
import { User } from '@/types/auth';

const AUTH_KEY = 'auth_state';

// Server-side account deletion (auth user + Firestore data). See
// functions/src/delete-account.ts.
const callDeleteAccount = httpsCallable(functions, 'deleteAccount');

const GOOGLE_WEB_CLIENT_ID = '697328573545-8ncat02t1ghmkgna9o21rgnhf8tp0e85.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

function inferProvider(fbUser: FirebaseUser): 'google' | 'apple' {
  const providerId = fbUser.providerData[0]?.providerId;
  return providerId === 'apple.com' ? 'apple' : 'google';
}

function mapFirebaseUser(
  fbUser: FirebaseUser,
  provider: 'google' | 'apple',
  nameOverride?: string | null,
): User {
  const createdAt = fbUser.metadata.creationTime
    ? new Date(fbUser.metadata.creationTime).getTime()
    : Date.now();

  return {
    id: fbUser.uid,
    email: fbUser.email ?? '',
    name: nameOverride || fbUser.displayName || 'Haiku Poet',
    provider,
    createdAt,
  };
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Subscribe to Firebase auth state. Persistence is handled by Firebase
  // (AsyncStorage on native, IndexedDB on web), so this fires on app launch
  // for already-signed-in users.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Prefer cached profile — Apple only sends name/email on first sign-in,
        // so we can't reliably reconstruct it from the Firebase user alone.
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        const cached: User | null = stored ? JSON.parse(stored) : null;

        if (cached && cached.id === fbUser.uid) {
          setUser(cached);
        } else {
          const mapped = mapFirebaseUser(fbUser, inferProvider(fbUser));
          setUser(mapped);
          await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(mapped));
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem(AUTH_KEY);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAuthenticated = useMemo(() => user !== null, [user]);

  const googleSignInMutation = useMutation({
    mutationFn: async () => {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (!response.data) {
        throw new Error('Google sign-in was cancelled');
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error('Google sign-in returned no ID token');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);

      const mapped = mapFirebaseUser(
        result.user,
        'google',
        response.data.user.name ?? result.user.displayName,
      );
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(mapped));
      setUser(mapped);
      return mapped;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const appleSignInMutation = useMutation({
    mutationFn: async () => {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple sign-in is only available on iOS');
      }

      // Apple expects a SHA-256 hash of a raw nonce; Firebase needs the raw
      // nonce so it can re-hash and verify against the JWT.
      const rawNonce =
        Math.random().toString(36).slice(2) +
        Date.now().toString(36) +
        Math.random().toString(36).slice(2);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('Apple sign-in returned no identity token');
      }

      const provider = new OAuthProvider('apple.com');
      const oauthCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce,
      });
      const result = await signInWithCredential(auth, oauthCredential);

      // Apple only returns name/email on the first sign-in. Capture it now;
      // on subsequent sign-ins fall back to whatever Firebase / cache has.
      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName]
            .filter(Boolean)
            .join(' ')
        : null;

      const stored = await AsyncStorage.getItem(AUTH_KEY);
      const cached: User | null = stored ? JSON.parse(stored) : null;

      const mapped = mapFirebaseUser(
        result.user,
        'apple',
        fullName ||
          cached?.name ||
          result.user.displayName ||
          'Haiku Poet',
      );
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(mapped));
      setUser(mapped);
      return mapped;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const logout = useCallback(async () => {
    try {
      if (user?.provider === 'google') {
        await GoogleSignin.signOut();
      }
    } catch {
      // Ignore — Firebase signOut + local cleanup is enough.
    }
    await signOut(auth);
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
    queryClient.invalidateQueries({ queryKey: ['auth'] });
  }, [queryClient, user]);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      // 1. Server deletes the Auth user + Firestore data. Throws if it fails,
      //    so we don't clear local state on a failed deletion.
      await callDeleteAccount();

      // 2. Local cleanup. The Auth user no longer exists, so signOut may be a
      //    no-op or error — best-effort.
      try {
        if (user?.provider === 'google') {
          await GoogleSignin.signOut();
        }
      } catch {
        // Ignore.
      }
      try {
        await signOut(auth);
      } catch {
        // currentUser is already invalid post-deletion; ignore.
      }
      await AsyncStorage.removeItem(AUTH_KEY);
      setUser(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const needsSignUp = useMemo(() => !isAuthenticated, [isAuthenticated]);

  return {
    user,
    isAuthenticated,
    isLoading,
    needsSignUp,
    signInWithGoogle: () => googleSignInMutation.mutateAsync(),
    signInWithApple: () => appleSignInMutation.mutateAsync(),
    isSigningIn: googleSignInMutation.isPending || appleSignInMutation.isPending,
    signInError:
      googleSignInMutation.error?.message ??
      appleSignInMutation.error?.message ??
      null,
    logout,
    deleteAccount: () => deleteAccountMutation.mutateAsync(),
    isDeletingAccount: deleteAccountMutation.isPending,
  };
});
