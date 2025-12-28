import React, { useEffect, useState } from "react";
import { View, FlatList, Alert, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Provider as PaperProvider,
  Button,
  Card,
  Text,
  TextInput,
  SegmentedButtons,
  Chip,
  Divider,
  IconButton,
} from "react-native-paper";

import FamilyChat from './family-chat';
import { ParentAdminPortal } from '../../components/ParentAdminPortal';
import { TaskMallAdmin } from '../../components/TaskMallAdmin';
import { SupabaseService } from '../../lib/supabase-service';

type Status = "SUBMITTED" | "APPROVED" | "REJECTED" | "COMPLETED" | "MISSED";

type Kid = {
  id: string;
  name: string;
  meretCount: number;
  lifetimeMeters: number;
  balanceCents: number;
  streakDays: number;
  lastMeretDate?: string; // YYYY-MM-DD
};

type Commitment = {
  id: string;
  kidId: string;
  title: string;
  details?: string;
  date: string; // YYYY-MM-DD
  effortMin: number;
  status: Status;
  createdAt: number;
  approvedAt?: number;
  decidedAt?: number;
  decidedBy?: "MOM" | "DAD";
};

type Store = {
  kids: Kid[];
  commitments: Commitment[];
  taskLibrary: { title: string; details?: string; effortMin: number; uses: number }[];
  lastBonusPaid?: { weekly?: string; monthly?: string }; // YYYY-WW, YYYY-MM
};

