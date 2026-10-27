const { supabase } = require('./backend/services/supabaseClient');

async function fixUserRoles() {
  try {
    console.log('=== FIXING USER ROLES ===');
    
    // Update Noriel Cruz to staff role (first approver)
    const { data: norielUpdate, error: norielError } = await supabase
      .from('users')
      .update({ role: 'staff' })
      .eq('email', 'norielzurc@gmail.com')
      .select();
    
    if (norielError) {
      console.error('Error updating Noriel role:', norielError);
    } else {
      console.log('✅ Updated Noriel Cruz to staff role');
    }
    
    // Update some other users to staff role for testing
    const staffEmails = ['jane.smith@example.com', 'sarah.wilson@example.com'];
    
    for (const email of staffEmails) {
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ role: 'staff' })
        .eq('email', email)
        .select();
      
      if (updateError) {
        console.error(`Error updating ${email}:`, updateError);
      } else {
        console.log(`✅ Updated ${email} to staff role`);
      }
    }
    
    // Ensure admin users are properly set
    const adminEmails = ['admin@example.com', 'david.brown@example.com'];
    
    for (const email of adminEmails) {
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', email)
        .select();
      
      if (updateError) {
        console.error(`Error updating ${email}:`, updateError);
      } else {
        console.log(`✅ Confirmed ${email} as admin role`);
      }
    }
    
    console.log('\n=== CHECKING UPDATED ROLES ===');
    
    // Get updated users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('role', { ascending: false });
    
    if (usersError) {
      console.error('Error fetching updated users:', usersError);
      return;
    }
    
    console.log('Updated user roles:');
    users.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role} - ID: ${user.id}`);
    });
    
    // Get staff and admin IDs for workflow update
    const staffUsers = users.filter(u => u.role === 'staff');
    const adminUsers = users.filter(u => u.role === 'admin');
    
    console.log('\n=== NEW WORKFLOW ASSIGNMENTS ===');
    console.log('Staff IDs for Step 2 (Under Review):');
    console.log(JSON.stringify(staffUsers.map(u => u.id), null, 2));
    
    console.log('\nAdmin IDs for Step 3 (Captain Approval):');
    console.log(JSON.stringify(adminUsers.map(u => u.id), null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixUserRoles();