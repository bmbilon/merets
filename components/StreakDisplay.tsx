import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  compact?: boolean;
}

export default function StreakDisplay({
  currentStreak,
  longestStreak,
  compact = false
}: StreakDisplayProps) {
  const flameScale = useRef(new Animated.Value(1)).current;
  const flameRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentStreak > 0) {
      // Animate flame
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(flameScale, {
              toValue: 1.2,
              duration: 600,
              useNativeDriver: true
            }),
            Animated.timing(flameScale, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true
            })
          ]),
          Animated.sequence([
            Animated.timing(flameRotate, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true
            }),
            Animated.timing(flameRotate, {
              toValue: -1,
              duration: 1200,
              useNativeDriver: true
            })
          ])
        ])
      ).start();
    }
  }, [currentStreak]);

  const rotation = flameRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg']
  });

  if (compact) {
    return (
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6,
        backgroundColor: currentStreak > 0 ? '#FFEBEE' : '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
      }}>
        <Animated.View
          style={{
            transform: [
              { scale: currentStreak > 0 ? flameScale : 1 },
              { rotate: currentStreak > 0 ? rotation : '0deg' }
            ]
          }}
        >
          <IconSymbol 
            size={20} 
            name={currentStreak > 0 ? "flame.fill" : "flame"} 
            color={currentStreak > 0 ? "#FF5722" : "#999"} 
          />
        </Animated.View>
        <Text 
          variant="bodyMedium" 
          style={{ 
            fontWeight: '600',
            color: currentStreak > 0 ? '#FF5722' : '#999'
          }}
        >
          {currentStreak} day{currentStreak !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  }

  return (
    <Surface
      style={{
        borderRadius: 16,
        padding: 16,
        backgroundColor: '#fff',
        elevation: 2
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Animated.View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: currentStreak > 0 ? '#FFEBEE' : '#f5f5f5',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [
              { scale: currentStreak > 0 ? flameScale : 1 },
              { rotate: currentStreak > 0 ? rotation : '0deg' }
            ]
          }}
        >
          <IconSymbol 
            size={28} 
            name={currentStreak > 0 ? "flame.fill" : "flame"} 
            color={currentStreak > 0 ? "#FF5722" : "#999"} 
          />
        </Animated.View>
        
        <View style={{ flex: 1 }}>
          <Text variant="bodySmall" style={{ color: '#666', marginBottom: 2 }}>
            Current Streak
          </Text>
          <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: currentStreak > 0 ? '#FF5722' : '#999' }}>
            {currentStreak} day{currentStreak !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Longest Streak */}
      <View 
        style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0'
        }}
      >
        <Text variant="bodyMedium" style={{ color: '#666' }}>
          Longest Streak
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <IconSymbol size={16} name="trophy.fill" color="#FFD700" />
          <Text variant="bodyMedium" style={{ fontWeight: '600', color: '#FFD700' }}>
            {longestStreak} day{longestStreak !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Motivational message */}
      {currentStreak === 0 && (
        <Text variant="bodySmall" style={{ color: '#999', marginTop: 8, fontStyle: 'italic' }}>
          Complete a task today to start your streak! 🔥
        </Text>
      )}
      {currentStreak > 0 && currentStreak < 3 && (
        <Text variant="bodySmall" style={{ color: '#FF5722', marginTop: 8, fontStyle: 'italic' }}>
          Keep it going! Complete a task tomorrow to continue your streak!
        </Text>
      )}
      {currentStreak >= 3 && currentStreak < 7 && (
        <Text variant="bodySmall" style={{ color: '#FF5722', marginTop: 8, fontStyle: 'italic' }}>
          You're on fire! 🔥 {7 - currentStreak} more day{7 - currentStreak !== 1 ? 's' : ''} to reach a week!
        </Text>
      )}
      {currentStreak >= 7 && (
        <Text variant="bodySmall" style={{ color: '#FF5722', marginTop: 8, fontStyle: 'italic' }}>
          Amazing! You've been consistent for {currentStreak} days! 🎉
        </Text>
      )}
    </Surface>
  );
}
