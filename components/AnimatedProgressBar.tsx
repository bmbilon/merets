import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface AnimatedProgressBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
  color?: string;
  showLabel?: boolean;
}

export default function AnimatedProgressBar({
  currentXP,
  maxXP,
  level,
  color = '#9C27B0',
  showLabel = true
}: AnimatedProgressBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const progress = Math.min(currentXP / maxXP, 1);
  const percentage = Math.round(progress * 100);

  useEffect(() => {
    // Animate progress bar
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 40,
      friction: 8,
      useNativeDriver: false
    }).start();

    // Pulse animation when near completion
    if (progress > 0.9) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
    }
  }, [currentXP, maxXP]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View>
      {showLabel && (
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 8 
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <IconSymbol size={20} name="star.fill" color={color} />
            <Text variant="bodyMedium" style={{ fontWeight: '600', color }}>
              Level {level}
            </Text>
          </View>
          <Text variant="bodySmall" style={{ color: '#666' }}>
            {currentXP}/{maxXP} XP ({percentage}%)
          </Text>
        </View>
      )}
      
      <Animated.View
        style={{
          height: 12,
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: 6,
          overflow: 'hidden',
          transform: [{ scale: scaleAnim }]
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            width: progressWidth,
            backgroundColor: color,
            borderRadius: 6,
            position: 'relative'
          }}
        >
          {/* Shine effect */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 6
            }}
          />
        </Animated.View>
      </Animated.View>

      {/* Next milestone indicator */}
      {progress < 1 && showLabel && (
        <Text variant="bodySmall" style={{ color: '#999', marginTop: 4 }}>
          {maxXP - currentXP} XP to next level
        </Text>
      )}
    </View>
  );
}
