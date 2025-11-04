#!/usr/bin/env node

/**
 * Fix logger import paths
 */

const fs = require('fs');
const path = require('path');

const files = [
  'backend/src/routes/admin.ts',
  'backend/src/routes/auth.ts',
  'backend/src/routes/devices.ts',
  'backend/src/routes/events.ts',
  'backend/src/routes/lock.ts',
  'backend/src/routes/notifications.ts',
  'backend/src/routes/packages.ts',
  'backend/src/routes/push.ts',
  'backend/src/routes/whatsapp.ts',
  'backend/src/services/database.ts',
  'backend/src/services/mqtt.ts',
  'backend/src/services/notificationQueue.ts',
  'backend/src/services/socket.ts',
];

console.log('🔧 Fixing logger import paths...\n');

let fixed = 0;

for (const file of files) {
  const fullPath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipping ${file} (not found)`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Determine correct path based on file location
  const correctPath = file.includes('/routes/') ? '../utils/logger' : './utils/logger';
  const wrongPath = './utils/logger';
  
  if (file.includes('/routes/')) {
    // Routes need ../utils/logger
    content = content.replace(
      /import\s+{\s*logger\s*}\s+from\s+['"]\.\/utils\/logger['"]/g,
      "import { logger } from '../utils/logger'"
    );
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${file}`);
    fixed++;
  } else {
    console.log(`✅ ${file} (already correct)`);
  }
}

console.log(`\n✅ Fixed ${fixed} import paths`);
