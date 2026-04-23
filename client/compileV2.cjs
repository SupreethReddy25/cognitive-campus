const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const presets = [
  ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
  ['@babel/preset-react', { runtime: 'automatic' }]
];

function compileDir(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file.replace(/\.tsx?$/, '.jsx')); // change extension

    if (fs.statSync(srcPath).isDirectory()) {
      compileDir(srcPath, destPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      try {
        const result = babel.transformFileSync(srcPath, {
          presets,
          filename: srcPath // important for TSX
        });
        fs.writeFileSync(destPath, result.code);
        console.log('Compiled:', srcPath);
      } catch(e) {
        console.error('Error compiling:', srcPath, e.message);
      }
    } else {
      fs.copyFileSync(srcPath, path.join(destDir, file));
    }
  }
}

compileDir(
  path.join(__dirname, 'src/WorkspaceV2/v0-cognitive-campus-ui-main/components'),
  path.join(__dirname, 'src/pages/WorkspaceV2/components')
);
compileDir(
  path.join(__dirname, 'src/WorkspaceV2/v0-cognitive-campus-ui-main/lib'),
  path.join(__dirname, 'src/pages/WorkspaceV2/lib')
);
// Also container
try {
  const result = babel.transformFileSync(
    path.join(__dirname, 'src/WorkspaceV2/v0-cognitive-campus-ui-main/app/WorkspaceContainer.tsx'),
    { presets, filename: 'WorkspaceContainer.tsx' }
  );
  fs.writeFileSync(path.join(__dirname, 'src/pages/WorkspaceV2/WorkspaceContainer.jsx'), result.code);
} catch(e) {}
