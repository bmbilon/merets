import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import {
  Provider as PaperProvider,
  Card,
  Text,
  Avatar,
  ProgressBar,
  Chip,
  Badge,
  Button,
  IconButton,
  Divider,
} from "react-native-paper";

import { 
  PlayerLevel, 
  PLAYER_TITLES, 
  getPlayerLevel, 
  getNextLevelProgress,
  GameBadge,
  SKILL_BADGES,
  BUSINESS_BADGES,
  Streak,
  STREAK_DEFINITIONS,
  PowerUp,
  POWER_UPS
} from '../../lib/systems/gamification-system';

import { SkillId, SkillProgress, SKILLS } from '../../lib/systems/skills-system';

// Enhanced Kid type with gamification features
interface GameKid {
  id: string;
  name: string;
  stickerCount: number;
  lifetimeStickers: number;
  balanceCents: number;
  streakDays: number;
  lastStickerDate?: string;
  
  // Gamification data
  level: PlayerLevel;
  badges: GameBadge[];
  streaks: Record<string, Streak>;
  skills: Record<SkillId, SkillProgress>;
  unlockedPowerUps: string[];
  usedPowerUps: Record<string, string>; // powerUpId -> lastUsedDate
}

interface PlayerProfileProps {
  kid: GameKid;
  onBack: () => void;
  onUsePowerUp: (powerUpId: string) => void;
}

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PlayerProfile({ kid, onBack, onUsePowerUp }: PlayerProfileProps) {
  // Safety check for undefined kid
  if (!kid) {
    return (
      <PaperProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 36 }}>
          <Text variant="headlineMedium">Player not found</Text>
          <Button mode="contained" onPress={onBack} style={{ marginTop: 20 }}>
            Go Back
          </Button>
        </View>
      </PaperProvider>
    );
  }

  const levelProgress = getNextLevelProgress(kid.lifetimeStickers);
  const currentTitle = PLAYER_TITLES[levelProgress.currentLevel];
  
  // Group badges by category
  const badgesByCategory = kid.badges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, GameBadge[]>);

  // Calculate skill mastery
  const skillLevels = Object.values(kid.skills).map(s => s.level);
  const averageSkillLevel = skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length;
  const masterSkills = skillLevels.filter(level => level === 4).length;

  // Active streaks
  const activeStreaks = Object.values(kid.streaks).filter(s => s.isActive && s.current > 0);

  // Available power-ups (not on cooldown)
  const today = new Date().toISOString().split('T')[0];
  const availablePowerUps = POWER_UPS.filter(powerUp => {
    const lastUsed = kid.usedPowerUps[powerUp.id];
    if (!lastUsed) return true;
    
    const daysSinceUsed = Math.floor(
      (new Date(today).getTime() - new Date(lastUsed).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceUsed >= powerUp.cooldown;
  });

  const getBadgeRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMMON': return '#9E9E9E';
      case 'RARE': return '#2196F3';
      case 'EPIC': return '#9C27B0';
      case 'LEGENDARY': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  return (
    <PaperProvider>
      <ScrollView style={{ flex: 1, backgroundColor: "#f5f5f5", paddingTop: 36 }}>
        <View style={{ padding: 16 }}>
          {/* Header */}
          <Card style={{ elevation: 6, marginBottom: 16 }}>
            <Card.Content style={{ gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <IconButton icon="arrow-left" onPress={onBack} />
                <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
                  {kid.name}'s Profile
                </Text>
                <View style={{ width: 48 }} />
              </View>

              {/* Player Level & Title */}
              <View style={{ alignItems: "center", gap: 12 }}>
                <Avatar.Icon 
                  size={80} 
                  icon={currentTitle.icon} 
                  style={{ backgroundColor: currentTitle.color }}
                />
                <View style={{ alignItems: "center" }}>
                  <Text variant="headlineMedium" style={{ fontWeight: "bold", color: currentTitle.color }}>
                    {currentTitle.name}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: "#666", textAlign: "center" }}>
                    {currentTitle.description}
                  </Text>
                </View>

                {/* Level Progress */}
                {levelProgress.nextLevel && (
                  <View style={{ width: "100%", gap: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text variant="bodySmall" style={{ fontWeight: "600" }}>
                        Progress to {PLAYER_TITLES[levelProgress.nextLevel].name}
                      </Text>
                      <Text variant="bodySmall" style={{ color: "#666" }}>
                        {levelProgress.stickersNeeded} stickers needed
                      </Text>
                    </View>
                    <ProgressBar 
                      progress={levelProgress.progress} 
                      color={PLAYER_TITLES[levelProgress.nextLevel].color}
                      style={{ height: 8, borderRadius: 4 }}
                    />
                  </View>
                )}

                {/* Stats Row */}
                <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%" }}>
                  <View style={{ alignItems: "center" }}>
                    <Text variant="titleMedium" style={{ fontWeight: "bold", color: currentTitle.color }}>
                      {kid.lifetimeStickers}
                    </Text>
                    <Text variant="bodySmall" style={{ color: "#666" }}>Total Stickers</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text variant="titleMedium" style={{ fontWeight: "bold", color: "#4CAF50" }}>
                      {kid.badges.length}
                    </Text>
                    <Text variant="bodySmall" style={{ color: "#666" }}>Badges</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text variant="titleMedium" style={{ fontWeight: "bold", color: "#FF9800" }}>
                      {masterSkills}
                    </Text>
                    <Text variant="bodySmall" style={{ color: "#666" }}>Master Skills</Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Active Streaks */}
          {activeStreaks.length > 0 && (
            <Card style={{ elevation: 4, marginBottom: 16 }}>
              <Card.Content style={{ gap: 12 }}>
                <Text variant="titleLarge" style={{ fontWeight: "bold", color: "#F44336" }}>
                  🔥 Active Streaks
                </Text>
                {activeStreaks.map((streak, index) => {
                  const def = STREAK_DEFINITIONS[streak.type];
                  return (
                    <View key={index} style={{ 
                      flexDirection: "row", 
                      alignItems: "center", 
                      gap: 12,
                      backgroundColor: `${def.color}20`,
                      padding: 12,
                      borderRadius: 8
                    }}>
                      <Avatar.Icon 
                        size={40} 
                        icon={def.icon} 
                        style={{ backgroundColor: def.color }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
                          {def.name} Streak
                        </Text>
                        <Text variant="bodyMedium" style={{ color: "#666" }}>
                          {streak.current} days • Best: {streak.best}
                        </Text>
                      </View>
                      <Chip 
                        mode="flat"
                        style={{ backgroundColor: def.color }}
                        textStyle={{ color: "white", fontWeight: "bold" }}
                      >
                        {streak.current} 🔥
                      </Chip>
                    </View>
                  );
                })}
              </Card.Content>
            </Card>
          )}

          {/* Badge Cabinet */}
          <Card style={{ elevation: 4, marginBottom: 16 }}>
            <Card.Content style={{ gap: 12 }}>
              <Text variant="titleLarge" style={{ fontWeight: "bold", color: "#FF9800" }}>
                🏆 Badge Cabinet
              </Text>
              
              {kid.badges.length === 0 ? (
                <View style={{ 
                  alignItems: "center", 
                  padding: 20, 
                  backgroundColor: "#f5f5f5", 
                  borderRadius: 8 
                }}>
                  <Text variant="bodyLarge" style={{ color: "#666", textAlign: "center" }}>
                    Complete commitments to earn your first badges!
                  </Text>
                  <Text variant="bodySmall" style={{ color: "#999", textAlign: "center", marginTop: 4 }}>
                    Badges represent your achievements and build your identity as a capable person.
                  </Text>
                </View>
              ) : (
                Object.entries(badgesByCategory).map(([category, badges]) => (
                  <View key={category} style={{ gap: 8 }}>
                    <Text variant="titleMedium" style={{ fontWeight: "600", color: "#333" }}>
                      {category.charAt(0) + category.slice(1).toLowerCase()} Badges
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {badges.map((badge, index) => (
                        <View key={index} style={{
                          backgroundColor: badge.color + "20",
                          borderRadius: 8,
                          padding: 12,
                          alignItems: "center",
                          minWidth: 100,
                          borderWidth: 2,
                          borderColor: getBadgeRarityColor(badge.rarity)
                        }}>
                          <Avatar.Icon 
                            size={32} 
                            icon={badge.icon} 
                            style={{ backgroundColor: badge.color, marginBottom: 4 }}
                          />
                          <Text variant="bodySmall" style={{ 
                            fontWeight: "bold", 
                            textAlign: "center",
                            color: badge.color 
                          }}>
                            {badge.name}
                          </Text>
                          <Text variant="bodySmall" style={{ 
                            color: getBadgeRarityColor(badge.rarity),
                            fontSize: 10,
                            marginTop: 2
                          }}>
                            {badge.rarity}
                          </Text>
                          {badge.flavorText && (
                            <Text variant="bodySmall" style={{ 
                              color: "#666", 
                              fontSize: 9, 
                              textAlign: "center",
                              fontStyle: "italic",
                              marginTop: 4
                            }}>
                              "{badge.flavorText}"
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </Card.Content>
          </Card>

          {/* Power-Ups Store */}
          {availablePowerUps.length > 0 && (
            <Card style={{ elevation: 4, marginBottom: 16 }}>
              <Card.Content style={{ gap: 12 }}>
                <Text variant="titleLarge" style={{ fontWeight: "bold", color: "#9C27B0" }}>
                  ⚡ Power-Ups Available
                </Text>
                <Text variant="bodyMedium" style={{ color: "#666" }}>
                  Spend stickers on special privileges and bonuses!
                </Text>
                
                {availablePowerUps.map((powerUp, index) => (
                  <View key={index} style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: `${powerUp.color}20`,
                    padding: 12,
                    borderRadius: 8
                  }}>
                    <Avatar.Icon 
                      size={40} 
                      icon={powerUp.icon} 
                      style={{ backgroundColor: powerUp.color }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
                        {powerUp.name}
                      </Text>
                      <Text variant="bodyMedium" style={{ color: "#666" }}>
                        {powerUp.description}
                      </Text>
                      <Text variant="bodySmall" style={{ 
                        color: powerUp.color, 
                        fontStyle: "italic",
                        marginTop: 2
                      }}>
                        "{powerUp.flavorText}"
                      </Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      {powerUp.stickerCost && (
                        <Button
                          mode="contained"
                          onPress={() => onUsePowerUp(powerUp.id)}
                          disabled={kid.stickerCount < powerUp.stickerCost}
                          style={{ 
                            backgroundColor: powerUp.color,
                            opacity: kid.stickerCount >= powerUp.stickerCost ? 1 : 0.5
                          }}
                        >
                          {powerUp.stickerCost} 🏆
                        </Button>
                      )}
                      {powerUp.streakUnlock && (
                        <Text variant="bodySmall" style={{ color: "#666", textAlign: "center" }}>
                          Unlocked by streak!
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Skill Mastery Overview */}
          <Card style={{ elevation: 4, marginBottom: 16 }}>
            <Card.Content style={{ gap: 12 }}>
              <Text variant="titleLarge" style={{ fontWeight: "bold", color: "#2196F3" }}>
                🎯 Skill Mastery
              </Text>
              
              <View style={{ gap: 8 }}>
                {Object.entries(kid.skills).map(([skillId, progress]) => {
                  const skill = SKILLS[skillId as SkillId];
                  return (
                    <View key={skillId} style={{
                      flexDirection: "row",
                      alignItems: "center", 
                      gap: 12,
                      backgroundColor: `${skill.color}20`,
                      padding: 12,
                      borderRadius: 8
                    }}>
                      <Avatar.Icon 
                        size={32} 
                        icon={skill.icon} 
                        style={{ backgroundColor: skill.color }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text variant="titleSmall" style={{ fontWeight: "bold" }}>
                          {skill.name}
                        </Text>
                        <Text variant="bodySmall" style={{ color: "#666" }}>
                          {progress.completions} completed • {progress.perfects} perfect
                        </Text>
                      </View>
                      <View style={{ alignItems: "center", minWidth: 60 }}>
                        <Text variant="titleMedium" style={{ 
                          fontWeight: "bold", 
                          color: skill.color 
                        }}>
                          Level {progress.level}
                        </Text>
                        {progress.level === 4 && (
                          <Text variant="bodySmall" style={{ color: "#FF9800" }}>
                            MASTER ⭐
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card.Content>
          </Card>

          {/* Unlocked Features */}
          <Card style={{ elevation: 4, marginBottom: 16 }}>
            <Card.Content style={{ gap: 12 }}>
              <Text variant="titleLarge" style={{ fontWeight: "bold", color: "#4CAF50" }}>
                🔓 Unlocked Features
              </Text>
              
              <View style={{ gap: 4 }}>
                {currentTitle.unlocks.map((unlock, index) => (
                  <View key={index} style={{ 
                    flexDirection: "row", 
                    alignItems: "center", 
                    gap: 8 
                  }}>
                    <Avatar.Icon 
                      size={24} 
                      icon="check-circle" 
                      style={{ backgroundColor: "#4CAF50" }}
                    />
                    <Text variant="bodyMedium" style={{ color: "#333" }}>
                      {unlock}
                    </Text>
                  </View>
                ))}
              </View>

              {levelProgress.nextLevel && (
                <>
                  <Divider />
                  <Text variant="titleMedium" style={{ fontWeight: "600", color: "#666" }}>
                    Coming at {PLAYER_TITLES[levelProgress.nextLevel].name}:
                  </Text>
                  <View style={{ gap: 4 }}>
                    {PLAYER_TITLES[levelProgress.nextLevel].unlocks.map((unlock, index) => (
                      <View key={index} style={{ 
                        flexDirection: "row", 
                        alignItems: "center", 
                        gap: 8,
                        opacity: 0.6
                      }}>
                        <Avatar.Icon 
                          size={24} 
                          icon="lock" 
                          style={{ backgroundColor: "#999" }}
                        />
                        <Text variant="bodyMedium" style={{ color: "#666" }}>
                          {unlock}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </PaperProvider>
  );
}