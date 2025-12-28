import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { SupabaseService } from '../lib/supabase-service'
import { supabase } from '../lib/supabase'

export const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState('Testing database connection...')
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    testConnection()
  }, [])

  const addResult = (message: string) => {
    setResults(prev => [...prev, message])
  }

  const testConnection = async () => {
    setLoading(true)
    setResults([])
    addResult('🔄 Starting database tests...')

    // Quick test to see if we get an API key error immediately
    try {
      // This will fail fast if API key is wrong
      await supabase.from('user_profiles').select('*').limit(1)
    } catch (error: any) {
      if (error.message?.includes('Invalid API key')) {
        addResult('❌ Invalid Supabase API key')
        addResult('   Error: ' + error.message)
        addResult('📋 To fix:')
        addResult('   1. Go to https://bzogqqkptnbtnmpzvdca.supabase.co')
        addResult('   2. Settings → API in left sidebar')
        addResult('   3. Copy the full "anon public" key (starts with eyJ)')
        addResult('   4. Update lib/supabase.ts with the complete key')
        addResult('   5. The key should be much longer than what you provided')
        setStatus('❌ Invalid API key - please update configuration')
        setLoading(false)
        return
      }
    }

    try {
      // Test 1: Get user profiles
      addResult('Testing user profiles...')
      const users = await SupabaseService.getUserProfiles()
      if (users.length > 0) {
        addResult(`✅ Found ${users.length} users: ${users.map(u => u.name).join(', ')}`)
      } else {
        addResult('❌ No users found - database might not be seeded')
      }

      // Test 2: Get skill categories
      addResult('Testing skill categories...')
      const skills = await SupabaseService.getSkillCategories()
      if (skills.length > 0) {
        addResult(`✅ Found ${skills.length} skills: ${skills.join(', ')}`)
      } else {
        addResult('❌ No skills found - pay_rates table might be empty')
      }

      // Test 3: Get micro-tasks
      addResult('Testing micro-tasks...')
      const microTasks = await SupabaseService.getMicroTasks()
      if (microTasks.length > 0) {
        addResult(`✅ Found ${microTasks.length} micro-tasks`)
        addResult(`   Sample: "${microTasks[0].title}" - $${(microTasks[0].base_pay_cents / 100).toFixed(2)}`)
      } else {
        addResult('❌ No micro-tasks found - task_templates table might be empty')
      }

      // Test 4: Get standard tasks
      addResult('Testing standard tasks...')
      const standardTasks = await SupabaseService.getStandardTasks()
      if (standardTasks.length > 0) {
        addResult(`✅ Found ${standardTasks.length} standard tasks`)
        addResult(`   Sample: "${standardTasks[0].title}" - $${(standardTasks[0].base_pay_cents / 100).toFixed(2)}`)
      } else {
        addResult('❌ No standard tasks found')
      }

      // Test 5: Test pay calculation
      addResult('Testing pay calculation...')
      const samplePay = await SupabaseService.calculateTaskPay('Cleaning', 30, 2)
      addResult(`✅ 30min Cleaning Level 2 = $${(samplePay / 100).toFixed(2)}`)

      setStatus('✅ Database tests completed!')

    } catch (error) {
      console.error('Database test error:', error)
      addResult(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setStatus('❌ Database connection failed!')
    } finally {
      setLoading(false)
    }
  }

  const testUserRetrieval = async () => {
    try {
      addResult('🔍 Testing user retrieval...')
      const aveya = await SupabaseService.getUserByName('Aveya')
      if (aveya) {
        addResult(`✅ Found Aveya: ID=${aveya.id}, XP=${aveya.total_xp}, Earnings=$${(aveya.total_earnings_cents / 100).toFixed(2)}`)
      } else {
        addResult('❌ Could not find Aveya - check user_profiles table')
      }
    } catch (error) {
      addResult(`❌ User retrieval error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        🧪 Supabase Database Test
      </Text>

      <View style={{ 
        backgroundColor: loading ? '#FFF3CD' : (status.includes('✅') ? '#D4EDDA' : '#F8D7DA'),
        padding: 15,
        borderRadius: 10,
        marginBottom: 20
      }}>
        <Text style={{ 
          fontSize: 16, 
          fontWeight: 'bold',
          color: loading ? '#856404' : (status.includes('✅') ? '#155724' : '#721c24')
        }}>
          {status}
        </Text>
      </View>

      <TouchableOpacity
        onPress={testConnection}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 10
        }}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          {loading ? 'Testing...' : 'Run Database Test'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={testUserRetrieval}
        style={{
          backgroundColor: '#28A745',
          padding: 15,
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 20
        }}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          Test User Retrieval
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Test Results:
      </Text>

      <ScrollView style={{ 
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        maxHeight: 400
      }}>
        {results.length === 0 ? (
          <Text style={{ color: '#666', fontStyle: 'italic' }}>
            No test results yet. Click "Run Database Test" to begin.
          </Text>
        ) : (
          results.map((result, index) => (
            <Text 
              key={index}
              style={{ 
                fontSize: 14,
                marginBottom: 8,
                fontFamily: 'monospace',
                color: result.includes('❌') ? '#dc3545' : 
                       result.includes('✅') ? '#28a745' : '#333'
              }}
            >
              {result}
            </Text>
          ))
        )}
      </ScrollView>

      <View style={{ 
        backgroundColor: '#E3F2FD',
        padding: 15,
        borderRadius: 10,
        marginTop: 20
      }}>
        <Text style={{ fontSize: 14, color: '#1565C0', fontWeight: '600' }}>
          📋 Database Setup Checklist:
        </Text>
        <Text style={{ fontSize: 12, color: '#1976D2', marginTop: 5 }}>
          1. Run schema.sql in Supabase SQL Editor{'\n'}
          2. Run seed.sql in Supabase SQL Editor{'\n'}
          3. Verify tables in Table Editor{'\n'}
          4. Test connection with this component
        </Text>
      </View>
    </View>
  )
}