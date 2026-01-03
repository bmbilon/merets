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
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Determine user role from selected user
    const loadUserRole = async () => {
      try {
        const user = await AsyncStorage.getItem('selected_user');
        console.log('[TabLayout] ===== LOADING USER ROLE =====');
        console.log('[TabLayout] Selected user:', user);
        
        let role: UserRole;
        if (user === 'lauren' || user === 'brett') {
          role = 'parent';
        } else if (user === 'aveya' || user === 'onyx') {
          role = 'earner';
        } else {
          role = 'earner'; // Default to earner
        }
        
        console.log('[TabLayout] Setting userRole to:', role);
        setUserRole(role);
      } catch (error) {
        console.error('[TabLayout] Error loading user:', error);
        setUserRole('earner');
      } finally {
        setIsLoading(false);
      }
    };
    loadUserRole();
  }, []);

  // Don't render tabs until we know the user role
  if (isLoading || !userRole) {
    return null;
  }

  console.log('[TabLayout] Rendering tabs with userRole:', userRole);

  const isEarner = userRole === 'earner';
  const isParent = userRole === 'parent' || userRole === 'issuer';

  return (
    <Tabs
      key={`tabs-${userRole}`}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 85,
          paddingBottom: 20,
          paddingTop: 8,
          paddingHorizontal: 20,
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
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 8,
        },
      }}>
      
      {/* Tab 1: Browse (earner) / Dashboard (parent) - ALWAYS VISIBLE */}
      <Tabs.Screen
        name="index"
        options={{
          title: isEarner ? 'Browse' : 'Dashboard',
          tabBarIcon: ({ color }) => (
            <IconSymbol 
              size={24} 
              name={isEarner ? 'square.grid.2x2' : 'house.fill'} 
              color={color} 
            />
          ),
        }}
      />

      {/* Tab 2: My Tasks (earner only) */}
      <Tabs.Screen
        name="my-tasks"
        options={{
          title: 'My Tasks',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="list.clipboard" color={color} />,
          href: isEarner ? '/my-tasks' : null,
        }}
      />

      {/* Tab 2: Tasks (parent only) */}
      <Tabs.Screen
        name="parent"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="checkmark.seal.fill" color={color} />,
          href: isParent ? '/parent' : null,
        }}
      />

      {/* Tab 3: Stats (earner only) */}
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
          href: isEarner ? '/skills' : null,
        }}
      />

      {/* Tab 3: Payouts (parent only) */}
      <Tabs.Screen
        name="payouts"
        options={{
          title: 'Payouts',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="banknote" color={color} />,
          href: isParent ? '/payouts' : null,
        }}
      />

      {/* Tab 4: Inbox - ALWAYS VISIBLE */}
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
