import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import {
  View,
  Modal,
  Animated,
  Easing,
  StyleSheet,
  TouchableWithoutFeedback,
  BackHandler,
} from "react-native";

const AddButtonBottomSheet = forwardRef((props: {children: React.ReactNode}, ref) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const openModal = () => {
    setIsModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => {
      setIsModalVisible(false);
    });
  };

  useImperativeHandle(ref, () => ({
    openModal,
    closeModal
  }));

  useEffect(() => {
    const handleBackPress = () => {
      if (isModalVisible) {
        closeModal();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => backHandler.remove();
  }, [isModalVisible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal transparent animationType="none" visible={isModalVisible}>
      <TouchableWithoutFeedback onPress={closeModal}>
        <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback >
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY }] }]}
          >
      {/* Render children passed to this component */}
      {props.children}
          </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

export default AddButtonBottomSheet;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    padding: 20,
  },
}); 