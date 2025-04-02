// This is a CommonJS shim for react-native-ble-plx to work around ES module issues

// Create a mock implementation for demonstration
class MockBleManager {
  constructor() {
    console.log("Mock BLE Manager initialized for Expo SDK 52");
    this.devices = [];
    this.isScanning = false;
  }

  destroy() {
    console.log("BLE Manager destroyed");
    return Promise.resolve();
  }

  async requestPermissions(permissions = []) {
    console.log("Permissions requested:", permissions);
    return true;
  }

  startDeviceScan(serviceUUIDs, options, listener) {
    console.log("Started scanning for devices");
    this.isScanning = true;
    
    // Simulate finding some devices
    setTimeout(() => {
      if (this.isScanning && listener) {
        const mockDevice = this.createMockDevice("BPMonitor-1", "00:11:22:33:44:55");
        if (!this.devices.find(d => d.id === mockDevice.id)) {
          this.devices.push(mockDevice);
          listener(null, mockDevice);
        }
      }
    }, 2000);
    
    setTimeout(() => {
      if (this.isScanning && listener) {
        const mockDevice = this.createMockDevice("BPMonitor-2", "11:22:33:44:55:66");
        if (!this.devices.find(d => d.id === mockDevice.id)) {
          this.devices.push(mockDevice);
          listener(null, mockDevice);
        }
      }
    }, 3500);
    
    setTimeout(() => {
      if (this.isScanning && listener) {
        const mockDevice = this.createMockDevice("Blood Pressure Monitor", "22:33:44:55:66:77");
        if (!this.devices.find(d => d.id === mockDevice.id)) {
          this.devices.push(mockDevice);
          listener(null, mockDevice);
        }
      }
    }, 5000);
  }

  stopDeviceScan() {
    console.log("Stopped scanning for devices");
    this.isScanning = false;
    return Promise.resolve();
  }

  createMockDevice(name, id) {
    return {
      id,
      name,
      connect: async () => {
        console.log(`Connected to device ${name}`);
        return {
          id,
          name,
          discoverAllServicesAndCharacteristics: async () => {
            console.log(`Discovered services for ${name}`);
            return {
              id,
              name,
              services: async () => {
                console.log(`Getting services for ${name}`);
                return [
                  {
                    uuid: "1810", // Blood Pressure Service
                    characteristics: async () => {
                      console.log(`Getting characteristics for service 1810`);
                      return [
                        {
                          uuid: "2A35", // Blood Pressure Measurement
                          monitor: (listener) => {
                            console.log(`Monitoring characteristic for ${name}`);
                            const intervalId = setInterval(() => {
                              if (listener) {
                                // Simulate blood pressure data
                                const systolic = Math.floor(Math.random() * 40) + 100; // 100-140
                                const diastolic = Math.floor(Math.random() * 20) + 70; // 70-90
                                const value = Buffer.from(`${systolic}/${diastolic}`).toString('base64');
                                
                                listener(null, {
                                  value,
                                  uuid: "2A35",
                                  isNotifiable: true,
                                  isReadable: true
                                });
                              }
                            }, 3000);
                            
                            return {
                              remove: () => {
                                clearInterval(intervalId);
                                console.log(`Stopped monitoring characteristic for ${name}`);
                              }
                            };
                          }
                        }
                      ];
                    }
                  }
                ];
              }
            };
          },
          cancelConnection: async () => {
            console.log(`Disconnected from device ${name}`);
            return true;
          }
        };
      }
    };
  }
}

// Error class mock
class BleError extends Error {
  constructor(message, errorCode) {
    super(message);
    this.errorCode = errorCode;
  }
}

// Error codes mock
const BleErrorCode = {
  BluetoothUnauthorized: 101,
  BluetoothPoweredOff: 102,
  BluetoothUnsupported: 103,
  DeviceNotFound: 201,
  DeviceDisconnected: 202,
  ScanStartFailed: 301
};

module.exports = {
  BleManager: MockBleManager,
  BleError,
  BleErrorCode
}; 