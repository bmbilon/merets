import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Surface, Text, Chip, Avatar, Badge, IconButton } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Ment {
  id: string;
  title: string;
  description: string;
  credits: number;
  timeEstimate: string;
  dueDate: string;
  issuerName: string;
  issuerTrustBadge?: string;
  approvalRequired: boolean;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status?: 'recommended' | 'quick' | 'available' | 'active' | 'submitted';
}

interface MentsMarketplaceProps {
  userName?: string;
  userColor?: string;
  ments?: Ment[];
  activeMents?: Ment[];
  onMentPress: (ment: Ment) => void;
  onRefresh?: () => void;
}

export default function MentsMarketplace({ 
  userName,
  userColor,
  ments: externalMents,
  activeMents: externalActiveMents,
  onMentPress,
  onRefresh: onRefreshProp
}: MentsMarketplaceProps) {
  const [activeSection, setActiveSection] = useState<'recommended' | 'quick' | 'available' | 'active'>('recommended');
  const [refreshing, setRefreshing] = useState(false);

  // Use external ments if provided, otherwise use mock data
  const ments: Ment[] = externalMents || [
    {
      id: '1',
      title: 'Clean garage',
      description: 'Sweep and organize tools',
      credits: 15,
      timeEstimate: '45 min',
      dueDate: 'Today',
      issuerName: 'Dad',
      issuerTrustBadge: '⭐',
      approvalRequired: false,
      category: 'Chores',
      difficulty: 'easy',
      status: 'recommended'
    },
    {
      id: '2',
      title: 'Take out recycling',
      description: 'Sort and take bins to curb',
      credits: 5,
      timeEstimate: '10 min',
      dueDate: 'Tomorrow',
      issuerName: 'Mom',
      approvalRequired: false,
      category: 'Chores',
      difficulty: 'easy',
      status: 'quick'
    },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    // Fetch new data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const onRefresh = onRefreshProp || handleRefresh;

  const renderMentCard = (ment: Ment) => (
    <TouchableOpacity
      key={ment.id}
      onPress={() => onMentPress(ment)}
      activeOpacity={0.7}
    >
      <Surface
        style={{
          marginBottom: 12,
          borderRadius: 16,
          padding: 16,
          backgroundColor: '#fff',
          elevation: 2,
        }}
      >
        {/* Header Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {ment.title}
            </Text>
            <Text variant="bodySmall" style={{ color: '#666', marginBottom: 8 }}>
              {ment.description}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
              ${ment.credits}
            </Text>
          </View>
        </View>

        {/* Meta Row */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <Chip
            icon={() => <IconSymbol size={14} name="clock.fill" color="#666" />}
            compact
            style={{ backgroundColor: '#f5f5f5' }}
          >
            {ment.timeEstimate}
          </Chip>
          <Chip
            icon={() => <IconSymbol size={14} name="calendar" color="#666" />}
            compact
            style={{ backgroundColor: '#f5f5f5' }}
          >
            {ment.dueDate}
          </Chip>
          {ment.approvalRequired && (
            <Chip
              icon={() => <IconSymbol size={14} name="lock.fill" color="#FF9800" />}
              compact
              style={{ backgroundColor: '#FFF3E0' }}
              textStyle={{ color: '#FF9800' }}
            >
              Approval needed
            </Chip>
          )}
        </View>

        {/* Footer Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Avatar.Text size={24} label={ment.issuerName[0]} style={{ backgroundColor: '#2196F3' }} />
            <Text variant="bodySmall" style={{ color: '#666' }}>
              {ment.issuerName} {ment.issuerTrustBadge}
            </Text>
          </View>
          <IconButton
            icon={() => <IconSymbol size={20} name="arrow.right.circle.fill" color="#6200ee" />}
            size={20}
            onPress={() => onMentPress(ment)}
          />
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const renderSection = () => {
    const sectionMents = ments.filter(m => m.status === activeSection);
    
    if (sectionMents.length === 0) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text variant="bodyLarge" style={{ color: '#999', textAlign: 'center' }}>
            {activeSection === 'active' 
              ? 'No active ments\nBrowse available ments to get started!'
              : 'No ments available\nCheck back soon!'}
          </Text>
        </View>
      );
    }

    return sectionMents.map(renderMentCard);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
      }}>
        <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 16 }}>
          Ments
        </Text>
        
        {/* Section Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          <Chip
            selected={activeSection === 'recommended'}
            onPress={() => setActiveSection('recommended')}
            style={{ backgroundColor: activeSection === 'recommended' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ color: activeSection === 'recommended' ? '#fff' : '#666' }}
          >
            ⭐ Recommended
          </Chip>
          <Chip
            selected={activeSection === 'quick'}
            onPress={() => setActiveSection('quick')}
            style={{ backgroundColor: activeSection === 'quick' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ color: activeSection === 'quick' ? '#fff' : '#666' }}
          >
            ⚡ Quick
          </Chip>
          <Chip
            selected={activeSection === 'available'}
            onPress={() => setActiveSection('available')}
            style={{ backgroundColor: activeSection === 'available' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ color: activeSection === 'available' ? '#fff' : '#666' }}
          >
            📋 Available
          </Chip>
          <Chip
            selected={activeSection === 'active'}
            onPress={() => setActiveSection('active')}
            style={{ backgroundColor: activeSection === 'active' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ color: activeSection === 'active' ? '#fff' : '#666' }}
          >
            🔥 Active
          </Chip>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderSection()}
      </ScrollView>
    </View>
  );
}
