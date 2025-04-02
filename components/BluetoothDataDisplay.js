import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BluetoothDataDisplay = ({ data }) => {
  // If no data is available yet
  if (!data || (!data.systolic && !data.diastolic)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bluetooth Data</Text>
        <Text style={styles.noDataText}>No data received yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Data</Text>
      <View style={styles.dataRow}>
        <Text style={styles.label}>Systolic:</Text>
        <Text style={styles.value}>{data.systolic} mmHg</Text>
      </View>
      <View style={styles.dataRow}>
        <Text style={styles.label}>Diastolic:</Text>
        <Text style={styles.value}>{data.diastolic} mmHg</Text>
      </View>
      <Text style={styles.timestamp}>Last Updated: {new Date().toLocaleTimeString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 16,
    color: '#555',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d600d3',
  },
  noDataText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'right',
  },
});

export default BluetoothDataDisplay; 