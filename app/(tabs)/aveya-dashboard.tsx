import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert, SafeAreaView } from "react-native";
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
  IconButton,
  TextInput,
  SegmentedButtons,
  Menu,
} from "react-native-paper";

import { SkillId, SKILLS } from '../../lib/systems/skills-system';
import { 
  RewardAnimation, 
  QuickCompleteButton, 
  calculateTaskRewards 
} from '../../lib/systems/instant-rewards';
import FamilyChat from './family-chat';
import { GameifiedTaskTiles } from '../../components/GameifiedTaskTiles';
import { SupabaseService } from '../../lib/supabase-service';
import { WeeklyProgressBubbles, MonthlyProgressSlider, StreakVisualizer } from '../../components/GameProgress';
import { UserStatsHeader } from '../../components/UserStatsHeader';
import { getUserEarningsStats } from '../../lib/earnings-calculator';
import { TaskMarketplace } from '../../components/TaskMarketplace';

// Import types and functions from the existing commitment logic
type Status = "SUBMITTED" | "APPROVED" | "REJECTED" | "COMPLETED" | "MISSED";

type Kid = {
  id: string;
  name: string;
  stickerCount: number;
  lifetimeStickers: number;
  balanceCents: number;
  streakDays: number;
  lastStickerDate?: string;
};

type Commitment = {
  id: string;
  kidId: string;
  title: string;
  details?: string;
  date: string;
  effortMin: number;
  status: Status;
  createdAt: number;
  approvedAt?: number;
  decidedAt?: number;
  decidedBy?: "MOM" | "DAD";
  skillId?: SkillId;
};

type Store = {
  kids: Kid[];
  commitments: Commitment[];
  taskLibrary: { title: string; details?: string; effortMin: number; uses: number }[];
  lastBonusPaid?: { weekly?: string; monthly?: string };
};

const STORAGE_KEY = "commitments_stickers_store_v1";

