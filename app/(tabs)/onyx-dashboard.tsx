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
import FamilyChat from './family-chat';
import { GameifiedTaskTiles } from '../../components/GameifiedTaskTiles';
import { SupabaseService } from '../../lib/supabase-service';
import { WeeklyProgressBubbles, MonthlyProgressSlider, StreakVisualizer } from '../../components/GameProgress';
import { UserStatsHeader } from '../../components/UserStatsHeader';
import { getUserEarningsStats } from '../../lib/earnings-calculator';
import { TaskMarketplace } from '../../components/TaskMarketplace';

// Same types as Aveya's dashboard
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

// Same utility functions
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
  if (raw) return JSON.parse(raw);

  const seeded: Store = {
    kids: [
      { id: "kid1", name: "Aveya", stickerCount: 0, lifetimeStickers: 0, balanceCents: 0, streakDays: 0 },
      { id: "kid2", name: "Onyx", stickerCount: 0, lifetimeStickers: 0, balanceCents: 0, streakDays: 0 },
    ],
    commitments: [],
    taskLibrary: [
      // Quick micro-tasks (2-5 min) - Perfect for Onyx!
      { title: "Take out trash", details: "Empty kitchen or bedroom trash", effortMin: 3, uses: 1 },
      { title: "Feed the pets", details: "Fill food and water bowls", effortMin: 2, uses: 1 },
      { title: "Empty small trash cans", details: "Bathroom and bedroom wastebaskets", effortMin: 4, uses: 1 },
      { title: "Put away clean dishes", details: "From dishwasher to cabinets", effortMin: 5, uses: 1 },
      { title: "Wipe bathroom counter", details: "Clean sink area and counter", effortMin: 3, uses: 1 },
      { title: "Stock toilet paper", details: "Check and refill all bathrooms", effortMin: 2, uses: 1 },
      { title: "Collect dirty towels", details: "Gather for laundry basket", effortMin: 2, uses: 1 },
      { title: "Quick vacuum spot", details: "High traffic area or spill", effortMin: 5, uses: 1 },
      { title: "Sort mail", details: "Organize on counter for parents", effortMin: 3, uses: 1 },
      { title: "Put shoes away", details: "Family shoes to proper spots", effortMin: 4, uses: 1 },
      
      // Regular tasks (10-30 min)
      { title: "Clean up toys and games", details: "Put everything back where it belongs", effortMin: 20, uses: 1 },
      { title: "Practice math facts", details: "Work on multiplication or addition", effortMin: 15, uses: 1 },
      { title: "Help with laundry", details: "Sort clothes or fold towels", effortMin: 25, uses: 1 },
      { title: "Read for fun", details: "Choose a good book and read quietly", effortMin: 20, uses: 1 },
      { title: "Organize backpack", details: "Clean out and organize school stuff", effortMin: 10, uses: 1 },
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

interface OnyxDashboardProps {
  onSwitchUser: () => void;
}

export default function OnyxDashboard({ onSwitchUser }: OnyxDashboardProps) {
  const { store, persist } = useStore();
  const [currentView, setCurrentView] = useState<"dashboard" | "create" | "chat">("dashboard");
  const [realCommitments, setRealCommitments] = useState<any[]>([]);
  
  // Create commitment state
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [day, setDay] = useState<"today" | "tomorrow">("today");
  const [effortMin, setEffortMin] = useState("30");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [skillMenuVisible, setSkillMenuVisible] = useState(false);

  // Function to fetch real commitments from database
  const fetchRealCommitments = async () => {
    try {
      // Get Onyx's user ID from the database
      const onyxProfile = await SupabaseService.getUserByName('Onyx');
      if (onyxProfile) {
        // Get all active commitments (pending + approved)
        const pendingCommitments = await SupabaseService.getUserCommitments(onyxProfile.id, 'pending');
        const approvedCommitments = await SupabaseService.getUserCommitments(onyxProfile.id, 'approved');
        const allCommitments = [...pendingCommitments, ...approvedCommitments];
        setRealCommitments(allCommitments);
      }
    } catch (error) {
      console.error('Error fetching real commitments:', error);
    }
  };

  // Load real commitments on mount and when store changes
  useEffect(() => {
    if (store) {
      fetchRealCommitments();
    }
  }, [store]);

  if (!store) {
    return (
      <PaperProvider>
        <View style={{ padding: 16, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading…</Text>
        </View>
      </PaperProvider>
    );
  }

  const onyx = store.kids.find((k) => k.name === "Onyx")!;
  const today = todayStr(0);
  const tomorrow = todayStr(1);
  const date = day === "today" ? today : tomorrow;

  const myToday = store.commitments.filter((c) => c.kidId === onyx.id && c.date === today && c.status !== "REJECTED");
  const myTomorrow = store.commitments.filter((c) => c.kidId === onyx.id && c.date === tomorrow && c.status !== "REJECTED");

  const weeklyCompleted = countCompletedForKid(store, onyx.id, (c) => weekKey(c.date) === weekKey(today));
  const monthlyCompleted = countCompletedForKid(store, onyx.id, (c) => monthKey(c.date) === monthKey(today));

  const weeklyProgress = Math.min(1, weeklyCompleted / 5);
  const monthlyProgress = Math.min(1, monthlyCompleted / 20);

  const suggestions = store.taskLibrary
    .slice()
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 6);

  const submitCommitment = async () => {
    const t = title.trim();
    if (!t) return Alert.alert("Oops!", "What do you want to do? Tell me your commitment!");

    const effort = Math.max(15, Math.min(180, parseInt(effortMin || "30", 10) || 30));

    const c: Commitment = {
      id: uid(),
      kidId: onyx.id,
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
    Alert.alert("Awesome! 🚀", "Your commitment is sent to Mom and Dad!");
  };

  const CommitmentRow = ({ item }: { item: Commitment }) => {
    const statusChip = (() => {
      const map: Record<Status, { label: string; color: string }> = {
        SUBMITTED: { label: "⏰ Waiting", color: "#FF9800" },
        APPROVED: { label: "🎯 Ready!", color: "#4CAF50" },
        REJECTED: { label: "❌ Not approved", color: "#F44336" },
        COMPLETED: { label: "🏆 Got sticker!", color: "#2196F3" },
        MISSED: { label: "😐 Missed", color: "#757575" },
      };
      return map[item.status];
    })();

    return (
      <Card style={{ marginVertical: 6, elevation: 2 }}>
        <Card.Content style={{ gap: 6 }}>
          <Text variant="titleSmall" style={{ color: "#333", fontSize: 16 }}>{item.title}</Text>
          {!!item.details && <Text variant="bodySmall" style={{ color: "#666" }}>{item.details}</Text>}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Chip style={{ backgroundColor: `${statusChip.color}20` }}>
              <Text style={{ color: statusChip.color, fontWeight: "600", fontSize: 12 }}>{statusChip.label}</Text>
            </Chip>
            <Chip icon="timer">{item.effortMin} min</Chip>
            {item.skillId && (
              <Chip 
                icon={SKILLS[item.skillId].icon}
                style={{ backgroundColor: `${SKILLS[item.skillId].color}20` }}
              >
                <Text style={{ color: SKILLS[item.skillId].color, fontWeight: "600", fontSize: 11 }}>
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
        currentUserId="onyx"
        currentUserName="Onyx"
        onBack={() => setCurrentView("dashboard")}
      />
    );
  }

  if (currentView === "create") {
    return (
      <PaperProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#e3f2fd" }}>
          <ScrollView 
            style={{ flex: 1, backgroundColor: "#e3f2fd" }}
            contentContainerStyle={{ paddingTop: 80, paddingBottom: 50 }}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
          <View style={{ padding: 16 }}>
            <Card style={{ backgroundColor: "white", elevation: 4 }}>
              <Card.Content style={{ gap: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text variant="headlineSmall" style={{ color: "#2196F3", fontWeight: "bold" }}>
                    🚀 New Commitment
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
                  style={{ backgroundColor: "#2196F310" }}
                />

                <TextInput
                  label="What will you do?"
                  value={title}
                  onChangeText={setTitle}
                  mode="outlined"
                  activeOutlineColor="#2196F3"
                  style={{ fontSize: 16 }}
                />
                
                <TextInput
                  label="More details (optional)"
                  value={details}
                  onChangeText={setDetails}
                  multiline
                  mode="outlined"
                  activeOutlineColor="#2196F3"
                />

                <TextInput
                  label="How many minutes?"
                  keyboardType="numeric"
                  value={effortMin}
                  onChangeText={setEffortMin}
                  mode="outlined"
                  activeOutlineColor="#2196F3"
                />

                {/* Skill Selection */}
                <View>
                  <Text variant="labelLarge" style={{ color: "#666", marginBottom: 8 }}>
                    🎯 Choose a skill to level up! (optional)
                  </Text>
                  <Menu
                    visible={skillMenuVisible}
                    onDismiss={() => setSkillMenuVisible(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setSkillMenuVisible(true)}
                        style={{ borderColor: "#2196F3", paddingVertical: 6 }}
                        textColor={selectedSkill ? "#2196F3" : "#666"}
                        icon={selectedSkill ? SKILLS[selectedSkill as SkillId].icon : "gamepad-variant"}
                      >
                        {selectedSkill ? SKILLS[selectedSkill as SkillId].name : "Pick a skill!"}
                      </Button>
                    }
                  >
                    <Menu.Item
                      onPress={() => {
                        setSelectedSkill(null);
                        setSkillMenuVisible(false);
                      }}
                      title="No skill this time"
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
                    <Text variant="bodySmall" style={{ color: "#2196F3", marginTop: 4, textAlign: "center" }}>
                      🆙 You'll get XP in {SKILLS[selectedSkill as SkillId].name} when you finish!
                    </Text>
                  )}
                </View>

                <Button
                  mode="contained"
                  onPress={submitCommitment}
                  style={{ backgroundColor: "#2196F3", borderRadius: 25, paddingVertical: 4 }}
                >
                  Send to Parents!
                </Button>
              </Card.Content>
            </Card>

            <Card style={{ marginTop: 16, backgroundColor: "white", elevation: 4 }}>
              <Card.Content style={{ gap: 12 }}>
                <Text variant="titleMedium" style={{ color: "#2196F3", fontWeight: "600" }}>
                  💡 Ideas for You
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
                    style={{ borderColor: "#2196F3", marginVertical: 2 }}
                    textColor="#2196F3"
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#e3f2fd" }}>
        <ScrollView 
          style={{ flex: 1, backgroundColor: "#e3f2fd" }}
          contentContainerStyle={{ paddingTop: 80, paddingBottom: 50 }}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
        <View>
          {/* Enhanced Stats Header */}
          <UserStatsHeader
            userName="Onyx"
            userInitial="O"
            color="#2196F3"
            {...getUserEarningsStats(onyx, store.commitments)}
            onChatPress={() => setCurrentView("chat")}
            onSwitchUser={onSwitchUser}
          />

          {/* Action Buttons */}
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                mode="contained"
                icon="plus-circle"
                onPress={() => setCurrentView("create")}
                style={{ backgroundColor: "#2196F3", borderRadius: 25, flex: 1 }}
              >
                Make Commitment!
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
                      : "No active commitments. Want to commit to something awesome? 🚀",
                    [
                      { text: "OK", style: "default" }
                    ]
                  )
                }}
                style={{ borderColor: "#2196F3", borderRadius: 25, flex: 1 }}
                textColor="#2196F3"
              >
                My Commitments
              </Button>
            </View>
          </View>

          {/* Gamified Task Tiles - Main Feature */}
          <GameifiedTaskTiles 
            userProfile={{
              id: onyx.id,
              name: onyx.name,
              role: 'kid',
              age: 11,
              total_xp: 0,
              total_earnings_cents: onyx.balanceCents,
              created_at: ''
            }}
            onTaskCompleted={() => {
              // Refresh store when task completed
              loadStore().then(setStore);
            }}
            onTaskCommitted={async () => {
              // Refresh store when new commitment made
              const refreshedStore = await loadStore();
              setStore(refreshedStore);
              // Also refresh real commitments
              await fetchRealCommitments();
            }}
          />

          {/* Addictive Game Progress Components */}
          <WeeklyProgressBubbles
            completed={weeklyCompleted}
            total={5}
            rewardAmount={50}
            color="#2196F3"
          />

          <MonthlyProgressSlider
            completed={monthlyCompleted}
            total={20}
            rewardAmount={500}
            color="#2196F3"
            daysRemaining={Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()))}
          />

          {onyx.streakDays > 0 && (
            <StreakVisualizer
              currentStreak={onyx.streakDays}
              bestStreak={onyx.streakDays} // TODO: Track best streak in store
              color="#2196F3"
            />
          )}

          {/* Task Marketplace */}
          <TaskMarketplace 
            userProfile={{
              id: onyx.id,
              name: onyx.name,
              role: 'kid',
              age: 11,
              total_xp: 0,
              total_earnings_cents: onyx.balanceCents,
              created_at: ''
            }}
            color="#2196F3"
            onTaskClaimed={() => {
              // Refresh store when task claimed
              loadStore().then(setStore);
            }}
          />

          {/* Today's Commitments */}
          <Card style={{ marginTop: 16, backgroundColor: "white", elevation: 4 }}>
            <Card.Content style={{ gap: 12 }}>
              <Text variant="titleMedium" style={{ color: "#2196F3", fontWeight: "600" }}>
                📅 Today's Adventures ({today})
              </Text>
              {myToday.length === 0 ? (
                <View style={{ backgroundColor: "#2196F310", padding: 16, borderRadius: 8 }}>
                  <Text style={{ color: "#666", fontSize: 16, textAlign: "center" }}>
                    No commitments yet! Want to make one? 🚀
                  </Text>
                </View>
              ) : (
                myToday.map((item) => <CommitmentRow key={item.id} item={item} />)
              )}

              {myTomorrow.length > 0 && (
                <>
                  <Divider style={{ marginVertical: 8 }} />
                  <Text variant="titleMedium" style={{ color: "#2196F3", fontWeight: "600" }}>
                    🌅 Tomorrow's Plans ({tomorrow})
                  </Text>
                  {myTomorrow.map((item) => <CommitmentRow key={item.id} item={item} />)}
                </>
              )}
            </Card.Content>
          </Card>
        </View>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}