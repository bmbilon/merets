import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Surface, Text, Avatar, Divider, Switch, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileSettingsProps {
  userId: string;
  userName: string;
}

export default function ProfileSettings({ userId, userName }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    loadSettings();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const notifications = await AsyncStorage.getItem('notifications_enabled');
      const sound = await AsyncStorage.getItem('sound_enabled');
      
      if (notifications !== null) setNotificationsEnabled(notifications === 'true');
      if (sound !== null) setSoundEnabled(sound === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('selected_user');
            // Navigate to login screen (implement based on your navigation)
          }
        }
      ]
    );
  };

  if (loading || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  const level = Math.floor(profile.total_xp / 100) + 1;
  const xpInLevel = profile.total_xp % 100;
  const xpToNextLevel = 100;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Profile Header */}
      <LinearGradient
        colors={['#7B1FA2', '#6A1B9A']}
        style={{ paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20, alignItems: 'center' }}
      >
        <Avatar.Text
          size={100}
          label={userName.substring(0, 2).toUpperCase()}
          style={{ backgroundColor: '#fff', marginBottom: 16 }}
          labelStyle={{ color: '#7B1FA2', fontSize: 40, fontWeight: 'bold' }}
        />
        <Text variant="headlineMedium" style={{ color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>
          {userName}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 8 }}>
          Level {level} • {profile.total_xp} XP
        </Text>
        <View style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.3)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ 
            width: `${(xpInLevel / xpToNextLevel) * 100}%`, 
            height: '100%', 
            backgroundColor: '#fff' 
          }} />
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
          {xpInLevel}/{xpToNextLevel} XP to Level {level + 1}
        </Text>
      </LinearGradient>

      {/* Stats */}
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <Surface style={{ flex: 1, padding: 16, borderRadius: 12, elevation: 2, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#4CAF50' }}>
              ${(profile.total_earnings_cents / 100).toFixed(2)}
            </Text>
            <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              Total Earned
            </Text>
          </Surface>

          <Surface style={{ flex: 1, padding: 16, borderRadius: 12, elevation: 2, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FF6B00' }}>
              {profile.current_streak || 0}🔥
            </Text>
            <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              Day Streak
            </Text>
          </Surface>
        </View>

        {/* Account Section */}
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
          Account
        </Text>
        <Surface style={{ borderRadius: 12, marginBottom: 20, elevation: 2 }}>
          <View style={{ overflow: 'hidden', borderRadius: 12 }}>
          <TouchableOpacity 
            style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => {/* Navigate to edit profile */}}
          >
            <View>
              <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                Edit Profile
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>
                Change name, avatar, and bio
              </Text>
            </View>
            <Text style={{ color: '#7B1FA2', fontSize: 20 }}>›</Text>
          </TouchableOpacity>
          
          <Divider />
          
          <TouchableOpacity 
            style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => {/* Navigate to change password */}}
          >
            <View>
              <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                Change Password
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>
                Update your password
              </Text>
            </View>
            <Text style={{ color: '#7B1FA2', fontSize: 20 }}>›</Text>
          </TouchableOpacity>
          </View>
        </Surface>

        {/* Notifications Section */}
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
          Notifications
        </Text>
        <Surface style={{ borderRadius: 12, marginBottom: 20, elevation: 2 }}>
          <View style={{ overflow: 'hidden', borderRadius: 12 }}>
          <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                Push Notifications
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>
                Receive notifications for new tasks and updates
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => {
                setNotificationsEnabled(value);
                saveSetting('notifications_enabled', value);
              }}
              color="#7B1FA2"
            />
          </View>
          
          <Divider />
          
          <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                Sound Effects
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>
                Play sounds for celebrations and achievements
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={(value) => {
                setSoundEnabled(value);
                saveSetting('sound_enabled', value);
              }}
              color="#7B1FA2"
            />  
          </View>
          </View>
        </Surface>

        {/* About Section */}
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
          About
        </Text>
        <Surface style={{ borderRadius: 12, marginBottom: 20, elevation: 2 }}>
          <View style={{ overflow: 'hidden', borderRadius: 12 }}>
          <TouchableOpacity 
            style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => {/* Navigate to help */}}
          >
            <View>
              <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                Help & Support
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>
                Get help with using Merets
              </Text>
            </View>
            <Text style={{ color: '#7B1FA2', fontSize: 20 }}>›</Text>
          </TouchableOpacity>
          
          <Divider />
          
          <TouchableOpacity 
            style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => {/* Navigate to privacy policy */}}
          >
            <View>
              <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                Privacy Policy
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>
                View our privacy policy
              </Text>
            </View>
            <Text style={{ color: '#7B1FA2', fontSize: 20 }}>›</Text>
          </TouchableOpacity>
          
          <Divider />
          
          <View style={{ padding: 16 }}>
            <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 4 }}>
              Version
            </Text>
            <Text style={{ color: '#666', fontSize: 12 }}>
              Merets v1.0.0
            </Text>
          </View>
          </View>
        </Surface>

        {/* Sign Out */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={{ borderColor: '#F44336', borderRadius: 12, marginBottom: 40 }}
          textColor="#F44336"
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
}
