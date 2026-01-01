import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type UserRole = 'earner' | 'parent' | 'issuer';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [userRole, setUserRole] = useState<UserRole>('earner');

  useEffect(() => {
    // Determine user role from selected user
    AsyncStorage.getItem('selected_user').then((user) => {
      if (user === 'lauren' || user === 'brett') {
        setUserRole('parent');
      } else if (user === 'aveya' || user === 'onyx') {
        setUserRole('earner');
      }
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 85,
          paddingBottom: 20,
          paddingTop: 8,
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#333' : '#e0e0e0',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}>
      
      {/* EARNER TABS */}
      {userRole === 'earner' && (
        <>
          {/* Browse Marketplace */}
          <Tabs.Screen
            name="index"
            options={{
              title: 'Browse',
              tabBarIcon: ({ color }) => <IconSymbol size={24} name="square.grid.2x2" color={color} />,
            }}
          />

          {/* My Ments (Active/Completed) */}
          <Tabs.Screen
            name="aveya-dashboard"
            options={{
              title: 'My Ments',
              tabBarIcon: ({ color }) => <IconSymbol size={24} name="list.clipboard" color={color} />,
            }}
          />

          {/* Stats */}
          <Tabs.Screen
            name="skills"
            options={{
              title: 'Stats',
              tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
            }}
          />
        </>
      )}

      {/* PARENT/ISSUER TABS */}
      {(userRole === 'parent' || userRole === 'issuer') && (
        <>
          {/* Dashboard */}
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
            }}
          />

          {/* Tasks (Approvals + Task Manager) */}
          <Tabs.Screen
            name="parent"
            options={{
              title: 'Tasks',
              tabBarIcon: ({ color }) => <IconSymbol size={24} name="checkmark.seal.fill" color={color} />,
            }}
          />

          {/* Payouts */}
          <Tabs.Screen
            name="family-chat"
            options={{
              title: 'Payouts',
              tabBarIcon: ({ color }) => <IconSymbol size={24} name="banknote" color={color} />,
            }}
          />
        </>
      )}

      {/* Hide unused tabs */}
      {userRole === 'earner' && (
        <>
          <Tabs.Screen name="parent" options={{ href: null }} />
          <Tabs.Screen name="family-chat" options={{ href: null }} />
          <Tabs.Screen name="issuer-dashboard" options={{ href: null }} />
        </>
      )}
      
      {(userRole === 'parent' || userRole === 'issuer') && (
        <>
          <Tabs.Screen name="aveya-dashboard" options={{ href: null }} />
          <Tabs.Screen name="skills" options={{ href: null }} />
          <Tabs.Screen name="issuer-dashboard" options={{ href: null }} />
        </>
      )}

      {/* All Roles: Inbox */}
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="tray.fill" color={color} />,
        }}
      />
      
      {/* Hidden screens */}
      <Tabs.Screen
        name="onyx-dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="database-test"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
