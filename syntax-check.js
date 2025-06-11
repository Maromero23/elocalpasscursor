const fs = require('fs');
const babel = require('@babel/core');

try {
  const code = fs.readFileSync('app/admin/qr-config/page.tsx', 'utf8');
  
  const result = babel.transformSync(code, {
    presets: ['@babel/preset-typescript', '@babel/preset-react'],
    filename: 'page.tsx'
  });
  
  console.log('✅ Syntax is valid!');
} catch (error) {
  console.log('❌ Syntax Error:');
  console.log('Line:', error.loc?.line);
  console.log('Column:', error.loc?.column);
  console.log('Message:', error.message);
}
