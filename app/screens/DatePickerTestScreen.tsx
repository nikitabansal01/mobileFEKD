import BackButton from '@/components/BackButton';
import DatePickerButton from '@/components/DatePickerButton';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';

const DatePickerTestScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [birthDate, setBirthDate] = useState(new Date(1995, 5, 15));
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
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => {}} />
        <Text style={styles.headerTitle}>Custom Date Picker Test</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Custom Date Picker Examples</Text>
        <Text style={styles.subtitle}>
          This shows how the custom DatePicker looks and works on both iOS and Android
        </Text>
        
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

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>✨ Features:</Text>
          <Text style={styles.infoText}>• Same appearance on iOS and Android</Text>
          <Text style={styles.infoText}>• Matches your app's theme colors</Text>
          <Text style={styles.infoText}>• Custom modal with smooth animations</Text>
          <Text style={styles.infoText}>• Easy to cancel without changing date</Text>
          <Text style={styles.infoText}>• Responsive design for all screen sizes</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    flex: 1,
    fontSize: responsiveFontSize(2.2),
    fontFamily: 'Inter-SemiBold',
    color: '#11181C',
    textAlign: 'center',
  },
  headerSpacer: {
    width: responsiveWidth(10),
  },
  content: {
    flex: 1,
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(3),
  },
  title: {
    fontSize: responsiveFontSize(2.5),
    fontFamily: 'Inter-SemiBold',
    color: '#11181C',
    textAlign: 'center',
    marginBottom: responsiveHeight(1),
  },
  subtitle: {
    fontSize: responsiveFontSize(1.7),
    fontFamily: 'Inter-Regular',
    color: '#687076',
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
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: responsiveWidth(4),
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(3),
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: responsiveFontSize(1.9),
    fontFamily: 'Inter-SemiBold',
    color: '#11181C',
    marginBottom: responsiveHeight(1),
  },
  infoText: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: 'Inter-Regular',
    color: '#687076',
    marginBottom: responsiveHeight(0.5),
  },
});

export default DatePickerTestScreen;
