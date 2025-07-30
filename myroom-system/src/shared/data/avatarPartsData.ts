import { AvailableParts, AvatarConfig, Gender, GenderData, AvatarPartPaths, AvatarColors, GenderSelectableParts } from '../types/AvatarTypes';

export const availablePartsData: AvailableParts = {
  male: {
    fixedParts: {
      body: { resourceId: "male-male_body-male_body" },
    },
  
    selectableParts: {
      hair: [
        { name: "No Hair",              fileName: null },
        { name: "Hair Style 1",    fileName: null, resourceId: "male-male_hair-male_hair_001" },
        { name: "Hair Style 2",    fileName: null, resourceId: "male-male_hair-male_hair_002" },
        { name: "Hair Style 3",    fileName: null, resourceId: "male-male_hair-male_hair_003" },
      ],
  
      top: [
        { name: "Male T-Shirt 1",       fileName: null, resourceId: "male-male_top-male_top_001" },
        { name: "Male Jacket 1",        fileName: null, resourceId: "male-male_top-male_top_002" },
      ],
  
      bottom: [
        { name: "Male Pant 1",          fileName: null, resourceId: "male-male_bottom-male_bottom_001" },
      ],
  
      shoes: [
        { name: "No Shoes",             fileName: null },
        { name: "Shoes 1",         fileName: null, resourceId: "male-male_shoes-male_shoes_001" },
        { name: "Shoes 2",         fileName: null, resourceId: "male-male_shoes-male_shoes_002" },
        { name: "Shoes 3",         fileName: null, resourceId: "male-male_shoes-male_shoes_003" },
      ],
  
      fullset: [
        { name: "No Fullset",           fileName: null },
        { name: "Fullset 1",       fileName: null, resourceId: "male-male_fullset-male_fullset_001" },
        { name: "Fullset 2",       fileName: null, resourceId: "male-male_fullset-male_fullset_002" },
        { name: "Fullset 3",       fileName: null, resourceId: "male-male_fullset-male_fullset_003" },
        { name: "Fullset 4",       fileName: null, resourceId: "male-male_fullset-male_fullset_004" },
        { name: "Fullset 5",       fileName: null, resourceId: "male-male_fullset-male_fullset_005" },
      ],
  
      accessory: [
        { name: "No Accessory",         fileName: null },
        { name: "Earing 1",     fileName: null, resourceId: "male-male_acc-male_acc_001" },
        { name: "Glasses 1",     fileName: null, resourceId: "male-male_acc-male_acc_002" },
      ],
    },
  
    defaultColors: {
      hair: "#4A301B",
      top:  "#1E90FF",
    },
  },

  female: {
    fixedParts: {
      body: { resourceId: "female-female_body-female_body" },
    },
  
    selectableParts: {
      hair: [
        { name: "No Hair",               fileName: null },
        { name: "Hair Style 1",   fileName: null, resourceId: "female-female_hair-female_hair_001" },
        { name: "Hair Style 2",   fileName: null, resourceId: "female-female_hair-female_hair_002" },
      ],
  
      top: [
        { name: "Blazer",          fileName: null, resourceId: "female-female_top-female_top_001" },
        { name: "Shirt",          fileName: null, resourceId: "female-female_top-female_top_002" },
      ],
  
      bottom: [
        { name: "Cute Pants",       fileName: null, resourceId: "female-female_bottom-female_bottom_001" },
        { name: "Flower Pants",       fileName: null, resourceId: "female-female_bottom-female_bottom_002" },
      ],
  
      shoes: [
        { name: "No Shoes",              fileName: null },
        { name: "Sport Shoes",        fileName: null, resourceId: "female-female_shoes-female_shoes_001" },
      ],
  
      fullset: [
        { name: "No Fullset",            fileName: null },
      ],
  
      accessory: [
        { name: "No Accessory",          fileName: null },
        { name: "Sun Glasses",    fileName: null, resourceId: "female-female_acc-female_acc_001" },
        { name: "Earing Set",    fileName: null, resourceId: "female-female_acc-female_acc_002" },
        { name: "Camera",    fileName: null, resourceId: "female-female_acc-female_acc_003" },
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
    body: genderData.fixedParts.body?.fileName || null,
    hair: null,
    top: null,
    bottom: null,
    shoes: null,
    fullset: null,
    accessory: null,
  };
  const initialResourceIds: AvatarPartPaths = {
    body: genderData.fixedParts.body?.resourceId || null,
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
        // Find first item with resourceId instead of fileName
        const firstActualItem = items.find((item) => item.resourceId !== null && item.resourceId !== undefined);
        initialParts[partType] = firstActualItem ? firstActualItem.resourceId : null;
        initialResourceIds[partType] = firstActualItem ? firstActualItem.resourceId || null : null;
      } else {
        initialParts[partType] = null;
        initialResourceIds[partType] = null;
      }
    }
  }

  return {
    gender: gender,
    parts: initialParts,
    colors: initialColors,
    resourceIds: initialResourceIds,
  };
};

export { availablePartsData as default };