import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { ItemManagementService } from '../src/services/ItemManagementService';

interface Args {
  dir: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: any = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (!value) continue;
    switch (key) {
      case '--dir':
      case '-d':
        parsed.dir = value;
        break;
    }
  }
  if (!parsed.dir) {
    console.error('Usage: ts-node import-items.ts --dir <itemsDir>');
    process.exit(1);
  }
  return parsed as Args;
}

const prisma = new PrismaClient();
const ims = new ItemManagementService(prisma);

async function processItems(dir: string, parentCategoryId: string | null, parentPath: string, level: number, adminId: string) {
  console.log(`Processing directory: ${dir}, parentCategoryId: ${parentCategoryId}, parentPath: ${parentPath}, level: ${level}`);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  console.log(`Found ${entries.length} entries in ${dir}`);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      console.log(`Entering subdirectory: ${fullPath}`);
      const processedName = entry.name.toLowerCase().replace(/\s+/g, '_');
      const newPath = parentPath ? `${parentPath}/${processedName}` : processedName;
      let cat = await prisma.itemCategory.findFirst({ where: { name: entry.name, parentId: parentCategoryId } });
      if (!cat) {
        console.log(`Creating new category: ${entry.name} with path ${newPath}`);
        cat = await prisma.itemCategory.create({ data: { name: entry.name, path: newPath, level, parentId: parentCategoryId } });
        console.log(`Created category with id: ${cat.id}`);
      } else {
        console.log(`Found existing category: ${entry.name} with id: ${cat.id}`);
      }
      await processItems(fullPath, cat.id, newPath, level + 1, adminId);
    } else if (entry.isFile() && path.extname(entry.name) === '.glb') {
      console.log(`Processing file: ${fullPath}`);
      try {
        const fileBuffer = await fs.readFile(fullPath);
        console.log(`Read file ${entry.name} successfully, size: ${fileBuffer.length}`);
        const mimeType = 'model/gltf-binary';
        await ims.createResource({
          name: path.parse(entry.name).name,
          fileBuffer,
          fileName: entry.name,
          mimeType,
          categoryId: parentCategoryId || 'default',
          uploadedByAdminId: adminId
        });
        console.log(`Successfully created resource for ${entry.name}`);
      } catch (error) {
        console.error(`Error processing file ${fullPath}: ${(error as Error).message}`);
      }
    }
  }
  console.log(`Finished processing directory: ${dir}`);
}

async function main() {
  const { dir } = parseArgs();
  const adminRecord = await prisma.admin.findFirst();
  if (!adminRecord) {
    throw new Error('No admin found in the database');
  }
  const admin = adminRecord.id;
  console.log('Starting items import...');
  try {
    await processItems(dir, null, '', 1, admin);
    console.log('Items import completed successfully');
  } catch (error) {
    console.error(`Import failed: ${(error as Error).message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error((e as Error).message || e);
  process.exit(1);
});