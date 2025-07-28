import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { RoomManagementService } from '../src/services/RoomManagementService';
import { S3Service } from '../src/services/S3Service';

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
    console.error('Usage: ts-node import-rooms.ts --dir <roomsDir>');
    process.exit(1);
  }
  return parsed as Args;
}

const prisma = new PrismaClient();
const rms = new RoomManagementService(prisma, S3Service.getInstance());

async function processRooms(dir: string, adminId: string) {
  const types = await fs.readdir(dir);
  for (const type of types) {
    const typePath = path.join(dir, type);
    if (!(await fs.stat(typePath)).isDirectory()) continue;

    const normalizedType = type.toLowerCase().replace(/\s+/g, '-');
    console.log(`[import-rooms] Processing room type: ${type}, Normalized to: ${normalizedType}`);

    let roomType = await prisma.roomType.upsert({
      where: { name: normalizedType },
      update: {},
      create: { name: normalizedType, label: type, resource_path: normalizedType, description: `${type} Room` },
    });
    console.log(`[import-rooms] RoomType upserted: ID=${roomType.id}, Name=${roomType.name}, ResourcePath=${roomType.resource_path}`);
    const files = await fs.readdir(typePath);
    for (const file of files) {
      if (path.extname(file) !== '.glb') continue;
      const filePath = path.join(typePath, file);
      const fileBuffer = await fs.readFile(filePath);
      await rms.createRoomResource({
        name: path.parse(file).name,
        roomTypeId: roomType.id,
        description: `${type} Room - ${path.parse(file).name}`,
        file: { buffer: fileBuffer, originalname: file, mimetype: 'model/gltf-binary', size: fileBuffer.length }
      }, adminId);
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
  console.log('Starting rooms import...');
  await processRooms(dir, admin);
  await prisma.$disconnect();
  console.log('Rooms import complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});