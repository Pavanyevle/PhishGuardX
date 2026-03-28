import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';

import Feather from 'react-native-vector-icons/Feather';
import { getScanHistory } from '../utils/historyStorage';

const HistoryScreen = () => {

  // ✅ Hooks must be at top level
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [safeCount, setSafeCount] = useState(0);
  const [threatCount, setThreatCount] = useState(0);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getScanHistory();

    setHistory(data);

    const totalScans = data.length;
    const safe = data.filter(item => item.result === 'SAFE').length;
    const threats = data.filter(
      item => item.result === 'HIGH' || item.result === 'SUSPICIOUS'
    ).length;

    setTotal(totalScans);
    setSafeCount(safe);
    setThreatCount(threats);
  };

  const getColor = (result) => {
    if (result === 'SAFE') return '#00C897';
    if (result === 'SUSPICIOUS') return '#FFA500';
    return '#FF4D4D';
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Feather
          name={item.result === 'SAFE' ? 'check-circle' : 'alert-triangle'}
          size={20}
          color={getColor(item.result)}
        />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.url} numberOfLines={1}>
            {item.url}
          </Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <Text style={[styles.result, { color: getColor(item.result) }]}>
          {item.result}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>History</Text>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#00C897' }]}>
            {safeCount}
          </Text>
          <Text style={styles.statLabel}>Safe</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#FF4D4D' }]}>
            {threatCount}
          </Text>
          <Text style={styles.statLabel}>Threats</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Scan History</Text>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  header: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  statsContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    flexDirection: 'row',
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  url: {
    color: '#fff',
    fontSize: 14,
  },
  time: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  result: {
    fontWeight: '600',
  },
});
