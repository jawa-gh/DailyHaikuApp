import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Colors from '@/constants/colors';

interface SplashScreenViewProps {
  onFinish: () => void;
}

export default function SplashScreenView({ onFinish }: SplashScreenViewProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(12)).current;
  const lineWidth1 = useRef(new Animated.Value(0)).current;
  const lineWidth2 = useRef(new Animated.Value(0)).current;
  const haikuLine1Opacity = useRef(new Animated.Value(0)).current;
  const haikuLine2Opacity = useRef(new Animated.Value(0)).current;
  const haikuLine3Opacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(lineWidth1, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(lineWidth2, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(100),
      Animated.stagger(250, [
        Animated.timing(haikuLine1Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(haikuLine2Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(haikuLine3Opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(600),
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          <Animated.View
            style={[
              styles.brushStroke,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Text style={styles.kanji}>俳</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.titleRow,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Text style={styles.title}>Daily Haiku</Text>
          </Animated.View>

          <View style={styles.dividerContainer}>
            <Animated.View
              style={[
                styles.dividerLine,
                {
                  width: lineWidth1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 40],
                  }),
                },
              ]}
            />
            <Animated.View style={[styles.dividerDot, { opacity: subtitleOpacity }]} />
            <Animated.View
              style={[
                styles.dividerLine,
                {
                  width: lineWidth2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 40],
                  }),
                },
              ]}
            />
          </View>

          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: subtitleOpacity,
                transform: [{ translateY: subtitleTranslateY }],
              },
            ]}
          >
            A moment captured in words
          </Animated.Text>
        </View>

        <View style={styles.haikuSection}>
          <Animated.Text style={[styles.haikuLine, { opacity: haikuLine1Opacity }]}>
            Morning light arrives
          </Animated.Text>
          <Animated.Text style={[styles.haikuLine, { opacity: haikuLine2Opacity }]}>
            Gentle words bloom on the page —
          </Animated.Text>
          <Animated.Text style={[styles.haikuLine, { opacity: haikuLine3Opacity }]}>
            Your haiku awaits
          </Animated.Text>
        </View>
      </View>

      <View style={styles.bottomAccent}>
        <View style={styles.accentLine} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: 'center',
  },
  brushStroke: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  kanji: {
    fontSize: 42,
    color: Colors.accent,
    fontWeight: '300' as const,
  },
  titleRow: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '200' as const,
    color: Colors.text,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
    gap: 8,
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.accent,
    opacity: 0.4,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '300' as const,
  },
  haikuSection: {
    alignItems: 'center',
    marginTop: 60,
    gap: 6,
  },
  haikuLine: {
    fontSize: 16,
    color: Colors.textMuted,
    fontStyle: 'italic',
    letterSpacing: 1,
    fontWeight: '300' as const,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    width: '100%',
  },
  accentLine: {
    width: 30,
    height: 2,
    backgroundColor: Colors.accent,
    opacity: 0.3,
    borderRadius: 1,
  },
});
