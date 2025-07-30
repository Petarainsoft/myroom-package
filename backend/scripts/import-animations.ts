import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
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
    console.error('Usage: ts-node import-animations.ts --dir <animationsDir>');
    process.exit(1);
  }
  return parsed as Args;
}

const prisma = new PrismaClient();
const s3Service = S3Service.getInstance();

async function processAnimations(dir: string, adminId: string) {
  const files = await fs.readdir(dir);
  
  for (const file of files) {
    if (path.extname(file) !== '.glb') continue;
    
    const filePath = path.join(dir, file);
    const fileBuffer = await fs.readFile(filePath);
    const fileName = path.parse(file).name;
    
    console.log(`[import-animations] Processing animation file: ${file}`);
    
    // Determine gender from filename
    let gender: 'MALE' | 'FEMALE' | 'UNISEX' = 'UNISEX';
    if (fileName.toLowerCase().includes('male') && !fileName.toLowerCase().includes('female')) {
      gender = 'MALE';
    } else if (fileName.toLowerCase().includes('female')) {
      gender = 'FEMALE';
    }
    
    // Create specific S3 key for animations
    const animationKey = `animations/${gender.toLowerCase()}/${fileName}.glb`;
    const specificS3Url = `models/${animationKey}`;
    
    // Upload to S3 with specific URL
    const uploadResult = await s3Service.uploadFile(
      fileBuffer,
      file,
      'system', // developerId for system uploads
      {
        contentType: 'model/gltf-binary',
        metadata: { category: 'animations' },
        specificS3Url: specificS3Url,
        ignoreIfExists: false
      }
    );
    const s3Url = uploadResult.url;
    const s3Key = uploadResult.key;
    
    console.log(`[import-animations] Uploaded to S3: ${s3Url}`);
    
    // Create animation record in database
    const animation = await prisma.animation.create({
      data: {
        name: fileName,
        description: `Animation file for ${gender.toLowerCase()} avatars`,
        s3Url: s3Url,
        s3Key: s3Key,
        fileSize: BigInt(fileBuffer.length),
        fileType: 'model/gltf-binary',
        mimeType: 'model/gltf-binary',
        gender: gender,
        animationType: 'IDLE', // Default animation type
        version: '1.0.0',
        resourceId: `anim_${fileName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        status: 'ACTIVE',
        metadata: {
          originalFileName: file,
          uploadedAt: new Date().toISOString()
        },
        uploadedByAdminId: adminId
      }
    });
    
    console.log(`[import-animations] Animation created: ID=${animation.id}, Name=${animation.name}, Gender=${animation.gender}`);
  }
}

async function main() {
  const { dir } = parseArgs();
  
  // Find admin user
  const adminRecord = await prisma.admin.findFirst();
  if (!adminRecord) {
    throw new Error('No admin found in the database');
  }
  const admin = adminRecord.id;
  
  console.log('Starting animations import...');
  await processAnimations(dir, admin);
  await prisma.$disconnect();
  console.log('Animations import complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});