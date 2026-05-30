import React from 'react';
import { Tabs } from 'expo-router';
import { Trophy, Heart, Newspaper, User } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981', // Glowing Green
        tabBarInactiveTintColor: '#9ca3af', // Soft gray
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.header,
        headerTintColor: '#ffffff',
        headerTitleStyle: styles.headerTitle,
        headerTitleAlign: 'center',
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'المباريات',
          headerTitle: 'كورة لايف - بث حي مباشر ⚽',
          tabBarIcon: ({ color, size }) => (
            <Trophy color={color} size={size - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'المفضلة',
          headerTitle: 'مفضلتك الرياضية ❤️',
          tabBarIcon: ({ color, size }) => (
            <Heart color={color} size={size - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'أخبار رياضية',
          headerTitle: 'الصحيفة والملخصات العالمية 📰',
          tabBarIcon: ({ color, size }) => (
            <Newspaper color={color} size={size - 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          headerTitle: 'الملف الشخصي والإشعارات 👤',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size - 2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0c1223',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1.5,
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  tabBarLabel: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '900',
    fontSize: 11,
    marginTop: 2,
  },
  header: {
    backgroundColor: '#0c1223',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.15)', // Light emerald border highlight
  },
  headerTitle: {
    fontWeight: '900',
    fontSize: 18,
    color: '#ffffff',
  },
});
