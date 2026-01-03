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
      
      {/* Browse/Dashboard - Shows for all, different content per role */}
      <Tabs.Screen
        name="index"
        options={{
          title: userRole === 'earner' ? 'Browse' : 'Dashboard',
          tabBarIcon: ({ color }) => (
            <IconSymbol 
              size={24} 
              name={userRole === 'earner' ? 'square.grid.2x2' : 'house.fill'} 
              color={color} 
            />
          ),
        }}
      />

      {/* My Tasks - Earner only */}
      <Tabs.Screen
        name="my-tasks"
        options={{
          title: 'My Tasks',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="list.clipboard" color={color} />,
          href: userRole === 'earner' ? undefined : null,
        }}
      />

      {/* Tasks - Parent shows this, Earner sees My Ments instead */}
      <Tabs.Screen
        name="parent"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="checkmark.seal.fill" color={color} />,
          href: userRole === 'parent' || userRole === 'issuer' ? undefined : null,
        }}
      />

      {/* Stats - Earner only */}
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
          href: userRole === 'earner' ? undefined : null,
        }}
      />

      {/* Payouts - Parent only */}
      <Tabs.Screen
        name="payouts"
        options={{
          title: 'Payouts',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="banknote" color={color} />,
          href: userRole === 'parent' || userRole === 'issuer' ? undefined : null,
        }}
      />

      {/* Inbox - Shows for all */}
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="tray.fill" color={color} />,
        }}
      />
      
      {/* Hidden screens */}
      <Tabs.Screen
        name="family-chat"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="aveya-dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="onyx-dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="issuer-dashboard"
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
