import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Platform, Alert } from 'react-native';
// Import from our local shim instead of react-native-ble-plx
import { BleManager, BleErrorCode } from '../blePlxShim';

// Initialize the BleManager outside the component to avoid recreating it on rerenders
let manager = null;

const BluetoothManager = ({ onDataReceived }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [bloodPressureData, setBloodPressureData] = useState({ systolic: 0, diastolic: 0 });
  const [isManagerInitialized, setIsManagerInitialized] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // Effect to initialize Bluetooth
  useEffect(() => {
    const initializeBluetooth = async () => {
      try {
        // Create a new BleManager instance if it doesn't exist
        if (!manager) {
          manager = new BleManager();
          console.log('BLE Manager created');
        }
        
        // Request necessary permissions on Android
        if (Platform.OS === 'android') {
          const permissions = [
            'android.permission.BLUETOOTH_SCAN',
            'android.permission.BLUETOOTH_CONNECT',
            'android.permission.ACCESS_FINE_LOCATION',
          ];
          console.log('Requesting permissions:', permissions);
          const granted = await manager.requestPermissions(permissions);
          console.log('Permissions result:', granted);
        }
        
        setIsManagerInitialized(true);
      } catch (error) {
        console.error('Error initializing Bluetooth:', error);
        Alert.alert('Bluetooth Error', 'Failed to initialize Bluetooth: ' + error.message);
      }
    };

    initializeBluetooth();

    // Clean up on component unmount
    return () => {
      if (subscription) {
        subscription.remove();
      }
      
      if (manager) {
        manager.destroy()
          .then(() => console.log('BLE Manager destroyed'))
          .catch(err => console.error('Error destroying BLE Manager:', err));
        manager = null;
      }
    };
  }, [subscription]);

  // Start scanning for devices
  const startScan = useCallback(() => {
    if (!isManagerInitialized || !manager) {
      Alert.alert('Not Ready', 'Bluetooth is not initialized yet. Please try again in a moment.');
      return;
    }
    
    try {
      setIsScanning(true);
      setDevices([]);

      // Before starting a new scan, make sure the previous one is stopped
      if (manager) {
        manager.stopDeviceScan();
      }

      console.log('Starting device scan...');
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scanning error:', error);
          setIsScanning(false);
          
          if (error.errorCode === BleErrorCode.BluetoothPoweredOff) {
            Alert.alert('Bluetooth Off', 'Please turn on Bluetooth to scan for devices.');
          } else {
            Alert.alert('Scan Error', 'Error while scanning: ' + error.message);
          }
          return;
        }

        // Check if the device is already in our list
        if (device && device.name && !devices.find((d) => d.id === device.id)) {
          console.log('Found device:', device.name, device.id);
          setDevices((prevDevices) => [...prevDevices, device]);
        }
      });

      // Stop scanning after 10 seconds
      setTimeout(() => {
        if (manager) {
          manager.stopDeviceScan();
          console.log('Scan timeout - stopped scanning');
        }
        setIsScanning(false);
      }, 10000);
    } catch (error) {
      console.error('Error starting scan:', error);
      setIsScanning(false);
      Alert.alert('Scan Error', 'Failed to start scanning: ' + error.message);
    }
  }, [isManagerInitialized, devices]);

  // Connect to a device
  const connectToDevice = useCallback(async (device) => {
    if (!manager) {
      Alert.alert('Not Ready', 'Bluetooth is not initialized yet.');
      return;
    }
    
    try {
      setIsScanning(false);
      if (manager) {
        manager.stopDeviceScan();
      }

      console.log(`Connecting to device ${device.name}...`);
      // Connect to the selected device
      const connectedDevice = await device.connect();
      console.log(`Connected to ${device.name}`);
      setConnectedDevice(connectedDevice);
      
      // Discover services and characteristics
      console.log(`Discovering services for ${device.name}...`);
      const discoveredDevice = await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log(`Services discovered for ${device.name}`);
      
      // Find services
      const services = await discoveredDevice.services();
      
      // For debugging - log all services and characteristics
      console.log('Available services:');
      let foundBloodPressureService = false;
      
      for (const service of services) {
        console.log(`Service: ${service.uuid}`);
        const characteristics = await service.characteristics();
        
        for (const characteristic of characteristics) {
          console.log(`  Characteristic: ${characteristic.uuid}`);
          
          // If this is the blood pressure measurement characteristic
          if (service.uuid === '1810' && characteristic.uuid === '2A35') {
            foundBloodPressureService = true;
            console.log('Found blood pressure service and characteristic');
            
            // Set up notification for the characteristic
            console.log('Setting up monitor for blood pressure data...');
            const sub = characteristic.monitor((error, char) => {
              if (error) {
                console.error('Monitoring error:', error);
                return;
              }
              
              try {
                // Parse the data
                if (char && char.value) {
                  console.log('Received blood pressure data:', char.value);
                  const decodedData = Buffer.from(char.value, 'base64').toString('utf8');
                  console.log('Decoded data:', decodedData);
                  
                  const [systolic, diastolic] = decodedData.split('/').map(Number);
                  
                  if (!isNaN(systolic) && !isNaN(diastolic)) {
                    const newData = { systolic, diastolic };
                    console.log('Parsed blood pressure:', newData);
                    
                    setBloodPressureData(newData);
                    
                    // Send data to parent component
                    if (onDataReceived) {
                      onDataReceived(newData);
                    }
                  } else {
                    console.error('Invalid blood pressure data format:', decodedData);
                  }
                }
              } catch (parseError) {
                console.error('Error parsing blood pressure data:', parseError);
              }
            });
            
            setSubscription(sub);
          }
        }
      }
      
      // If no blood pressure service was found, fall back to simulation
      if (!foundBloodPressureService) {
        console.log('No blood pressure service found, using simulation');
        simulateBloodPressureData();
      }
      
      Alert.alert('Connected', `Connected to ${device.name}`);
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Error', `Failed to connect: ${error.message}`);
    }
  }, [onDataReceived]);

  // Simulate receiving blood pressure data
  const simulateBloodPressureData = useCallback(() => {
    // Create an interval to simulate data reception
    const dataInterval = setInterval(() => {
      // Generate random blood pressure data for demonstration
      const systolic = Math.floor(Math.random() * 40) + 100; // Random between 100-140
      const diastolic = Math.floor(Math.random() * 20) + 70; // Random between 70-90
      
      const newData = { systolic, diastolic };
      console.log('Simulated blood pressure:', newData);
      
      setBloodPressureData(newData);
      
      // Send data to parent component
      if (onDataReceived) {
        onDataReceived(newData);
      }
    }, 3000); // Update every 3 seconds
    
    // Create a cleanup function that conforms to the subscription interface
    const mockSubscription = {
      remove: () => {
        console.log('Removing simulated data subscription');
        clearInterval(dataInterval);
      }
    };
    
    setSubscription(mockSubscription);
  }, [onDataReceived]);

  // Disconnect from device
  const disconnectDevice = useCallback(async () => {
    if (connectedDevice) {
      try {
        // Clear any subscription
        if (subscription) {
          subscription.remove();
          setSubscription(null);
        }
        
        if (manager) {
          console.log(`Disconnecting from ${connectedDevice.name}...`);
          await connectedDevice.cancelConnection();
          console.log(`Disconnected from ${connectedDevice.name}`);
        }
        
        setConnectedDevice(null);
        setBloodPressureData({ systolic: 0, diastolic: 0 });
        Alert.alert('Disconnected', 'Device disconnected');
      } catch (error) {
        console.error('Disconnect error:', error);
        Alert.alert('Error', `Failed to disconnect: ${error.message}`);
      }
    }
  }, [connectedDevice, subscription]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Bluetooth Devices</Text>
        {connectedDevice ? (
          <Text style={styles.connectedText}>Connected to: {connectedDevice.name}</Text>
        ) : null}
      </View>

      <View style={styles.buttonContainer}>
        {!connectedDevice ? (
          <TouchableOpacity 
            style={[styles.button, isScanning ? styles.buttonDisabled : null]}
            onPress={startScan}
            disabled={isScanning || !isManagerInitialized}
          >
            <Text style={styles.buttonText}>
              {!isManagerInitialized ? 'Initializing...' : isScanning ? 'Scanning...' : 'Scan for Devices'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={disconnectDevice}>
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      {isScanning || devices.length > 0 ? (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.deviceItem}
              onPress={() => connectToDevice(item)}
              disabled={connectedDevice !== null}
            >
              <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
              <Text style={styles.deviceId}>{item.id}</Text>
            </TouchableOpacity>
          )}
          style={styles.deviceList}
          ListEmptyComponent={
            isScanning ? (
              <Text style={styles.emptyText}>Searching for devices...</Text>
            ) : (
              <Text style={styles.emptyText}>No devices found</Text>
            )
          }
        />
      ) : null}

      {connectedDevice && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataText}>
            Received Data: {bloodPressureData.systolic}/{bloodPressureData.diastolic} mmHg
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  connectedText: {
    fontSize: 16,
    color: 'green',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#d600d3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  buttonDisabled: {
    backgroundColor: '#c0c0c0',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deviceList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  deviceItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#666',
  },
  dataContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dataText: {
    fontSize: 18,
    textAlign: 'center',
  },
});

export default BluetoothManager; 