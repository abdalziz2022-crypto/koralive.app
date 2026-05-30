import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible until resources are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Hide splash screen after initialization
    const timer = setTimeout(async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Safe fallback
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#030712' }}>
      <StatusBar style="light" backgroundColor="#030712" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0c1223',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#030712',
          },
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="match/[id]" 
          options={{ 
            headerShown: true, 
            title: "تفاصيل المباراة ⚽",
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: '#0c1223' },
            headerTintColor: '#10b981'
          }} 
        />
      </Stack>
    </View>
  );
}
