import { responsiveFontSize2 } from "@/globalFontSizeNew";
import React, { useEffect, useState } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { responsiveWidth, responsiveHeight, responsiveFontSize } from "react-native-responsive-dimensions";
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import GradientText from "@/components/GradientText";
import TextInputContainer from "./customComponent/TextInputContainer";
import FixedBottomContainer from "./FixedBottomContainer";
import PrimaryButton from "./PrimaryButton";
import GoogleIconSvg from "@/assets/images/SVG/OnboardingSVG/GoogleIconSvg";
import AppleIconSvg from "@/assets/images/SVG/OnboardingSVG/AppleIconSvg";
import RightTickSvg from "@/assets/images/SVG/OnboardingSVG/RightTickSvg";
import { signUpWithEmail } from "@/config/firebase";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, OAuthProvider } from 'firebase/auth';
import { auth } from '@/config/firebase';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Alert } from "react-native";
import sessionService from '@/services/sessionService';

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
};

type LoginBottomSheetNavigationProp = StackNavigationProp<RootStackParamList>;

interface LoginBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

const LoginBottomSheet = ({ visible, onClose }: LoginBottomSheetProps) => {
  const navigation = useNavigation<LoginBottomSheetNavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (result) => {
          // 세션 연결 시도
          try {
            const linkSuccess = await sessionService.linkSessionToUser(result.user);
            if (linkSuccess) {
              Alert.alert('Success', 'Google signup successful! Your survey data has been linked.');
              onClose();
              navigation.navigate('HomeScreen');
            } else {
              Alert.alert('Success', 'Google signup successful! But failed to link survey data.');
              onClose();
              navigation.navigate('HomeScreen');
            }
          } catch (linkError) {
            console.error('세션 연결 실패:', linkError);
            Alert.alert('Success', 'Google signup successful! But failed to link survey data.');
            onClose();
            navigation.navigate('HomeScreen');
          }
        })
        .catch((error) => {
          Alert.alert('Error', error.message || 'Google signup failed');
        });
    }
  }, [googleResponse]);

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
  }, [visible]);

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

    setLoading(true);
    try {
      const result = await signUpWithEmail(email, password);
      
      if (result.success) {
        // 세션 연결 시도
        try {
          const linkSuccess = await sessionService.linkSessionToUser(result.user);
          if (linkSuccess) {
            Alert.alert("Success", "Signup successful! Your survey data has been linked.");
            onClose();
            navigation.navigate('HomeScreen');
          } else {
            Alert.alert("Success", "Signup successful! But failed to link survey data.");
            onClose();
            navigation.navigate('HomeScreen');
          }
        } catch (linkError) {
          console.error('세션 연결 실패:', linkError);
          Alert.alert("Success", "Signup successful! But failed to link survey data.");
          onClose();
          navigation.navigate('HomeScreen');
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

  const handleGoogleSignin = () => {
    googlePromptAsync();
  };

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
      
      // 세션 연결 시도
      try {
        const linkSuccess = await sessionService.linkSessionToUser(result.user);
        if (linkSuccess) {
          Alert.alert("Success", "Apple signup successful! Your survey data has been linked.");
          onClose();
          navigation.navigate('HomeScreen');
        } else {
          Alert.alert("Success", "Apple signup successful! But failed to link survey data.");
          onClose();
          navigation.navigate('HomeScreen');
        }
      } catch (linkError) {
        console.error('세션 연결 실패:', linkError);
        Alert.alert("Success", "Apple signup successful! But failed to link survey data.");
        onClose();
        navigation.navigate('HomeScreen');
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Apple signup failed");
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
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
                containerStyle={styles.textInput}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInputContainer
                placeholder="Set Password"
                value={password}
                onChangeText={setPassword}
                containerStyle={styles.textInput}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <TextInputContainer
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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
              <Text style={styles.socialButtonText}>Sign up with Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleAppleSignin}
            >
              <AppleIconSvg />
              <Text style={styles.socialButtonText}>Sign up with Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By signing up, you agree to Auvra by Hormone Insight's{' '}
              <Text style={styles.termsLink}>Terms and Conditions</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <FixedBottomContainer>
          <PrimaryButton
            title={loading ? "Signing up..." : "Sign up"}
            onPress={handleSignup}
            disabled={loading || !email || !password || !confirmPassword}
          />
        </FixedBottomContainer>
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
    maxHeight: '95%',
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
  scrollContent: {
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(10),
  },
  headerContainer: {
    marginBottom: responsiveHeight(4),
  },
  subHeaderText: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: "Inter400",
    color: "#000000",
    marginBottom: responsiveHeight(2),
    lineHeight: responsiveFontSize(1.2) * 1.25,
  },
  gradientTitleContainer: {
  },
  maskedView: {
    width: responsiveWidth(85),
    height: responsiveHeight(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientTitleText: {
    fontFamily: 'NotoSerif600',
    fontSize: responsiveFontSize(3),
    textAlign: 'left',
    lineHeight: responsiveHeight(3),
  },
  formContainer: {
    marginBottom: responsiveHeight(3),
  },
  inputContainer: {
    marginBottom: responsiveHeight(2.5),
  },
  textInput: {
    // TextInputContainer의 기본 높이와 패딩을 그대로 사용
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
    fontSize: responsiveFontSize(1.2),
    lineHeight: responsiveFontSize(1.2) * 1.25,
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
    fontSize: responsiveFontSize(1.2),
    fontFamily: "Inter400",
    marginHorizontal: responsiveWidth(2.5),
    lineHeight: responsiveFontSize(1.2) * 1.25,
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
    fontSize: responsiveFontSize(1.4),
    fontFamily: "Inter500",
    lineHeight: responsiveFontSize(1.4) * 1.25,
  },
  termsContainer: {
    marginBottom: responsiveHeight(2),
  },
  termsText: {
    fontFamily: "Inter400",
    fontSize: responsiveFontSize(1.2),
    color: "#6f6f6f",
    textAlign: "center",
    lineHeight: responsiveFontSize(1.0) * 1.5,
  },
  termsLink: {
    color: "#000000",
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },

});

export default LoginBottomSheet; 