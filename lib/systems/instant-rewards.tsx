import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, Alert, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { 
  Text, 
  Card, 
  Button, 
  Avatar, 
  ProgressBar,
  Chip,
  IconButton
} from 'react-native-paper';

import { SkillId, SKILLS, SkillProgress } from './skills-system';
import { GameBadge, getPlayerLevel, PLAYER_TITLES } from './gamification-system';

// Enhanced reward calculation for micro-tasks
export const MICRO_TASK_REWARDS = {
  // Instant rewards for micro-tasks (2-5 min)
  MICRO: {
    baseCents: 300,  // $3.00 for micro-tasks
    baseXP: 15,
    stickerChance: 0.8  // 80% chance of sticker for micro-tasks
  },
  // Standard rewards for longer tasks
  STANDARD: {
    baseCents: 2000, // $20.00 for standard tasks  
    baseXP: 25,
    stickerChance: 1.0  // 100% chance of sticker
  }
};

interface RewardAnimationProps {
  visible: boolean;
  onComplete: () => void;
  rewards: {
    cents: number;
    stickers: number;
    xp: number;
    skillId?: SkillId;
    newBadges?: GameBadge[];
    levelUp?: boolean;
    newLevel?: number;
  };
}

export function RewardAnimation({ visible, onComplete, rewards }: RewardAnimationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Play reward sequence
      playRewardSequence();
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after showing rewards
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(onComplete);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const playRewardSequence = async () => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Ca-ching sound for money
      if (rewards.cents > 0) {
        await playSound('ca-ching');
        setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 100);
      }

      // Level up sound
      if (rewards.levelUp) {
        setTimeout(() => playSound('level-up'), 500);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 500);
      }

      // Badge unlock sound
      if (rewards.newBadges && rewards.newBadges.length > 0) {
        setTimeout(() => playSound('badge-unlock'), 300);
      }

      // XP gain sound
      if (rewards.xp > 0) {
        setTimeout(() => playSound('xp-gain'), 200);
      }

    } catch (error) {
      console.log('Sound playback error:', error);
    }
  };

  const playSound = async (soundType: string) => {
    try {
      // For now, we'll use system sounds. In production you'd have custom sound files
      switch (soundType) {
        case 'ca-ching':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'level-up':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'badge-unlock':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'xp-gain':
          await Haptics.selectionAsync();
          break;
      }
    } catch (error) {
      console.log('Haptic error:', error);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        opacity: fadeAnim,
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Card style={{ 
          minWidth: 300,
          elevation: 8,
          backgroundColor: 'white'
        }}>
          <Card.Content style={{ alignItems: 'center', gap: 20, padding: 30 }}>
            {/* Celebration Header */}
            <Text variant="headlineMedium" style={{ 
              fontWeight: 'bold', 
              color: '#4CAF50',
              textAlign: 'center'
            }}>
              🎉 Task Complete! 🎉
            </Text>

            {/* Rewards Grid */}
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap', 
              gap: 16,
              justifyContent: 'center'
            }}>
              {/* Money Reward */}
              {rewards.cents > 0 && (
                <View style={{ 
                  alignItems: 'center', 
                  backgroundColor: '#4CAF5020',
                  padding: 16,
                  borderRadius: 12,
                  minWidth: 100
                }}>
                  <Text variant="titleLarge" style={{ 
                    fontWeight: 'bold',
                    color: '#4CAF50'
                  }}>
                    +${(rewards.cents / 100).toFixed(2)}
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#666' }}>
                    Earned
                  </Text>
                </View>
              )}

              {/* Stickers */}
              {rewards.stickers > 0 && (
                <View style={{ 
                  alignItems: 'center',
                  backgroundColor: '#FF980020', 
                  padding: 16,
                  borderRadius: 12,
                  minWidth: 100
                }}>
                  <Text variant="titleLarge" style={{ 
                    fontWeight: 'bold',
                    color: '#FF9800'
                  }}>
                    +{rewards.stickers} 🏆
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#666' }}>
                    Stickers
                  </Text>
                </View>
              )}

              {/* XP Gain */}
              {rewards.xp > 0 && rewards.skillId && (
                <View style={{ 
                  alignItems: 'center',
                  backgroundColor: `${SKILLS[rewards.skillId].color}20`,
                  padding: 16,
                  borderRadius: 12,
                  minWidth: 100
                }}>
                  <Avatar.Icon 
                    size={32}
                    icon={SKILLS[rewards.skillId].icon}
                    style={{ backgroundColor: SKILLS[rewards.skillId].color, marginBottom: 8 }}
                  />
                  <Text variant="titleSmall" style={{ 
                    fontWeight: 'bold',
                    color: SKILLS[rewards.skillId].color
                  }}>
                    +{rewards.xp} XP
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#666' }}>
                    {SKILLS[rewards.skillId].name}
                  </Text>
                </View>
              )}
            </View>

            {/* Level Up */}
            {rewards.levelUp && rewards.newLevel && (
              <View style={{
                backgroundColor: '#9C27B020',
                padding: 20,
                borderRadius: 12,
                alignItems: 'center',
                width: '100%'
              }}>
                <Text variant="headlineSmall" style={{ 
                  fontWeight: 'bold', 
                  color: '#9C27B0',
                  marginBottom: 8
                }}>
                  🚀 LEVEL UP! 🚀
                </Text>
                <Text variant="titleMedium" style={{ 
                  color: '#9C27B0',
                  textAlign: 'center'
                }}>
                  You're now a {PLAYER_TITLES[rewards.newLevel as keyof typeof PLAYER_TITLES].name}!
                </Text>
              </View>
            )}

            {/* New Badges */}
            {rewards.newBadges && rewards.newBadges.length > 0 && (
              <View style={{
                backgroundColor: '#FF980020',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                width: '100%'
              }}>
                <Text variant="titleMedium" style={{ 
                  fontWeight: 'bold',
                  color: '#FF9800',
                  marginBottom: 12
                }}>
                  🏆 New Badge Unlocked!
                </Text>
                {rewards.newBadges.map((badge, index) => (
                  <View key={index} style={{ 
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 8
                  }}>
                    <Avatar.Icon 
                      size={32}
                      icon={badge.icon}
                      style={{ backgroundColor: badge.color }}
                    />
                    <View>
                      <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                        {badge.name}
                      </Text>
                      <Text variant="bodySmall" style={{ color: '#666' }}>
                        {badge.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Continue Button */}
            <Button
              mode="contained"
              onPress={() => {
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(onComplete);
              }}
              style={{
                backgroundColor: '#4CAF50',
                borderRadius: 25,
                paddingHorizontal: 20
              }}
            >
              Awesome! 🎉
            </Button>
          </Card.Content>
        </Card>
      </Animated.View>
    </Animated.View>
  );
}

// Animated Progress Ring Component
interface AnimatedProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor?: string;
  animateOnMount?: boolean;
}

export function AnimatedProgressRing({ 
  progress, 
  size, 
  strokeWidth, 
  color, 
  backgroundColor = '#E0E0E0',
  animateOnMount = true 
}: AnimatedProgressRingProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const animation = Animated.timing(progressAnim, {
      toValue: progress,
      duration: animateOnMount ? 1000 : 0,
      useNativeDriver: false,
    });

    const listener = progressAnim.addListener(({ value }) => {
      setDisplayProgress(value);
    });

    animation.start();

    return () => {
      progressAnim.removeListener(listener);
    };
  }, [progress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - displayProgress);

  return (
    <View style={{ width: size, height: size }}>
      {/* Background Circle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
        }}
      />
      
      {/* Progress Circle - This would need react-native-svg for proper implementation */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopColor: 'transparent',
          borderRightColor: displayProgress > 0.25 ? color : 'transparent',
          borderBottomColor: displayProgress > 0.5 ? color : 'transparent',
          borderLeftColor: displayProgress > 0.75 ? color : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }}
      />
    </View>
  );
}

