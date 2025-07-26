/// <reference types="node" />
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import mime from 'mime-types';
import { ResourceManagementService } from '../src/services/ResourceManagementService';
// S3Service is used internally by ResourceManagementService – no direct import needed here

/**
 * Script to walk through myroom-system/public/models directory,
 * create category hierarchy, upload .glb (and other) files to S3 via S3Service,
 * and insert Resource records via ResourceManagementService.
 *
 * Usage (from backend dir):
 *   npx ts-node scripts/import-myroom-assets.ts --root ../../myroom-system/public/models --admin <ADMIN_ID>
 */

interface Args {
  root: string;
  admin: string;
  ownerProjectId?: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: any = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (!value) continue;
    switch (key) {
      case '--root':
      case '-r':
        parsed.root = value;
        break;
      case '--admin':
      case '-a':
        parsed.admin = value;
        break;
      case '--project':
      case '-p':
        parsed.ownerProjectId = value;
        break;
    }
  }
  if (!parsed.root || !parsed.admin) {
    console.error('Usage: ts-node import-myroom-assets.ts --root <modelsDir> --admin <ADMIN_ID>');
    process.exit(1);
  }
  return parsed as Args;
}

const prisma = new PrismaClient();
const rms = new ResourceManagementService(prisma);

async function ensureCategory(
  name: string,
  parentId: string | null,
  level: number,
  fullPath: string
) {
  // Look for existing category by unique combination name + parentId (unique index)
  let cat = await prisma.itemCategory.findFirst({
    where: { name, parentId },
  });
  if (cat) return cat;

  cat = await prisma.itemCategory.create({
    data: {
      name,
      path: fullPath,
      parentId,
      level,
      isPremium: false,
      metadata: {},
    },
  });
  return cat;
}

async function processDirectory(
  dir: string,
  parentCategoryId: string | null,
  parentPathString: string,
  level: number,
  adminId: string
) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Create/ensure category
      const newPathString = parentPathString ? `${parentPathString}/${entry.name}` : entry.name;
      const category = await ensureCategory(entry.name, parentCategoryId, level, newPathString);
      await processDirectory(fullPath, category.id, newPathString, level + 1, adminId);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.glb', '.gltf', '.png', '.jpg', '.jpeg', '.hdr', '.dds'].includes(ext)) continue;
      const fileBuffer = await fs.readFile(fullPath);
      const mimeType = mime.lookup(ext) || 'application/octet-stream';
      const categoryId = parentCategoryId;
      if (!categoryId) {
        console.warn(`Skipping file without category: ${fullPath}`);
        continue;
      }
      const fileName = entry.name;
      try {
        const res = await rms.createResource({
          name: path.parse(fileName).name,
          description: undefined,
          fileBuffer,
          fileName,
          mimeType: mimeType.toString(),
          categoryId,
          uploadedByAdminId: adminId,
          ownerProjectId: undefined,
        });
        console.log('Uploaded', res.name, '->', res.id);
      } catch (err) {
        console.error('Failed to import', fullPath, err);
      }
    }
  }
}

async function main() {
  const { root, admin } = parseArgs();
  console.log('Starting import...');
  await processDirectory(path.resolve(root), null, '', 0, admin);
  await prisma.$disconnect();
  console.log('Import complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
