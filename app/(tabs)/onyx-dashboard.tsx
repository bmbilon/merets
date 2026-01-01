import React, { useState, useEffect } from "react";
import { View } from "react-native";
import EarnerDashboard from "@/components/EarnerDashboard";
import { SupabaseService } from '../../lib/supabase-service';

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
  const [rep, setRep] = useState(45);
  const [totalMerets, setTotalMerets] = useState(80);
  const [totalCredits, setTotalCredits] = useState(125);
  const [activeMents, setActiveMents] = useState(2);
  const [completedMents, setCompletedMents] = useState(7);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      // TODO: Replace with actual Supabase queries
      // const stats = await SupabaseService.getUserStats('onyx');
      // setRep(stats.rep);
      // setTotalMerets(stats.totalMerets);
      // setTotalCredits(stats.totalCredits);
      // setActiveMents(stats.activeMents);
      // setCompletedMents(stats.completedMents);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  return (
    <EarnerDashboard
      userName="Onyx"
      userColor="#2196F3"
      rep={rep}
      totalMerets={totalMerets}
      totalCredits={totalCredits}
      activeMents={activeMents}
      completedMents={completedMents}
    />
  );
}
