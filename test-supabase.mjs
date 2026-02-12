import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== Supabase Configuration Test ===');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('\n=== Testing signInWithPassword ===');
try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ag@bitmob.com.br',
    password: '12345678',
  });

  if (error) {
    console.error('❌ Login error:', error.message);
    process.exit(1);
  }

  console.log('✅ Login successful!');
  console.log('User ID:', data.user?.id);
  console.log('User Email:', data.user?.email);
  console.log('Session exists:', !!data.session);
  console.log('Access Token:', data.session?.access_token ? `${data.session.access_token.substring(0, 20)}...` : 'MISSING');

  console.log('\n=== Testing getUser with token ===');
  const { data: userData, error: userError } = await supabase.auth.getUser(data.session.access_token);

  if (userError) {
    console.error('❌ GetUser error:', userError.message);
    process.exit(1);
  }

  console.log('✅ GetUser successful!');
  console.log('User ID:', userData.user?.id);
  console.log('User Email:', userData.user?.email);
  console.log('User Metadata:', userData.user?.user_metadata);

  console.log('\n✅ All tests passed!');
} catch (err) {
  console.error('❌ Unexpected error:', err.message);
  console.error(err.stack);
  process.exit(1);
}
