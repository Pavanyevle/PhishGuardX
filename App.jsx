import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import SecureBrowserScreen from './src/screens/SecureBrowserScreen';

import { hybridScan } from './src/utils/scannerEngine';

export const navigationRef = createNavigationContainerRef();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* ---------------- Tabs ---------------- */

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1E293B' },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      <Tab.Screen
        name="Scanner"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="shield" size={22} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="clock" size={22} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="settings" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/* ---------------- App ---------------- */

export default function App() {

  useEffect(() => {

    const handleUrl = async (event) => {
      const url = event?.url;
      if (!url) return;

      try {
        const result = await hybridScan(url);

        if (result === 'HIGH') {
          alert('🚫 Phishing link blocked');
          return;
        }

        navigationRef.current?.navigate('SecureBrowser', {
          incomingUrl: url,
        });

      } catch (e) {
        console.log(e);
      }
    };

    Linking.addEventListener('url', handleUrl);

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => {
      Linking.removeAllListeners('url');
    };

  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={Tabs} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="SecureBrowser" component={SecureBrowserScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}