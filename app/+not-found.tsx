import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { useLanguage } from '@/providers/LanguageProvider';

export default function NotFoundScreen() {
  const { t } = useLanguage();
  return (
    <>
      <Stack.Screen options={{ title: t.notFound.title }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🍃</Text>
        <Text style={styles.title}>{t.notFound.message}</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t.notFound.returnHome}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  link: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.accent,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600' as const,
  },
});
