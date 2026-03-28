import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

const SettingsScreen = () => {
  const [activeTab, setActiveTab] = useState('whitelist');
  const [domain, setDomain] = useState('');
  const [domains, setDomains] = useState([]);
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= AUTH ================= */

  useEffect(() => {
    const login = async () => {
      try {
        const userCredential = await auth().signInAnonymously();
        setUid(userCredential.user.uid);
      } catch (e) {
        console.log('Auth error:', e);
      }
    };
    login();
  }, []);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (!uid) return;

    setLoading(true);

    const ref = database().ref(`users/${uid}/${activeTab}`);

    const listener = ref.on('value', snapshot => {
      const data = snapshot.val() || {};

      const list = Object.entries(data).map(([key, value]) => ({
        key,
        original: value.original,
      }));

      setDomains(list);
      setLoading(false);
    });

    return () => ref.off('value', listener);
  }, [uid, activeTab]);

  /* ================= SANITIZE DOMAIN ================= */

  const sanitizeKey = (domain) => {
    return domain
      .replace(/^https?:\/\//, '')
      .replace(/\./g, '_dot_')
      .replace(/\//g, '')
      .trim()
      .toLowerCase();
  };

  /* ================= ADD DOMAIN ================= */

  const addDomain = () => {
    if (!domain.trim() || !uid) return;

    const cleanKey = sanitizeKey(domain);

    database()
      .ref(`users/${uid}/${activeTab}/${cleanKey}`)
      .set({
        original: domain.trim().toLowerCase(),
        addedAt: Date.now(),
      });

    setDomain('');
  };

  /* ================= REMOVE DOMAIN ================= */

  const removeDomain = (key) => {
    if (!uid) return;

    database()
      .ref(`users/${uid}/${activeTab}/${key}`)
      .remove();
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'whitelist' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('whitelist')}>
          <Text style={styles.tabText}>
            Whitelist ({activeTab === 'whitelist' ? domains.length : ''})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'blacklist' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('blacklist')}>
          <Text style={styles.tabText}>
            Blacklist ({activeTab === 'blacklist' ? domains.length : ''})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Enter domain (e.g., example.com)"
          placeholderTextColor="#777"
          style={styles.input}
          value={domain}
          onChangeText={setDomain}
        />

        <TouchableOpacity style={styles.addButton} onPress={addDomain}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color="#4A90E2" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={domains}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <View style={styles.domainCard}>
              <Text style={styles.domainText}>{item.original}</Text>
              <TouchableOpacity onPress={() => removeDomain(item.key)}>
                <Feather name="trash-2" size={18} color="#FF4D4D" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No domains added</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default SettingsScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
  },

  header: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 20,
  },

  tabRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  tabButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderRadius: 14,
    marginHorizontal: 5,
  },

  activeTab: {
    backgroundColor: '#4A90E2',
  },

  tabText: {
    color: '#fff',
    fontWeight: '600',
  },

  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 15,
    color: '#fff',
  },

  addButton: {
    backgroundColor: '#4A90E2',
    marginLeft: 10,
    padding: 14,
    borderRadius: 14,
    justifyContent: 'center',
  },

  domainCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },

  domainText: {
    color: '#fff',
  },

  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 40,
  },
});
