import React, { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Provider as PaperProvider,
  Text,
  IconButton,
} from "react-native-paper";
import MentsMarketplace from "@/components/MentsMarketplace";
import MentDetailModal from "@/components/MentDetailModal";

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
    const UserSelectScreen = require('../../components/screens/user-select').default;
    return <UserSelectScreen onUserSelected={(user: string) => setSelectedUser(user)} />;
  }

  // Route to appropriate dashboard based on selected user
  const handleSwitchUser = async () => {
    await AsyncStorage.removeItem("selected_user");
    setSelectedUser(null);
  };

  switch (selectedUser) {
    case "aveya":
      return <EarnerMarketplace userName="Aveya" userColor="#E91E63" onSwitchUser={handleSwitchUser} />;
    
    case "onyx":
      return <EarnerMarketplace userName="Onyx" userColor="#2196F3" onSwitchUser={handleSwitchUser} />;
    
    case "lauren":
    case "brett":
      return <ParentDashboard onSwitchUser={handleSwitchUser} selectedUser={selectedUser} />;
    
    default:
      // Reset if unknown user
      setSelectedUser(null);
      return null;
  }
}

// Earner Marketplace Component
function EarnerMarketplace({ userName, userColor, onSwitchUser }: { userName: string; userColor: string; onSwitchUser: () => void }) {
  const [selectedMent, setSelectedMent] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Mock data for now - will be replaced with Supabase queries
  const mockMents = [
    {
      id: '1',
      title: 'Clean the garage',
      description: 'Sweep, organize tools, take out trash',
      category: 'Chores',
      credits: 15,
      timeEstimate: '1 hour',
      dueDate: 'Tomorrow',
      difficulty: 'medium' as const,
      approvalRequired: true,
      issuerName: 'Dad',
      issuerTrust: 'Family',
      issuerRep: 100
    },
    {
      id: '2',
      title: 'Walk the dog',
      description: '30 minute walk around the neighborhood',
      category: 'Pet Care',
      credits: 8,
      timeEstimate: '30 min',
      dueDate: 'Today',
      difficulty: 'easy' as const,
      approvalRequired: false,
      issuerName: 'Mom',
      issuerTrust: 'Family',
      issuerRep: 100
    }
  ];

  const handleCommit = (mentId: string) => {
    console.log('Committed to ment:', mentId);
    setShowDetail(false);
    // TODO: Integrate with Supabase
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: 50, right: 16, zIndex: 1000 }}>
        <IconButton 
          icon="account-switch" 
          onPress={onSwitchUser}
          style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        />
      </View>
      <MentsMarketplace 
        userName={userName}
        userColor={userColor}
        ments={mockMents}
        activeMents={[]}
        onMentPress={(ment) => {
          setSelectedMent(ment);
          setShowDetail(true);
        }}
        onRefresh={() => {
          console.log('Refreshing ments...');
          // TODO: Fetch from Supabase
        }}
      />
      <MentDetailModal
        visible={showDetail}
        onDismiss={() => setShowDetail(false)}
        ment={selectedMent}
        onCommit={handleCommit}
      />
    </View>
  );
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
