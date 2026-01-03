import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Provider as PaperProvider, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StatsScreen from '@/components/StatsScreen';
import { supabase } from '@/lib/supabase';

export default function SkillsTab() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  // Reload user when tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, [])
  );

  const loadUser = async () => {
    try {
      const selectedUser = await AsyncStorage.getItem('selected_user');
      if (!selectedUser) {
        setLoading(false);
        return;
      }

      // Get user profile from database
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('name', selectedUser.charAt(0).toUpperCase() + selectedUser.slice(1))
        .single();

      if (profile) {
        setUserId(profile.id);
        setUserName(profile.name);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PaperProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </PaperProvider>
    );
  }

  if (!userId) {
    return (
      <PaperProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ textAlign: 'center', color: '#666' }}>
            Please select a user to view stats
          </Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <StatsScreen userId={userId} userName={userName} />
    </PaperProvider>
  );
}
