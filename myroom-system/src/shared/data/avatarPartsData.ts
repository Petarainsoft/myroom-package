import { AvailableParts, AvatarConfig, Gender, GenderData, AvatarPartPaths, AvatarColors, GenderSelectableParts } from '../types/AvatarTypes';

export const availablePartsData: AvailableParts = {
  male: {
    fixedParts: {
      body: "/models/male/male_body/male_body.glb",
    },
  
    selectableParts: {
      hair: [
        { name: "No Hair",              fileName: null },
        { name: "Hair Style 1",    fileName: "/models/male/male_hair/male_hair_001.glb" },
        { name: "Hair Style 2",    fileName: "/models/male/male_hair/male_hair_002.glb" },
        { name: "Hair Style 3",    fileName: "/models/male/male_hair/male_hair_003.glb" },
      ],
  
      top: [
        { name: "No Top",               fileName: null },
        { name: "Male T-Shirt 1",       fileName: "/models/male/male_top/male_top_001.glb" },
        { name: "Male Jacket 1",        fileName: "/models/male/male_top/male_top_002.glb" },
      ],
  
      bottom: [
        { name: "No Bottom",            fileName: null },
        { name: "Male Pant 1",          fileName: "/models/male/male_bottom/male_bottom_001.glb" },
      ],
  
      shoes: [
        { name: "No Shoes",             fileName: null },
        { name: "Shoes 1",         fileName: "/models/male/male_shoes/male_shoes_001.glb" },
        { name: "Shoes 2",         fileName: "/models/male/male_shoes/male_shoes_002.glb" },
        { name: "Shoes 3",         fileName: "/models/male/male_shoes/male_shoes_003.glb" },
      ],
  
      fullset: [
        { name: "No Fullset",           fileName: null },
        { name: "Fullset 1",       fileName: "/models/male/male_fullset/male_fullset_001.glb" },
        { name: "Fullset 2",       fileName: "/models/male/male_fullset/male_fullset_002.glb" },
        { name: "Fullset 3",       fileName: "/models/male/male_fullset/male_fullset_003.glb" },
        { name: "Fullset 4",       fileName: "/models/male/male_fullset/male_fullset_004.glb" },
        { name: "Fullset 5",       fileName: "/models/male/male_fullset/male_fullset_005.glb" },
      ],
  
      accessory: [
        { name: "No Accessory",         fileName: null },
        { name: "Earing 1",     fileName: "/models/male/male_acc/male_acc_001.glb" },
        { name: "Glasses 1",     fileName: "/models/male/male_acc/male_acc_002.glb" },
      ],
    },
  
    defaultColors: {
      hair: "#4A301B",
      top:  "#1E90FF",
    },
  },

  female: {
    fixedParts: {
      body: "/models/female/female_body/female_body.glb",
    },
  
    selectableParts: {
      hair: [
        { name: "No Hair",               fileName: null },
        { name: "Hair Style 1",   fileName: "/models/female/female_hair/female_hair_001.glb" },
        { name: "Hair Style 2",   fileName: "/models/female/female_hair/female_hair_002.glb" },
      ],
  
      top: [
        { name: "No Top",                fileName: null },
        { name: "Blazer",          fileName: "/models/female/female_top/female_top_001.glb" },
        { name: "Shirt",          fileName: "/models/female/female_top/female_top_002.glb" },
      ],
  
      bottom: [
        { name: "No Bottom",             fileName: null },
        { name: "Cute Pants",       fileName: "/models/female/female_bottom/female_bottom_001.glb" },
        { name: "Flower Pants",       fileName: "/models/female/female_bottom/female_bottom_002.glb" },
      ],
  
      shoes: [
        { name: "No Shoes",              fileName: null },
        { name: "Sport Shoes",        fileName: "/models/female/female_shoes/female_shoes_001.glb" },
      ],
  
      fullset: [
        { name: "No Fullset",            fileName: null },
      ],
  
      accessory: [
        { name: "No Accessory",          fileName: null },
        { name: "Sun Glasses",    fileName: "/models/female/female_acc/female_acc_001.glb" },
        { name: "Earing Set",    fileName: "/models/female/female_acc/female_acc_002.glb" },
        { name: "Camera",    fileName: "/models/female/female_acc/female_acc_003.glb" },
      ],
    },
  
    defaultColors: {
      hair: "#5E3D25",
      top:  "#FF69B4",
    },
  }  
};

export const getDefaultConfigForGender = (gender: Gender): AvatarConfig => {
  const genderData = availablePartsData[gender];
  if (!genderData) {
    console.error(
      `getDefaultConfigForGender: Gender data for "${gender}" not found! Defaulting to male.`
    );
    return getDefaultConfigForGender("male");
  }

  const initialParts: AvatarPartPaths = {
    body: genderData.fixedParts.body,
    hair: null,
    top: null,
    bottom: null,
    shoes: null,
    fullset: null,
    accessory: null,
  };
  const initialColors: AvatarColors = { ...genderData.defaultColors };

  for (const partType in genderData.selectableParts) {
    if (partType !== 'fullset' && partType !== 'accessory') {
      const items = genderData.selectableParts[partType as keyof GenderSelectableParts];
      if (items && items.length > 0) {
        const firstActualItem = items.find((item) => item.fileName !== null);
        initialParts[partType] = firstActualItem ? firstActualItem.fileName : null;
      } else {
        initialParts[partType] = null;
      }
    }
  }

  return {
    gender: gender,
    parts: initialParts,
    colors: initialColors,
  };
};

export { availablePartsData as default };