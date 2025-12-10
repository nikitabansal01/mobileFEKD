import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/config/firebase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Image assets from Figma
const imgLoading = "http://localhost:3845/assets/b0e74d06b35689a6403477cf90fbacb394b75b3e.svg";

// Storage keys for user state
const HAS_COMPLETED_ONBOARDING_KEY = '@hasCompletedOnboarding';

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const fadeAnim = new Animated.Value(0);
  const logoScaleAnim = new Animated.Value(0.8);
  const textFadeAnim = new Animated.Value(0);
  const loadingRotateAnim = new Animated.Value(0);
  const [isNavigating, setIsNavigating] = useState(false);

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

    // Loading animation
    Animated.loop(
      Animated.timing(loadingRotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    /**
     * Determine where to navigate based on auth and onboarding status
     * Flow:
     * - Logged in → MainScreenTabs (Home)
     * - Completed onboarding but not logged in → LoginScreen
     * - First time user → OnboardingScreen
     */
    const determineNavigation = async () => {
      // Small delay for splash animation
      await new Promise(resolve => setTimeout(resolve, 2500));

      if (isNavigating) return;
      setIsNavigating(true);

      try {
        const currentUser = auth.currentUser;
        const hasCompletedOnboarding = await AsyncStorage.getItem(HAS_COMPLETED_ONBOARDING_KEY);

        console.log('🔍 SplashScreen navigation check:', {
          isLoggedIn: !!currentUser,
          hasCompletedOnboarding: !!hasCompletedOnboarding,
        });

        if (currentUser) {
          // User is logged in - go to home
          console.log('✅ User logged in - navigating to MainScreenTabs');
          navigation.replace('MainScreenTabs');
        } else if (hasCompletedOnboarding) {
          // User has seen onboarding but is not logged in - show onboarding final slide with login option
          console.log('🔐 Returning user - navigating to OnboardingScreen (last slide)');
          navigation.replace('OnboardingScreen', { skipToEnd: true });
        } else {
          // First time user - show onboarding
          console.log('👋 First time user - navigating to OnboardingScreen');
          navigation.replace('OnboardingScreen');
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to onboarding on error
        navigation.replace('OnboardingScreen');
      }
    };

    determineNavigation();
  }, [navigation]);

  const loadingRotation = loadingRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Central Content */}
      <View style={styles.content}>
        <View style={styles.contentContainer}>
          {/* Blurred Gradient Background */}
          <BlurView intensity={20} style={styles.gradientWrapper}>
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.01)',
                'rgba(242, 147, 183, 0.20)',
                'rgba(255, 255, 255, 0.1)',  // Fades to transparent
              ]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.contentGradient}
            />
          </BlurView>

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

          {/* Loading Animation */}
          <Animated.View
            style={[
              styles.loadingContainer,
              {
                opacity: textFadeAnim,
                transform: [{ rotate: loadingRotation }],
              },
            ]}
          >
            <Image source={{ uri: imgLoading }} style={styles.loadingIcon} resizeMode="contain" />
          </Animated.View>
        </View>
      </View>
    </View>
    // <View style={styles.container}>
    //   <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />


    //   {/* Central Content */}
    //   <View style={styles.content}>
    //     {/* Content Background Gradient Container */}
    //     <View style={styles.contentContainer}>
    //       <LinearGradient
    //         colors={[
    //           'rgba(255, 182, 210, 0.10)',
    //           'rgba(242, 147, 183, 0.20)',
    //         ]}
    //         locations={[0, 1]}
    //         start={{ x: 0, y: 0 }}
    //         end={{ x: 0, y: 1 }}
    //         style={styles.contentGradient}
    //       />

    //       {/* Auvra Character */}
    //       <Animated.View 
    //         style={[
    //           styles.characterContainer,
    //           {
    //             opacity: fadeAnim,
    //             transform: [{ scale: logoScaleAnim }],
    //           },
    //         ]}
    //       >
    //         <AuvraCharacter size={scale(120)} />
    //       </Animated.View>

    //       {/* Tagline */}
    //       <Animated.Text 
    //         style={[
    //           styles.tagline, 
    //           { opacity: textFadeAnim }
    //         ]}
    //       >
    //         The missing piece in your hormone care
    //       </Animated.Text>

    //       {/* Loading Animation */}
    //       <Animated.View 
    //         style={[
    //           styles.loadingContainer,
    //           {
    //             opacity: textFadeAnim,
    //             transform: [{ rotate: loadingRotation }],
    //           },
    //         ]}
    //       >
    //         <Image source={{ uri: imgLoading }} style={styles.loadingIcon} resizeMode="contain" />
    //       </Animated.View>
    //     </View>
    //   </View>
    // </View>
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
    borderRadius: scale(250),  // Circular shape
    overflow: 'hidden',        // Important for borderRadius to work with BlurView
  },
  contentGradient: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    //    marginBottom: verticalScale(0),
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
    fontFamily: 'Poppins400',
    color: '#6E4B6F',
    textAlign: 'center',
    lineHeight: moderateScale(26, 1.5),
    // marginTop: verticalScale(0),
    paddingTop: verticalScale(5),
    zIndex: 10,
  },
  loadingContainer: {
    width: scale(50),
    height: scale(50),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingIcon: {
    width: scale(50),
    height: scale(50),
  },
});
