import React, { useEffect, useRef } from 'react';
import { View, Modal, Animated, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width, height } = Dimensions.get('window');

interface LevelUpCelebrationProps {
  visible: boolean;
  level: number;
  onDismiss: () => void;
}

export default function LevelUpCelebration({ visible, level, onDismiss }: LevelUpCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Firework particles
  const fireworks = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: useRef(new Animated.Value(0)).current,
    y: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(1)).current,
  }));

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      rotateAnim.setValue(0);
      fireworks.forEach(fw => {
        fw.x.setValue(0);
        fw.y.setValue(0);
        fw.opacity.setValue(1);
      });

      // Sequence of animations
      Animated.sequence([
        // Big number pop-in
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Fade in background and text
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          // Continuous rotation
          Animated.loop(
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            })
          ),
        ]),
      ]).start();

      // Fireworks explosion
      setTimeout(() => {
        fireworks.forEach((fw, i) => {
          const angle = (i / fireworks.length) * Math.PI * 2;
          const distance = 150 + Math.random() * 100;
          const targetX = Math.cos(angle) * distance;
          const targetY = Math.sin(angle) * distance;

          Animated.parallel([
            Animated.timing(fw.x, {
              toValue: targetX,
              duration: 1000 + Math.random() * 500,
              useNativeDriver: true,
            }),
            Animated.timing(fw.y, {
              toValue: targetY,
              duration: 1000 + Math.random() * 500,
              useNativeDriver: true,
            }),
            Animated.timing(fw.opacity, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }, 300);
    }
  }, [visible]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getBenefits = (level: number) => {
    if (level >= 50) {
      return {
        title: 'Elite Status! 🏆',
        benefits: [
          'Premium task access',
          'Top-tier pay rates',
          'Priority task selection',
          'Exclusive opportunities',
        ],
        color: '#FFD700', // Gold
      };
    } else if (level >= 40) {
      return {
        title: 'Expert Level! 🌟',
        benefits: [
          'Advanced task access',
          'Excellent pay rates',
          'High priority matching',
          'Reputation boost',
        ],
        color: '#9C27B0', // Purple
      };
    } else if (level >= 30) {
      return {
        title: 'Veteran Status! 💪',
        benefits: [
          'Better task variety',
          'Higher pay rates',
          'Improved visibility',
          'Trust badge upgrade',
        ],
        color: '#FF5722', // Deep Orange
      };
    } else if (level >= 20) {
      return {
        title: 'Experienced! ⭐',
        benefits: [
          'More task options',
          'Increased pay rates',
          'Better reputation',
          'Unlock new categories',
        ],
        color: '#2196F3', // Blue
      };
    } else if (level >= 10) {
      return {
        title: 'Rising Star! 🚀',
        benefits: [
          'Higher earning potential',
          'More opportunities',
          'Increased trust',
          'Better task matches',
        ],
        color: '#4CAF50', // Green
      };
    } else {
      return {
        title: 'Level Up! 🎉',
        benefits: [
          'Better pay rates',
          'More reliable reputation',
          'New tasks unlocked',
          'Keep climbing!',
        ],
        color: '#FF9800', // Orange
      };
    }
  };

  const { title, benefits, color } = getBenefits(level);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Fireworks particles */}
        {fireworks.map((fw) => (
          <Animated.View
            key={fw.id}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
              transform: [
                { translateX: fw.x },
                { translateY: fw.y },
              ],
              opacity: fw.opacity,
            }}
          />
        ))}

        {/* Rotating glow ring */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: 150,
            borderWidth: 4,
            borderColor: color,
            opacity: 0.3,
            transform: [{ rotate: spin }],
          }}
        />

        {/* Main content */}
        <View style={{ alignItems: 'center', zIndex: 10 }}>
          {/* Big Level Number */}
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: color,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 30,
                elevation: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 80,
                  fontWeight: 'bold',
                  color: '#fff',
                  textShadowColor: 'rgba(0, 0, 0, 0.5)',
                  textShadowOffset: { width: 2, height: 2 },
                  textShadowRadius: 4,
                }}
              >
                {level}
              </Text>
            </View>
          </Animated.View>

          {/* Title and benefits */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              alignItems: 'center',
              paddingHorizontal: 40,
            }}
          >
            <Text
              variant="displaySmall"
              style={{
                color: '#fff',
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {title}
            </Text>

            <Text
              variant="titleLarge"
              style={{
                color: color,
                fontWeight: 'bold',
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              Level {level} Unlocked!
            </Text>

            {/* Benefits list */}
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 32,
                borderWidth: 2,
                borderColor: color,
              }}
            >
              <Text
                variant="titleMedium"
                style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                New Benefits Unlocked:
              </Text>
              {benefits.map((benefit, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <IconSymbol
                    size={20}
                    name="checkmark.circle.fill"
                    color={color}
                  />
                  <Text
                    variant="bodyLarge"
                    style={{
                      color: '#fff',
                      marginLeft: 12,
                    }}
                  >
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>

            {/* Continue button */}
            <Button
              mode="contained"
              onPress={onDismiss}
              style={{
                backgroundColor: color,
                borderRadius: 12,
                paddingHorizontal: 32,
              }}
              contentStyle={{ paddingVertical: 8 }}
              labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
            >
              Continue
            </Button>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
