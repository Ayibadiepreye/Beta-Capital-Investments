const fs = require('fs');
const path = require('path');

// Use absolute paths from repository root
const sourceDir = '/vercel/path0/artifacts/bettercapitalinvestment/dist/public';
const targetDir = '/vercel/path0/public';

function copyDir(src, dest) {
  // Check if source exists
  if (!fs.existsSync(src)) {
    console.error('Source directory does not exist:', src);
    process.exit(1);
  }

  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying build files from', sourceDir, 'to', targetDir);
copyDir(sourceDir, targetDir);
console.log('✓ Build files copied successfully');
