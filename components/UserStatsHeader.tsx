import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, TouchableOpacity } from 'react-native'
import { Avatar, IconButton, Divider } from 'react-native-paper'
import * as Haptics from 'expo-haptics'

interface UserStatsHeaderProps {
  userName: string
  userInitial: string
  color: string
  totalEarningsCents: number
  earnedTodayCents: number
  earnedWeekCents: number
  earnedMonthCents: number
  totalCommitmentsHonored: number
  currentStreakDays: number
  onChatPress: () => void
  onSwitchUser: () => void
}

export const UserStatsHeader: React.FC<UserStatsHeaderProps> = ({
  userName,
  userInitial,
  color,
  totalEarningsCents,
  earnedTodayCents,
  earnedWeekCents,
  earnedMonthCents,
  totalCommitmentsHonored,
  currentStreakDays,
  onChatPress,
  onSwitchUser
}) => {
  const bounceAnim = useRef(new Animated.Value(1)).current
  const moneyGlowAnim = useRef(new Animated.Value(0)).current
  const trophySpinAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Money glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(moneyGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(moneyGlowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start()

    // Trophy spin animation when there are achievements
    if (totalCommitmentsHonored > 0) {
      Animated.loop(
        Animated.timing(trophySpinAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true
        })
      ).start()
    }
  }, [totalCommitmentsHonored])

  const formatMoney = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const handleStatsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // Bounce animation on press
    Animated.sequence([
      Animated.spring(bounceAnim, {
        toValue: 0.95,
        tension: 300,
        friction: 10,
        useNativeDriver: true
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true
      })
    ]).start()
  }

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
      {/* Top Row - User Info & Controls */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar.Text 
            size={55} 
            label={userInitial} 
            style={{ backgroundColor: color }}
            labelStyle={{ fontSize: 24, fontWeight: 'bold' }}
          />
          <View>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#333'
            }}>
              Hey {userName}! 👋
            </Text>
            {currentStreakDays > 0 && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FF572220',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                marginTop: 4
              }}>
                <Text style={{
                  fontSize: 12,
                  color: '#FF5722',
                  fontWeight: 'bold'
                }}>
                  🔥 {currentStreakDays} day streak!
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={{ flexDirection: 'row' }}>
          <IconButton 
            icon="chat" 
            onPress={onChatPress}
            style={{ backgroundColor: `${color}20` }}
            iconColor={color}
          />
          <IconButton 
            icon="account-switch" 
            onPress={onSwitchUser}
            iconColor="#666"
          />
        </View>
      </View>

      <Divider style={{ marginBottom: 16 }} />

      {/* Stats Grid */}
      <TouchableOpacity 
        onPress={handleStatsPress}
        activeOpacity={0.8}
      >
        <Animated.View style={{
          transform: [{ scale: bounceAnim }]
        }}>
          {/* Money Stats Row */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 16
          }}>
            {/* Total Earnings - Prominent */}
            <View style={{
              flex: 1,
              alignItems: 'center',
              backgroundColor: '#4CAF5015',
              borderRadius: 16,
              padding: 12,
              marginRight: 8,
              borderWidth: 2,
              borderColor: '#4CAF50'
            }}>
              <Animated.View style={{
                opacity: moneyGlowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1]
                }),
                transform: [{
                  scale: moneyGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05]
                  })
                }]
              }}>
                <Text style={{ fontSize: 24 }}>💰</Text>
              </Animated.View>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#2E7D32',
                marginTop: 4
              }}>
                {formatMoney(totalEarningsCents)}
              </Text>
              <Text style={{
                fontSize: 11,
                color: '#666',
                textAlign: 'center'
              }}>
                Total Earned
              </Text>
            </View>

            {/* Today's Earnings */}
            <View style={{
              flex: 0.8,
              alignItems: 'center',
              backgroundColor: '#FF980015',
              borderRadius: 12,
              padding: 10,
              marginRight: 4
            }}>
              <Text style={{ fontSize: 18 }}>💵</Text>
              <Text style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: '#F57C00'
              }}>
                {formatMoney(earnedTodayCents)}
              </Text>
              <Text style={{
                fontSize: 10,
                color: '#666'
              }}>
                Today
              </Text>
            </View>

            {/* This Week */}
            <View style={{
              flex: 0.8,
              alignItems: 'center',
              backgroundColor: `${color}15`,
              borderRadius: 12,
              padding: 10,
              marginRight: 4
            }}>
              <Text style={{ fontSize: 18 }}>💳</Text>
              <Text style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: color
              }}>
                {formatMoney(earnedWeekCents)}
              </Text>
              <Text style={{
                fontSize: 10,
                color: '#666'
              }}>
                Week
              </Text>
            </View>

            {/* This Month */}
            <View style={{
              flex: 0.8,
              alignItems: 'center',
              backgroundColor: '#9C27B015',
              borderRadius: 12,
              padding: 10
            }}>
              <Text style={{ fontSize: 18 }}>🏦</Text>
              <Text style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: '#7B1FA2'
              }}>
                {formatMoney(earnedMonthCents)}
              </Text>
              <Text style={{
                fontSize: 10,
                color: '#666'
              }}>
                Month
              </Text>
            </View>
          </View>

          {/* Achievement Stats Row */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#FFF8E120',
            borderRadius: 16,
            padding: 12
          }}>
            <Animated.View style={{
              transform: [{
                rotate: trophySpinAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }]
            }}>
              <Text style={{ fontSize: 28, marginRight: 12 }}>🏆</Text>
            </Animated.View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#FF6F00'
              }}>
                {totalCommitmentsHonored}
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#666',
                textAlign: 'center'
              }}>
                Commitments Honored
              </Text>
            </View>
            
            <View style={{
              backgroundColor: '#FF6F0020',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginLeft: 16
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: '#FF6F00'
              }}>
                🌟 RELIABLE!
              </Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Motivational Message */}
      <View style={{
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: `${color}10`,
        borderRadius: 12,
        padding: 8
      }}>
        <Text style={{
          fontSize: 12,
          color: '#666',
          textAlign: 'center'
        }}>
          {totalEarningsCents === 0 
            ? "Complete tasks below to start earning! 🚀"
            : earnedTodayCents > 0
            ? "Great work today! Keep it up! 💪"
            : "Ready to earn more today? 💎"
          }
        </Text>
      </View>
    </View>
  )
}