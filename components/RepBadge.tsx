import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, Text, ProgressBar, Tooltip } from 'react-native-paper';
import { getRepTier, getRepProgress, getRepPrivileges } from '@/lib/rep-service';

interface RepBadgeProps {
  repScore: number;
  variant?: 'full' | 'compact' | 'minimal';
  showProgress?: boolean;
  showPrivileges?: boolean;
}

export default function RepBadge({ 
  repScore, 
  variant = 'compact',
  showProgress = false,
  showPrivileges = false
}: RepBadgeProps) {
  const tierInfo = getRepTier(repScore);
  const progress = getRepProgress(repScore);
  const privileges = getRepPrivileges(repScore);

  // Minimal variant - just the abbrev chip
  if (variant === 'minimal') {
    return (
      <Chip
        mode="flat"
        style={[styles.minimalChip, { backgroundColor: tierInfo.color + '20' }]}
        textStyle={[styles.minimalText, { color: tierInfo.color }]}
      >
        {tierInfo.abbrev}
      </Chip>
    );
  }

  // Compact variant - abbrev + score
  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <Chip
          mode="flat"
          style={[styles.compactChip, { backgroundColor: tierInfo.color + '20' }]}
          textStyle={[styles.compactText, { color: tierInfo.color }]}
        >
          {tierInfo.abbrev} • {repScore}
        </Chip>
      </View>
    );
  }

  // Full variant - everything
  return (
    <View style={styles.fullContainer}>
      {/* Title and Score */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{tierInfo.title}</Text>
          <Text style={styles.description}>{tierInfo.description}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: tierInfo.color }]}>
          <Text style={styles.scoreText}>{repScore}</Text>
          <Text style={styles.abbrevText}>{tierInfo.abbrev}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress to {progress.next}</Text>
            <Text style={styles.progressPercent}>{progress.percentage}%</Text>
          </View>
          <ProgressBar
            progress={progress.percentage / 100}
            color={tierInfo.color}
            style={styles.progressBar}
          />
        </View>
      )}

      {/* Privileges */}
      {showPrivileges && (
        <View style={styles.privilegesContainer}>
          <Text style={styles.privilegesTitle}>Rep Privileges:</Text>
          <View style={styles.privilegesList}>
            {privileges.payMultiplier > 1.0 && (
              <Chip
                icon="currency-usd"
                mode="outlined"
                compact
                style={styles.privilegeChip}
              >
                +{Math.round((privileges.payMultiplier - 1) * 100)}% Pay
              </Chip>
            )}
            {privileges.canAutoApprove && (
              <Chip
                icon="check-circle"
                mode="outlined"
                compact
                style={styles.privilegeChip}
              >
                Auto-Approve
              </Chip>
            )}
            {privileges.canInstantPay && (
              <Chip
                icon="flash"
                mode="outlined"
                compact
                style={styles.privilegeChip}
              >
                Instant Pay
              </Chip>
            )}
            {privileges.requiresManualApproval && (
              <Chip
                icon="account-check"
                mode="outlined"
                compact
                style={styles.privilegeChip}
              >
                Manual Approval
              </Chip>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Minimal variant
  minimalChip: {
    height: 24,
    paddingHorizontal: 8,
  },
  minimalText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactChip: {
    height: 28,
    paddingHorizontal: 10,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Full variant
  fullContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  description: {
    fontSize: 13,
    color: '#666',
  },
  scoreBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  abbrevText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
  },

  // Progress
  progressContainer: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f0f0f0',
  },

  // Privileges
  privilegesContainer: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  privilegesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  privilegesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  privilegeChip: {
    height: 28,
  },
});
