import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { responsiveFontSize, responsiveWidth } from 'react-native-responsive-dimensions';
import { createInputStyle, createInputTextStyle } from '../utils/inputStyles';
import SimpleDatePicker from './SimpleDatePicker';

interface DatePickerButtonProps {
  /** Selected date */
  value: Date;
  /** Function called when date changes */
  onDateChange: (date: Date) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Additional styles for the button */
  style?: any;
}

const DatePickerButton: React.FC<DatePickerButtonProps> = ({
  value,
  onDateChange,
  placeholder = "Select Date",
  disabled = false,
  style,
}) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePress = () => {
    if (!disabled) {
      setIsPickerVisible(true);
    }
  };

  const handleDateChange = (date: Date) => {
    onDateChange(date);
    setIsPickerVisible(false);
  };

  const handleClose = () => {
    setIsPickerVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          createInputStyle(disabled ? 'default' : 'default'),
          disabled && styles.buttonDisabled,
          style
        ]}
        onPress={handlePress}
        disabled={disabled}
      >
        <View style={styles.buttonContent}>
          <Text style={[
            createInputTextStyle(disabled ? 'default' : 'default'),
            disabled && styles.buttonTextDisabled
          ]}>
            {formatDate(value)}
          </Text>
          <View style={styles.arrowContainer}>
            <Text style={[
              styles.arrow,
              disabled && styles.arrowDisabled
            ]}>▼</Text>
          </View>
        </View>
      </TouchableOpacity>

      <SimpleDatePicker
        value={value}
        onDateChange={handleDateChange}
        visible={isPickerVisible}
        onClose={handleClose}
        placeholder={placeholder}
      />
    </>
  );
};

const styles = StyleSheet.create({
  buttonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#d0d0d0',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonTextDisabled: {
    color: '#6f6f6f',
  },
  arrowContainer: {
    marginLeft: responsiveWidth(2),
  },
  arrow: {
    fontSize: responsiveFontSize(1.4),
    color: '#333333',
  },
  arrowDisabled: {
    color: '#6f6f6f',
  },
});

export default DatePickerButton;
