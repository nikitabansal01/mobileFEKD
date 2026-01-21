import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import AppleIconSvg from '@/assets/images/SVG/OnboardingSVG/AppleIconSvg';
import GoogleIconSvg from '@/assets/images/SVG/OnboardingSVG/GoogleIconSvg';
import RightTickSvg from '@/assets/images/SVG/OnboardingSVG/RightTickSvg';
import AuvraCharacter from '@/components/AuvraCharacter';
import TextInputContainer from '@/components/customComponent/TextInputContainer';
import FixedBottomContainer from '@/components/FixedBottomContainer';
import GradientText from '@/components/GradientText';
import PrimaryButton from '@/components/PrimaryButton';

// Services
import { auth, signInWithEmail } from '@/config/firebase';
import authService from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

type RootStackParamList = {
  OnboardingScreen: undefined;
  IntroScreen: undefined;
  QuestionScreen: undefined;
  ResultScreen: undefined;
  ResearchingScreen: undefined;
  LoadingScreen: undefined;
  ResultLoadingScreen: undefined;
  LoginScreen: undefined;
  HomeScreen: undefined;
  MainScreenTabs: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LoginScreen'>;

/**
 * Login screen component with email/password and social authentication
 * Supports Google and Apple sign-in methods
 */
const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  // Load saved email on mount if remember me was enabled
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedCredentials = await authService.getSavedCredentials();
        if (savedCredentials) {
          setEmail(savedCredentials.email);
          setPassword(savedCredentials.password);
          setRememberMe(true);
        } else {
          // Check if just email was saved
          const savedEmail = await authService.getSavedEmail();
          if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
          }
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    };
    loadSavedCredentials();
  }, []);

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (result) => {
          // Save login state
          await authService.setLoggedIn(result.user.uid);
          // For social logins, we enable remember me by default
          await authService.saveCredentials('', '', true);

          // Clear stale flags from previous sessions (important for returning users)
          await AsyncStorage.multiRemove([
            'plan_generating_in_background',
            'session_link_complete',
            'fresh_signup_pending_refresh',
            'post_auth_flow',
            'post_auth_started_ms'
          ]);

          Alert.alert('Success', 'Google login successful!');
          navigation.navigate('MainScreenTabs');
        })
        .catch((error) => {
          Alert.alert('Error', error.message || 'Google login failed');
        });
    }
  }, [googleResponse]);

  /**
   * Handle email/password login
   */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmail(email, password);

      if (result.success && result.user) {
        // Save credentials based on remember me preference
        await authService.saveCredentials(email, password, rememberMe);
        // Mark user as logged in
        await authService.setLoggedIn(result.user.uid);

        // Clear stale flags from previous sessions (important for returning users)
        await AsyncStorage.multiRemove([
          'plan_generating_in_background',
          'session_link_complete',
          'fresh_signup_pending_refresh',
          'post_auth_flow',
          'post_auth_started_ms'
        ]);

        Alert.alert("Success", "Login successful!");
        navigation.navigate('MainScreenTabs');
      } else {
        Alert.alert("Error", result.error || "Login failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google sign-in
   */
  const handleGoogleSignin = () => {
    googlePromptAsync();
  };

  /**
   * Handle Apple sign-in
   */
  const handleAppleSignin = async () => {
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert("Error", "Apple authentication is not available on this device");
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken!,
      });

      const result = await signInWithCredential(auth, firebaseCredential);

      // Save login state
      await authService.setLoggedIn(result.user.uid);
      // For social logins, we enable remember me by default
      await authService.saveCredentials('', '', true);

      // Clear stale flags from previous sessions (important for returning users)
      await AsyncStorage.multiRemove([
        'plan_generating_in_background',
        'session_link_complete',
        'fresh_signup_pending_refresh',
        'post_auth_flow',
        'post_auth_started_ms'
      ]);

      Alert.alert("Success", "Apple login successful!");
      navigation.navigate('MainScreenTabs');
    } catch (error: any) {
      Alert.alert("Error", error.message || "Apple login failed");
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Scrollable Content - entire screen slides up with keyboard */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.characterContainer}>
              <AuvraCharacter size={responsiveWidth(20)} />
            </View>

            <View style={styles.titleContainer}>
              <GradientText
                text="Welcome Back!"
                textStyle={styles.title}
                containerStyle={styles.maskedView}
              />
            </View>

            <Text style={styles.subtitle}>
              Login to start taking care of your hormones
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInputContainer
              placeholder="Email address or Phone Number"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="email"
              returnKeyType="next"
              containerStyle={styles.textInput}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInputContainer
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              autoComplete="password"
              returnKeyType="done"
              containerStyle={styles.textInput}
            />
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.rememberContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxSelected]}>
                {rememberMe && <RightTickSvg size={responsiveFontSize(1.4)} color="#FFF" />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignin}
              disabled={!googleRequest}
            >
              <GoogleIconSvg />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleAppleSignin}
            >
              <AppleIconSvg />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signupLinkContainer}>
            <Text style={styles.signupLinkText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('OnboardingScreen')}>
              <Text style={styles.signupLinkAction}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to Auvra by Hormone Insight's{' '}
              <Text style={styles.termsLink}>Terms and Conditions</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <FixedBottomContainer>
          <PrimaryButton
            title={loading ? "Logging in..." : "Log in"}
            onPress={handleLogin}
            disabled={loading || !email || !password}
          />
        </FixedBottomContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: responsiveHeight(10),
    paddingHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(3),
  },
  characterContainer: {
    alignItems: 'center',
    marginBottom: responsiveHeight(1),
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(0.5),
  },
  maskedView: {
    width: responsiveWidth(85),
    height: responsiveHeight(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'NotoSerif600',
    fontSize: responsiveFontSize(3.12),
    textAlign: 'center',
    lineHeight: responsiveHeight(3.12),
  },
  subtitle: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7),
    color: '#6f6f6f',
    textAlign: 'center',
    lineHeight: responsiveFontSize(1.7) * 1.25,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(1),
    paddingBottom: responsiveHeight(8),
    gap: responsiveHeight(2),
  },
  inputContainer: {
    marginBottom: responsiveHeight(1),
  },
  textInput: {
    // Uses default TextInputContainer styles
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveHeight(1.5),
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(2.5),
  },
  checkbox: {
    width: responsiveWidth(5),
    height: responsiveHeight(2.5),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C17EC9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#C17EC9',
  },
  rememberText: {
    fontFamily: 'Inter400',
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: responsiveFontSize(1.7),
    lineHeight: responsiveFontSize(1.7) * 1.25,
  },
  forgotPasswordText: {
    fontFamily: 'Inter400',
    color: '#C17EC9',
    fontSize: responsiveFontSize(1.7),
    lineHeight: responsiveFontSize(1.7) * 1.25,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(73, 69, 79, 0.34)',
  },
  dividerText: {
    color: '#6f6f6f',
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter400',
    marginHorizontal: responsiveWidth(2.5),
    lineHeight: responsiveFontSize(1.7) * 1.25,
  },
  socialContainer: {
    gap: responsiveHeight(1.5),
    marginBottom: responsiveHeight(2),
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveWidth(2),
    height: responsiveHeight(6),
    backgroundColor: '#ffffff',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingHorizontal: responsiveWidth(4),
  },
  socialButtonText: {
    color: '#1e1e1e',
    fontSize: responsiveFontSize(1.98),
    fontFamily: 'Inter500',
    lineHeight: responsiveFontSize(1.98) * 1.25,
  },
  signupLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveHeight(1),
  },
  signupLinkText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.7),
    color: '#6f6f6f',
  },
  signupLinkAction: {
    fontFamily: 'Inter600',
    fontSize: responsiveFontSize(1.7),
    color: '#C17EC9',
  },
  termsContainer: {
    marginBottom: responsiveHeight(8),
    paddingBottom: responsiveHeight(2),
  },
  termsText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.42),
    color: '#6f6f6f',
    textAlign: 'center',
    lineHeight: responsiveFontSize(1.0) * 1.5,
  },
  termsLink: {
    color: '#000000',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
});

export default LoginScreen;
