import React, { useState, useEffect } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Provider as PaperProvider,
  Text,
  IconButton,
} from "react-native-paper";
import MentsMarketplace from "@/components/MentsMarketplace";
import MentDetailModal from "@/components/MentDetailModal";
import { supabase } from "@/lib/supabase";

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
  const [ments, setMents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from Supabase
  useEffect(() => {
    fetchMents();
  }, []);

  const fetchMents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .order('skill_category', { ascending: true });

      if (error) {
        console.error('Error fetching ments:', error);
        return;
      }

      // Transform Supabase data to match component format
      const transformedMents = data?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        category: task.skill_category,
        credits: task.base_pay_cents / 100, // Convert cents to dollars
        timeEstimate: `${task.effort_minutes} min`,
        dueDate: 'Available now',
        difficulty: task.difficulty_level === 1 ? 'easy' : task.difficulty_level === 2 ? 'medium' : 'hard',
        approvalRequired: false,
        issuerName: 'Family',
        issuerTrust: 'Family',
        issuerRep: 100,
        status: task.is_micro_task ? 'quick' : 'available'
      })) || [];

      setMents(transformedMents);
    } catch (error) {
      console.error('Error in fetchMents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = (mentId: string) => {
    console.log('Committed to ment:', mentId);
    setShowDetail(false);
    // TODO: Create commitment in Supabase
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading ments...</Text>
      </View>
    );
  }

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
        ments={ments}
        activeMents={[]}
        onMentPress={(ment) => {
          setSelectedMent(ment);
          setShowDetail(true);
        }}
        onRefresh={fetchMents}
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
