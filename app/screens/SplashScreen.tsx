import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import authService from '@/services/authService';
import { auth } from '@/config/firebase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const [authChecked, setAuthChecked] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const logoScaleAnim = new Animated.Value(0.8);
  const textFadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Start animations
    Animated.sequence([
      // Logo animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Text animation
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Check auth state and navigate accordingly
    const checkAuthAndNavigate = async () => {
      try {
        // Wait for Firebase auth to initialize
        await new Promise<void>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve();
          });
        });

        // Check if user is already logged in (Firebase session persists)
        if (auth.currentUser) {
          console.log('✅ User already logged in via Firebase, navigating to MainScreenTabs');
          await authService.setLoggedIn(auth.currentUser.uid);
          setAuthChecked(true);
          navigation.replace('MainScreenTabs');
          return;
        }

        // Attempt auto-login with saved credentials
        const autoLoginResult = await authService.attemptAutoLogin();

        if (autoLoginResult.success) {
          console.log('✅ Auto-login successful, navigating to MainScreenTabs');
          setAuthChecked(true);
          navigation.replace('MainScreenTabs');
          return;
        }

        // If user needs to enter password (was logged in but remember me was off)
        if (autoLoginResult.needsPassword) {
          console.log('🔑 User needs to enter password, navigating to LoginScreen');
          setAuthChecked(true);
          navigation.replace('LoginScreen');
          return;
        }

        // First time user or logged out user
        console.log('👋 New user, navigating to OnboardingScreen');
        setAuthChecked(true);
        navigation.replace('OnboardingScreen');
      } catch (error) {
        console.error('Error during auth check:', error);
        setAuthChecked(true);
        navigation.replace('OnboardingScreen');
      }
    };

    // Wait for animation to complete, then check auth
    const timer = setTimeout(() => {
      checkAuthAndNavigate();
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Central Content */}
      <View style={styles.content}>
        <View style={styles.contentContainer}>
          {/* Simple Gradient Background (no BlurView - it crashes on some Android devices) */}
          <View style={styles.gradientWrapper}>
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.01)',
                'rgba(242, 147, 183, 0.20)',
                'rgba(255, 255, 255, 0.1)',
              ]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.contentGradient}
            />
          </View>

          {/* Auvra Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoScaleAnim }],
              },
            ]}
          >
            <Image
              source={require('@/assets/images/auvraLogoSplash.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Tagline */}
          <Animated.Text
            style={[
              styles.tagline,
              { opacity: textFadeAnim }
            ]}
          >
            The missing piece in your{'\n'}hormonal care
          </Animated.Text>

          {/* Simple Loading Spinner (no external image) */}
          <Animated.View
            style={[
              styles.loadingContainer,
              { opacity: textFadeAnim },
            ]}
          >
            <ActivityIndicator size="large" color="#bb4471" />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  contentContainer: {
    width: scale(300),
    height: scale(400),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientWrapper: {
    position: 'absolute',
    width: scale(600),
    height: scale(400),
    borderRadius: scale(250),
    overflow: 'hidden',
  },
  contentGradient: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: scale(263),
    height: scale(180),
  },
  tagline: {
    fontSize: moderateScale(18, 1.5),
    fontFamily: 'Inter400',
    color: '#6E4B6F',
    textAlign: 'center',
    lineHeight: moderateScale(26, 1.5),
    paddingTop: verticalScale(5),
    zIndex: 10,
  },
  loadingContainer: {
    marginTop: verticalScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
