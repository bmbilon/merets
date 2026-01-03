import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from 'react-native-paper';
import UserSelectScreen from './screens/user-select';
import PinAuth from './screens/pin-auth';

type User = 'aveya' | 'onyx' | 'lauren' | 'brett';

interface AuthGateProps {
  children: React.ReactNode;
  onAuthComplete: () => void;
}

const USER_KEY = 'selected_user';

export default function AuthGate({ children, onAuthComplete }: AuthGateProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPinAuth, setShowPinAuth] = useState(false);

  useEffect(() => {
    loadUser();
    
    // Poll AsyncStorage every second to detect changes
    const interval = setInterval(() => {
      checkUserChange();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const checkUserChange = async () => {
    try {
      const user = await AsyncStorage.getItem(USER_KEY);
      // Only update if user actually changed
      if (user !== selectedUser) {
        console.log('[AuthGate] User changed from', selectedUser, 'to', user);
        setSelectedUser(user as User | null);
        // Don't call onAuthComplete here - it causes infinite loop
        // The user selection flow will call it when needed
      }
    } catch (error) {
      console.error('[AuthGate] Error checking user change:', error);
    }
  };

  const loadUser = async () => {
    try {
      const user = await AsyncStorage.getItem(USER_KEY);
      console.log('[AuthGate] Loaded user:', user);
      setSelectedUser(user as User | null);
    } catch (error) {
      console.error('[AuthGate] Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isParent = (user: User) => {
    return user === 'lauren' || user === 'brett';
  };

  const handleUserSelected = async (user: User) => {
    console.log('[AuthGate] User selected:', user);
    
    // Check if switching to a parent account
    if (isParent(user)) {
      // If already a parent, allow direct switch
      if (selectedUser && isParent(selectedUser)) {
        await completeUserSwitch(user);
      } else {
        // Require PIN authentication
        setPendingUser(user);
        setShowPinAuth(true);
      }
    } else {
      // Switching to kid account - no auth needed
      await completeUserSwitch(user);
    }
  };

  const completeUserSwitch = async (user: User) => {
    console.log('[AuthGate] Completing user switch to:', user);
    await AsyncStorage.setItem(USER_KEY, user);
    setSelectedUser(user);
    setPendingUser(null);
    setShowPinAuth(false);
    
    // Notify parent that auth is complete and app should reload
    onAuthComplete();
  };

  const handlePinSuccess = async () => {
    if (pendingUser) {
      await completeUserSwitch(pendingUser);
    }
  };

  const handlePinCancel = () => {
    setPendingUser(null);
    setShowPinAuth(false);
  };

  const handleSwitchUser = async () => {
    await AsyncStorage.removeItem(USER_KEY);
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Show PIN auth if required
  if (showPinAuth && pendingUser) {
    const userName = pendingUser.charAt(0).toUpperCase() + pendingUser.slice(1);
    return (
      <PinAuth
        userName={userName}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />
    );
  }

  // Show user selection if no user selected
  if (!selectedUser) {
    return <UserSelectScreen onUserSelected={handleUserSelected} />;
  }

  // User is authenticated, show the app
  return <>{children}</>;
}
