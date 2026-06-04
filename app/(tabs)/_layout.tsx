import { Tabs } from 'expo-router';
import { Feather, BookOpen, Settings } from 'lucide-react-native';
import React from 'react';
import Colors from '@/constants/colors';
import { useLanguage } from '@/providers/LanguageProvider';

export default function TabLayout() {
  const { t } = useLanguage();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="(today)"
        options={{
          title: t.tabs.today,
          tabBarIcon: ({ color, size }) => <Feather size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: t.tabs.archive,
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />

    </Tabs>
  );
}
