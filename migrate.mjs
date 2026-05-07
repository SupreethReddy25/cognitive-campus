import fs from 'fs';
import path from 'path';

const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

const removeRecursiveSync = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const curPath = path.join(dirPath, file);
      if (fs.statSync(curPath).isDirectory()) {
        removeRecursiveSync(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
};

const rootDir = 'c:/Supreeth/Projects/cognitive-campus';

try {
  console.log('1. Copying new UI files (this may take a moment)...');
  copyRecursiveSync(path.join(rootDir, 'new-ui-version/client/src'), path.join(rootDir, 'client/src'));

  console.log('2. Deleting dead code folders...');
  removeRecursiveSync(path.join(rootDir, 'client/src/pages/v4'));
  removeRecursiveSync(path.join(rootDir, 'client/src/pages/WorkspaceV2'));
  removeRecursiveSync(path.join(rootDir, 'client/src/temp_v4'));

  console.log('3. Deleting Docker files...');
  ['docker-compose.yml', 'server/Dockerfile'].forEach(f => {
    const fp = path.join(rootDir, f);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  });

  console.log('4. Deleting dead root folders...');
  removeRecursiveSync(path.join(rootDir, 'new-ui-version'));
  removeRecursiveSync(path.join(rootDir, 'next-app'));

  console.log('\n✅ Migration complete! All files copied and cleaned up successfully.');
  console.log('You can now run "npm run dev" in the client folder.');
} catch (error) {
  console.error('\n❌ An error occurred during migration:', error);
}
