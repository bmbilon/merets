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
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      
      {/* EARNER TABS */}
      {userRole === 'earner' && (
        <>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Ments',
              tabBarIcon: ({ color }) => <IconSymbol size={26} name="list.bullet.rectangle" color={color} />,
            }}
          />
          <Tabs.Screen
            name="skills"
            options={{
              title: 'Progress',
              tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.line.uptrend.xyaxis" color={color} />,
            }}
          />
          <Tabs.Screen
            name="family-chat"
            options={{
              title: 'Credits',
              tabBarIcon: ({ color }) => <IconSymbol size={26} name="dollarsign.circle.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="inbox"
            options={{
              title: 'Inbox',
              tabBarIcon: ({ color }) => <IconSymbol size={26} name="bell.fill" color={color} />,
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
              title: 'Approvals',
              tabBarIcon: ({ color }) => <IconSymbol size={26} name="checkmark.circle.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="index"
            options={{
              title: 'Kids',
              tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="family-chat"
            options={{
              title: 'Credits',
              tabBarIcon: ({ color }) => <IconSymbol size={26} name="creditcard.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="inbox"
            options={{
              title: 'Inbox',
              tabBarIcon: ({ color }) => <IconSymbol size={26} name="bell.fill" color={color} />,
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
              title: 'Issue',
              tabBarIcon: ({ color }) => <IconSymbol size={26} name="plus.circle.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="parent"
            options={{
              title: 'Review',
              tabBarIcon: ({ color }) => <IconSymbol size={26} name="star.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="family-chat"
            options={{
              title: 'Favorites',
              tabBarIcon: ({ color }) => <IconSymbol size={26} name="heart.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="inbox"
            options={{
              title: 'Inbox',
              tabBarIcon: ({ color }) => <IconSymbol size={26} name="bell.fill" color={color} />,
            }}
          />
        </>
      )}
      
      {/* Hidden tabs - accessible but not shown in navigation */}
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
