import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'studygenie_materials';

// Save materials to AsyncStorage
export const saveMaterials = async (materials) => {
  try {
    const jsonValue = JSON.stringify(materials);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    console.log('✅ Materials saved to local storage');
    return true;
  } catch (error) {
    console.error('❌ Error saving materials:', error);
    return false;
  }
};

// Load materials from AsyncStorage
export const loadMaterials = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (jsonValue !== null) {
      const materials = JSON.parse(jsonValue);
      console.log('✅ Materials loaded from local storage:', materials.length);
      return materials;
    }
    console.log('ℹ️ No materials found in local storage');
    return [];
  } catch (error) {
    console.error('❌ Error loading materials:', error);
    return [];
  }
};

// Clear all materials
export const clearMaterials = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('✅ Materials cleared from storage');
    return true;
  } catch (error) {
    console.error('❌ Error clearing materials:', error);
    return false;
  }
};
