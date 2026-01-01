import React, { useState, useEffect } from "react";
import { View } from "react-native";
import EarnerDashboard from "@/components/EarnerDashboard";
import { SupabaseService } from '../../lib/supabase-service';

interface AveyaDashboardProps {
  onSwitchUser: () => void;
}

export default function AveyaDashboard({ onSwitchUser }: AveyaDashboardProps) {
  const [rep, setRep] = useState(75);
  const [totalMerets, setTotalMerets] = useState(150);
  const [totalCredits, setTotalCredits] = useState(245);
  const [activeMents, setActiveMents] = useState(3);
  const [completedMents, setCompletedMents] = useState(12);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      // TODO: Replace with actual Supabase queries
      // const stats = await SupabaseService.getUserStats('aveya');
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
      userName="Aveya"
      userColor="#E91E63"
      rep={rep}
      totalMerets={totalMerets}
      totalCredits={totalCredits}
      activeMents={activeMents}
      completedMents={completedMents}
    />
  );
}
