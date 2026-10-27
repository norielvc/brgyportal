const bcrypt = require('./backend/node_modules/bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nCopy this hash and update the password_hash in Supabase for admin@example.com');
}

generateHash();
