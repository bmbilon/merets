import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Provider as PaperProvider,
  Button,
  Card,
  Text,
  Avatar,
  ProgressBar,
  Divider,
  Chip,
  Badge,
  IconButton,
} from "react-native-paper";

import { 
  SkillId, 
  SkillProgress, 
  Badge as SkillBadge,
  SKILLS, 
  SKILL_MISSIONS,
  getXPToNextLevel,
  initializeSkills
} from "../../lib/systems/skills-system";

// Updated types to include skills
type Kid = {
  id: string;
  name: string;
  meretCount: number;
  lifetimeMeters: number;
  balanceCents: number;
  streakDays: number;
  lastMeretDate?: string;
  skills: Record<SkillId, SkillProgress>;
  badges: SkillBadge[];
};

type Store = {
  kids: Kid[];
  commitments: any[];
  taskLibrary: any[];
  lastBonusPaid?: { weekly?: string; monthly?: string };
};

const STORAGE_KEY = "commitments_stickers_store_v1";

async function loadStore(): Promise<Store> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    const store = JSON.parse(raw);
    
    // Initialize skills for existing kids if they don't have them
    store.kids = store.kids.map((kid: any) => ({
      ...kid,
      skills: kid.skills || initializeSkills(),
      badges: kid.badges || []
    }));
    
    return store;
  }

  const seeded: Store = {
    kids: [
      { 
        id: "kid1", 
        name: "Aveya", 
        meretCount: 0, 
        lifetimeMeters: 0, 
        balanceCents: 0, 
        streakDays: 0,
        skills: initializeSkills(),
        badges: []
      },
      { 
        id: "kid2", 
        name: "Onyx", 
        meretCount: 0, 
        lifetimeMeters: 0, 
        balanceCents: 0, 
        streakDays: 0,
        skills: initializeSkills(),
        badges: []
      },
    ],
    commitments: [],
    taskLibrary: [],
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

async function saveStore(store: Store) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function useStore() {
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    loadStore().then(setStore);
  }, []);

  const persist = async (next: Store) => {
    setStore(next);
    await saveStore(next);
  };

  return { store, persist };
}

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

interface SkillCardProps {
  skillId: SkillId;
  progress: SkillProgress;
  kidName: string;
  onMissionSelect: (skillId: SkillId, mission: string) => void;
}

