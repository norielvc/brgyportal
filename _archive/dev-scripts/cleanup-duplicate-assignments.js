const { supabase } = require('./backend/services/supabaseClient');

async function cleanupDuplicateAssignments() {
  try {
    console.log('=== CLEANING UP DUPLICATE WORKFLOW ASSIGNMENTS ===');
    
    // Find duplicate assignments (same request_id, step_id, assigned_user_id)
    const { data: assignments, error: fetchError } = await supabase
      .from('workflow_assignments')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      console.error('Error fetching assignments:', fetchError);
      return;
    }
    
    console.log(`Total assignments found: ${assignments.length}`);
    
    // Group by request_id + step_id + assigned_user_id
    const groupedAssignments = {};
    const duplicatesToDelete = [];
    
    assignments.forEach(assignment => {
      const key = `${assignment.request_id}-${assignment.step_id}-${assignment.assigned_user_id}`;
      
      if (!groupedAssignments[key]) {
        groupedAssignments[key] = [];
      }
      groupedAssignments[key].push(assignment);
    });
    
    // Find duplicates (keep the first one, mark others for deletion)
    Object.keys(groupedAssignments).forEach(key => {
      const group = groupedAssignments[key];
      if (group.length > 1) {
        console.log(`Found ${group.length} duplicates for key: ${key}`);
        // Keep the first (oldest) assignment, delete the rest
        for (let i = 1; i < group.length; i++) {
          duplicatesToDelete.push(group[i].id);
        }
      }
    });
    
    console.log(`Found ${duplicatesToDelete.length} duplicate assignments to delete`);
    
    if (duplicatesToDelete.length > 0) {
      // Delete duplicates in batches
      const batchSize = 10;
      for (let i = 0; i < duplicatesToDelete.length; i += batchSize) {
        const batch = duplicatesToDelete.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('workflow_assignments')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          console.error(`Error deleting batch ${i / batchSize + 1}:`, deleteError);
        } else {
          console.log(`Deleted batch ${i / batchSize + 1}: ${batch.length} assignments`);
        }
      }
      
      console.log(`✅ Cleanup completed. Deleted ${duplicatesToDelete.length} duplicate assignments`);
    } else {
      console.log('✅ No duplicates found');
    }
    
    // Show final count
    const { data: finalAssignments, error: finalError } = await supabase
      .from('workflow_assignments')
      .select('id');
    
    if (finalError) {
      console.error('Error getting final count:', finalError);
    } else {
      console.log(`Final assignment count: ${finalAssignments.length}`);
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupDuplicateAssignments();