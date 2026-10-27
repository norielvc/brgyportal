const { supabase } = require('./backend/services/supabaseClient');

async function checkUserRolesConstraint() {
  try {
    console.log('=== CHECKING USER ROLES CONSTRAINT ===');
    
    // Try to get the table schema information
    const { data, error } = await supabase
      .rpc('get_table_constraints', { table_name: 'users' })
      .single();
    
    if (error) {
      console.log('Could not get constraints via RPC, checking manually...');
      
      // Let's try to see what roles exist currently
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role')
        .order('role');
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
      }
      
      const uniqueRoles = [...new Set(users.map(u => u.role))];
      console.log('Current roles in database:', uniqueRoles);
      
      // Let's try updating one user to different roles to see what's allowed
      console.log('\n=== TESTING ALLOWED ROLES ===');
      const testUserId = 'f398db9a-1224-42f9-a72f-69dd14fa5064'; // Jane Smith
      
      const rolesToTest = ['staff', 'manager', 'employee', 'clerk', 'secretary'];
      
      for (const role of rolesToTest) {
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({ role: role })
          .eq('id', testUserId)
          .select();
        
        if (updateError) {
          console.log(`❌ Role '${role}' is NOT allowed: ${updateError.message}`);
        } else {
          console.log(`✅ Role '${role}' is allowed`);
          // Revert back to user
          await supabase
            .from('users')
            .update({ role: 'user' })
            .eq('id', testUserId);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserRolesConstraint();