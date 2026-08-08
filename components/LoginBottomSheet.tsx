
import AppleIconSvg from "@/assets/images/SVG/OnboardingSVG/AppleIconSvg";
import GoogleIconSvg from "@/assets/images/SVG/OnboardingSVG/GoogleIconSvg";
import RightTickSvg from "@/assets/images/SVG/OnboardingSVG/RightTickSvg";
import GradientText from "@/components/GradientText";
import { auth, signUpWithEmail } from "@/config/firebase";
import sessionService from '@/services/sessionService';
import authService from '@/services/authService';
import { userScopedAsyncStorage } from '@/src/core/storage/userScopedAsyncStorage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { getAdditionalUserInfo, GoogleAuthProvider, OAuthProvider, signInWithCredential } from 'firebase/auth';
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { responsiveFontSize, responsiveHeight, responsiveWidth } from "react-native-responsive-dimensions";
import TextInputContainer from "./customComponent/TextInputContainer";
import PrimaryButton from "./PrimaryButton";

WebBrowser.maybeCompleteAuthSession();

/**
 * Navigation stack parameter list for the app
 */
type RootStackParamList = {
  OnboardingScreen: undefined;
  IntroScreen: undefined;
  QuestionScreen: undefined;
  ResultScreen: undefined;
  ResearchingScreen: undefined;
  LoadingScreen: undefined;
  ResultLoadingScreen: undefined;
  SignupLoadingScreen: undefined;
  LoginScreen: undefined;
  HomeScreen: undefined;
  MainScreenTabs: { freshSignup?: boolean } | undefined;
};

type LoginBottomSheetNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Props for the LoginBottomSheet component
 */
interface LoginBottomSheetProps {
  /** Whether the bottom sheet is visible */
  visible: boolean;
  /** Function to call when the bottom sheet should be closed */
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * LoginBottomSheet Component
 * 
 * A bottom sheet modal that provides user authentication options including:
 * - Email/password signup
 * - Google OAuth signup
 * - Apple authentication signup
 * - Session linking with survey data
 * 
 * @param props - Component props
 * @param props.visible - Bottom sheet visibility
 * @param props.onClose - Close handler function
 * @returns JSX.Element
 */
const LoginBottomSheet = ({ visible, onClose }: LoginBottomSheetProps) => {
  const navigation = useNavigation<LoginBottomSheetNavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [healthDataAccepted, setHealthDataAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Signing up...');
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    iosClientId:
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      '',
  });

  const canStartSignup = privacyAccepted && healthDataAccepted;

  const hasValidOnboardingSession = async (): Promise<boolean> => {
    const requirements = await sessionService.getRequiredConsents();
    const types = new Set(requirements.map((item) => item.consent_type));
    if (types.has('privacy') && types.has('health_data_processing')) return true;
    Alert.alert('Questionnaire expired', 'Please restart your questionnaire before creating an account.');
    return false;
  };

  /** Records explicit decisions using the exact document versions returned by v2. */
  const prepareNewAccountSetup = async (): Promise<boolean> => {
    if (!canStartSignup) {
      Alert.alert('Consent required', 'Please review and accept both required consent documents.');
      return false;
    }
    try {
      const requirements = await sessionService.getRequiredConsents();
      await sessionService.setClaimConsents(requirements.map((requirement) => ({
        consent_type: requirement.consent_type,
        document_version: requirement.document_version,
        granted: requirement.consent_type === 'privacy'
          ? privacyAccepted
          : requirement.consent_type === 'health_data_processing'
            ? healthDataAccepted
            : false,
      })));
      await userScopedAsyncStorage.setItem('session_link_complete', 'pending');
      await userScopedAsyncStorage.setItem('post_auth_flow', 'signup');
      await userScopedAsyncStorage.setItem('post_auth_started_ms', Date.now().toString());
      return true;
    } catch (error: any) {
      Alert.alert('Unable to continue', error?.message || 'Your onboarding session has expired. Please restart the questionnaire.');
      return false;
    }
  };

  /**
   * Handles Google OAuth response and user authentication
   */
  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);

      setLoading(true);
      setLoadingMessage('Signing in with Google...');

      signInWithCredential(auth, credential)
        .then(async (result) => {
          // CRITICAL: Distinguish between NEW users (signup) and RETURNING users (login)
          const isNewUser = !!getAdditionalUserInfo(result)?.isNewUser;
          console.log(`🔐 [Google Auth] isNewUser=${isNewUser}`);

          // Track post-auth flow timing for debugging performance (signup vs login)
          try {
            await userScopedAsyncStorage.setItem('post_auth_flow', isNewUser ? 'signup' : 'login');
            await userScopedAsyncStorage.setItem('post_auth_started_ms', Date.now().toString());
          } catch {
            // ignore
          }

          await authService.saveLoginPreference(result.user.email ?? '', rememberMe);

          if (isNewUser) {
            if (!await prepareNewAccountSetup()) return;
            onClose();
            navigation.navigate('SignupLoadingScreen');
          } else {
            if (await sessionService.hasPendingSignupRecovery()) {
              if (!await prepareNewAccountSetup()) return;
              onClose();
              navigation.navigate('SignupLoadingScreen');
              return;
            }
            // RETURNING USER: Skip session link entirely!
            // Clear any stale flags from previous sessions
            await userScopedAsyncStorage.multiRemove([
              'plan_generating_in_background',
              'session_link_complete',
              'fresh_signup_pending_refresh',
              'post_auth_flow',
              'post_auth_started_ms'
            ]);

            console.log('✅ [Google Auth] Returning user - navigating directly to MainScreenTabs');
            Alert.alert('Success', 'Google login successful!');
            onClose();
            navigation.navigate('MainScreenTabs');
          }
        })
        .catch((error) => {
          Alert.alert('Error', error.message || 'Google signup failed');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  // An OAuth response is a one-shot event. Re-subscribing when UI state changes
  // would process the same credential more than once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  /**
   * Handles bottom sheet animation when visibility changes
   */
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  /**
   * Handles email/password signup process
   */
  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (!canStartSignup) {
      Alert.alert('Consent required', 'Please review and accept both required consent documents.');
      return;
    }
    if (!await hasValidOnboardingSession()) return;

    setLoading(true);
    setLoadingMessage('Creating your account...');
    try {
      const result = await signUpWithEmail(email, password);

      if (result.success) {
        await authService.saveLoginPreference(email, rememberMe);
        if (await prepareNewAccountSetup()) {
          onClose();
          navigation.navigate('SignupLoadingScreen');
        }
      } else {
        Alert.alert("Error", result.error || "Signup failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiates Google OAuth signup process
   */
  const handleGoogleSignin = async () => {
    if (!canStartSignup) {
      Alert.alert('Consent required', 'Please review and accept both required consent documents.');
      return;
    }
    if (!await hasValidOnboardingSession()) return;
    void googlePromptAsync();
  };

  /**
   * Handles Apple authentication signup process
   */
  const handleAppleSignin = async () => {
    if (!canStartSignup) {
      Alert.alert('Consent required', 'Please review and accept both required consent documents.');
      return;
    }
    if (!await hasValidOnboardingSession()) return;
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert("Error", "Apple authentication is not available on this device");
        return;
      }

      setLoading(true);
      setLoadingMessage('Signing in with Apple...');

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

      // CRITICAL: Distinguish between NEW users (signup) and RETURNING users (login)
      const isNewUser = !!getAdditionalUserInfo(result)?.isNewUser;
      console.log(`🔐 [Apple Auth] isNewUser=${isNewUser}`);

      await authService.saveLoginPreference(result.user.email ?? '', rememberMe);

      if (isNewUser) {
        if (!await prepareNewAccountSetup()) return;
        onClose();
        navigation.navigate('SignupLoadingScreen');
      } else {
            if (await sessionService.hasPendingSignupRecovery()) {
              if (!await prepareNewAccountSetup()) return;
              onClose();
              navigation.navigate('SignupLoadingScreen');
              return;
            }
        // RETURNING USER: Skip session link entirely!
        // Clear any stale flags from previous sessions
        await userScopedAsyncStorage.multiRemove([
          'plan_generating_in_background',
          'session_link_complete',
          'fresh_signup_pending_refresh',
          'post_auth_flow',
          'post_auth_started_ms'
        ]);

        console.log('✅ [Apple Auth] Returning user - navigating directly to MainScreenTabs');
        Alert.alert('Success', 'Apple login successful!');
        onClose();
        navigation.navigate('MainScreenTabs');
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Apple signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <Animated.View
        style={[
          styles.bottomSheetCard,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.handleBar} />

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 40}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            bounces={true}
          >
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <Text style={styles.subHeaderText}>But first...</Text>
              <View style={styles.gradientTitleContainer}>
                <GradientText
                  text="How would you like to sign up?"
                  textStyle={styles.gradientTitleText}
                  containerStyle={styles.maskedView}
                />
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
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
                  placeholder="Set Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="next"
                  containerStyle={styles.textInput}
                />
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <TextInputContainer
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="done"
                  containerStyle={styles.textInput}
                />
              </View>

              {/* Remember Me */}
              <TouchableOpacity
                style={styles.rememberContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxSelected]}>
                  {rememberMe && <RightTickSvg size={responsiveFontSize(1.4)} color="#FFF" />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityState={{ checked: privacyAccepted }}
                accessibilityLabel="Accept the Privacy Policy"
                style={styles.consentContainer}
                onPress={() => setPrivacyAccepted((accepted) => !accepted)}
              >
                <View style={[styles.checkbox, privacyAccepted && styles.checkboxSelected]}>
                  {privacyAccepted && <RightTickSvg size={responsiveFontSize(1.4)} color="#FFF" />}
                </View>
                <Text style={styles.consentText}>I agree to the Privacy Policy selected for this signup.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityState={{ checked: healthDataAccepted }}
                accessibilityLabel="Consent to health data processing"
                style={styles.consentContainer}
                onPress={() => setHealthDataAccepted((accepted) => !accepted)}
              >
                <View style={[styles.checkbox, healthDataAccepted && styles.checkboxSelected]}>
                  {healthDataAccepted && <RightTickSvg size={responsiveFontSize(1.4)} color="#FFF" />}
                </View>
                <Text style={styles.consentText}>I consent to processing my health information for my personalized plan.</Text>
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
                disabled={!googleRequest || loading || !canStartSignup}
              >
                <GoogleIconSvg />
                <Text style={styles.socialButtonText}>Sign up with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleAppleSignin}
                disabled={loading || !canStartSignup}
              >
                <AppleIconSvg />
                <Text style={styles.socialButtonText}>Sign up with Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By signing up, you agree to Auvra by Hormone Insight&apos;s{' '}
                <Text style={styles.termsLink}>Terms and Conditions</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Bottom Button - inside ScrollView so it scrolls with content */}
            <View style={styles.buttonContainer}>
              <PrimaryButton
                title={loading ? loadingMessage : "Sign up"}
                onPress={handleSignup}
                disabled={loading || !email || !password || !confirmPassword || !canStartSignup}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(217, 217, 217, 0.5)",
    zIndex: 1,
  },
  bottomSheetCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 2,
    paddingTop: 8,
    height: SCREEN_HEIGHT * 0.95,
    maxHeight: '95%',
    overflow: 'hidden',
  },
  handleBar: {
    width: responsiveWidth(36),
    height: 5,
    backgroundColor: "#CFCFCF",
    borderRadius: 100,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(10),
  },
  headerContainer: {
    marginBottom: responsiveHeight(4),
  },
  subHeaderText: {
    fontSize: responsiveFontSize(1.7), // 12px
    fontFamily: "Inter400",
    color: "#000000",
    marginBottom: responsiveHeight(2),
    lineHeight: responsiveFontSize(1.7) * 1.25,
  },
  gradientTitleContainer: {
  },
  maskedView: {
    width: responsiveWidth(85),
    height: responsiveHeight(7), // Changed height from 6 to 8
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientTitleText: {
    fontFamily: 'NotoSerif600',
    fontSize: responsiveFontSize(3.4), // 24px
    textAlign: 'left',
    lineHeight: responsiveHeight(3.4),
  },
  formContainer: {
    marginBottom: responsiveHeight(3),
  },
  inputContainer: {
    marginBottom: responsiveHeight(2.5),
  },
  textInput: {
    // Use default height and padding from TextInputContainer
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(2.5),
    marginBottom: responsiveHeight(2),
  },
  checkbox: {
    width: responsiveWidth(5),
    height: responsiveHeight(2.5),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C17EC9",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#C17EC9",
  },
  rememberText: {
    fontFamily: "Inter400",
    color: "rgba(0, 0, 0, 0.6)",
    fontSize: responsiveFontSize(1.7), // 12px
    lineHeight: responsiveFontSize(1.7) * 1.25,
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveWidth(2.5),
    marginBottom: responsiveHeight(1.5),
  },
  consentText: {
    flex: 1,
    fontFamily: 'Inter400',
    color: 'rgba(0, 0, 0, 0.72)',
    fontSize: responsiveFontSize(1.55),
    lineHeight: responsiveFontSize(1.55) * 1.35,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(3),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(73, 69, 79, 0.34)",
  },
  dividerText: {
    color: "#6f6f6f",
    fontSize: responsiveFontSize(1.7), // 12px
    fontFamily: "Inter400",
    marginHorizontal: responsiveWidth(2.5),
    lineHeight: responsiveFontSize(1.7) * 1.25,
  },
  socialContainer: {
    gap: responsiveHeight(1.5),
    marginBottom: responsiveHeight(4),
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: responsiveWidth(2),
    height: responsiveHeight(6),
    backgroundColor: "#ffffff",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    paddingHorizontal: responsiveWidth(4),
  },
  socialButtonText: {
    color: "#1e1e1e",
    fontSize: responsiveFontSize(1.98), // 14px
    fontFamily: "Inter500",
    lineHeight: responsiveFontSize(1.98) * 1.25,
  },
  termsContainer: {
    marginBottom: responsiveHeight(2),
  },
  buttonContainer: {
    marginTop: responsiveHeight(1),
    marginBottom: responsiveHeight(4),
    paddingHorizontal: responsiveWidth(1),
  },
  termsText: {
    fontFamily: "Inter400",
    fontSize: responsiveFontSize(1.42), // 10px
    color: "#6f6f6f",
    textAlign: "center",
    lineHeight: responsiveFontSize(1.42) * 1.5,
  },
  termsLink: {
    color: "#000000",
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },

});

export default LoginBottomSheet;
