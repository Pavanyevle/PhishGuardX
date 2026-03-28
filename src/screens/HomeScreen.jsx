import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';

import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import auth from '@react-native-firebase/auth';

import { hybridScan } from '../utils/scannerEngine';
import { saveScanToHistory } from '../utils/historyStorage';

const HomeScreen = ({ navigation }) => {

  const [clipboardEnabled, setClipboardEnabled] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastClipboard, setLastClipboard] = useState('');

  /* 🔐 Anonymous login */
  useEffect(() => {
    auth().signInAnonymously().catch(()=>{});
  }, []);

  /* ================= CLIPBOARD MONITOR ================= */

  useEffect(() => {

    const checkClipboard = async () => {

      if (!clipboardEnabled) return;

      try {
        let text = await Clipboard.getString();

        if (!text) return;

        // normalize
        if (!text.startsWith('http')) {
          if (text.includes('www')) {
            text = 'https://' + text;
          }
        }

        // avoid duplicate scan
        if (text === lastClipboard) return;

        if (text.includes('http')) {

          setLastClipboard(text);

          const scanResult = await hybridScan(text);
          await saveScanToHistory(text, scanResult);

          if (scanResult !== 'SAFE') {
            Alert.alert(
              '⚠️ Dangerous Link Detected',
              `Status: ${scanResult}`
            );
          }
        }

      } catch(e){
        console.log(e);
      }
    };

    const interval = setInterval(checkClipboard, 3000);
    return () => clearInterval(interval);

  }, [clipboardEnabled, lastClipboard]);

  /* ================= MANUAL SCAN ================= */

  const handleScan = async () => {

    if (!url) return Alert.alert('Enter URL');

    setLoading(true);

    try {
      let formatted = url.startsWith('http') ? url : `https://${url}`;

      const scanResult = await hybridScan(formatted);
      await saveScanToHistory(formatted, scanResult);

      setResult(scanResult);
      setModalVisible(true);

    } catch {
      Alert.alert('Scan failed');
    }

    setLoading(false);
  };

  const getColor = () => {
    if (result === 'SAFE') return '#00C897';
    if (result === 'SUSPICIOUS') return '#FFA500';
    return '#FF4D4D';
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <Text style={styles.header}>Scanner</Text>

        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Feather name="shield" size={35} color="#4A90E2" />
          </View>
          <Text style={styles.appName}>PhishGuardX</Text>
          <Text style={styles.tagline}>Hybrid AI Phishing Detection</Text>
        </View>

        {/* Clipboard */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather name="clipboard" size={20} color="#4A90E2" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.cardTitle}>Clipboard Monitor</Text>
                <Text style={styles.cardSubtitle}>Auto-detect copied links</Text>
              </View>
            </View>
            <Switch
              value={clipboardEnabled}
              onValueChange={setClipboardEnabled}
            />
          </View>
        </View>

        {/* Manual */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Manual URL Scan</Text>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Enter URL"
              placeholderTextColor="#777"
              value={url}
              onChangeText={setUrl}
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
            {loading ? (
              <ActivityIndicator color="#fff"/>
            ) : (
              <>
                <Feather name="search" size={18} color="#fff" />
                <Text style={styles.scanText}> Scan URL</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* QR + Browser */}
        <View style={styles.featureRow}>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="qrcode-scan" size={28} color="#4A90E2"/>
            </View>
            <Text style={styles.featureTitle}>QR Scanner</Text>
            <Text style={styles.featureSubtitle}>Scan QR codes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('SecureBrowser')}
          >
            <View style={styles.iconCircle}>
              <Feather name="globe" size={28} color="#00C897"/>
            </View>
            <Text style={styles.featureTitle}>Secure Browser</Text>
            <Text style={styles.featureSubtitle}>Browse safely</Text>
          </TouchableOpacity>

        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* RESULT MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <Feather
              name={result === 'SAFE' ? 'check-circle' : 'alert-triangle'}
              size={50}
              color={getColor()}
            />
            <Text style={[styles.resultText,{color:getColor()}]}>{result}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={()=>setModalVisible(false)}
            >
              <Text style={{color:'#fff'}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default HomeScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0F172A',paddingHorizontal:16},
  header:{fontSize:20,fontWeight:'600',color:'#fff',marginVertical:15},
  logoContainer:{alignItems:'center',marginVertical:20},
  logoCircle:{backgroundColor:'#1E293B',padding:20,borderRadius:50},
  appName:{color:'#fff',fontSize:24,fontWeight:'700',marginTop:10},
  tagline:{color:'#94A3B8',fontSize:14},
  card:{backgroundColor:'#1E293B',padding:16,borderRadius:16,marginBottom:16},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  rowLeft:{flexDirection:'row',alignItems:'center'},
  cardTitle:{color:'#fff',fontSize:16,fontWeight:'600'},
  cardSubtitle:{color:'#94A3B8',fontSize:13},
  sectionTitle:{color:'#fff',fontSize:16,fontWeight:'600'},
  inputContainer:{backgroundColor:'#0F172A',borderRadius:12,marginTop:10,paddingHorizontal:10},
  input:{color:'#fff',height:45},
  scanButton:{backgroundColor:'#4A90E2',marginTop:15,padding:14,borderRadius:12,flexDirection:'row',justifyContent:'center',alignItems:'center'},
  scanText:{color:'#fff',fontSize:15,fontWeight:'600',marginLeft:6},
  featureRow:{flexDirection:'row',justifyContent:'space-between',marginBottom:16},
  featureCard:{backgroundColor:'#1E293B',width:'48%',padding:16,borderRadius:16,alignItems:'center'},
  iconCircle:{backgroundColor:'#0F172A',padding:15,borderRadius:50,marginBottom:10},
  featureTitle:{color:'#fff',fontWeight:'600'},
  featureSubtitle:{color:'#94A3B8',fontSize:12},
  modalContainer:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'center',alignItems:'center'},
  modalCard:{backgroundColor:'#1E293B',padding:30,borderRadius:20,alignItems:'center',width:'80%'},
  resultText:{fontSize:22,fontWeight:'700',marginVertical:15},
  closeButton:{backgroundColor:'#4A90E2',paddingVertical:10,paddingHorizontal:25,borderRadius:10,marginTop:10},
});