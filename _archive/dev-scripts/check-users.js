const mongoose = require('mongoose');

// Connect and check users
async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/admin_dashboard');
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      role: String,
      status: String
    }));

    const users = await User.find({}, 'firstName lastName email role status');
    console.log('\n📋 Users in database:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ${user.firstName} ${user.lastName}`);
    });

    const admin = await User.findOne({ email: 'admin@example.com' });
    if (admin) {
      console.log('\n✅ Admin user found:', admin.email);
    } else {
      console.log('\n❌ Admin user not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();