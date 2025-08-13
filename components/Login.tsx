import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import React, { useRef, useState, useEffect } from "react";
import GoogleIconSvg from "@/assets/images/SVG/OnboardingSVG/GoogleIconSvg";
import AppleIconSvg from "@/assets/images/SVG/OnboardingSVG/AppleIconSvg";
import { Link, useRouter } from "expo-router";
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from "react-native-responsive-dimensions";
import { responsiveFontSize2 } from "@/globalFontSizeNew";
import ExpandableInput from "./ExpandableInput";
import RightTickSvg from "@/assets/images/SVG/OnboardingSVG/RightTickSvg";
import { signInWithEmail } from "@/config/firebase";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, OAuthProvider } from 'firebase/auth';
import { auth } from '@/config/firebase';
import * as AppleAuthentication from 'expo-apple-authentication';
import sessionService from '@/services/sessionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '', // 또는 app.json의 extra에서 불러오기
  });

  // Google Client ID 디버깅
  console.log('Google Client ID Debug:', {
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'SET' : 'NOT SET',
    clientIdValue: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.substring(0, 20) + '...' || 'NOT SET'
  });

  // 컴포넌트 마운트 시 저장된 로그인 정보 복원
  useEffect(() => {
    loadSavedLoginInfo();
  }, []);

  // 저장된 로그인 정보 불러오기
  const loadSavedLoginInfo = async () => {
    try {
      const savedRememberMe = await AsyncStorage.getItem('rememberMe');
      if (savedRememberMe === 'true') {
        const savedEmail = await AsyncStorage.getItem('savedEmail');
        const savedPassword = await AsyncStorage.getItem('savedPassword');
        
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
          console.log('저장된 로그인 정보 복원됨');
        }
      }
    } catch (error) {
      console.error('저장된 로그인 정보 불러오기 실패:', error);
    }
  };

  // 로그인 정보 저장
  const saveLoginInfo = async () => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('savedEmail', email);
        await AsyncStorage.setItem('savedPassword', password);
        console.log('로그인 정보 저장됨');
      } else {
        // Remember me가 해제되면 저장된 정보 삭제
        await AsyncStorage.removeItem('rememberMe');
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
        console.log('저장된 로그인 정보 삭제됨');
      }
    } catch (error) {
      console.error('로그인 정보 저장 실패:', error);
    }
  };

  // Remember me 상태 변경 핸들러
  const handleRememberMeToggle = () => {
    setRememberMe(!rememberMe);
  };

  // 로그아웃 시 저장된 정보 삭제
  const clearSavedLoginInfo = async () => {
    try {
      await AsyncStorage.removeItem('rememberMe');
      await AsyncStorage.removeItem('savedEmail');
      await AsyncStorage.removeItem('savedPassword');
      console.log('저장된 로그인 정보 삭제됨');
    } catch (error) {
      console.error('저장된 로그인 정보 삭제 실패:', error);
    }
  };

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (result) => {
          // 소셜 로그인 성공 시 Remember me 정보 저장
          if (rememberMe) {
            await AsyncStorage.setItem('rememberMe', 'true');
            await AsyncStorage.setItem('savedEmail', result.user?.email || '');
            // 소셜 로그인의 경우 비밀번호는 저장하지 않음 (보안상)
            console.log('소셜 로그인 정보 저장됨');
          }
          
          // Firebase 토큰 가져오기
          const token = await result.user?.getIdToken();
          
          if (token) {
            // 세션을 사용자와 연결
            const linkSuccess = await sessionService.linkSessionToUser(token);
            if (linkSuccess) {
              console.log('세션이 사용자와 연결됨');
            } else {
              console.log('세션 연결 실패 (세션이 없을 수 있음)');
            }
          }
          
          Alert.alert('Success', 'Google login successful!');
          // TODO: 로그인 성공 후 처리
        })
        .catch((error) => {
          Alert.alert('Error', error.message || 'Google login failed');
        });
    }
  }, [googleResponse]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        // 로그인 정보 저장
        await saveLoginInfo();
        
        // Firebase 토큰 가져오기
        const token = await result.user?.getIdToken();
        
        if (token) {
          // 세션을 사용자와 연결
          const linkSuccess = await sessionService.linkSessionToUser(token);
          if (linkSuccess) {
            console.log('세션이 사용자와 연결됨');
          } else {
            console.log('세션 연결 실패 (세션이 없을 수 있음)');
          }
        }
        
        Alert.alert("Success", "Login successful!");
        console.log("Login successful:", result.user?.email);
        // TODO: 여기에 로그인 성공 후 처리 로직 추가
      } else {
        Alert.alert("Error", result.error || "Login failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // 기존 handleGoogleSignin 함수는 expo-auth-session 방식으로 교체
  const handleGoogleSignin = () => {
    googlePromptAsync();
  };

  const handleAppleSignin = async () => {
    try {
      // Apple 로그인 사용 가능 여부 확인
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert("Error", "Apple authentication is not available on this device");
        return;
      }

      // Apple 로그인
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Firebase로 인증
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken!,
      });
      
      const result = await signInWithCredential(auth, firebaseCredential);
      
      // 소셜 로그인 성공 시 Remember me 정보 저장
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('savedEmail', result.user?.email || '');
        // 소셜 로그인의 경우 비밀번호는 저장하지 않음 (보안상)
        console.log('소셜 로그인 정보 저장됨');
      }
      
      // Firebase 토큰 가져오기
      const token = await result.user?.getIdToken();
      
      if (token) {
        // 세션을 사용자와 연결
        const linkSuccess = await sessionService.linkSessionToUser(token);
        if (linkSuccess) {
          console.log('세션이 사용자와 연결됨');
        } else {
          console.log('세션 연결 실패 (세션이 없을 수 있음)');
        }
      }
      
      Alert.alert("Success", "Apple login successful!");
      console.log("Apple login successful:", result.user?.email);
      // TODO: 여기에 로그인 성공 후 처리 로직 추가
    } catch (error: any) {
      Alert.alert("Error", error.message || "Apple login failed");
    }
  };
  
  return (
    <View>
      <View style={styles.loginContainer}>
        <View style={{ gap: 24 }}>
          <ExpandableInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            isFocused={focusedInput === "first"}
            onFocus={() => setFocusedInput("first")}
          />
          <ExpandableInput
            label="Set password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            isFocused={focusedInput === "secound"}
            onFocus={() => setFocusedInput("secound")}
          />
        </View>

        {/* Remember me */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginVertical: 20,
          }}
          onPress={handleRememberMeToggle}
        >
          <View
            style={[
              styles.rememberMeView,
              rememberMe && styles.rememberClickView,
            ]}
          >
            <RightTickSvg
              size={responsiveFontSize(1.4)}
              color={rememberMe ? "#FFF" : "#BB4471"}
            />
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </TouchableOpacity>
        {/* login in */}
        <TouchableOpacity 
          onPress={handleLogin} 
          style={[styles.buttonView, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Log in"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotButtonView}
          onPress={() => console.log("Forgot password")}
        >
          <Text style={styles.forgotButtonText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Line */}
        <View style={styles.lineContainer}>
          <View style={styles.lineView} />
          <Text style={styles.lineText}>or</Text>
          <View style={styles.lineView} />
        </View>

        {/* Buttons */}
        <View style={styles.socialLoginContainer}>
          <TouchableOpacity
            onPress={handleGoogleSignin}
            style={styles.googleButtonView}
            disabled={!googleRequest}
          >
            <GoogleIconSvg />
            <Text style={styles.googleButtonText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.googleButtonView}
            onPress={handleAppleSignin}
          >
            <AppleIconSvg />
            <Text style={styles.googleButtonText}>Apple</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  rememberMeView: {
    width: responsiveWidth(5.56),
    height: responsiveHeight(2.68),
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: "#BB4471",
    justifyContent: "center",
    alignItems: "center",
  },
  rememberClickView: {
    backgroundColor: "#BB4471",
  },
  rememberText: {
    fontFamily: "Poppins400",
    color: "rgba(0, 0, 0, 0.60)",
    fontSize: responsiveFontSize2(1.65),
  },
  loginContainer: {
    paddingVertical: 10,
  },
  inputLable: {
    color: "#B3B3B3",
    fontSize: responsiveFontSize2(1.65),
    fontFamily: "Poppins400",
  },
  inputView: {
    color: "black",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderColor: "#D9D9D9",
  },
  innerInputView: {
    color: "#000",
    fontSize: 12,
    padding: 0,
    fontFamily: "Poppins400",
  },
  buttonView: {
    padding: 20,
    backgroundColor: "#BB4471",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  forgotButtonView: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  forgotButtonText: {
    fontSize: responsiveFontSize2(1.92),
    fontFamily: "Poppins500",
    color: "rgba(0, 0, 0, 0.60)",
  },
  buttonText: {
    fontSize: responsiveFontSize2(1.92),
    fontFamily: "Poppins500",
    color: "#FFF",
  },
  lineContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 34,
    marginBottom: 21,
  },
  lineView: {
    borderWidth: 0.4,
    flex: 1,
    borderColor: "rgba(73, 69, 79, 0.34)",
  },
  lineText: {
    color: "rgba(73, 69, 79, 0.34)",
    fontSize: responsiveFontSize2(1.8),
    fontFamily: "Poppins400",
  },
  socialLoginContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  googleButtonView: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 27,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    borderColor: "#D9D9D9",
    flexDirection: "row",
    gap: 8,
  },
  googleButtonText: {
    fontSize: responsiveFontSize2(1.64),
    fontFamily: "Poppins400",
    color: "rgba(30, 30, 30, 1)",
  },
}); 