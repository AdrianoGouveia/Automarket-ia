import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase signIn...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'SET' : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

try {
  console.log('\nAttempting signIn...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ag@bitmob.com.br',
    password: '12345678',
  });

  console.log('\nResult:');
  console.log('- hasData:', !!data);
  console.log('- hasError:', !!error);
  console.log('- hasSession:', !!data?.session);
  console.log('- hasUser:', !!data?.user);
  
  if (error) {
    console.log('\nError:', error);
  }
  
  if (data?.user) {
    console.log('\nUser:', {
      id: data.user.id,
      email: data.user.email,
      metadata: data.user.user_metadata,
    });
  }
  
  if (data?.session) {
    console.log('\nSession token:', data.session.access_token.substring(0, 50) + '...');
  }
} catch (err) {
  console.error('\nCaught exception:', err);
}
