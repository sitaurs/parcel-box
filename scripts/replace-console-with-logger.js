#!/usr/bin/env node

/**
 * Script to automatically replace console.* calls with logger
 * Usage: node replace-console-with-logger.js
 */

const fs = require('fs');
const path = require('path');

// Files to process
const filesToProcess = [
  'backend/src/index.ts',
  'backend/src/services/mqtt.ts',
  'backend/src/services/database.ts',
  'backend/src/services/socket.ts',
  'backend/src/services/notificationQueue.ts',
  'backend/src/middleware/auth.ts',
  'backend/src/routes/auth.ts',
  'backend/src/routes/devices.ts',
  'backend/src/routes/packages.ts',
  'backend/src/routes/events.ts',
  'backend/src/routes/notifications.ts',
  'backend/src/routes/push.ts',
  'backend/src/routes/whatsapp.ts',
  'backend/src/routes/lock.ts',
  'backend/src/routes/admin.ts',
];

// Replacement patterns
const replacements = [
  // console.log → logger.info
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
  },
  // console.error → logger.error
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
  },
  // console.warn → logger.warn
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
  },
  // console.debug → logger.debug
  {
    pattern: /console\.debug\(/g,
    replacement: 'logger.debug(',
  },
  // console.info → logger.info
  {
    pattern: /console\.info\(/g,
    replacement: 'logger.info(',
  },
];

// Check if logger import exists
function hasLoggerImport(content) {
  return /import\s+.*logger.*from\s+['"].*logger.*['"]/i.test(content);
}

// Add logger import if not exists
function addLoggerImport(content) {
  if (hasLoggerImport(content)) {
    return content;
  }
  
  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  // Add logger import after last import
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, "import { logger } from './utils/logger';");
  } else {
    // No imports found, add at the beginning
    lines.unshift("import { logger } from './utils/logger';");
  }
  
  return lines.join('\n');
}

// Process a single file
function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipping ${filePath} (not found)`);
    return { processed: false, replacements: 0 };
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let replacementCount = 0;
  
  // Apply replacements
  for (const { pattern, replacement } of replacements) {
    const matches = content.match(pattern);
    if (matches) {
      replacementCount += matches.length;
      content = content.replace(pattern, replacement);
    }
  }
  
  if (replacementCount > 0) {
    // Add logger import if needed
    content = addLoggerImport(content);
    
    // Write back to file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}: ${replacementCount} replacements`);
    return { processed: true, replacements: replacementCount };
  } else {
    console.log(`⏭️  ${filePath}: No console.* calls found`);
    return { processed: false, replacements: 0 };
  }
}

// Main execution
console.log('🔧 Starting console.* to logger replacement...\n');

let totalReplacements = 0;
let processedFiles = 0;

for (const file of filesToProcess) {
  const result = processFile(file);
  if (result.processed) {
    processedFiles++;
    totalReplacements += result.replacements;
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Completed!`);
console.log(`📁 Files processed: ${processedFiles}/${filesToProcess.length}`);
console.log(`🔄 Total replacements: ${totalReplacements}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⚠️  Note: Please review changes and run `npm run typecheck` to verify.');
