import React, { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Provider as PaperProvider,
  Text,
  IconButton,
} from "react-native-paper";

export default function MainApp() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await AsyncStorage.getItem("selected_user");
        setSelectedUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <PaperProvider>
        <View style={{ padding: 16, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading…</Text>
        </View>
      </PaperProvider>
    );
  }

  // Show user selection if no user is selected
  if (!selectedUser) {
    const UserSelectScreen = require('./user-select').default;
    return <UserSelectScreen onUserSelected={(user: string) => setSelectedUser(user)} />;
  }

  // Route to appropriate dashboard based on selected user
  const handleSwitchUser = async () => {
    await AsyncStorage.removeItem("selected_user");
    setSelectedUser(null);
  };

  switch (selectedUser) {
    case "aveya":
      const AveyaDashboard = require('./aveya-dashboard').default;
      return <AveyaDashboard onSwitchUser={handleSwitchUser} />;
    
    case "onyx":
      const OnyxDashboard = require('./onyx-dashboard').default;
      return <OnyxDashboard onSwitchUser={handleSwitchUser} />;
    
    case "lauren":
    case "brett":
      return <ParentDashboard onSwitchUser={handleSwitchUser} selectedUser={selectedUser} />;
    
    default:
      // Reset if unknown user
      setSelectedUser(null);
      return null;
  }
}

// Parent Dashboard Component (using the existing parent screen logic)
function ParentDashboard({ onSwitchUser, selectedUser }: { onSwitchUser: () => void; selectedUser: string }) {
  // Import and use the existing parent screen
  const ParentScreen = require('./parent').default;
  
  // Create a wrapper that includes the switch user functionality
  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: 50, right: 16, zIndex: 1000 }}>
        <IconButton 
          icon="account-switch" 
          onPress={onSwitchUser}
          style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        />
      </View>
      <ParentScreen />
    </View>
  );
}