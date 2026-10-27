const { supabase } = require('./backend/services/supabaseClient');

async function checkUsersAndWorkflows() {
  try {
    console.log('=== CHECKING USERS IN DATABASE ===');
    
    // Get all users from database
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log('Users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('---');
    });
    
    console.log('\n=== STAFF AND ADMIN USERS ===');
    const staffUsers = users.filter(u => u.role === 'staff');
    const adminUsers = users.filter(u => u.role === 'admin');
    
    console.log('Staff Users:');
    staffUsers.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - ID: ${user.id}`);
    });
    
    console.log('\nAdmin Users:');
    adminUsers.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - ID: ${user.id}`);
    });
    
    console.log('\n=== RECOMMENDED WORKFLOW ASSIGNMENTS ===');
    console.log('For Step 2 (Staff Review) - assignedUsers should be:');
    console.log(JSON.stringify(staffUsers.map(u => u.id), null, 2));
    
    console.log('\nFor Step 3 (Captain Approval) - assignedUsers should be:');
    console.log(JSON.stringify(adminUsers.map(u => u.id), null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsersAndWorkflows();