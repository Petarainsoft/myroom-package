// update-items-manifest.js
const fs = require('fs');
const path = require('path');

// Utility to capitalize each word
function capitalizeWords(str) {
  return str.replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

// Recursively get all .glb files in a directory
function getAllGlbFiles(dir, files = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllGlbFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.glb')) {
      files.push(fullPath);
    }
  });
  return files;
}

const rootDir = path.join(__dirname, '..');
const itemsManifestPath = path.join(rootDir, 'public/manifest/item/items-manifest.json');
const itemsDir = path.join(rootDir, 'public/models/items');

// 1. Read manifest and get existing IDs
const manifest = JSON.parse(fs.readFileSync(itemsManifestPath, 'utf-8'));
const existingIds = new Set(manifest.items.map(item => item.id));

// 2. Find all .glb files
const allGlbFiles = getAllGlbFiles(itemsDir);

// 3. Build new item entries
const newItems = allGlbFiles
  .map(filePath => {
    const relPath = path.relative(path.join(rootDir, 'public'), filePath).replace(/\\/g, '/');
    const fileName = path.basename(filePath, '.glb');
    const id = fileName;
    if (existingIds.has(id)) return null;
    const name = capitalizeWords(fileName.toLowerCase());
    const imageUrl = `/images/items/${fileName}.jpg`;
    // Category is the parent folder name
    const category = path.basename(path.dirname(filePath));
    return {
      id,
      name,
      imageUrl,
      category,
      path: `/${relPath}`
    };
  })
  .filter(Boolean);

// 4. Add new items to manifest and write back if needed
if (newItems.length > 0) {
  manifest.items.push(...newItems);
  fs.writeFileSync(itemsManifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Added ${newItems.length} new items to items-manifest.json.`);
} else {
  console.log('No new items to add.');
}
