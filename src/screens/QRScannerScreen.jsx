import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { hybridScan } from '../utils/scannerEngine';
import { saveScanToHistory } from '../utils/historyStorage';

const QRScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const device = useCameraDevice('back');
  const scanLock = useRef(false); // prevents multiple scans

  useEffect(() => {
    (async () => {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'granted');
    })();
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: async (codes) => {
      if (!isScanning || scanLock.current) return;

      if (codes.length > 0) {
        scanLock.current = true; // lock scanning
        const scannedUrl = codes[0].value;

        if (!scannedUrl || !scannedUrl.startsWith('http')) {
          Alert.alert('Invalid QR', 'QR does not contain a valid URL');
          scanLock.current = false;
          return;
        }

        setIsScanning(false);

        try {
          const result = await hybridScan(scannedUrl);

          // Save to history
          await saveScanToHistory(scannedUrl, result);

          Alert.alert(
            'Scan Result',
            `URL: ${scannedUrl}\n\nStatus: ${result}`,
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } catch (error) {
          console.log(error);
          Alert.alert('Error', 'Failed to scan QR code');
          scanLock.current = false;
          setIsScanning(true);
        }
      }
    },
  });

  if (!device || !hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Requesting Camera Permission...</Text>
      </View>
    );
  }

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={isScanning}
      codeScanner={codeScanner}
    />
  );
};

export default QRScannerScreen;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});
