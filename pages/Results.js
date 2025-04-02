import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import BloodPressureDisplay from '../components/BloodPressureDisplay';
import Graph from '../components/Graph';
import Statistics from '../components/Statistics';
import Header from '../components/header';
import BluetoothManager from '../components/BluetoothManager';
import BluetoothDataDisplay from '../components/BluetoothDataDisplay';

const Results = () => {
  const date = 'Mon, Aug 23';
  const [bloodPressureData, setBloodPressureData] = useState({
    systolic: 122,
    diastolic: 82
  });
  const avgBpm = 92;
  const minBpm = 72;
  const maxBpm = 180;

  // Handle data received from Bluetooth
  const handleBluetoothData = (data) => {
    if (data && data.systolic && data.diastolic) {
      setBloodPressureData(data);
    }
  };

   return (
    <View style={styles.container}>
      <Header date={date} />
      <BloodPressureDisplay 
        systolic={bloodPressureData.systolic} 
        diastolic={bloodPressureData.diastolic} 
      />
      <BluetoothDataDisplay data={bloodPressureData} />
      <Graph />
      <Statistics avg={avgBpm} min={minBpm} max={maxBpm} />
      <BluetoothManager onDataReceived={handleBluetoothData} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '80%',
    backgroundColor: '#ffffff',
  },
});


export default Results;
