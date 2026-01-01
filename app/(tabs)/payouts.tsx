import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import FinancialSummary from '../../components/FinancialSummary';

export default function PayoutsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }} edges={['top']}>
      <FinancialSummary />
    </SafeAreaView>
  );
}
