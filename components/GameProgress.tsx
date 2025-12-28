import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Animated, TouchableOpacity, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'

interface WeeklyProgressBubblesProps {
  completed: number
  total: number
  rewardAmount: number
  color: string
}

export const WeeklyProgressBubbles: React.FC<WeeklyProgressBubblesProps> = ({
  completed,
  total,
  rewardAmount,
  color
}) => {
  const animatedValues = useRef(Array(total).fill(null).map(() => new Animated.Value(0))).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const glowAnim = useRef(new Animated.Value(0)).current
  
  useEffect(() => {
    // Animate filled bubbles
    animatedValues.forEach((anim, index) => {
      if (index < completed) {
        Animated.spring(anim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          delay: index * 100,
          useNativeDriver: true
        }).start()
      }
    })

    // Pulse animation for next bubble
    if (completed < total) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      ).start()
    }

    // Glow effect when close to completion
    if (completed >= total - 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ).start()
    }
  }, [completed, total])

  const bubbleSize = 45

  return (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 20,
      margin: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <View>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333'
          }}>
            Weekly Challenge 🎯
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#666'
          }}>
            {completed}/{total} Merets earned
          </Text>
        </View>
        
        <View style={{
          backgroundColor: completed >= total ? '#4CAF50' : `${color}20`,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: completed >= total ? '#4CAF50' : color
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: completed >= total ? 'white' : color
          }}>
            ${rewardAmount}
          </Text>
        </View>
      </View>

      {/* Bubble Progress */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
      }}>
        {Array(total).fill(null).map((_, index) => {
          const isCompleted = index < completed
          const isNext = index === completed
          const isFuture = index > completed
          
          return (
            <View key={index} style={{ alignItems: 'center' }}>
              {/* Connection Line */}
              {index < total - 1 && (
                <View style={{
                  position: 'absolute',
                  top: bubbleSize / 2 - 1,
                  left: bubbleSize - 4,
                  width: 30,
                  height: 2,
                  backgroundColor: isCompleted ? color : '#E0E0E0',
                  zIndex: 0
                }} />
              )}
              
              {/* Bubble */}
              <Animated.View
                style={{
                  width: bubbleSize,
                  height: bubbleSize,
                  borderRadius: bubbleSize / 2,
                  borderWidth: 3,
                  borderColor: isCompleted ? color : (isNext ? color : '#E0E0E0'),
                  backgroundColor: isCompleted ? color : 'white',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1,
                  transform: [
                    { scale: animatedValues[index] },
                    { scale: isNext ? pulseAnim : 1 }
                  ],
                  shadowColor: isCompleted ? color : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: isCompleted ? 6 : 0
                }}
              >
                {isCompleted ? (
                  <Text style={{
                    fontSize: 18,
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    ✓
                  </Text>
                ) : isNext ? (
                  <Animated.View style={{
                    opacity: glowAnim
                  }}>
                    <Text style={{
                      fontSize: 20,
                      color: color
                    }}>
                      🏆
                    </Text>
                  </Animated.View>
                ) : (
                  <View style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#E0E0E0'
                  }} />
                )}
              </Animated.View>
              
              {/* Day Label */}
              <Text style={{
                fontSize: 12,
                color: isCompleted ? color : '#999',
                fontWeight: isCompleted ? 'bold' : 'normal',
                marginTop: 8
              }}>
                {index + 1}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Progress Text */}
      <View style={{
        alignItems: 'center',
        marginTop: 8
      }}>
        {completed >= total ? (
          <View style={{
            backgroundColor: '#4CAF5020',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 12
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#4CAF50'
            }}>
              🎉 Challenge Complete! Bonus Earned! 🎉
            </Text>
          </View>
        ) : (
          <Text style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center'
          }}>
            {total - completed} more Meret{total - completed !== 1 ? 's' : ''} to unlock ${rewardAmount} bonus!
          </Text>
        )}
      </View>
    </View>
  )
}

interface MonthlyProgressSliderProps {
  completed: number
  total: number
  rewardAmount: number
  color: string
  daysRemaining: number
}