const STORAGE_KEY = "commitments_stickers_store_v1";
const PARENT_AUTH_KEY = "parent_authenticated";

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
  const dayNr = (d.getDay() + 6) % 7; // Mon=0
  target.setDate(target.getDate() - dayNr + 3); // Thu
  const firstThu = new Date(target.getFullYear(), 0, 4);
  const firstDayNr = (firstThu.getDay() + 6) % 7;
  firstThu.setDate(firstThu.getDate() - firstDayNr + 3);
  const weekNo = 1 + Math.round((target.getTime() - firstThu.getTime()) / (7 * 24 * 3600 * 1000));
  return `${target.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7); // YYYY-MM
}

async function loadStore(): Promise<Store> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);

  const seeded: Store = {
    kids: [
      { id: "kid1", name: "Aveya", meretCount: 0, lifetimeMeters: 0, balanceCents: 0, streakDays: 0 },
      { id: "kid2", name: "Onyx", meretCount: 0, lifetimeMeters: 0, balanceCents: 0, streakDays: 0 },
    ],
    commitments: [],
    taskLibrary: [
      { title: "Keep sink clear of dishes all day", details: "Dishwasher empty or loaded and running towards a cycle.", effortMin: 60, uses: 1 },
      { title: "Clear snow from walkways", details: "Keep walkways safe. Bring deliveries in the same day.", effortMin: 60, uses: 1 },
      { title: "Schoolwork sprint", details: "45–90 minutes: finish assignments due this week.", effortMin: 60, uses: 1 },
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

function CommitmentRow({ item, kidName }: { item: Commitment; kidName: string }) {
  const statusChip = (() => {
    const map: Record<Status, { label: string }> = {
      SUBMITTED: { label: "Waiting approval" },
      APPROVED: { label: "Approved" },
      REJECTED: { label: "Rejected" },
      COMPLETED: { label: "🙂 Smiley" },
      MISSED: { label: "⭕ Missed" },
    };
    return map[item.status];
  })();

  return (
    <Card style={{ marginVertical: 6 }}>
      <Card.Content style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="titleSmall">{item.title}</Text>
          <Text variant="labelSmall">{kidName}</Text>
        </View>
        {!!item.details && <Text variant="bodySmall">{item.details}</Text>}
        <Text variant="bodySmall">Date: {item.date}</Text>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Chip>{statusChip.label}</Chip>
          <Chip>{item.effortMin} min</Chip>
        </View>
      </Card.Content>
    </Card>
  );
}

export default function ParentScreen() {
  const { store, persist } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [role, setRole] = useState<"MOM" | "DAD">("DAD");
  const [selectedKid, setSelectedKid] = useState("kid1");
  const [showChat, setShowChat] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [showTaskMallAdmin, setShowTaskMallAdmin] = useState(false);
  const [parentProfile, setParentProfile] = useState<any>(null);

  useEffect(() => {
    // Check if already authenticated
    AsyncStorage.getItem(PARENT_AUTH_KEY).then((auth) => {
      if (auth === "true") {
        setIsAuthenticated(true);
        // Load parent profile for admin portal
        loadParentProfile();
      }
    });
  }, []);

  const loadParentProfile = async () => {
    try {
      const parentName = role === 'MOM' ? 'Lauren' : 'Brett';
      const profile = await SupabaseService.getUserByName(parentName);
      setParentProfile(profile);
    } catch (error) {
      console.error('Error loading parent profile:', error);
    }
  };

  const handleLogin = async () => {
    // Simple password check (in real app, use proper authentication)
    if (password === "Plume79$") {
      setIsAuthenticated(true);
      await AsyncStorage.setItem(PARENT_AUTH_KEY, "true");
      setPassword("");
    } else {
      Alert.alert("Access Denied", "Incorrect password");
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    await AsyncStorage.removeItem(PARENT_AUTH_KEY);
  };

  if (!store) {
    return (
      <PaperProvider>
        <View style={{ padding: 16, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading…</Text>
        </View>
      </PaperProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <PaperProvider>
        <View style={{ flex: 1, padding: 16, paddingTop: 100, justifyContent: 'center', alignItems: 'center' }}>
          <Card style={{ width: '100%', maxWidth: 400 }}>
            <Card.Content style={{ gap: 16 }}>
              <Text variant="headlineMedium" style={{ textAlign: 'center' }}>Parent Access</Text>
              <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
                Enter the parent password to access commitment management
              </Text>
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                onSubmitEditing={handleLogin}
                right={
                  <TextInput.Icon
                    icon={passwordVisible ? "eye-off" : "eye"}
                    onPress={() => setPasswordVisible(!passwordVisible)}
                  />
                }
              />
              <Button mode="contained" onPress={handleLogin}>
                Sign In
              </Button>
            </Card.Content>
          </Card>
        </View>
      </PaperProvider>
    );
  }

  const today = todayStr(0);
  const kid = store.kids.find((k) => k.id === selectedKid)!;
  
  const pending = store.commitments.filter((c) => c.status === "SUBMITTED");
  const approvedToday = store.commitments.filter((c) => c.date === today && c.status === "APPROVED");
  const allCommitments = store.commitments.slice(0, 20); // Show recent 20

  const applyDecision = async (commitmentId: string, status: Status) => {
    const commitments = store.commitments.map((c) =>
      c.id === commitmentId
        ? { ...c, status, approvedAt: status === "APPROVED" ? Date.now() : c.approvedAt }
        : c
    );
    await persist({ ...store, commitments });
  };

  const markOutcome = async (commitmentId: string, outcome: "COMPLETED" | "MISSED") => {
    const c = store.commitments.find((x) => x.id === commitmentId);
    if (!c) return;

    const commitments = store.commitments.map((x) =>
      x.id === commitmentId ? { ...x, status: outcome, decidedAt: Date.now(), decidedBy: role } : x
    );

    const kids = store.kids.map((k) => {
      if (k.id !== c.kidId) return k;

      if (outcome === "COMPLETED") {
        const newStickerCount = k.stickerCount + 1;
        const newLifetime = k.lifetimeStickers + 1;
        const newBalance = k.balanceCents + 2000;

        const yesterday = todayStr(-1);
        const streak = k.lastStickerDate === yesterday ? k.streakDays + 1 : 1;

        return {
          ...k,
          stickerCount: newStickerCount,
          lifetimeStickers: newLifetime,
          balanceCents: newBalance,
          streakDays: streak,
          lastStickerDate: c.date,
        };
      } else {
        return { ...k, stickerCount: Math.max(0, k.stickerCount - 1) };
      }
    });

    const nextStore: Store = { ...store, commitments, kids };
    const wk = weekKey(today);
    const mk = monthKey(today);

    const weeklyCompleted = countCompletedForKid(nextStore, c.kidId, (x) => weekKey(x.date) === wk);
    const monthlyCompleted = countCompletedForKid(nextStore, c.kidId, (x) => monthKey(x.date) === mk);

    let bonusAdded = 0;

    if (weeklyCompleted >= 5 && nextStore.lastBonusPaid?.weekly !== wk) {
      bonusAdded += 5000;
      nextStore.lastBonusPaid = { ...(nextStore.lastBonusPaid ?? {}), weekly: wk };
    }
    if (monthlyCompleted >= 20 && nextStore.lastBonusPaid?.monthly !== mk) {
      bonusAdded += 50000;
      nextStore.lastBonusPaid = { ...(nextStore.lastBonusPaid ?? {}), monthly: mk };
    }
    if (bonusAdded > 0) {
      nextStore.kids = nextStore.kids.map((k) => (k.id === c.kidId ? { ...k, balanceCents: k.balanceCents + bonusAdded } : k));
      const kidName = store.kids.find((k) => k.id === c.kidId)?.name || "Kid";
      Alert.alert("Bonus paid", `Added ${dollars(bonusAdded)} to ${kidName}'s balance.`);
    }

    await persist(nextStore);
  };

  if (showChat) {
    return (
      <FamilyChat
        currentUserId={role.toLowerCase() === 'mom' ? 'lauren' : 'brett'}
        currentUserName={role === 'MOM' ? 'Mom' : 'Dad'}
        onBack={() => setShowChat(false)}
      />
    );
  }

  if (showAdminPortal && parentProfile) {
    return (
      <PaperProvider>
        <ParentAdminPortal
          parentProfile={parentProfile}
          onClose={() => setShowAdminPortal(false)}
        />
      </PaperProvider>
    );
  }

  if (showTaskMallAdmin) {
    return (
      <PaperProvider>
        <TaskMallAdmin
          parentProfile={parentProfile}
          onClose={() => setShowTaskMallAdmin(false)}
        />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <ScrollView style={{ flex: 1, padding: 16, paddingTop: 36 }}>
        <Card>
          <Card.Content style={{ gap: 10 }}>
            {/* Header with better spacing */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <Text variant="headlineSmall" style={{ flex: 1, minWidth: 150 }}>Parent Dashboard</Text>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                <IconButton 
                  icon="store" 
                  onPress={() => {
                    loadParentProfile();
                    setShowTaskMallAdmin(true);
                  }}
                  style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', margin: 0 }}
                  iconColor="#4CAF50"
                  size={20}
                />
                <IconButton 
                  icon="cog" 
                  onPress={() => {
                    loadParentProfile();
                    setShowAdminPortal(true);
                  }}
                  style={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', margin: 0 }}
                  iconColor="#FF9800"
                  size={20}
                />
                <IconButton 
                  icon="chat" 
                  onPress={() => setShowChat(true)}
                  style={{ backgroundColor: 'rgba(233, 30, 99, 0.1)', margin: 0 }}
                  iconColor="#E91E63"
                  size={20}
                />
                <Button 
                  mode="outlined" 
                  compact 
                  onPress={handleLogout}
                  style={{ minWidth: 80 }}
                >
                  Sign Out
                </Button>
              </View>
            </View>

            <SegmentedButtons
              value={role}
              onValueChange={(v) => setRole(v as any)}
              buttons={[
                { value: "MOM", label: "Mom" },
                { value: "DAD", label: "Dad" },
              ]}
            />

            <Divider />

            <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
              {store.kids.map((k) => (
                <View key={k.id} style={{ alignItems: "center" }}>
                  <Text variant="titleMedium">{k.name}</Text>
                  <Text variant="bodyMedium">🏆 {k.meretCount}</Text>
                  <Text variant="bodySmall">{dollars(k.balanceCents)}</Text>
                  <Text variant="bodySmall">🔥 {k.streakDays} days</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Task Mall Management */}
        <Card style={{ marginTop: 12, backgroundColor: '#E8F5E8' }}>
          <Card.Content style={{ gap: 12 }}>
            <Text variant="titleLarge" style={{ color: '#2E7D32', fontWeight: 'bold' }}>
              🛒 Task Mall Management
            </Text>
            <Text variant="bodyMedium" style={{ color: '#666' }}>
              Manage all household tasks, pricing, and priorities
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Button
                mode="contained"
                icon="store"
                onPress={() => {
                  loadParentProfile();
                  setShowTaskMallAdmin(true);
                }}
                style={{ backgroundColor: '#4CAF50', flex: 1 }}
              >
                Manage Tasks
              </Button>
              <Button
                mode="outlined"
                icon="cog"
                onPress={() => {
                  loadParentProfile();
                  setShowAdminPortal(true);
                }}
                style={{ borderColor: '#FF9800', flex: 1 }}
                textColor="#FF9800"
              >
                Priorities
              </Button>
            </View>
          </Card.Content>
        </Card>

        {pending.length > 0 && (
          <Card style={{ marginTop: 12 }}>
            <Card.Content style={{ gap: 8 }}>
              <Text variant="titleLarge">⏳ Awaiting Approval ({pending.length})</Text>
              {pending.map((c) => {
                const kidName = store.kids.find((k) => k.id === c.kidId)?.name || "Kid";
                return (
                  <Card key={c.id} style={{ marginVertical: 6 }}>
                    <Card.Content style={{ gap: 6 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text variant="titleSmall">{c.title}</Text>
                        <Text variant="labelSmall">{kidName}</Text>
                      </View>
                      {!!c.details && <Text variant="bodySmall">{c.details}</Text>}
                      <Text variant="bodySmall">Date: {c.date} • {c.effortMin} min</Text>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <Button mode="contained" onPress={() => applyDecision(c.id, "APPROVED")}>
                          ✅ Approve
                        </Button>
                        <Button mode="outlined" onPress={() => applyDecision(c.id, "REJECTED")}>
                          ❌ Reject
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {approvedToday.length > 0 && (
          <Card style={{ marginTop: 12 }}>
            <Card.Content style={{ gap: 8 }}>
              <Text variant="titleLarge">🎯 Ready for Merets - Today ({approvedToday.length})</Text>
              {approvedToday.map((c) => {
                const kidName = store.kids.find((k) => k.id === c.kidId)?.name || "Kid";
                return (
                  <Card key={c.id} style={{ marginVertical: 6 }}>
                    <Card.Content style={{ gap: 6 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text variant="titleSmall">{c.title}</Text>
                        <Text variant="labelSmall">{kidName}</Text>
                      </View>
                      {!!c.details && <Text variant="bodySmall">{c.details}</Text>}
                      <Text variant="bodySmall">{c.effortMin} min effort</Text>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <Button mode="contained" onPress={() => markOutcome(c.id, "COMPLETED")}>
                          🙂 Give Meret
                        </Button>
                        <Button mode="outlined" onPress={() => markOutcome(c.id, "MISSED")}>
                          ⭕ Mark Missed
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                );
              })}
            </Card.Content>
          </Card>
        )}

        <Card style={{ marginTop: 12 }}>
          <Card.Content style={{ gap: 8 }}>
            <Text variant="titleLarge">📊 Recent Activity</Text>
            {allCommitments.length === 0 ? (
              <Text>No commitments yet.</Text>
            ) : (
              allCommitments.map((item) => {
                const kidName = store.kids.find((k) => k.id === item.kidId)?.name || "Kid";
                return <CommitmentRow key={item.id} item={item} kidName={kidName} />;
              })
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </PaperProvider>
  );
}