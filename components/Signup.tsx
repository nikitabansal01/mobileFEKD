import AppleIconSvg from "@/assets/images/SVG/OnboardingSVG/AppleIconSvg";
import GoogleIconSvg from "@/assets/images/SVG/OnboardingSVG/GoogleIconSvg";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useRef, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    responsiveFontSize,
    responsiveHeight,
    responsiveWidth,
} from "react-native-responsive-dimensions";

import RightTickSvg from "@/assets/images/SVG/OnboardingSVG/RightTickSvg";
import { auth, signUpWithEmail } from "@/config/firebase";
import { Feather } from "@expo/vector-icons";
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from 'firebase/auth';
import AddButtonBottomSheet from "./AddButtonBottomSheet";
import ExpandableInput from "./ExpandableInput";

WebBrowser.maybeCompleteAuthSession();

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ConfirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<any>(null);
  const navigation = useNavigation<StackNavigationProp<any>>();

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '', // 또는 app.json의 extra에서 불러오기
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((result) => {
          Alert.alert('Success', 'Google signup successful!');
          // TODO: 회원가입 성공 후 처리
        })
        .catch((error) => {
          Alert.alert('Error', error.message || 'Google signup failed');
        });
    }
  }, [googleResponse]);

  const handleSignup = async () => {
    if (!email || !password || !ConfirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== ConfirmPassword) {
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
        Alert.alert("Success", "Signup successful!");
        console.log("Signup successful:", result.user?.email);
        // TODO: 여기에 회원가입 성공 후 처리 로직 추가
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
      Alert.alert("Success", "Apple signup successful!");
      console.log("Apple signup successful:", result.user?.email);
      // TODO: 여기에 회원가입 성공 후 처리 로직 추가
    } catch (error: any) {
      Alert.alert("Error", error.message || "Apple signup failed");
    }
  };
  
  return (
    <View>
      <View style={styles.loginContainer}>
        <View>
          <ExpandableInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            isFocused={focusedInput === "first"}
            onFocus={() => setFocusedInput("first")}
            inputViewStyle={{marginBottom:24}}
          />
          <ExpandableInput
            label="Set password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            isFocused={focusedInput === "secound"}
            onFocus={() => setFocusedInput("secound")}
          />
          {/* strong */}
          <View style={{ alignItems: "flex-end" }}>
            <TouchableOpacity
              style={styles.strongView}
              onPress={() => bottomRef.current.openModal()}
            >
              <Text style={styles.strongText}>strong</Text>
              <Feather
                name="info"
                size={responsiveFontSize(2.46)}
                color="#C7C7CC"
              />
            </TouchableOpacity>
          </View>
          <AddButtonBottomSheet ref={bottomRef}>
            <View style={styles.bottomSheetView}>
              <Text style={styles.bottomSheetHeaderText}>
                Your password must include
              </Text>
              <Text style={styles.bottomSheetHeaderStrongText}>Strong</Text>
            </View>
            <View style={styles.bottomSheetItemView}>
              <View style={styles.bottomSheetTickView}>
                <RightTickSvg size={responsiveFontSize(1.4)} color="#FFF" />
              </View>
              <Text style={styles.bottomSheetItemText}>
                At least one letter
              </Text>
            </View>

            <View style={styles.bottomSheetItemView}>
              <View style={styles.bottomSheetTickView}>
                <RightTickSvg size={responsiveFontSize(1.4)} color="#FFF" />
              </View>
              <Text style={styles.bottomSheetItemText}>
                At least one number
              </Text>
            </View>

            <View style={styles.bottomSheetItemView}>
              <View style={styles.bottomSheetTickView}>
                <RightTickSvg size={responsiveFontSize(1.4)} color="#FFF" />
              </View>
              <Text style={styles.bottomSheetItemText}>
                At least 8 characters
              </Text>
            </View>
          </AddButtonBottomSheet>
          <ExpandableInput
            label="Confirm password"
            value={ConfirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            isFocused={focusedInput === "third"}
            onFocus={() => setFocusedInput("third")}
            inputViewStyle={{marginBottom:24}}
          />
        </View>

        {/* remamber me */}
        <TouchableOpacity
          style={styles.rememberContainer}
          onPress={() => setRememberMe(!rememberMe)}
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
          onPress={handleSignup} 
          style={[styles.buttonView, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Signing up..." : "Sign up"}
          </Text>
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
            <Text style={styles.googleText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.googleButtonView}
            onPress={handleAppleSignin}
          >
            <AppleIconSvg />
            <Text style={styles.googleText}>Apple</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Signup;

const styles = StyleSheet.create({
  bottomSheetView: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "space-between",
  },
  bottomSheetHeaderText: {
    color: "#1E1E1E",
    fontSize: responsiveFontSize(1.92),
    fontFamily: "Poppins400",
  },
  bottomSheetHeaderStrongText: {
    color: "#44AD5E",
    fontSize: responsiveFontSize(1.92),
    fontFamily: "Poppins400",
    textAlign: "right",
  },
  bottomSheetItemView: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  bottomSheetTickView: {
    width: 20,
    height: 20,
    backgroundColor: "#44AD5E",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  bottomSheetItemText: {
    color: "#44AD5E",
    fontSize: responsiveFontSize(1.65),
    fontFamily: "Poppins400",
  },
  strongView: {
    flexDirection: "row",
    gap: 2,
    alignItems: "center",
    justifyContent: "flex-end",
    marginVertical: 4,
  },
  strongText: {
    color: "#44AD5E",
    fontSize: responsiveFontSize(1.4),
    fontFamily: "Poppins400",
    textAlign: "right",
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
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
    fontSize: responsiveFontSize(1.65),
  },
  loginContainer: {
    paddingVertical: 10,
  },
  inputLable: {
    color: "#B3B3B3",
    fontSize: responsiveFontSize(1.65),
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
    fontSize: responsiveFontSize(1.65),
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
  buttonText: {
    fontSize: responsiveFontSize2(2.4),
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
    fontSize: responsiveFontSize2(1.65),
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
    alignItems: "center",
    flex: 1,
    borderColor: "#D9D9D9",
    flexDirection: "row",
    gap: 8,
  },
  googleText: {
    color: "rgba(30, 30, 30, 1)",
    fontFamily: "Poppins400",
    fontSize: responsiveFontSize2(1.65),
  },
}); 