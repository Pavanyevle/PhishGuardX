import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';

import { WebView } from 'react-native-webview';
import Feather from 'react-native-vector-icons/Feather';

import { hybridScan } from '../utils/scannerEngine';
import { saveScanToHistory } from '../utils/historyStorage';
import { detectFakeBrand } from '../utils/fakeLoginDetector';

/* ⭐ Detect password field */
const detectLoginScript = `
setTimeout(()=>{
 const password=document.querySelector('input[type="password"]');
 if(password){
   window.ReactNativeWebView.postMessage("PASSWORD_DETECTED");
 }
},2000);
`;

const getDomain = (url) => {
  try {
    return url.replace('https://','').replace('http://','').split('/')[0];
  } catch {
    return null;
  }
};

const SecureBrowserScreen = ({ route }) => {

  const incomingUrl = route?.params?.incomingUrl;

  const [url,setUrl]=useState('');
  const [loading,setLoading]=useState(false);
  const [openUrl,setOpenUrl]=useState(null);
  const [blockedUrl,setBlockedUrl]=useState(null);
  const [loginWarned,setLoginWarned]=useState(false);

  const lastDomainRef = useRef(null);
  const scanningRef = useRef(false);

  /* ⭐ External open */
  useEffect(()=>{
    if(incomingUrl) openIncoming(incomingUrl);
  },[incomingUrl]);

  const openIncoming = async(link)=>{
    scanAndOpen(link);
  };

  /* ⭐ Core scan function */
  const scanAndOpen = async(link)=>{

    if(scanningRef.current) return;
    scanningRef.current=true;

    try{

      if(link.startsWith("http://")){
        Alert.alert("⚠️ Insecure Connection","Site not using HTTPS");
      }

      const result=await hybridScan(link);
      await saveScanToHistory(link,result);

      if(result==="HIGH"){
        setBlockedUrl(link);
        scanningRef.current=false;
        return;
      }

      setOpenUrl(link);
      lastDomainRef.current=getDomain(link);

    }catch{}

    scanningRef.current=false;
  };

  /* 🔎 Manual browse */
  const handleBrowse = ()=>{
    if(!url) return Alert.alert("Enter URL");

    const formatted=url.startsWith("http")?url:`https://${url}`;
    scanAndOpen(formatted);
  };

  /* 🚫 BLOCK SCREEN */
  if(blockedUrl){
    return(
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Feather name="alert-triangle" size={70} color="#FF4D4D"/>
          <Text style={styles.blockTitle}>Phishing Site Blocked</Text>
          <Text style={styles.blockSub}>This page was detected as dangerous.</Text>

          <TouchableOpacity
            style={styles.goBtn}
            onPress={()=>{
              setBlockedUrl(null);
              setOpenUrl(null);
            }}
          >
            <Text style={{color:"#fff"}}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return(
    <SafeAreaView style={styles.container}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TextInput
          placeholder="Enter website"
          placeholderTextColor="#777"
          value={url}
          onChangeText={setUrl}
          style={styles.input}
        />

        <TouchableOpacity style={styles.goBtn} onPress={handleBrowse}>
          {loading
            ? <ActivityIndicator color="#fff"/>
            : <Feather name="arrow-right" size={20} color="#fff"/>}
        </TouchableOpacity>
      </View>

      {openUrl ? (
        <WebView
          source={{uri:openUrl}}
          style={{flex:1}}
          injectedJavaScript={detectLoginScript}

          /* ⭐ Login detect */
          onMessage={(event)=>{
            if(event.nativeEvent.data==="PASSWORD_DETECTED" && !loginWarned){
              setLoginWarned(true);
              Alert.alert(
                "⚠️ Login Page Detected",
                "This page contains password input. Ensure site is trusted."
              );
            }
          }}

          /* ⭐ Navigation scan */
          onShouldStartLoadWithRequest={(request)=>{

            const nextUrl=request.url;

            if(!nextUrl || nextUrl===openUrl) return true;

            const nextDomain=getDomain(nextUrl);

            /* ⭐ Redirect detect */
            if(lastDomainRef.current && nextDomain!==lastDomainRef.current){
              Alert.alert("⚠️ Redirect Detected","Site changed domain.");
            }

            lastDomainRef.current=nextDomain;

            /* ⭐ Fake brand detect */
            const fake=detectFakeBrand(nextUrl);
            if(fake){
              Alert.alert("🚨 Possible Fake Login","Brand impersonation suspected.");
            }

            scanAndOpen(nextUrl);

            return false;
          }}
        />
      ):(
        <View style={styles.empty}>
          <Feather name="shield" size={60} color="#4A90E2"/>
          <Text style={styles.text}>Secure Browser Ready</Text>
        </View>
      )}

    </SafeAreaView>
  );
};

export default SecureBrowserScreen;

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:"#0F172A"},
  topBar:{flexDirection:"row",padding:10},
  input:{flex:1,backgroundColor:"#1E293B",borderRadius:12,paddingHorizontal:10,color:"#fff"},
  goBtn:{backgroundColor:"#4A90E2",marginLeft:10,padding:12,borderRadius:12,justifyContent:"center"},
  empty:{flex:1,justifyContent:"center",alignItems:"center"},
  text:{color:"#94A3B8",marginTop:10},
  blockTitle:{color:"#fff",fontSize:18,marginTop:10},
  blockSub:{color:"#94A3B8",marginTop:6}
});