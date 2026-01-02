import React, { useEffect, useState } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { Surface, Text, Chip, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface FinancialData {
  totalPaid: number;
  pendingPayments: number;
  thisMonth: number;
  lastMonth: number;
  byChild: { name: string; amount: number; tasks: number }[];
  byCategory: { category: string; amount: number; count: number }[];
  recentPayments: { date: string; child: string; task: string; amount: number }[];
}

export default function EnhancedFinancialSummary() {
  const [data, setData] = useState<FinancialData>({
    totalPaid: 0,
    pendingPayments: 0,
    thisMonth: 0,
    lastMonth: 0,
    byChild: [],
    byCategory: [],
    recentPayments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      // Get all commitments with payment data
      const { data: commitments } = await supabase
        .from('commitments')
        .select(`
          id,
          pay_cents,
          status,
          completed_at,
          user_id,
          task_template_id,
          user_profiles!inner(name),
          task_templates!inner(title, skill_category)
        `)
        .in('status', ['completed', 'in_progress', 'submitted']);

      if (!commitments) {
        setLoading(false);
        return;
      }

      // Calculate totals
      const completed = commitments.filter(c => c.status === 'completed');
      const pending = commitments.filter(c => c.status === 'submitted' || c.status === 'in_progress');
      
      const totalPaid = completed.reduce((sum, c) => sum + (c.pay_cents || 0), 0) / 100;
      const pendingPayments = pending.reduce((sum, c) => sum + (c.pay_cents || 0), 0) / 100;

      // This month vs last month
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonth = completed
        .filter(c => new Date(c.completed_at) >= thisMonthStart)
        .reduce((sum, c) => sum + (c.pay_cents || 0), 0) / 100;

      const lastMonth = completed
        .filter(c => {
          const date = new Date(c.completed_at);
          return date >= lastMonthStart && date <= lastMonthEnd;
        })
        .reduce((sum, c) => sum + (c.pay_cents || 0), 0) / 100;

      // By child
      const byChildMap = new Map<string, { amount: number; tasks: number }>();
      completed.forEach(c => {
        const name = (c.user_profiles as any).name;
        const existing = byChildMap.get(name) || { amount: 0, tasks: 0 };
        byChildMap.set(name, {
          amount: existing.amount + (c.pay_cents || 0) / 100,
          tasks: existing.tasks + 1
        });
      });
      const byChild = Array.from(byChildMap.entries()).map(([name, data]) => ({
        name,
        ...data
      })).sort((a, b) => b.amount - a.amount);

      // By category
      const byCategoryMap = new Map<string, { amount: number; count: number }>();
      completed.forEach(c => {
        const category = (c.task_templates as any).skill_category || 'Other';
        const existing = byCategoryMap.get(category) || { amount: 0, count: 0 };
        byCategoryMap.set(category, {
          amount: existing.amount + (c.pay_cents || 0) / 100,
          count: existing.count + 1
        });
      });
      const byCategory = Array.from(byCategoryMap.entries()).map(([category, data]) => ({
        category,
        ...data
      })).sort((a, b) => b.amount - a.amount);

      // Recent payments (last 10)
      const recentPayments = completed
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
        .slice(0, 10)
        .map(c => ({
          date: new Date(c.completed_at).toLocaleDateString(),
          child: (c.user_profiles as any).name,
          task: (c.task_templates as any).title,
          amount: (c.pay_cents || 0) / 100
        }));

      setData({
        totalPaid,
        pendingPayments,
        thisMonth,
        lastMonth,
        byChild,
        byCategory,
        recentPayments
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading financial data...</Text>
      </View>
    );
  }

  const monthChange = data.lastMonth > 0 
    ? ((data.thisMonth - data.lastMonth) / data.lastMonth * 100).toFixed(1)
    : '0';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <LinearGradient
        colors={['#2E7D32', '#1B5E20']}
        style={{ padding: 20, paddingTop: 40 }}
      >
        <Text variant="headlineMedium" style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>
          Financial Overview
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
          Track family task earnings and spending
        </Text>
      </LinearGradient>

      {/* Summary Cards */}
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <Surface style={{ flex: 1, minWidth: (width - 44) / 2, padding: 16, borderRadius: 12, elevation: 3 }}>
            <Text style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>Total Paid</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#2E7D32' }}>
              ${data.totalPaid.toFixed(2)}
            </Text>
          </Surface>

          <Surface style={{ flex: 1, minWidth: (width - 44) / 2, padding: 16, borderRadius: 12, elevation: 3 }}>
            <Text style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>Pending</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FF6B00' }}>
              ${data.pendingPayments.toFixed(2)}
            </Text>
          </Surface>

          <Surface style={{ flex: 1, minWidth: (width - 44) / 2, padding: 16, borderRadius: 12, elevation: 3 }}>
            <Text style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>This Month</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1976D2' }}>
              ${data.thisMonth.toFixed(2)}
            </Text>
            {data.lastMonth > 0 && (
              <Chip
                compact
                style={{ 
                  alignSelf: 'flex-start', 
                  marginTop: 8,
                  backgroundColor: parseFloat(monthChange) >= 0 ? '#E8F5E9' : '#FFEBEE'
                }}
                textStyle={{ fontSize: 10, color: parseFloat(monthChange) >= 0 ? '#2E7D32' : '#D32F2F' }}
              >
                {parseFloat(monthChange) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(monthChange))}%
              </Chip>
            )}
          </Surface>

          <Surface style={{ flex: 1, minWidth: (width - 44) / 2, padding: 16, borderRadius: 12, elevation: 3 }}>
            <Text style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>Last Month</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#666' }}>
              ${data.lastMonth.toFixed(2)}
            </Text>
          </Surface>
        </View>

        {/* By Child */}
        <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 12 }}>
          By Child
        </Text>
        {data.byChild.map((child, index) => (
          <Surface key={index} style={{ padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  {child.name}
                </Text>
                <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
                  {child.tasks} tasks completed
                </Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2E7D32' }}>
                ${child.amount.toFixed(2)}
              </Text>
            </View>
          </Surface>
        ))}

        {/* By Category */}
        <Text variant="titleLarge" style={{ fontWeight: 'bold', marginTop: 20, marginBottom: 12 }}>
          By Category
        </Text>
        {data.byCategory.map((cat, index) => (
          <Surface key={index} style={{ padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  {cat.category}
                </Text>
                <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
                  {cat.count} tasks
                </Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1976D2' }}>
                ${cat.amount.toFixed(2)}
              </Text>
            </View>
          </Surface>
        ))}

        {/* Recent Payments */}
        <Text variant="titleLarge" style={{ fontWeight: 'bold', marginTop: 20, marginBottom: 12 }}>
          Recent Payments
        </Text>
        <Surface style={{ borderRadius: 12, elevation: 2, overflow: 'hidden' }}>
          {data.recentPayments.map((payment, index) => (
            <View key={index}>
              <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>
                    {payment.child}
                  </Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>
                    {payment.task}
                  </Text>
                  <Text style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
                    {payment.date}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2E7D32', marginLeft: 12 }}>
                  ${payment.amount.toFixed(2)}
                </Text>
              </View>
              {index < data.recentPayments.length - 1 && <Divider />}
            </View>
          ))}
        </Surface>
      </View>
    </ScrollView>
  );
}