// Quick Action Button for Instant Completion
interface QuickCompleteButtonProps {
  onComplete: () => void;
  disabled?: boolean;
  taskTitle: string;
}

export function QuickCompleteButton({ onComplete, disabled = false, taskTitle }: QuickCompleteButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = async () => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Confirmation for instant completion
    Alert.alert(
      "Task Complete? 🎯",
      `Mark "${taskTitle}" as finished?`,
      [
        { text: "Not Yet", style: "cancel" },
        { 
          text: "Done! 🎉", 
          style: "default",
          onPress: onComplete
        }
      ]
    );
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Button
        mode="contained"
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={{
          backgroundColor: isPressed ? '#388E3C' : '#4CAF50',
          borderRadius: 25,
          elevation: isPressed ? 2 : 4,
        }}
        icon="check-circle"
      >
        Mark Complete
      </Button>
    </Animated.View>
  );
}

// Calculate rewards for task completion
export function calculateTaskRewards(effortMin: number, skillId?: SkillId): {
  cents: number;
  stickers: number; 
  xp: number;
  isMicroTask: boolean;
} {
  const isMicroTask = effortMin <= 5;
  const rewardTier = isMicroTask ? MICRO_TASK_REWARDS.MICRO : MICRO_TASK_REWARDS.STANDARD;
  
  // Base rewards
  let cents = rewardTier.baseCents;
  let xp = rewardTier.baseXP;
  
  // Scale by effort time
  const timeMultiplier = Math.max(0.5, effortMin / (isMicroTask ? 3 : 30));
  cents = Math.round(cents * timeMultiplier);
  xp = Math.round(xp * timeMultiplier);
  
  // Sticker calculation
  const stickerRoll = Math.random();
  const stickers = stickerRoll < rewardTier.stickerChance ? 1 : 0;
  
  return { cents, stickers, xp, isMicroTask };
}

