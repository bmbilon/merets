const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bzogqqkptnbtnmpzvdca.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b2dxcWtwdG5idG5tcHp2ZGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDYxNjQsImV4cCI6MjA4MjI4MjE2NH0.sRD72Zve-r5tGfAg8rRPFnaaCdFHwLdz59_HIpFgen4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success! Found', data.length, 'tasks');
      console.log('First task:', JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testConnection();
