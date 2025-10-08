import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface AuvraChatModalProps {
  onClose: () => void;
  onResponse: (response: 'positive' | 'negative') => void;
}

const AuvraChatModal: React.FC<AuvraChatModalProps> = ({ onClose, onResponse }) => {
  return (
    <View style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>
      
      {/* Main chat bubble */}
      <View style={styles.chatBubble}>
        <LinearGradient
          colors={['rgba(104, 58, 244, 0.3)', 'rgba(228, 176, 236, 0.3)', 'rgba(187, 68, 113, 0.3)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBubble}
        >
          <Text style={styles.mainMessage}>
            How does your action plan look today?
          </Text>
        </LinearGradient>
      </View>

      {/* Response options */}
      <View style={styles.responseContainer}>
        <TouchableOpacity 
          style={styles.responseButton}
          onPress={() => onResponse('positive')}
        >
          <Text style={styles.responseText}>👍 It works for me</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.responseButton}
          onPress={() => onResponse('negative')}
        >
          <Text style={styles.responseText}>👎 I want to change it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: responsiveHeight(12), // Position above bottom navigation
    left: responsiveWidth(5),
    right: responsiveWidth(5),
    zIndex: 1000,
    backgroundColor: '#FFEDF7', // Semi-transparent white background
    borderRadius: 15,
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(6),
    paddingBottom: responsiveHeight(5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatBubble: {
    marginBottom: responsiveHeight(1.5),
  },
  gradientBubble: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(10),
    borderRadius: 10,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  mainMessage: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: 'Poppins400',
    color: '#000000',
    lineHeight: responsiveHeight(2.2),
  },
  responseContainer: {
    alignItems: 'flex-end',
    gap: responsiveHeight(0.8),
  },
  responseButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#6F6F6F',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.2),
    borderRadius: 10,
    maxWidth: responsiveWidth(50),
  },
  responseText: {
    fontSize:  moderateScale(12, 1.5),
    fontFamily: 'Poppins400',
    color: '#000000',
    lineHeight: responsiveHeight(2.2),
  },
  closeButton: {
    position: 'absolute',
    top: responsiveHeight(1),
    right: responsiveWidth(2),
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    borderRadius: responsiveWidth(3),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  closeButtonText: {
    fontSize: responsiveFontSize(2.5),
    color: '#666666',
    fontWeight: 'bold',
    lineHeight: responsiveHeight(2.5),
  },
});

export default AuvraChatModal;