// Simplified RewardAnimation for use with GameifiedTaskTiles
export function SimpleRewardAnimation({ money, xp, stickers, onComplete }: {
  money: number;
  xp: number;
  stickers: number;
  onComplete: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animation sequence
    playRewardSequence();
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after showing rewards
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(onComplete);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const playRewardSequence = async () => {
    try {
      // Initial haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Money sound effect (haptic)
      if (money > 0) {
        setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 100);
      }

      // XP gain effect
      if (xp > 0) {
        setTimeout(() => Haptics.selectionAsync(), 200);
      }

      // Sticker celebration
      if (stickers > 0) {
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 300);
      }

    } catch (error) {
      console.log('Haptic error:', error);
    }
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        opacity: fadeAnim,
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={{ 
          minWidth: 280,
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 24,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8
        }}>
          {/* Celebration Header */}
          <Text style={{ 
            fontSize: 24,
            fontWeight: 'bold', 
            color: '#4CAF50',
            textAlign: 'center',
            marginBottom: 20
          }}>
            🎉 Task Complete! 🎉
          </Text>

          {/* Rewards Grid */}
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            gap: 12,
            justifyContent: 'center',
            marginBottom: 20
          }}>
            {/* Money Reward */}
            {money > 0 && (
              <View style={{ 
                alignItems: 'center', 
                backgroundColor: '#E8F5E8',
                padding: 16,
                borderRadius: 12,
                minWidth: 90,
                borderWidth: 2,
                borderColor: '#4CAF50'
              }}>
                <Text style={{ 
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#2E7D32'
                }}>
                  +${(money / 100).toFixed(2)}
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  Money
                </Text>
              </View>
            )}

            {/* XP */}
            {xp > 0 && (
              <View style={{ 
                alignItems: 'center',
                backgroundColor: '#E3F2FD', 
                padding: 16,
                borderRadius: 12,
                minWidth: 90,
                borderWidth: 2,
                borderColor: '#2196F3'
              }}>
                <Text style={{ 
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#1976D2'
                }}>
                  +{xp} XP
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  Experience
                </Text>
              </View>
            )}

            {/* Stickers */}
            {stickers > 0 && (
              <View style={{ 
                alignItems: 'center',
                backgroundColor: '#FFF3E0', 
                padding: 16,
                borderRadius: 12,
                minWidth: 90,
                borderWidth: 2,
                borderColor: '#FF9800'
              }}>
                <Text style={{ 
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#F57C00'
                }}>
                  +{stickers} 🏆
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  Stickers
                </Text>
              </View>
            )}
          </View>

          {/* Continue Button */}
          <Button
            mode="contained"
            onPress={() => {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(onComplete);
            }}
            style={{
              backgroundColor: '#4CAF50',
              borderRadius: 20,
              paddingHorizontal: 12
            }}
          >
            Awesome! 🎉
          </Button>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
