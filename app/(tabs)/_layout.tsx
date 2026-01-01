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
      
      {/* Index/Browse Screen */}
      <Tabs.Screen
        name="index"
        options={{
          title: userRole === 'earner' ? 'Browse' : 'Family',
          tabBarIcon: ({ color }) => (
            <IconSymbol 
              size={24} 
              name={userRole === 'earner' ? 'square.grid.2x2' : 'house.fill'} 
              color={color} 
            />
          ),
          href: userRole === 'earner' || userRole === 'parent' ? undefined : null,
        }}
      />

      {/* Earner: My Ments Dashboard */}
      <Tabs.Screen
        name="aveya-dashboard"
        options={{
          title: 'My Ments',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="list.clipboard" color={color} />,
          href: userRole === 'earner' ? undefined : null,
        }}
      />

      {/* Earner: Stats/Skills */}
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
          href: userRole === 'earner' ? undefined : null,
        }}
      />

      {/* Parent: Approve */}
      <Tabs.Screen
        name="parent"
        options={{
          title: userRole === 'parent' ? 'Approve' : 'Review',
          tabBarIcon: ({ color }) => (
            <IconSymbol 
              size={24} 
              name={userRole === 'parent' ? 'checkmark.seal.fill' : 'checklist'} 
              color={color} 
            />
          ),
          href: userRole === 'parent' || userRole === 'issuer' ? undefined : null,
        }}
      />

      {/* Parent/Issuer: Credits/Payouts/Network */}
      <Tabs.Screen
        name="family-chat"
        options={{
          title: userRole === 'parent' ? 'Payouts' : 'Network',
          tabBarIcon: ({ color }) => (
            <IconSymbol 
              size={24} 
              name={userRole === 'parent' ? 'banknote' : 'person.3.fill'} 
              color={color} 
            />
          ),
          href: userRole === 'parent' || userRole === 'issuer' ? undefined : null,
        }}
      />

      {/* Issuer: Post */}
      <Tabs.Screen
        name="issuer-dashboard"
        options={{
          title: 'Post',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="plus.app.fill" color={color} />,
          href: userRole === 'issuer' ? undefined : null,
        }}
      />

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
