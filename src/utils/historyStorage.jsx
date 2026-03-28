import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'SCAN_HISTORY';

export const saveScanToHistory = async (url, result) => {
  try {
    const existingHistory = await AsyncStorage.getItem(HISTORY_KEY);
    const history = existingHistory ? JSON.parse(existingHistory) : [];

    const newEntry = {
      id: Date.now().toString(),
      url,
      result,
      time: new Date().toLocaleString(),
    };

    history.unshift(newEntry); // add newest at top

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.log('Error saving history:', error);
  }
};

export const getScanHistory = async () => {
  try {
    const history = await AsyncStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.log('Error loading history:', error);
    return [];
  }
};
