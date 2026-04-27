import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 92,
          paddingBottom: 32,
          paddingTop: 8,
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Home',      tabBarIcon: ({ color, size }) => <Ionicons name="home-outline"          size={size} color={color} /> }} />
      <Tabs.Screen name="saved"     options={{ title: 'Saved',     tabBarIcon: ({ color, size }) => <Ionicons name="bookmark-outline"      size={size} color={color} /> }} />
      <Tabs.Screen name="stories"   options={{ title: 'Stories',   tabBarIcon: ({ color, size }) => <Ionicons name="book-outline"          size={size} color={color} /> }} />
      <Tabs.Screen name="playlists" options={{ title: 'Playlists', tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="streak"    options={{ title: 'Streak',    tabBarIcon: ({ color, size }) => <Ionicons name="flame-outline"         size={size} color={color} /> }} />
      <Tabs.Screen name="settings"   options={{ title: 'Settings',  tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline"      size={size} color={color} /> }} />
    </Tabs>
  );
}
