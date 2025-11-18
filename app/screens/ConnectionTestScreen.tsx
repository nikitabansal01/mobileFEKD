import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getDynamicApiUrl } from '@/utils/apiConfig';

/**
 * Connection Test Screen - Debug tool to test backend connectivity
 * Add this to your navigation to test connection issues
 */
export default function ConnectionTestScreen() {
  const [apiUrl, setApiUrl] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const url = getDynamicApiUrl();
    setApiUrl(url);
    addLog(`🔗 Detected API URL: ${url}`);
  }, []);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResults([]);
    addLog('🔄 Starting connection test...');

    try {
      // Test 1: Basic fetch to session endpoint
      addLog(`📍 Testing: ${apiUrl}/api/v1/questions/sessions`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/api/v1/questions/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: 'test_device_from_app'
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      addLog(`📊 Response Status: ${response.status}`);
      addLog(`📊 Response OK: ${response.ok}`);

      if (response.ok) {
        const data = await response.json();
        addLog(`✅ SUCCESS! Session created: ${data.session_id}`);
        addLog(`✅ Backend is reachable and working!`);
      } else {
        const errorText = await response.text();
        addLog(`❌ Failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        addLog(`❌ Error: ${error.name}`);
        addLog(`❌ Message: ${error.message}`);
        
        if (error.name === 'AbortError') {
          addLog('⏱️  Request timed out after 10 seconds');
          addLog('💡 Backend might not be running or URL is wrong');
        } else if (error.message.includes('Network request failed')) {
          addLog('🌐 Network request failed');
          addLog('💡 Possible causes:');
          addLog('   1. Backend is not running');
          addLog('   2. Wrong IP address for device');
          addLog('   3. Firewall blocking connection');
          addLog('   4. Device not on same network');
        }
      } else {
        addLog(`❌ Unknown error: ${String(error)}`);
      }
    }

    setTesting(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Connection Test</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>API URL:</Text>
        <Text style={styles.infoValue}>{apiUrl}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testConnection}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? '⏳ Testing...' : '🚀 Test Connection'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.logContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.logText}>
            {result}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.helpBox}>
        <Text style={styles.helpTitle}>💡 Quick Fixes:</Text>
        <Text style={styles.helpText}>1. Make sure backend is running (python main.py)</Text>
        <Text style={styles.helpText}>2. Check backend responds: curl http://localhost:8000/api/v1/health</Text>
        <Text style={styles.helpText}>3. For physical device: use your machine's IP</Text>
        <Text style={styles.helpText}>4. Both devices on same WiFi network</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  logText: {
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 5,
  },
  helpBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 12,
    marginBottom: 5,
    color: '#856404',
  },
});
