// Mapping between animation GLB bones and avatar skeleton
// This mapping applies to all animations from all_animation.glb (walk, idle, run, etc.)
export const SKELETON_BONE_MAPPING: { [key: string]: string | null } = {
  // Standard_walk.glb bones -> Avatar bones
  'b_Hip_01': 'mixamorigHips',
  'b_Spine01_02': 'mixamorigSpine',
  'b_Spine02_03': 'mixamorigSpine1',
  'b_Neck_04': 'mixamorigNeck',
  'b_Head_05': 'mixamorigHead',
  
  // Right arm
  'b_RightUpperArm_06': 'mixamorigRightArm',
  'b_RightForeArm_07': 'mixamorigRightForeArm',
  'b_RightHand_08': 'mixamorigRightHand',
  
  // Left arm
  'b_LeftUpperArm_09': 'mixamorigLeftArm',
  'b_LeftForeArm_010': 'mixamorigLeftForeArm',
  'b_LeftHand_011': 'mixamorigLeftHand',
  
  // Tail (can be skipped if avatar has no tail)
  'b_Tail01_012': null,
  'b_Tail02_013': null,
  'b_Tail03_014': null,
  
  // Left leg
  'b_LeftLeg01_015': 'mixamorigLeftUpLeg',
  'b_LeftLeg02_016': 'mixamorigLeftLeg',
  'b_LeftFoot01_017': 'mixamorigLeftFoot',
  
  // Right leg
  'b_RightLeg01_019': 'mixamorigRightUpLeg',
  'b_RightLeg02_020': 'mixamorigRightLeg',
  'b_RightFoot01_021': 'mixamorigRightFoot',
};

// Function to find bone mapping for all animation types
export function findMappedBone(originalBoneName: string, targetSkeleton: any): any {
  const mappedName = SKELETON_BONE_MAPPING[originalBoneName];
  
  if (mappedName === null) {
    // This bone doesn't need mapping (like tail)
    console.log(`🦴 Bone ${originalBoneName} doesn't need mapping (null)`);
    return null;
  }
  
  if (mappedName) {
    // Find bone with mapped name
    const bone = targetSkeleton.bones.find((b: any) => b.name === mappedName);
    if (bone) {
      console.log(`🦴 Mapped bone ${originalBoneName} -> ${mappedName} (found)`);
      return bone;
    }
    console.log(`⚠️ Mapped bone ${originalBoneName} -> ${mappedName} (not found in target skeleton)`);
  }
  
  // Fallback: find bone with original name
  const originalBone = targetSkeleton.bones.find((b: any) => b.name === originalBoneName);
  if (originalBone) {
    // console.log(`🦴 Using original bone name ${originalBoneName} (fallback)`);
  } else {
    console.log(`❌ Bone ${originalBoneName} not found in target skeleton (no mapping available)`);
  }
  return originalBone;
}

// Function to log all skeleton bones
export function logSkeletonBones(skeleton: any, name: string) {
  console.log(`🦴 ${name} skeleton bones:`);
  skeleton.bones.forEach((bone: any, index: number) => {
    console.log(`  ${index}: ${bone.name}`);
  });
}