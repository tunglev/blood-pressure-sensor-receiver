// App.js
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Home from './pages/Home'; // Adjust the import path if necessary
import Results from './pages/Results'; // Adjust the path accordingly

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error?.toString()}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [isBLESupported, setBLESupported] = useState(true);
  
  useEffect(() => {
    // Check if the device supports Bluetooth
    if (Platform.OS === 'ios' && parseInt(Platform.Version, 10) < 13) {
      setBLESupported(false);
      Alert.alert(
        'Incompatible Device',
        'Your device does not support Bluetooth Low Energy. Please use a device with iOS 13 or later.'
      );
    }
  }, []);
  
  if (!isBLESupported) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.errorTitle}>Bluetooth Not Supported</Text>
        <Text style={styles.errorMessage}>
          Your device doesn't support the Bluetooth features required for this app.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <Results />
        <Home/>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8d7da',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#721c24',
    textAlign: 'center',
  }
});
