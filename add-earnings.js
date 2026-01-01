#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bzogqqkptnbtnmpzvdca.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addEarnings() {
  try {
    // Get Aveya and Onyx profiles
    const { data: profiles, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('name', ['Aveya', 'Onyx']);

    if (fetchError) throw fetchError;

    console.log('Found profiles:', profiles.map(p => p.name).join(', '));

    // Add $140 (14000 cents) to each kid
    const additionalCents = 14000;

    for (const profile of profiles) {
      const currentEarnings = profile.total_earnings_cents || 0;
      const newEarnings = currentEarnings + additionalCents;

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ total_earnings_cents: newEarnings })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      console.log(`✅ ${profile.name}: $${(currentEarnings / 100).toFixed(2)} → $${(newEarnings / 100).toFixed(2)} (+$140.00)`);
    }

    console.log('\n✨ Successfully added $140 to each kid\'s total earnings!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addEarnings();
