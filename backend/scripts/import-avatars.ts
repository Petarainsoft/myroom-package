import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { AvatarManagementService } from '../src/services/AvatarManagementService';
import { S3Service } from '../src/services/S3Service';
import { logger } from '../src/utils/logger';
import { AvatarPartType } from '../src/types/avatar';

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
    console.error('Usage: ts-node import-avatars.ts --dir <avatarsDir>');
    process.exit(1);
  }
  return parsed as Args;
}

const prisma = new PrismaClient();
const ams = new AvatarManagementService(prisma, S3Service.getInstance(), logger);

async function processAvatars(dir: string, adminId: string) {
  const genders = await fs.readdir(dir);
  for (const gender of genders) {
    const genderPath = path.join(dir, gender);
    if (!(await fs.stat(genderPath)).isDirectory()) continue;
    let genderCat = await prisma.avatarCategory.upsert({
      where: { path: gender },
      update: {},
      create: { name: gender, categoryType: 'gender', path: gender }
    });
    const parts = await fs.readdir(genderPath);
    for (const part of parts) {
      const partPath = path.join(genderPath, part);
      if (!(await fs.stat(partPath)).isDirectory()) continue;
      let partCat = await prisma.avatarCategory.upsert({
        where: { path: `${gender}/${part}` },
        update: {},
        create: { name: part, categoryType: 'part_type', parentId: genderCat.id, path: `${gender}/${part}` }
      });
      const files = await fs.readdir(partPath);
      for (const file of files) {
        if (path.extname(file) !== '.glb') continue;
        const filePath = path.join(partPath, file);
        const fileBuffer = await fs.readFile(filePath);
        const name = path.parse(file).name;
        const category = await prisma.avatarCategory.findUnique({ where: { id: partCat.id } });
        if (!category || !category.path) {
          console.error(`Category not found or missing path for id: ${partCat.id}`);
          continue;
        }
        const resourceId = `${category.path.replace(/\//g, '-')}-${name}`;
        const existing = await prisma.avatar.findUnique({ where: { resourceId } });
        if (existing) {
          console.log(`Skipping existing avatar: ${resourceId}`);
          continue;
        }
        await ams.createAvatar({
          name: name,
          gender: gender.toUpperCase() as any,
          partType: getPartType(part),
          categoryId: partCat.id,
          file: fileBuffer
        }, adminId);
      }
    }
  }
}

async function main() {
  const { dir } = parseArgs();
  const adminRecord = await prisma.admin.findFirst();
  if (!adminRecord) {
    throw new Error('No admin found in the database');
  }
  const admin = adminRecord.id;
  console.log('Starting avatars import...');
  await processAvatars(dir, admin);
  await prisma.$disconnect();
  console.log('Avatars import complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

function getPartType(part: string): AvatarPartType {
  const lowerPart = part.toLowerCase();
  if (lowerPart.includes('hair')) return AvatarPartType.HAIR;
  if (lowerPart.includes('top')) return AvatarPartType.TOP;
  if (lowerPart.includes('bottom')) return AvatarPartType.BOTTOM;
  if (lowerPart.includes('shoes')) return AvatarPartType.SHOES;
  if (lowerPart.includes('acc')) return AvatarPartType.ACCESSORY;
  if (lowerPart.includes('body')) return AvatarPartType.BODY;
  if (lowerPart.includes('fullset')) return AvatarPartType.FULLSET;
  throw new Error(`Unknown part type: ${part}`);
}