export const MonthlyProgressSlider: React.FC<MonthlyProgressSliderProps> = ({
  completed,
  total,
  rewardAmount,
  color,
  daysRemaining
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current
  const sparkleAnim = useRef(new Animated.Value(0)).current
  const [showSparkles, setShowSparkles] = useState(false)

  const progress = Math.min(completed / total, 1)
  const percentage = Math.round(progress * 100)

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false
    }).start()

    // Show sparkles when progress is high
    if (progress > 0.7) {
      setShowSparkles(true)
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true
          })
        ])
      ).start()
    }
  }, [progress])

  return (
    <TouchableOpacity
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      style={{
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden'
      }}
    >
      {/* Background Glow Effect */}
      {progress > 0.8 && (
        <Animated.View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `${color}05`,
          opacity: sparkleAnim
        }} />
      )}

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20
      }}>
        <View>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333'
          }}>
            Monthly Quest 🌟
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12
          }}>
            <Text style={{
              fontSize: 14,
              color: '#666'
            }}>
              {completed}/{total} Merets
            </Text>
            <View style={{
              backgroundColor: '#FF980020',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12
            }}>
              <Text style={{
                fontSize: 12,
                color: '#FF9800',
                fontWeight: 'bold'
              }}>
                {daysRemaining} days left
              </Text>
            </View>
          </View>
        </View>
        
        <View style={{
          backgroundColor: progress >= 1 ? '#4CAF50' : `${color}20`,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: progress >= 1 ? '#4CAF50' : color
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: progress >= 1 ? 'white' : color
          }}>
            ${rewardAmount}
          </Text>
        </View>
      </View>

      {/* Progress Bar Container */}
      <View style={{
        backgroundColor: '#F0F0F0',
        borderRadius: 25,
        height: 24,
        marginBottom: 16,
        overflow: 'hidden'
      }}>
        {/* Animated Progress Fill */}
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 25,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp'
            }),
            backgroundColor: color
          }}
        >
          {/* Sparkle Effects */}
          {showSparkles && (
            <>
              <Animated.Text style={{
                fontSize: 12,
                color: 'white',
                opacity: sparkleAnim,
                transform: [{
                  translateX: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20]
                  })
                }]
              }}>
                ✨
              </Animated.Text>
              <Animated.Text style={{
                fontSize: 10,
                color: 'white',
                opacity: sparkleAnim,
                marginLeft: 8,
                transform: [{
                  translateX: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15]
                  })
                }]
              }}>
                ⭐
              </Animated.Text>
            </>
          )}
        </Animated.View>

        {/* Progress Percentage */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: progress > 0.3 ? 'white' : '#666'
          }}>
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Bottom Stats */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <View style={{ alignItems: 'flex-start' }}>
          <Text style={{
            fontSize: 12,
            color: '#999'
          }}>
            Weekly Average Needed
          </Text>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: color
          }}>
            4 per week
          </Text>
        </View>

        {progress >= 1 ? (
          <View style={{
            backgroundColor: '#4CAF5020',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: '#4CAF50'
            }}>
              🏆 QUEST COMPLETE!
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{
              fontSize: 12,
              color: '#999'
            }}>
              Still Need
            </Text>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#FF9800'
            }}>
              {total - completed} more
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

// Streaks visualization (bonus component)
interface StreakVisualizerProps {
  currentStreak: number
  bestStreak: number
  color: string
}

export const StreakVisualizer: React.FC<StreakVisualizerProps> = ({
  currentStreak,
  bestStreak,
  color
}) => {
  const flameAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (currentStreak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(flameAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(flameAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      ).start()
    }
  }, [currentStreak])

  if (currentStreak === 0) return null

  return (
    <TouchableOpacity
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        margin: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#FF5722',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        borderLeftWidth: 4,
        borderLeftColor: '#FF5722'
      }}
    >
      <Animated.Text style={{
        fontSize: 32,
        marginRight: 16,
        transform: [{ scale: flameAnim }]
      }}>
        🔥
      </Animated.Text>
      
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#FF5722'
        }}>
          {currentStreak} Day Streak!
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#666'
        }}>
          Best: {bestStreak} days • Keep it up!
        </Text>
      </View>

      <View style={{
        backgroundColor: '#FF572220',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6
      }}>
        <Text style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: '#FF5722'
        }}>
          ON FIRE!
        </Text>
      </View>
    </TouchableOpacity>
  )
}