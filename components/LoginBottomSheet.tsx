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
import { responsiveWidth } from "react-native-responsive-dimensions";
import Login from "./Login";
import Signup from "./Signup";

interface LoginBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

const LoginBottomSheet = ({ visible, onClose }: LoginBottomSheetProps) => {
  const [loginEnable, setLoginEnable] = useState(false);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

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
    if (!visible) setLoginEnable(false);
  }, [visible]);

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
          { transform: [{ translateY: slideAnim }], height: '90%' },
        ]}
      >
        <View style={styles.handleBar} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header text */}
          <View style={styles.headerContainer}>
            <Text style={styles.subHeaderText}>But first...</Text>
            <Text style={styles.mainHeaderText}>
              How would you like to sign up?
            </Text>
          </View>
          {/* Login/Signup component */}
          <View style={styles.formContainer}>
            {loginEnable ? <Login /> : <Signup />}
          </View>
        </ScrollView>
        {/* Bottom toggle */}
        <TouchableOpacity
          style={styles.bottomToggle}
          onPress={() => setLoginEnable(!loginEnable)}
        >
          <Text style={styles.haveAccountText}>
            {loginEnable ? "Don't have an account?" : "Have an account?"} {" "}
            <Text style={styles.linkText}>
              {loginEnable ? "Sign up" : "Log in"}
            </Text>
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  subHeaderText: {
    fontSize: responsiveFontSize2(1.8),
    fontFamily: "Poppins400",
    color: "#000000",
    marginBottom: 4,
  },
  mainHeaderText: {
    fontSize: responsiveFontSize2(3),
    fontFamily: "Poppins500",
    color: "#BB4471",
    lineHeight: responsiveFontSize2(3.6),
  },
  formContainer: {
    flex: 1,
  },
  bottomToggle: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  haveAccountText: {
    fontFamily: "Poppins400",
    fontSize: responsiveFontSize2(1.5),
    color: "rgba(0, 0, 0, 0.6)",
  },
  linkText: {
    color: "#BB4471",
    textDecorationLine: "underline",
    fontFamily: "Poppins400",
  },
});

export default LoginBottomSheet; 