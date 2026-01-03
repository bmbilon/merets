import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { Surface, Text, Chip, Avatar, Searchbar, ProgressBar } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';
import RepBadge from '@/components/RepBadge';

interface Task {
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

interface EarnerTaskMarketProps {
  userName?: string;
  tasks?: Task[];
  activeTasks?: Task[];
  totalEarnings?: number;
  currentStreak?: number;
  level?: number;
  totalXP?: number;
  repScore?: number;
  onTaskPress: (task: Task) => void;
  onRefresh?: () => void;
}

export default function EarnerTaskMarket({ 
  userName = 'Earner',
  tasks: externalTasks,
  activeTasks: externalActiveTasks,
  totalEarnings = 0,
  currentStreak = 0,
  level = 1,
  totalXP = 0,
  repScore = 10,
  onTaskPress,
  onRefresh: onRefreshProp
}: EarnerTaskMarketProps) {
  console.log('🎮 NEW EarnerTaskMarket with gamification loaded!');
  
  const [activeSection, setActiveSection] = useState<'available' | 'quick' | 'recommended' | 'active'>('available');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'pay'>('category');
  const [sortBy, setSortBy] = useState<'pay' | 'time' | 'value'>('pay');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  // Collapse all categories by default when groupedTasks changes
  React.useEffect(() => {
    const allCategories = new Set(Object.keys(groupedTasks));
    setCollapsedCategories(allCategories);
  }, [activeSection, groupBy]); // Re-collapse when section or grouping changes

  const tasks: Task[] = externalTasks || [];

  const onRefresh = async () => {
    setRefreshing(true);
    if (onRefreshProp) {
      await onRefreshProp();
    }
    setRefreshing(false);
  };

  // Filter and search tasks
  const groupedTasks = useMemo(() => {
    let filtered = tasks.filter(t => t.status === activeSection);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.issuerName.toLowerCase().includes(query)
      );
    }
    
    // Group tasks
    if (groupBy === 'none') {
      return { 'All Tasks': filtered };
    } else if (groupBy === 'category') {
      const groups: Record<string, Task[]> = {};
      filtered.forEach(task => {
        const cat = task.category || 'Other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(task);
      });
      // Sort each group based on sortBy
      Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => {
          if (sortBy === 'pay') {
            return b.credits - a.credits; // Highest pay first
          } else if (sortBy === 'time') {
            // Parse time estimate (e.g., "20 min" -> 20)
            const timeA = parseInt(a.timeEstimate) || 0;
            const timeB = parseInt(b.timeEstimate) || 0;
            return timeA - timeB; // Shortest time first
          } else { // sortBy === 'value' (pay per minute)
            const timeA = parseInt(a.timeEstimate) || 1;
            const timeB = parseInt(b.timeEstimate) || 1;
            const valueA = a.credits / timeA;
            const valueB = b.credits / timeB;
            return valueB - valueA; // Highest value per minute first
          }
        });
      });
      return groups;
    } else { // groupBy === 'pay'
      const groups: Record<string, Task[]> = {
        'High Pay ($8+)': [],
        'Medium Pay ($4-7)': [],
        'Quick Cash ($1-3)': []
      };
      filtered.forEach(task => {
        if (task.credits >= 8) groups['High Pay ($8+)'].push(task);
        else if (task.credits >= 4) groups['Medium Pay ($4-7)'].push(task);
        else groups['Quick Cash ($1-3)'].push(task);
      });
      return groups;
    }
  }, [tasks, activeSection, searchQuery, groupBy, sortBy]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#999';
    }
  };

  const renderTaskCard = (task: Task) => (
    <TouchableOpacity
      key={task.id}
      onPress={() => onTaskPress(task)}
      activeOpacity={0.7}
    >
      <Surface
        style={{
          marginBottom: 8,
          borderRadius: 12,
          backgroundColor: '#fff',
          elevation: 1,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: task.status === 'recommended' ? '#FFD700' : 'transparent'
        }}
      >
        {/* Recommended Badge */}
        {task.status === 'recommended' && (
          <View style={{ 
            position: 'absolute', 
            top: 12, 
            right: 12, 
            backgroundColor: '#FFD700',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            zIndex: 1
          }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#000' }}>⭐ Recommended</Text>
          </View>
        )}

        <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Price Badge */}
          <View style={{ 
            backgroundColor: '#E8F5E9',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 10,
            minWidth: 55,
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2E7D32' }}>
              ${task.credits}
            </Text>
          </View>
          
          {/* Task Info */}
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 2, color: '#1a1a1a' }}>
              {task.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 10, color: '#999' }}>🕒 {task.timeEstimate}</Text>
              <Text style={{ fontSize: 10, color: getDifficultyColor(task.difficulty), fontWeight: '600' }}>
                {task.difficulty.toUpperCase()}
              </Text>
              {task.approvalRequired && (
                <Text style={{ fontSize: 10, color: '#FF9800' }}>🔒 Approval</Text>
              )}
            </View>
          </View>
          
          {/* Start Button */}
          <View style={{
            backgroundColor: '#6200ee',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12
          }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
              →
            </Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>
        {searchQuery.trim() ? '🔍' : activeSection === 'active' ? '🎯' : '📋'}
      </Text>
      <Text variant="titleMedium" style={{ color: '#666', textAlign: 'center', marginBottom: 8 }}>
        {searchQuery.trim() 
          ? 'No tasks found'
          : activeSection === 'active' 
            ? 'No active tasks yet'
            : 'No tasks available'}
      </Text>
      <Text variant="bodyMedium" style={{ color: '#999', textAlign: 'center' }}>
        {searchQuery.trim() 
          ? `Try a different search term`
          : activeSection === 'active' 
            ? 'Browse available tasks to get started!'
            : 'Check back soon for new opportunities!'}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header with Stats */}
      <LinearGradient
        colors={['#6200ee', '#7c4dff']}
        style={{
          paddingTop: 50,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      >
        <Text variant="titleLarge" style={{ color: '#fff', fontWeight: 'bold', marginBottom: 12 }}>
          Hey {userName}! 👋
        </Text>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: 10, 
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)'
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, marginBottom: 2 }}>
              Total Earned
            </Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              ${totalEarnings.toFixed(2)}
            </Text>
          </View>

          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: 10, 
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)'
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, marginBottom: 2 }}>
              Rep Level
            </Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              {repScore}
            </Text>
          </View>

          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: 10, 
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)'
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, marginBottom: 2 }}>
              Streak 🔥
            </Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              {currentStreak}d
            </Text>
          </View>

          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: 10, 
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <RepBadge repScore={repScore} variant="minimal" />
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, marginTop: 4 }}>
              Rep
            </Text>
          </View>
        </View>



        {/* Search Bar */}
        <Searchbar
          placeholder="Search tasks..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ 
            backgroundColor: '#fff',
            borderRadius: 12,
            elevation: 0,
            height: 44
          }}
          inputStyle={{ fontSize: 14 }}
          iconColor="#6200ee"
        />
      </LinearGradient>

      {/* Sort/Group Bar */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Text variant="labelSmall" style={{ color: '#666' }}>Group:</Text>
          <Chip
            selected={groupBy === 'category'}
            onPress={() => setGroupBy('category')}
            compact
            style={{ height: 32, backgroundColor: groupBy === 'category' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ fontSize: 12, color: groupBy === 'category' ? '#fff' : '#666', lineHeight: 16 }}
          >
            Category
          </Chip>
          <Chip
            selected={groupBy === 'pay'}
            onPress={() => setGroupBy('pay')}
            compact
            style={{ height: 32, backgroundColor: groupBy === 'pay' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ fontSize: 12, color: groupBy === 'pay' ? '#fff' : '#666', lineHeight: 16 }}
          >
            Pay
          </Chip>
          <Chip
            selected={groupBy === 'none'}
            onPress={() => setGroupBy('none')}
            compact
            style={{ height: 32, backgroundColor: groupBy === 'none' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ fontSize: 12, color: groupBy === 'none' ? '#fff' : '#666', lineHeight: 16 }}
          >
            All
          </Chip>
          
          <View style={{ width: 1, height: 24, backgroundColor: '#e0e0e0', marginHorizontal: 4 }} />
          
          <Text variant="labelSmall" style={{ color: '#666' }}>Sort:</Text>
          <Chip
            selected={sortBy === 'pay'}
            onPress={() => setSortBy('pay')}
            compact
            style={{ height: 32, backgroundColor: sortBy === 'pay' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ fontSize: 12, color: sortBy === 'pay' ? '#fff' : '#666', lineHeight: 16 }}
          >
            💰 Pay
          </Chip>
          <Chip
            selected={sortBy === 'value'}
            onPress={() => setSortBy('value')}
            compact
            style={{ height: 32, backgroundColor: sortBy === 'value' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ fontSize: 12, color: sortBy === 'value' ? '#fff' : '#666', lineHeight: 16 }}
          >
            ⚡ $/min
          </Chip>
          <Chip
            selected={sortBy === 'time'}
            onPress={() => setSortBy('time')}
            compact
            style={{ height: 32, backgroundColor: sortBy === 'time' ? '#6200ee' : '#f5f5f5' }}
            textStyle={{ fontSize: 12, color: sortBy === 'time' ? '#fff' : '#666', lineHeight: 16 }}
          >
            ⏱️ Time
          </Chip>
        </View>
      </View>

      {/* Section Tabs */}
      <View style={{ backgroundColor: '#fff', paddingVertical: 12 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          <Chip
            selected={activeSection === 'available'}
            onPress={() => setActiveSection('available')}
            style={{ 
              backgroundColor: activeSection === 'available' ? '#6200ee' : '#f5f5f5',
              height: 36
            }}
            textStyle={{ 
              color: activeSection === 'available' ? '#fff' : '#666',
              fontWeight: '600',
              fontSize: 13
            }}
          >
            📋 Available
          </Chip>
          <Chip
            selected={activeSection === 'quick'}
            onPress={() => setActiveSection('quick')}
            style={{ 
              backgroundColor: activeSection === 'quick' ? '#6200ee' : '#f5f5f5',
              height: 36
            }}
            textStyle={{ 
              color: activeSection === 'quick' ? '#fff' : '#666',
              fontWeight: '600',
              fontSize: 13
            }}
          >
            ⚡ Quick Wins
          </Chip>
          <Chip
            selected={activeSection === 'recommended'}
            onPress={() => setActiveSection('recommended')}
            style={{ 
              backgroundColor: activeSection === 'recommended' ? '#6200ee' : '#f5f5f5',
              height: 36
            }}
            textStyle={{ 
              color: activeSection === 'recommended' ? '#fff' : '#666',
              fontWeight: '600',
              fontSize: 13
            }}
          >
            ⭐ For You
          </Chip>
          <Chip
            selected={activeSection === 'active'}
            onPress={() => setActiveSection('active')}
            style={{ 
              backgroundColor: activeSection === 'active' ? '#6200ee' : '#f5f5f5',
              height: 36
            }}
            textStyle={{ 
              color: activeSection === 'active' ? '#fff' : '#666',
              fontWeight: '600',
              fontSize: 13
            }}
          >
            🔥 My Tasks
          </Chip>
        </ScrollView>
      </View>

      {/* Task List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />
        }
      >
        {Object.keys(groupedTasks).length === 0 || Object.values(groupedTasks).every(arr => arr.length === 0) ? (
          renderEmptyState()
        ) : (
          Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            groupTasks.length > 0 && (
              <View key={groupName} style={{ marginBottom: 16 }}>
                {groupBy !== 'none' && (
                  <TouchableOpacity 
                    onPress={() => toggleCategory(groupName)}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      marginBottom: 8,
                      paddingBottom: 6,
                      borderBottomWidth: 2,
                      borderBottomColor: '#6200ee'
                    }}
                  >
                    <Text variant="titleSmall" style={{ fontWeight: 'bold', color: '#6200ee' }}>
                      {groupName}
                    </Text>
                    <Text variant="bodySmall" style={{ marginLeft: 8, color: '#999' }}>
                      ({groupTasks.length})
                    </Text>
                    <Text style={{ marginLeft: 'auto', color: '#6200ee', fontSize: 18 }}>
                      {collapsedCategories.has(groupName) ? '▼' : '▲'}
                    </Text>
                  </TouchableOpacity>
                )}
                {!collapsedCategories.has(groupName) && groupTasks.map(renderTaskCard)}
              </View>
            )
          ))
        )}
      </ScrollView>
    </View>
  );
}
