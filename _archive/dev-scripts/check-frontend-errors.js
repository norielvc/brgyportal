const http = require('http');

async function checkFrontend() {
  console.log('🔍 Checking CompanyHub Frontend...');
  
  try {
    // Test if frontend is accessible
    const response = await fetch('http://localhost:3002');
    console.log('✅ Frontend Status:', response.status);
    
    if (response.ok) {
      const html = await response.text();
      
      // Check for common error indicators
      const errors = [];
      
      if (html.includes('Module not found')) {
        errors.push('❌ Module import errors detected');
      }
      
      if (html.includes('Cannot resolve')) {
        errors.push('❌ Path resolution errors detected');
      }
      
      if (html.includes('SyntaxError')) {
        errors.push('❌ JavaScript syntax errors detected');
      }
      
      if (html.includes('ReferenceError')) {
        errors.push('❌ Reference errors detected');
      }
      
      if (errors.length === 0) {
        console.log('✅ No obvious errors detected in HTML');
      } else {
        console.log('⚠️  Potential issues found:');
        errors.forEach(error => console.log('  ', error));
      }
      
      // Check if essential elements are present
      if (html.includes('CompanyHub')) {
        console.log('✅ CompanyHub branding found');
      }
      
      if (html.includes('Sign in to your management system')) {
        console.log('✅ Login page content found');
      }
      
    }
    
  } catch (error) {
    console.error('❌ Error checking frontend:', error.message);
  }
}

checkFrontend();