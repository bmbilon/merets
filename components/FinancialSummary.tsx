import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Surface, Text, Chip, Divider } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '../lib/supabase';

interface FinancialSummaryProps {
  compact?: boolean;
}

export default function FinancialSummary({ compact = false }: FinancialSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalEarned: 0,
    totalPending: 0,
    totalPaid: 0,
    thisWeek: 0,
    thisMonth: 0,
    averagePerTask: 0,
    topEarner: { name: '', amount: 0 }
  });

  useEffect(() => {
    fetchFinancialSummary();
  }, []);

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true);
      
      // Get all earner profiles
      const { data: users } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'kid');

      if (!users) return;

      // Calculate totals
      let totalEarned = 0;
      let topEarner = { name: '', amount: 0 };

      users.forEach(user => {
        const earnings = (user.total_earnings_cents || 0) / 100;
        totalEarned += earnings;
        
        if (earnings > topEarner.amount) {
          topEarner = { name: user.name, amount: earnings };
        }
      });

      // Get pending submissions
      const { data: pending } = await supabase
        .from('commitment_submissions')
        .select('commitment_id, commitments!inner(pay_cents)')
        .eq('status', 'pending_approval');

      const totalPending = pending?.reduce((sum, sub: any) => {
        return sum + ((sub.commitments?.pay_cents || 0) / 100);
      }, 0) || 0;

      // Get this week's earnings
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: weeklyCommitments } = await supabase
        .from('commitments')
        .select('pay_cents')
        .eq('status', 'completed')
        .gte('completed_at', oneWeekAgo.toISOString());

      const thisWeek = weeklyCommitments?.reduce((sum, c) => sum + ((c.pay_cents || 0) / 100), 0) || 0;

      // Get this month's earnings
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const { data: monthlyCommitments } = await supabase
        .from('commitments')
        .select('pay_cents')
        .eq('status', 'completed')
        .gte('completed_at', oneMonthAgo.toISOString());

      const thisMonth = monthlyCommitments?.reduce((sum, c) => sum + ((c.pay_cents || 0) / 100), 0) || 0;

      // Calculate average per task
      const { data: allCompleted } = await supabase
        .from('commitments')
        .select('pay_cents')
        .eq('status', 'completed');

      const averagePerTask = allCompleted && allCompleted.length > 0
        ? allCompleted.reduce((sum, c) => sum + ((c.pay_cents || 0) / 100), 0) / allCompleted.length
        : 0;

      setSummary({
        totalEarned,
        totalPending,
        totalPaid: totalEarned,
        thisWeek,
        thisMonth,
        averagePerTask,
        topEarner
      });
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Surface style={{ 
        borderRadius: 16, 
        padding: 24, 
        backgroundColor: '#fff',
        elevation: 2,
        alignItems: 'center'
      }}>
        <Text variant="bodyMedium" style={{ color: '#666' }}>Loading financial summary...</Text>
      </Surface>
    );
  }

  if (compact) {
    return (
      <Surface style={{ 
        borderRadius: 16, 
        padding: 16, 
        backgroundColor: '#fff',
        elevation: 2
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <IconSymbol size={24} name="dollarsign.circle.fill" color="#4CAF50" />
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              Financial Summary
            </Text>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="bodyMedium" style={{ color: '#666' }}>Total Paid Out</Text>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
              ${summary.totalEarned.toFixed(2)}
            </Text>
          </View>

          {summary.totalPending > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="bodyMedium" style={{ color: '#666' }}>Pending Approval</Text>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#FF9800' }}>
                ${summary.totalPending.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="bodyMedium" style={{ color: '#666' }}>This Week</Text>
            <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
              ${summary.thisWeek.toFixed(2)}
            </Text>
          </View>
        </View>
      </Surface>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <IconSymbol size={32} name="chart.bar.fill" color="#4CAF50" />
        <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
          Financial Overview
        </Text>
      </View>

      {/* Total Summary Card */}
      <Surface style={{ 
        borderRadius: 16, 
        padding: 20, 
        backgroundColor: '#E8F5E9',
        elevation: 2,
        marginBottom: 16
      }}>
        <Text variant="bodyLarge" style={{ color: '#2E7D32', marginBottom: 8 }}>
          Total Paid to Kids
        </Text>
        <Text variant="displaySmall" style={{ fontWeight: 'bold', color: '#2E7D32', marginBottom: 16 }}>
          ${summary.totalEarned.toFixed(2)}
        </Text>
        
        {summary.totalPending > 0 && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 8,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#C8E6C9'
          }}>
            <IconSymbol size={20} name="clock.fill" color="#FF9800" />
            <Text variant="bodyMedium" style={{ color: '#666' }}>
              ${summary.totalPending.toFixed(2)} pending approval
            </Text>
          </View>
        )}
      </Surface>

      {/* Time Period Breakdown */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <Surface style={{ 
          flex: 1,
          borderRadius: 16,
          padding: 16,
          backgroundColor: '#fff',
          elevation: 2
        }}>
          <IconSymbol size={24} name="calendar" color="#2196F3" style={{ marginBottom: 8 }} />
          <Text variant="bodySmall" style={{ color: '#666', marginBottom: 4 }}>
            This Week
          </Text>
          <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#2196F3' }}>
            ${summary.thisWeek.toFixed(2)}
          </Text>
        </Surface>

        <Surface style={{ 
          flex: 1,
          borderRadius: 16,
          padding: 16,
          backgroundColor: '#fff',
          elevation: 2
        }}>
          <IconSymbol size={24} name="calendar" color="#9C27B0" style={{ marginBottom: 8 }} />
          <Text variant="bodySmall" style={{ color: '#666', marginBottom: 4 }}>
            This Month
          </Text>
          <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#9C27B0' }}>
            ${summary.thisMonth.toFixed(2)}
          </Text>
        </Surface>
      </View>

      {/* Stats */}
      <Surface style={{ 
        borderRadius: 16, 
        padding: 20, 
        backgroundColor: '#fff',
        elevation: 2,
        marginBottom: 16
      }}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 16 }}>
          Statistics
        </Text>

        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <IconSymbol size={20} name="chart.line.uptrend.xyaxis" color="#666" />
              <Text variant="bodyMedium" style={{ color: '#666' }}>
                Average per Task
              </Text>
            </View>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              ${summary.averagePerTask.toFixed(2)}
            </Text>
          </View>

          <Divider />

          {summary.topEarner.name && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <IconSymbol size={20} name="trophy.fill" color="#FFD700" />
                <Text variant="bodyMedium" style={{ color: '#666' }}>
                  Top Earner
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                  {summary.topEarner.name}
                </Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>
                  ${summary.topEarner.amount.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Surface>

      {/* Budget Insights */}
      <Surface style={{ 
        borderRadius: 16, 
        padding: 20, 
        backgroundColor: '#FFF3E0',
        elevation: 2
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <IconSymbol size={24} name="lightbulb.fill" color="#F57C00" />
          <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#E65100' }}>
            Budget Insights
          </Text>
        </View>
        
        <Text variant="bodyMedium" style={{ color: '#E65100', marginBottom: 8 }}>
          • Weekly average: ${(summary.thisMonth / 4).toFixed(2)}
        </Text>
        <Text variant="bodyMedium" style={{ color: '#E65100', marginBottom: 8 }}>
          • Projected monthly: ${(summary.thisWeek * 4.33).toFixed(2)}
        </Text>
        {summary.totalPending > 0 && (
          <Text variant="bodyMedium" style={{ color: '#E65100' }}>
            • {summary.totalPending > 20 ? '⚠️' : '💡'} ${summary.totalPending.toFixed(2)} awaiting your approval
          </Text>
        )}
      </Surface>
    </ScrollView>
  );
}
