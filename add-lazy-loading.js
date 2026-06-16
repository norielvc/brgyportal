#!/usr/bin/env node
/**
 * Script to add loading="lazy" to all img tags in portal component
 * Run: node add-lazy-loading.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/Portal/PortalPageContent.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Count how many img tags we're updating
let updateCount = 0;

// Add loading="lazy" to all img tags that don't already have it
// Exception: Logo should load eagerly, hero carousel first image should load eagerly
content = content.replace(
  /<img\s+(?![^>]*loading=)/g,
  (match, offset) => {
    // Check if this is the logo (within 100 chars of "tenantConfig.logo")
    const contextBefore = content.substring(Math.max(0, offset - 200), offset);
    const contextAfter = content.substring(offset, Math.min(content.length, offset + 200));
    
    // Logo should load eagerly
    if (contextAfter.includes('tenantConfig.logo')) {
      updateCount++;
      return '<img loading="eager" ';
    }
    
    // Hero carousel first image loads eagerly (already handled)
    if (contextAfter.includes('index === 0 ? "eager" : "lazy"')) {
      return match; // Skip, already has conditional loading
    }
    
    // All other images load lazily
    updateCount++;
    return '<img loading="lazy" ';
  }
);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`✅ Added lazy loading to ${updateCount} images in PortalPageContent.js`);
console.log(`📄 File: ${filePath}`);
