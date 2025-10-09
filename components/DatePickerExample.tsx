import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import DatePickerButton from './DatePickerButton';

const DatePickerExample: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [birthDate, setBirthDate] = useState(new Date(1995, 5, 15)); // Example birth date
  const [periodStartDate, setPeriodStartDate] = useState(new Date());

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleBirthDateChange = (date: Date) => {
    setBirthDate(date);
  };

  const handlePeriodDateChange = (date: Date) => {
    setPeriodStartDate(date);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Custom Date Picker Examples</Text>
      
      {/* General Date Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Select a Date</Text>
        <DatePickerButton
          value={selectedDate}
          onDateChange={handleDateChange}
          placeholder="Choose a date"
        />
      </View>

      {/* Birth Date Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Birth Date</Text>
        <DatePickerButton
          value={birthDate}
          onDateChange={handleBirthDateChange}
          placeholder="Select your birth date"
        />
      </View>

      {/* Period Start Date Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Last Period Start Date</Text>
        <DatePickerButton
          value={periodStartDate}
          onDateChange={handlePeriodDateChange}
          placeholder="When did your last period start?"
        />
      </View>

      {/* Disabled Example */}
      <View style={styles.section}>
        <Text style={styles.label}>Disabled Date Picker</Text>
        <DatePickerButton
          value={new Date()}
          onDateChange={() => {}}
          placeholder="This picker is disabled"
          disabled={true}
        />
      </View>

      {/* Display Selected Dates */}
      <View style={styles.resultsSection}>
        <Text style={styles.resultsTitle}>Selected Dates:</Text>
        <Text style={styles.resultText}>
          General Date: {selectedDate.toLocaleDateString()}
        </Text>
        <Text style={styles.resultText}>
          Birth Date: {birthDate.toLocaleDateString()}
        </Text>
        <Text style={styles.resultText}>
          Period Start: {periodStartDate.toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(3),
  },
  title: {
    fontSize: responsiveFontSize(2.5),
    fontFamily: 'Inter-SemiBold',
    color: '#11181C',
    textAlign: 'center',
    marginBottom: responsiveHeight(3),
  },
  section: {
    marginBottom: responsiveHeight(3),
  },
  label: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Inter-Medium',
    color: '#11181C',
    marginBottom: responsiveHeight(1),
  },
  resultsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: responsiveWidth(4),
    marginTop: responsiveHeight(2),
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: responsiveFontSize(1.9),
    fontFamily: 'Inter-SemiBold',
    color: '#11181C',
    marginBottom: responsiveHeight(1),
  },
  resultText: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: 'Inter-Regular',
    color: '#687076',
    marginBottom: responsiveHeight(0.5),
  },
});

export default DatePickerExample;
