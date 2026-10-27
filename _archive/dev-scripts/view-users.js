const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function viewUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/admin_dashboard';
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      role: String,
      status: String,
      loginCount: Number,
      lastLogin: Date,
      createdAt: Date,
      updatedAt: Date
    }));

    console.log('\n' + '='.repeat(80));
    console.log('                           USER DATABASE VIEWER');
    console.log('='.repeat(80));

    const users = await User.find({}).sort({ createdAt: -1 });
    
    console.log(`\n📊 Total Users: ${users.length}`);
    
    // Group by status
    const activeUsers = users.filter(u => u.status === 'active');
    const inactiveUsers = users.filter(u => u.status === 'inactive');
    const suspendedUsers = users.filter(u => u.status === 'suspended');
    const adminUsers = users.filter(u => u.role === 'admin');

    console.log(`✅ Active: ${activeUsers.length} | ❌ Inactive: ${inactiveUsers.length} | 🚫 Suspended: ${suspendedUsers.length} | 👑 Admins: ${adminUsers.length}`);

    console.log('\n' + '-'.repeat(80));
    console.log('ID'.padEnd(8) + 'NAME'.padEnd(25) + 'EMAIL'.padEnd(30) + 'ROLE'.padEnd(8) + 'STATUS');
    console.log('-'.repeat(80));

    users.forEach((user, index) => {
      const id = (index + 1).toString().padEnd(8);
      const name = `${user.firstName} ${user.lastName}`.padEnd(25);
      const email = user.email.padEnd(30);
      const role = user.role.padEnd(8);
      const statusIcon = user.status === 'active' ? '✅' : user.status === 'inactive' ? '❌' : '🚫';
      const status = `${statusIcon} ${user.status}`;
      
      console.log(`${id}${name}${email}${role}${status}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('🔑 LOGIN CREDENTIALS FOR TESTING:');
    console.log('='.repeat(80));
    console.log('Admin: admin@example.com / admin123');
    console.log('User:  user@example.com / user123');
    console.log('\n💡 TIP: Use MongoDB Compass GUI for detailed view and editing');
    console.log('   Connection: mongodb://localhost:27017');
    console.log('   Database: admin_dashboard');
    console.log('   Collection: users');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

viewUsers();