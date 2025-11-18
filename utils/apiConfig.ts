import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dynamically gets the best API URL for the current platform and network configuration
 * Uses Expo's built-in manifest to detect host machine IP
 */
export function getDynamicApiUrl(): string {
  try {
    // First, check if environment variable is set
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl) {
      console.log('✅ Using API URL from .env:', envUrl);
      return envUrl;
    }

    // For web platform, always use localhost
    if (Platform.OS === 'web') {
      console.log('🌐 Web platform: Using localhost:8000');
      return 'http://localhost:8000';
    }

    // Try to get the host machine IP from Expo's debugger host
    // This works for both physical devices and emulators when running Expo
    try {
      const debuggerHost = Constants.expoConfig?.hostUri;
      if (debuggerHost) {
        // Extract just the IP address (remove port if present)
        const hostIp = debuggerHost.split(':')[0];
        const apiUrl = `http://${hostIp}:8000`;
        console.log(`📱 Auto-detected host machine IP: ${apiUrl}`);
        return apiUrl;
      }
    } catch (error) {
      console.warn('⚠️ Could not access Constants.expoConfig, using fallback');
    }

    // Fallback to platform-specific defaults
    if (Platform.OS === 'android') {
      console.log('🤖 Android fallback: Using 10.0.2.2:8000 (emulator address)');
      return 'http://10.0.2.2:8000';
    } else if (Platform.OS === 'ios') {
      console.log('🍎 iOS fallback: Using localhost:8000 (simulator address)');
      return 'http://localhost:8000';
    }

    // Final fallback
    console.log('❓ Unknown platform: Using localhost:8000');
    return 'http://localhost:8000';
  } catch (error) {
    console.error('❌ Error in getDynamicApiUrl:', error);
    // Absolute fallback
    return 'http://localhost:8000';
  }
}


