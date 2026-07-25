import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';

const { width: screenWidth } = Dimensions.get('window');

interface SimpleDatePickerProps {
  value: Date;
  onDateChange: (date: Date) => void;
  visible: boolean;
  onClose: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
}

const SimpleDatePicker: React.FC<SimpleDatePickerProps> = ({
  value,
  onDateChange,
  visible,
  onClose,
  minimumDate = new Date(1900, 0, 1),
  maximumDate = new Date(2100, 11, 31),
  placeholder = "Select Date"
}) => {
  const [selectedDate, setSelectedDate] = useState(value);
  const [currentMonth, setCurrentMonth] = useState(value.getMonth());
  const [currentYear, setCurrentYear] = useState(value.getFullYear());

  useEffect(() => {
    if (visible) {
      // Ensure we're showing the correct month/year for the selected date
      const targetMonth = value.getMonth();
      const targetYear = value.getFullYear();
      
      setSelectedDate(value);
      setCurrentMonth(targetMonth);
      setCurrentYear(targetYear);
      
      console.log('Calendar opened with date:', value.toDateString(), 'Month:', targetMonth, 'Year:', targetYear);
    }
  }, [visible, value]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    // Only check the selectedDate state, not the initial value
    // This ensures only one date can be selected at a time
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    onDateChange(selectedDate);
    onClose();
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: React.ReactElement[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelectedDay = isSelected(day);
      const isTodayDay = isToday(day);
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isSelectedDay && styles.selectedDay,
            isTodayDay && !isSelectedDay && styles.todayDay
          ]}
          onPress={() => handleDateSelect(day)}
        >
          <Text style={[
            styles.dayText,
            isTodayDay && !isSelectedDay && styles.todayDayText,
            isSelectedDay && styles.selectedDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Date</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthYearText}>
              {months[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.dayHeaderText}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>

          {/* Selected Date Display */}
          <View style={styles.selectedDateContainer}>
            <Text style={styles.selectedDateText}>
              Selected: {selectedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '80%',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(3),
  },
  cancelButtonText: {
    fontSize: responsiveFontSize(1.7),
    color: '#333333',
    fontFamily: 'Inter400',
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.1),
    fontFamily: 'Inter500',
    color: '#333333',
  },
  confirmButton: {
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(3),
  },
  confirmButtonText: {
    fontSize: responsiveFontSize(1.7),
    color: '#c17ec9',
    fontFamily: 'Inter500',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: responsiveFontSize(2.5),
    color: '#333333',
    fontFamily: 'Inter500',
  },
  monthYearText: {
    fontSize: responsiveFontSize(2.2),
    fontFamily: 'Inter500',
    color: '#333333',
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: responsiveWidth(2),
    marginBottom: responsiveHeight(1),
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Inter400',
    color: '#666666',
    paddingVertical: responsiveHeight(1),
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: responsiveWidth(2),
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveHeight(0.5),
  },
  selectedDay: {
    backgroundColor: '#c17ec9',
    borderRadius: 20,
  },
  todayDay: {
    borderWidth: 1,
    borderColor: '#c17ec9',
    borderRadius: 20,
  },
  dayText: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: 'Inter400',
    color: '#333333',
  },
  selectedDayText: {
    color: '#ffffff',
    fontFamily: 'Inter500',
  },
  todayDayText: {
    color: '#c17ec9',
    fontFamily: 'Inter500',
  },
  selectedDateContainer: {
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: responsiveHeight(2),
  },
  selectedDateText: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Inter400',
    color: '#333333',
    textAlign: 'center',
  },
});

export default SimpleDatePicker;
