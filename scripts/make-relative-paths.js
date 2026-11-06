const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'frontend', 'public');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  content = content.replace(/href="\/(?!\/)/g, 'href="');
  content = content.replace(/src="\/(?!\/)/g, 'src="');

  // Thay thế window.location.href = '/...' thành window.location.href = '...'
  content = content.replace(/window\.location\.href\s*=\s*['"]\/(.*?)['"]/g, "window.location.href = '$1'");

  // Thay thế các đường dẫn file ảnh hoặc object: image: '/...' -> image: '...'
  content = content.replace(/image:\s*['"]\/(.*?)['"]/g, "image: '$1'");

  // Thay thế href: '/...' -> href: '...'
  content = content.replace(/href:\s*['"]\/(.*?)['"]/g, "href: '$1'");

  // Thay thế href="/..." trong template literals `${...}` hoặc HTML strings
  content = content.replace(/href=\\"\/([^\\"]+)\\"/g, 'href=\\"$1\\"');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Đã cập nhật đường dẫn tương đối: ${path.basename(filePath)}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.html') || file.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

walkDir(publicDir);
console.log('Hoàn thành cập nhật toàn bộ đường dẫn thành tương đối!');
