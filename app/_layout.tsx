import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Provider as PaperProvider } from 'react-native-paper';
import { useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AuthGate from '@/components/auth-gate';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [authKey, setAuthKey] = useState(0);

  // Force remount of entire app when auth completes
  const handleAuthComplete = () => {
    console.log('[RootLayout] Auth complete, forcing remount');
    setAuthKey(prev => prev + 1);
  };

  return (
    <PaperProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGate onAuthComplete={handleAuthComplete}>
          <Stack key={authKey}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </AuthGate>
        <StatusBar style="auto" />
      </ThemeProvider>
    </PaperProvider>
  );
}