function SkillCard({ skillId, progress, kidName, onMissionSelect }: SkillCardProps) {
  const skill = SKILLS[skillId];
  const xpProgress = getXPToNextLevel(progress.xp);
  const missions = SKILL_MISSIONS[skillId][progress.level];
  const nextLevelMissions = progress.level < 4 ? SKILL_MISSIONS[skillId][(progress.level + 1) as 1 | 2 | 3 | 4] : [];

  return (
    <Card style={{ marginVertical: 8, elevation: 4 }}>
      <Card.Content style={{ gap: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar.Icon 
            size={60} 
            icon={skill.icon} 
            style={{ backgroundColor: skill.color }}
          />
          <View style={{ flex: 1 }}>
            <Text variant="titleLarge" style={{ fontWeight: "bold", color: skill.color }}>
              {skill.name}
            </Text>
            <Text variant="bodyMedium" style={{ color: "#666" }}>
              {skill.description}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Chip 
                mode="outlined" 
                style={{ backgroundColor: `${skill.color}20` }}
              >
                Level {progress.level}
              </Chip>
              <Text variant="bodySmall" style={{ color: "#666" }}>
                {progress.completions} completed • {progress.perfects} perfect
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        {progress.level < 4 && (
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text variant="bodySmall" style={{ fontWeight: "600" }}>
                Progress to Level {progress.level + 1}
              </Text>
              <Text variant="bodySmall" style={{ color: "#666" }}>
                {Math.floor(progress.xp)} / {Math.floor(progress.xp + xpProgress.needed)} XP
              </Text>
            </View>
            <ProgressBar 
              progress={xpProgress.percentage} 
              color={skill.color}
              style={{ height: 8, borderRadius: 4 }}
            />
          </View>
        )}

        {progress.level === 4 && (
          <View style={{ 
            backgroundColor: `${skill.color}20`, 
            padding: 12, 
            borderRadius: 8,
            alignItems: "center"
          }}>
            <Text variant="titleMedium" style={{ color: skill.color, fontWeight: "bold" }}>
              🏆 MASTER LEVEL ACHIEVED!
            </Text>
          </View>
        )}

        <Divider />

        {/* Available Missions */}
        <View>
          <Text variant="titleMedium" style={{ fontWeight: "600", marginBottom: 8 }}>
            Available Missions (Level {progress.level})
          </Text>
          {missions.map((mission, index) => (
            <Button
              key={index}
              mode="outlined"
              onPress={() => onMissionSelect(skillId, mission)}
              style={{ 
                marginVertical: 2, 
                borderColor: skill.color,
                borderWidth: 1
              }}
              textColor={skill.color}
            >
              {mission}
            </Button>
          ))}
        </View>

        {/* Next Level Preview */}
        {nextLevelMissions.length > 0 && (
          <View>
            <Text variant="titleMedium" style={{ fontWeight: "600", marginBottom: 8, color: "#999" }}>
              🔒 Level {progress.level + 1} Missions (Coming Soon)
            </Text>
            {nextLevelMissions.slice(0, 2).map((mission, index) => (
              <Button
                key={index}
                mode="outlined"
                disabled
                style={{ 
                  marginVertical: 2, 
                  borderColor: "#ccc",
                  opacity: 0.6
                }}
                textColor="#999"
              >
                {mission}
              </Button>
            ))}
            <Text variant="bodySmall" style={{ color: "#999", fontStyle: "italic", marginTop: 4 }}>
              Complete more Level {progress.level} missions to unlock!
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

export default function SkillsScreen() {
  const { store, persist } = useStore();
  const [selectedKid, setSelectedKid] = useState("kid1");

  if (!store) {
    return (
      <PaperProvider>
        <View style={{ padding: 16, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading…</Text>
        </View>
      </PaperProvider>
    );
  }

  const kid = store.kids.find(k => k.id === selectedKid)!;

  const handleMissionSelect = (skillId: SkillId, mission: string) => {
    Alert.alert(
      "Start Mission?",
      `Ready to start: "${mission}"?\n\nThis will create a new commitment that parents can approve and rate for quality.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Let's Go!",
          onPress: () => {
            // TODO: Navigate to commitment creation with pre-filled skill mission
            Alert.alert("Coming Soon!", "Mission-based commitment creation will be added next!");
          }
        }
      ]
    );
  };

  const totalBadges = kid.badges.length;
  const totalSkillLevels = Object.values(kid.skills).reduce((sum, skill) => sum + skill.level, 0);

  return (
    <PaperProvider>
      <ScrollView 
        style={{ flex: 1, backgroundColor: "#f5f5f5" }}
        contentContainerStyle={{ paddingTop: 50, paddingBottom: 50 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={{ padding: 16 }}>
          {/* Header */}
          <Card style={{ elevation: 4 }}>
            <Card.Content style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Avatar.Text size={50} label={kid.name.slice(0, 1)} />
                  <View>
                    <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
                      {kid.name}'s Skills
                    </Text>
                    <Text variant="bodyMedium" style={{ color: "#666" }}>
                      🏆 {totalBadges} badges • ⭐ Level {totalSkillLevels} total
                    </Text>
                  </View>
                </View>
              </View>

              {/* Kid Selector */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                {store.kids.map(k => (
                  <Button
                    key={k.id}
                    mode={selectedKid === k.id ? "contained" : "outlined"}
                    onPress={() => setSelectedKid(k.id)}
                    style={{ flex: 1 }}
                  >
                    {k.name}
                  </Button>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Skill Cards */}
          {Object.entries(SKILLS).map(([skillId, skill]) => (
            <SkillCard
              key={skillId}
              skillId={skillId as SkillId}
              progress={kid.skills[skillId as SkillId]}
              kidName={kid.name}
              onMissionSelect={handleMissionSelect}
            />
          ))}

          {/* Badges Section */}
          {kid.badges.length > 0 && (
            <Card style={{ marginVertical: 8, elevation: 4 }}>
              <Card.Content>
                <Text variant="titleLarge" style={{ fontWeight: "bold", marginBottom: 12 }}>
                  🏆 Achievement Badges
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {kid.badges.map((badge, index) => (
                    <Chip 
                      key={index}
                      mode="outlined"
                      style={{ backgroundColor: "#FFD700" }}
                    >
                      {badge.name}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Getting Started */}
          {totalSkillLevels === 6 && totalBadges === 0 && (
            <Card style={{ marginVertical: 8, elevation: 4 }}>
              <Card.Content>
                <Text variant="titleLarge" style={{ fontWeight: "bold", marginBottom: 8 }}>
                  🎮 Welcome to Job Games!
                </Text>
                <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                  Choose a mission from any skill above to start earning XP and leveling up! 
                  Complete missions with high quality to earn bonus XP and unlock advanced levels.
                </Text>
                <Text variant="bodySmall" style={{ color: "#666" }}>
                  💡 Pro tip: Start with Laundry or Dishes - they have the most frequent opportunities!
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
    </PaperProvider>
  );
}