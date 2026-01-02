import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useRepChangeNotifications, RepAuditEntry } from '@/hooks/useRepAttribution';
import { getRepTier, formatRepChange } from '@/lib/rep-service';

interface RepChangeToastProps {
  userId: string;
}

export default function RepChangeToast({ userId }: RepChangeToastProps) {
  const [visible, setVisible] = useState(false);
  const [change, setChange] = useState<RepAuditEntry | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useRepChangeNotifications(userId, (newChange) => {
    // Only show toast for significant changes (±3 or more)
    if (Math.abs(newChange.change_amount) >= 3) {
      setChange(newChange);
      setVisible(true);
      showToast();
    }
  });

  const showToast = () => {
    // Slide in and fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideToast();
    }, 5000);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setChange(null);
    });
  };

  if (!visible || !change) return null;

  const isPositive = change.change_amount > 0;
  const tierInfo = getRepTier(change.new_rep);
  const changeText = formatRepChange(change.change_amount);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card
        style={[
          styles.card,
          isPositive ? styles.cardPositive : styles.cardNegative,
        ]}
        onPress={hideToast}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>
              {isPositive ? '📈' : '📉'}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {isPositive ? 'Rep Increased!' : 'Rep Decreased'}
            </Text>
            <Text style={styles.subtitle}>
              {change.reason}
            </Text>
            <View style={styles.repRow}>
              <Text style={styles.repChange}>
                {change.old_rep} → {change.new_rep}
              </Text>
              <View
                style={[
                  styles.changeBadge,
                  isPositive ? styles.changeBadgePositive : styles.changeBadgeNegative,
                ]}
              >
                <Text style={styles.changeText}>{changeText}</Text>
              </View>
            </View>
          </View>

          {/* Rep Badge */}
          <View
            style={[
              styles.repBadge,
              { backgroundColor: tierInfo.color },
            ]}
          >
            <Text style={styles.repScore}>{change.new_rep}</Text>
            <Text style={styles.repTier}>{tierInfo.abbrev}</Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    elevation: 8,
    borderRadius: 12,
  },
  cardPositive: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardNegative: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  repChange: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  changeBadgePositive: {
    backgroundColor: '#4CAF50',
  },
  changeBadgeNegative: {
    backgroundColor: '#F44336',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  repBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  repScore: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  repTier: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
  },
});