// Utility functions
function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function weekKey(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThu = new Date(target.getFullYear(), 0, 4);
  const firstDayNr = (firstThu.getDay() + 6) % 7;
  firstThu.setDate(firstThu.getDate() - firstDayNr + 3);
  const weekNo = 1 + Math.round((target.getTime() - firstThu.getTime()) / (7 * 24 * 3600 * 1000));
  return `${target.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

function uid() {
  return Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

async function loadStore(): Promise<Store> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  
  // Try to sync with Supabase on first load
  if (!raw) {
    try {
      const aveyaProfile = await SupabaseService.getUserByName('Aveya');
      const onyxProfile = await SupabaseService.getUserByName('Onyx');
      
      if (aveyaProfile && onyxProfile) {
        // Get completed commitments from Supabase
        const aveyaCompleted = await SupabaseService.getUserCommitments(aveyaProfile.id, 'completed');
        const onyxCompleted = await SupabaseService.getUserCommitments(onyxProfile.id, 'completed');
        
        // Convert Supabase commitments to AsyncStorage format
        const allCompleted = [
          ...aveyaCompleted.map(c => ({
            id: c.id,
            kidId: "kid1",
            title: c.custom_title || 'Task',
            details: c.custom_description || '',
            date: c.completed_at ? c.completed_at.split('T')[0] : todayStr(0),
            effortMin: c.effort_minutes,
            status: "COMPLETED" as Status,
            createdAt: new Date(c.created_at).getTime(),
            decidedAt: c.completed_at ? new Date(c.completed_at).getTime() : Date.now()
          })),
          ...onyxCompleted.map(c => ({
            id: c.id,
            kidId: "kid2",
            title: c.custom_title || 'Task',
            details: c.custom_description || '',
            date: c.completed_at ? c.completed_at.split('T')[0] : todayStr(0),
            effortMin: c.effort_minutes,
            status: "COMPLETED" as Status,
            createdAt: new Date(c.created_at).getTime(),
            decidedAt: c.completed_at ? new Date(c.completed_at).getTime() : Date.now()
          }))
        ];
        
        const seeded: Store = {
          kids: [
            { 
              id: "kid1", 
              name: "Aveya", 
              stickerCount: aveyaCompleted.length, 
              lifetimeStickers: aveyaCompleted.length, 
              balanceCents: aveyaProfile.total_earnings_cents || 0, 
              streakDays: 0 
            },
            { 
              id: "kid2", 
              name: "Onyx", 
              stickerCount: onyxCompleted.length, 
              lifetimeStickers: onyxCompleted.length, 
              balanceCents: onyxProfile.total_earnings_cents || 0, 
              streakDays: 0 
            },
          ],
          commitments: allCompleted,
          taskLibrary: [
            // Micro-tasks (2-5 min) - High frequency, instant satisfaction
            { title: "Take out kitchen trash", details: "Empty and replace trash bag", effortMin: 3, uses: 1 },
            { title: "Empty bathroom trash cans", details: "All bathroom wastebaskets", effortMin: 5, uses: 1 },
            { title: "Stock bathroom supplies", details: "TP, hand towels, soap refills", effortMin: 4, uses: 1 },
            { title: "Wipe down kitchen counters", details: "Clean and sanitize all surfaces", effortMin: 5, uses: 1 },
            { title: "Load dishwasher", details: "Fill and start if full", effortMin: 4, uses: 1 },
            { title: "Spot-clean mirrors", details: "Bathroom and bedroom mirrors", effortMin: 3, uses: 1 },
            { title: "Collect laundry", details: "Gather dirty clothes to hamper", effortMin: 2, uses: 1 },
            { title: "Tidy living room", details: "Put things back where they belong", effortMin: 5, uses: 1 },
            { title: "Water houseplants", details: "Check and water as needed", effortMin: 3, uses: 1 },
            { title: "Feed pets", details: "Fill food and water bowls", effortMin: 2, uses: 1 },
            
            // Standard tasks (15-45 min)
            { title: "Study for upcoming test", details: "Focus session with no distractions", effortMin: 45, uses: 1 },
            { title: "Organize bedroom", details: "Clean, organize, and make bed", effortMin: 30, uses: 1 },
            { title: "Help with dinner prep", details: "Assist with meal preparation and cleanup", effortMin: 25, uses: 1 },
            { title: "Practice instrument", details: "Focused practice session", effortMin: 30, uses: 1 },
            { title: "Complete homework early", details: "Finish all assignments before dinner", effortMin: 60, uses: 1 },
          ],
          lastBonusPaid: {},
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
    }
  }
  
  // Fallback to empty state if sync failed or raw data exists
  if (raw) return JSON.parse(raw);

  const seeded: Store = {
    kids: [
      { id: "kid1", name: "Aveya", stickerCount: 0, lifetimeStickers: 0, balanceCents: 0, streakDays: 0 },
      { id: "kid2", name: "Onyx", stickerCount: 0, lifetimeStickers: 0, balanceCents: 0, streakDays: 0 },
    ],
    commitments: [],
    taskLibrary: [
      { title: "Take out kitchen trash", details: "Empty and replace trash bag", effortMin: 3, uses: 1 },
      { title: "Empty bathroom trash cans", details: "All bathroom wastebaskets", effortMin: 5, uses: 1 },
      { title: "Stock bathroom supplies", details: "TP, hand towels, soap refills", effortMin: 4, uses: 1 },
      { title: "Wipe down kitchen counters", details: "Clean and sanitize all surfaces", effortMin: 5, uses: 1 },
      { title: "Load dishwasher", details: "Fill and start if full", effortMin: 4, uses: 1 },
      { title: "Spot-clean mirrors", details: "Bathroom and bedroom mirrors", effortMin: 3, uses: 1 },
      { title: "Collect laundry", details: "Gather dirty clothes to hamper", effortMin: 2, uses: 1 },
      { title: "Tidy living room", details: "Put things back where they belong", effortMin: 5, uses: 1 },
      { title: "Water houseplants", details: "Check and water as needed", effortMin: 3, uses: 1 },
      { title: "Feed pets", details: "Fill food and water bowls", effortMin: 2, uses: 1 },
      { title: "Study for upcoming test", details: "Focus session with no distractions", effortMin: 45, uses: 1 },
      { title: "Organize bedroom", details: "Clean, organize, and make bed", effortMin: 30, uses: 1 },
      { title: "Help with dinner prep", details: "Assist with meal preparation and cleanup", effortMin: 25, uses: 1 },
      { title: "Practice instrument", details: "Focused practice session", effortMin: 30, uses: 1 },
      { title: "Complete homework early", details: "Finish all assignments before dinner", effortMin: 60, uses: 1 },
    ],
    lastBonusPaid: {},
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

async function saveStore(store: Store) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function countCompletedForKid(store: Store, kidId: string, predicate: (c: Commitment) => boolean) {
  return store.commitments.filter((c) => c.kidId === kidId && c.status === "COMPLETED" && predicate(c)).length;
}

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
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

interface AveyaDashboardProps {
  onSwitchUser: () => void;
}

export default function AveyaDashboard({ onSwitchUser }: AveyaDashboardProps) {
  const { store, persist } = useStore();
  const [currentView, setCurrentView] = useState<"dashboard" | "create" | "chat">("dashboard");
  const [realCommitments, setRealCommitments] = useState<any[]>([]);
  const [aveyaProfile, setAveyaProfile] = useState<any | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  
  // Create commitment state
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [day, setDay] = useState<"today" | "tomorrow">("today");
  const [effortMin, setEffortMin] = useState("30");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [skillMenuVisible, setSkillMenuVisible] = useState(false);

  // Function to load real profile from database
  const loadRealProfile = async () => {
    try {
      const profile = await SupabaseService.getUserByName('Aveya');
      if (profile) {
        setAveyaProfile(profile);
      }
    } catch (error) {
      console.error('Error loading Aveya profile:', error);
    }
  };

  // Function to fetch real commitments from database
  const fetchRealCommitments = async () => {
    try {
      // Use the loaded profile
      if (aveyaProfile) {
        // Get all active commitments (pending_approval + accepted + in_progress)
        const pendingCommitments = await SupabaseService.getUserCommitments(aveyaProfile.id, 'pending_approval');
        const acceptedCommitments = await SupabaseService.getUserCommitments(aveyaProfile.id, 'accepted');
        const inProgressCommitments = await SupabaseService.getUserCommitments(aveyaProfile.id, 'in_progress');
        const allCommitments = [...pendingCommitments, ...acceptedCommitments, ...inProgressCommitments];
        setRealCommitments(allCommitments);
      }
    } catch (error) {
      console.error('Error fetching real commitments:', error);
    }
  };

  // Load real profile on mount
  useEffect(() => {
    loadRealProfile();
  }, []);

  // Load real commitments when profile is loaded
  useEffect(() => {
    if (aveyaProfile) {
      fetchRealCommitments();
    }
  }, [aveyaProfile]);

  // Force reload from Supabase
  const forceReloadFromSupabase = async () => {
    setIsReloading(true);
    try {
      // Clear AsyncStorage
      await AsyncStorage.removeItem('commitments_stickers_store_v1');
      // Reload store (this will trigger the Supabase sync in loadStore)
      const reloadedStore = await loadStore();
      persist(reloadedStore);
      Alert.alert('✨ Data Reloaded', 'Successfully synced with database!');
    } catch (error) {
      console.error('Error reloading from Supabase:', error);
      Alert.alert('Error', 'Failed to reload data from database');
    } finally {
      setIsReloading(false);
    }
  };

  // Reward state
  const [showRewards, setShowRewards] = useState(false);
  const [currentRewards, setCurrentRewards] = useState<any>(null);

  if (!store) {
    return (
      <PaperProvider>
        <View style={{ padding: 16, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading…</Text>
        </View>
      </PaperProvider>
    );
  }

  const aveya = store.kids.find((k) => k.name === "Aveya")!;
  const today = todayStr(0);
  const tomorrow = todayStr(1);
  const date = day === "today" ? today : tomorrow;

  const myToday = store.commitments.filter((c) => c.kidId === aveya.id && c.date === today && c.status !== "REJECTED");
  const myTomorrow = store.commitments.filter((c) => c.kidId === aveya.id && c.date === tomorrow && c.status !== "REJECTED");

  const weeklyCompleted = countCompletedForKid(store, aveya.id, (c) => weekKey(c.date) === weekKey(today));
  const monthlyCompleted = countCompletedForKid(store, aveya.id, (c) => monthKey(c.date) === monthKey(today));

  const weeklyProgress = Math.min(1, weeklyCompleted / 5);
  const monthlyProgress = Math.min(1, monthlyCompleted / 20);

  const suggestions = store.taskLibrary
    .slice()
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 5);

  const instantCompleteTask = async (taskTitle: string, effortMin: number, skillId?: SkillId) => {
    // Calculate rewards
    const rewards = calculateTaskRewards(effortMin, skillId);
    
    // Update store immediately (no parent approval needed for micro-tasks)
    const updatedAveya = {
      ...aveya,
      stickerCount: aveya.stickerCount + rewards.stickers,
      lifetimeStickers: aveya.lifetimeStickers + rewards.stickers,
      balanceCents: aveya.balanceCents + rewards.cents
    };
    
    const newCommitment: Commitment = {
      id: uid(),
      kidId: aveya.id,
      title: taskTitle,
      details: `${effortMin} min micro-task`,
      date: todayStr(0),
      effortMin,
      status: "COMPLETED",
      createdAt: Date.now(),
      decidedAt: Date.now(),
      skillId: skillId as SkillId || undefined,
    };
    
    const updatedStore = {
      ...store,
      kids: store.kids.map(k => k.id === aveya.id ? updatedAveya : k),
      commitments: [newCommitment, ...store.commitments]
    };
    
    await persist(updatedStore);
    
    // Show instant reward animation
    setCurrentRewards({
      cents: rewards.cents,
      stickers: rewards.stickers,
      xp: rewards.xp,
      skillId,
      newBadges: [], // TODO: Check for new badges
      levelUp: false, // TODO: Check for level up
    });
    setShowRewards(true);
  };

  const submitCommitment = async () => {
    const t = title.trim();
    if (!t) return Alert.alert("Missing title", "Please describe your commitment.");

    const effort = Math.max(15, Math.min(180, parseInt(effortMin || "60", 10) || 60));

    const c: Commitment = {
      id: uid(),
      kidId: aveya.id,
      title: t,
      details: details.trim() || undefined,
      date,
      effortMin: effort,
      status: "SUBMITTED",
      createdAt: Date.now(),
      skillId: selectedSkill as SkillId || undefined,
    };

    const lib = [...store.taskLibrary];
    const idx = lib.findIndex((x) => x.title.toLowerCase() === t.toLowerCase());
    if (idx >= 0) lib[idx] = { ...lib[idx], uses: lib[idx].uses + 1, details: c.details ?? lib[idx].details, effortMin: effort };
    else lib.push({ title: t, details: c.details, effortMin: effort, uses: 1 });

    await persist({ ...store, commitments: [c, ...store.commitments], taskLibrary: lib });
    setTitle("");
    setDetails("");
    setSelectedSkill(null);
    setCurrentView("dashboard");
    Alert.alert("Ment Submitted! ✨", "Your ment has been sent to your parents for approval.");
  };

  const CommitmentRow = ({ item }: { item: Commitment }) => {
    const statusChip = (() => {
      const map: Record<Status, { label: string; color: string }> = {
        SUBMITTED: { label: "⏳ Pending", color: "#FF9800" },
        APPROVED: { label: "✅ Ready", color: "#4CAF50" },
        REJECTED: { label: "❌ Declined", color: "#F44336" },
        COMPLETED: { label: "🏆 Done!", color: "#E91E63" },
        MISSED: { label: "😔 Missed", color: "#757575" },
      };
      return map[item.status];
    })();

    return (
      <Card style={{ marginVertical: 6 }}>
        <Card.Content style={{ gap: 6 }}>
          <Text variant="titleSmall" style={{ color: "#333" }}>{item.title}</Text>
          {!!item.details && <Text variant="bodySmall" style={{ color: "#666" }}>{item.details}</Text>}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Chip style={{ backgroundColor: `${statusChip.color}20` }}>
              <Text style={{ color: statusChip.color, fontWeight: "600" }}>{statusChip.label}</Text>
            </Chip>
            <Chip icon="clock-outline">{item.effortMin} min</Chip>
            {item.skillId && (
              <Chip 
                icon={SKILLS[item.skillId].icon}
                style={{ backgroundColor: `${SKILLS[item.skillId].color}20` }}
              >
                <Text style={{ color: SKILLS[item.skillId].color, fontWeight: "600" }}>
                  {SKILLS[item.skillId].name}
                </Text>
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (currentView === "chat") {
    return (
      <FamilyChat
        currentUserId="aveya"
        currentUserName="Aveya"
        onBack={() => setCurrentView("dashboard")}
      />
    );
  }

  if (currentView === "create") {
    return (
      <PaperProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fce4ec" }}>
          <ScrollView 
            style={{ flex: 1, backgroundColor: "#fce4ec" }}
            contentContainerStyle={{ paddingTop: 80, paddingBottom: 50 }}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
          <View style={{ padding: 16 }}>
            <Card style={{ backgroundColor: "white", elevation: 4 }}>
              <Card.Content style={{ gap: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text variant="headlineSmall" style={{ color: "#E91E63", fontWeight: "bold" }}>
                    ✨ New Ment
                  </Text>
                  <IconButton icon="close" onPress={() => setCurrentView("dashboard")} />
                </View>

                <SegmentedButtons
                  value={day}
                  onValueChange={(v) => setDay(v as any)}
                  buttons={[
                    { value: "today", label: "Today" },
                    { value: "tomorrow", label: "Tomorrow" },
                  ]}
                  style={{ backgroundColor: "#E91E6310" }}
                />

                <TextInput
                  label="What's your ment?"
                  value={title}
                  onChangeText={setTitle}
                  mode="outlined"
                  activeOutlineColor="#E91E63"
                />
                
                <TextInput
                  label="Details (optional)"
                  value={details}
                  onChangeText={setDetails}
                  multiline
                  mode="outlined"
                  activeOutlineColor="#E91E63"
                />

                <TextInput
                  label="Time needed (minutes)"
                  keyboardType="numeric"
                  value={effortMin}
                  onChangeText={setEffortMin}
                  mode="outlined"
                  activeOutlineColor="#E91E63"
                />

                {/* Skill Selection */}
                <View>
                  <Text variant="labelLarge" style={{ color: "#666", marginBottom: 8 }}>
                    🎯 Skill Category (optional)
                  </Text>
                  <Menu
                    visible={skillMenuVisible}
                    onDismiss={() => setSkillMenuVisible(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setSkillMenuVisible(true)}
                        style={{ borderColor: "#E91E63" }}
                        textColor={selectedSkill ? "#E91E63" : "#666"}
                        icon={selectedSkill ? SKILLS[selectedSkill as SkillId].icon : "gamepad-variant"}
                      >
                        {selectedSkill ? SKILLS[selectedSkill as SkillId].name : "Select a skill"}
                      </Button>
                    }
                  >
                    <Menu.Item
                      onPress={() => {
                        setSelectedSkill(null);
                        setSkillMenuVisible(false);
                      }}
                      title="No specific skill"
                      leadingIcon="close"
                    />
                    {Object.entries(SKILLS).map(([skillId, skill]) => (
                      <Menu.Item
                        key={skillId}
                        onPress={() => {
                          setSelectedSkill(skillId);
                          setSkillMenuVisible(false);
                        }}
                        title={skill.name}
                        leadingIcon={skill.icon}
                      />
                    ))}
                  </Menu>
                  {selectedSkill && (
                    <Text variant="bodySmall" style={{ color: "#666", marginTop: 4 }}>
                      📈 Earn XP in {SKILLS[selectedSkill as SkillId].name} when completed!
                    </Text>
                  )}
                </View>

                <Button
                  mode="contained"
                  onPress={submitCommitment}
                  style={{ backgroundColor: "#E91E63", borderRadius: 25 }}
                >
                  Submit for Approval
                </Button>
              </Card.Content>
            </Card>

            <Card style={{ marginTop: 16, backgroundColor: "white", elevation: 4 }}>
              <Card.Content style={{ gap: 12 }}>
                <Text variant="titleMedium" style={{ color: "#E91E63", fontWeight: "600" }}>
                  💡 Popular Ideas
                </Text>
                {suggestions.map((s) => (
                  <Button
                    key={s.title}
                    mode="outlined"
                    onPress={() => {
                      setTitle(s.title);
                      setDetails(s.details ?? "");
                      setEffortMin(String(s.effortMin));
                    }}
                    style={{ borderColor: "#E91E63" }}
                    textColor="#E91E63"
                  >
                    {s.title}
                  </Button>
                ))}
              </Card.Content>
            </Card>
          </View>
          </ScrollView>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fce4ec" }}>
        <ScrollView 
          style={{ flex: 1, backgroundColor: "#fce4ec" }}
          contentContainerStyle={{ paddingTop: 80, paddingBottom: 50 }}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
        <View>
          {/* Enhanced Stats Header */}
          <UserStatsHeader
            userName="Aveya"
            userInitial="A"
            color="#E91E63"
            {...getUserEarningsStats(aveya, store.commitments)}
            onChatPress={() => setCurrentView("chat")}
            onSwitchUser={onSwitchUser}
          />

          {/* Action Buttons */}
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => setCurrentView("create")}
                style={{ backgroundColor: "#E91E63", borderRadius: 25, flex: 1 }}
              >
                New Commitment
              </Button>
              
              <Button
                mode="outlined"
                icon="format-list-checkbox"
                onPress={async () => {
                  // Refresh commitments from database
                  await fetchRealCommitments();
                  
                  // Show current commitments from database
                  Alert.alert(
                    "My Commitments 📋",
                    realCommitments.length > 0 
                      ? `You have ${realCommitments.length} active commitment${realCommitments.length > 1 ? 's' : ''}:\n\n${realCommitments.map(c => `• ${c.custom_title || c.title} (${c.status})`).join('\n')}`
                      : "No active commitments. Ready to commit to a new task?",
                    [
                      { text: "OK", style: "default" }
                    ]
                  )
                }}
                style={{ borderColor: "#E91E63", borderRadius: 25, flex: 1 }}
                textColor="#E91E63"
              >
                My Commitments
              </Button>
            </View>
            <View style={{ marginTop: 8 }}>
              <Button
                mode="outlined"
                icon="reload"
                onPress={forceReloadFromSupabase}
                loading={isReloading}
                disabled={isReloading}
                style={{ borderColor: "#E91E63", borderRadius: 25 }}
                textColor="#E91E63"
              >
                {isReloading ? "Syncing..." : "Sync with Database"}
              </Button>
            </View>
          </View>

          {/* Gamified Task Tiles - Main Feature */}
          {aveyaProfile && (
            <GameifiedTaskTiles 
              userProfile={{
                id: aveyaProfile.id,
                name: aveyaProfile.name,
                role: aveyaProfile.role,
                age: aveyaProfile.age || 15,
                total_xp: aveyaProfile.total_xp || 0,
                total_earnings_cents: aveyaProfile.total_earnings_cents || aveya.balanceCents,
                created_at: aveyaProfile.created_at
              }}
            onTaskCompleted={async () => {
              // Refresh store when task completed
              const refreshedStore = await loadStore();
              await persist(refreshedStore);
            }}
              onTaskCommitted={async () => {
                // Refresh store when new commitment made
                const refreshedStore = await loadStore();
                await persist(refreshedStore);
                // Also refresh real commitments
                await fetchRealCommitments();
              }}
            />
          )}

          {/* Addictive Game Progress Components */}
          <WeeklyProgressBubbles
            completed={weeklyCompleted}
            total={5}
            rewardAmount={50}
            color="#E91E63"
          />

          <MonthlyProgressSlider
            completed={monthlyCompleted}
            total={20}
            rewardAmount={500}
            color="#E91E63"
            daysRemaining={Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()))}
          />

          {aveya.streakDays > 0 && (
            <StreakVisualizer
              currentStreak={aveya.streakDays}
              bestStreak={aveya.streakDays} // TODO: Track best streak in store
              color="#E91E63"
            />
          )}

          {/* Task Marketplace */}
          {aveyaProfile && (
            <TaskMarketplace 
              userProfile={{
                id: aveyaProfile.id,
                name: aveyaProfile.name,
                role: aveyaProfile.role,
                age: aveyaProfile.age || 15,
                total_xp: aveyaProfile.total_xp || 0,
                total_earnings_cents: aveyaProfile.total_earnings_cents || aveya.balanceCents,
                created_at: aveyaProfile.created_at
              }}
              color="#E91E63"
              onTaskClaimed={async () => {
                // Refresh store when task claimed
                const refreshedStore = await loadStore();
                await persist(refreshedStore);
              }}
            />
          )}

          {/* Today's Commitments */}
          <Card style={{ marginTop: 16, backgroundColor: "white", elevation: 4 }}>
            <Card.Content style={{ gap: 12 }}>
              <Text variant="titleMedium" style={{ color: "#E91E63", fontWeight: "600" }}>
                📅 Today ({today})
              </Text>
              {myToday.length === 0 ? (
                <Text style={{ color: "#666", fontStyle: "italic" }}>
                  No commitments yet. Ready to make one?
                </Text>
              ) : (
                myToday.map((item) => <CommitmentRow key={item.id} item={item} />)
              )}

              {myTomorrow.length > 0 && (
                <>
                  <Divider style={{ marginVertical: 8 }} />
                  <Text variant="titleMedium" style={{ color: "#E91E63", fontWeight: "600" }}>
                    📅 Tomorrow ({tomorrow})
                  </Text>
                  {myTomorrow.map((item) => <CommitmentRow key={item.id} item={item} />)}
                </>
              )}
            </Card.Content>
          </Card>
        </View>
        </ScrollView>
        
        {/* Reward Animation Overlay */}
        {showRewards && currentRewards && (
          <RewardAnimation
            visible={showRewards}
            rewards={currentRewards}
            onComplete={() => {
              setShowRewards(false);
              setCurrentRewards(null);
            }}
          />
        )}
      </SafeAreaView>
    </PaperProvider>
  );
}