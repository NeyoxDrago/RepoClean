#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

const ports = [3000, 3001, 5000];

console.log('🧹 Cleaning up development ports...');

ports.forEach(port => {
  try {
    if (os.platform() === 'win32') {
      // Windows
      try {
        const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
        const lines = result.split('\n').filter(line => line.includes(`LISTENING`));
        
        lines.forEach(line => {
          const pid = line.trim().split(/\s+/).pop();
          if (pid && !isNaN(pid)) {
            try {
              execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
              console.log(`✅ Killed process ${pid} on port ${port}`);
            } catch (err) {
              console.log(`⚠️  Could not kill process ${pid} on port ${port}`);
            }
          }
        });
      } catch (err) {
        console.log(`ℹ️  No process found on port ${port}`);
      }
    } else {
      // macOS/Linux
      try {
        const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
        if (pid) {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          console.log(`✅ Killed process ${pid} on port ${port}`);
        }
      } catch (err) {
        console.log(`ℹ️  No process found on port ${port}`);
      }
    }
  } catch (error) {
    console.log(`⚠️  Error checking port ${port}:`, error.message);
  }
});

console.log('🎉 Port cleanup complete! You can now run: npm run dev'); 