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
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#333' : '#e0e0e0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}>
      
      {/* EARNER TABS */}
      {userRole === 'earner' && (
        <>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Browse',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.grid.2x2" color={color} />,
            }}
          />
          <Tabs.Screen
            name="aveya-dashboard"
            options={{
              title: 'My Ments',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.clipboard" color={color} />,
            }}
          />
          <Tabs.Screen
            name="skills"
            options={{
              title: 'Stats',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="inbox"
            options={{
              title: 'Inbox',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="tray.fill" color={color} />,
            }}
          />
        </>
      )}

      {/* PARENT TABS */}
      {userRole === 'parent' && (
        <>
          <Tabs.Screen
            name="parent"
            options={{
              title: 'Approve',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="checkmark.seal.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="index"
            options={{
              title: 'Family',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="family-chat"
            options={{
              title: 'Payouts',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="banknote" color={color} />,
            }}
          />
          <Tabs.Screen
            name="inbox"
            options={{
              title: 'Inbox',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="tray.fill" color={color} />,
            }}
          />
        </>
      )}

      {/* ISSUER TABS */}
      {userRole === 'issuer' && (
        <>
          <Tabs.Screen
            name="issuer-dashboard"
            options={{
              title: 'Post',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.app.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="parent"
            options={{
              title: 'Review',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="checklist" color={color} />,
            }}
          />
          <Tabs.Screen
            name="family-chat"
            options={{
              title: 'Network',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.3.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="inbox"
            options={{
              title: 'Inbox',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="tray.fill" color={color} />,
            }}
          />
        </>
      )}
      
      {/* Hidden tabs - accessible but not shown in navigation */}
      <Tabs.Screen
        name="aveya-dashboard"
        options={{
          href: userRole === 'earner' ? undefined : null,
        }}
      />
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
      <Tabs.Screen
        name="skills"
        options={{
          href: userRole === 'earner' ? undefined : null,
        }}
      />
    </Tabs>
  );
}
