import React, { useEffect, useState } from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import Images from '../assets/images';

interface CalendarBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

const CalendarBottomSheet: React.FC<CalendarBottomSheetProps> = ({ visible, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Reset to current month when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentMonth(new Date());
    }
  }, [visible]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getCyclePhase = (day: number, month: Date) => {
    // Mock cycle phase logic - 30-day cycle
    // In real app this would be based on user data
    if (day >= 1 && day <= 5) return 'periods';
    if (day >= 6 && day <= 14) return 'follicular';
    if (day >= 15 && day <= 17) return 'ovulation';
    if (day >= 18 && day <= 30) return 'luteal';
    return 'luteal'; // Default for any edge cases
  };

  // Check if a specific day has period (mock data - in real app this would be user data)
  const hasPeriodOnDay = (day: number, month: Date) => {
    // Mock: 29-day cycle starting from 1st of every month
    // This is a simplified mock - in real app would track actual cycle dates
    const isFirstDayOfPeriod = day === 1;
    return isFirstDayOfPeriod;
    
    // Real implementation would look something like:
    // return userPeriodData.some(period => 
    //   period.startDate.getDate() === day &&
    //   period.startDate.getMonth() === month.getMonth() &&
    //   period.startDate.getFullYear() === month.getFullYear()
    // );
  };

  // Check if a specific day is during period (for dashed border)
  const isOnPeriod = (day: number, month: Date) => {
    // Mock: Period on 1st-5th of every month
    const isPeriodDay = day >= 1 && day <= 5;
    return isPeriodDay;
  };

  const getCycleColor = (phase: string) => {
    switch (phase) {
      case 'periods': return '#bb4471';
      case 'follicular': return '#ffcf00';
      case 'ovulation': return '#7ae071';
      case 'luteal': return '#d5d5d5';
      default: return '#d5d5d5';
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const renderCalendarDay = (day: number | null, index: number) => {
    if (day === null) {
      return <View key={index} style={styles.emptyDay} />;
    }

    const phase = getCyclePhase(day, currentMonth);
    const color = getCycleColor(phase);
    const isCurrentDay = isToday(day);
    const hasPeriod = hasPeriodOnDay(day, currentMonth);
    const isPeriodDay = isOnPeriod(day, currentMonth);

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayContainer,
          {
            borderColor: color,
            backgroundColor: isCurrentDay ? '#ffd933' : 'transparent',
            borderStyle: isPeriodDay ? 'dashed' : 'solid',
          },
        ]}
      >
        {isCurrentDay ? (
          <View style={styles.todayContainer}>
            <Text style={styles.todayLabel}>Today</Text>
            <Text style={styles.todayNumber}>{day}</Text>
          </View>
        ) : hasPeriod ? (
          <View style={styles.periodContainer}>
            <Text style={styles.periodIcon}>🩸</Text>
          </View>
        ) : (
          <Text style={styles.dayNumber}>{day}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>My Cycle Calendar</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { borderColor: '#bb4471', borderStyle: 'dashed' }]} />
                <Text style={styles.legendText}>Periods</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { borderColor: '#ffcf00' }]} />
                <Text style={styles.legendText}>Follicular</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { borderColor: '#7ae071' }]} />
                <Text style={styles.legendText}>Ovulation</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { borderColor: '#d5d5d5' }]} />
                <Text style={styles.legendText}>Luteal</Text>
              </View>
            </View>
          </View>

          {/* Calendar */}
          <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.calendar}>
              {/* Month Header */}
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                  <Text style={styles.navIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthText}>{getMonthName(currentMonth)}</Text>
                <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                  <Text style={styles.navIcon}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Day Headers */}
              <View style={styles.dayHeaders}>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, index) => (
                  <Text key={index} style={styles.dayHeader}>{day}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {days.map((day, index) => renderCalendarDay(day, index))}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Info */}
          <View style={styles.bottomInfo}>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Perfect time to tackle <Text style={styles.highlightText}>creative tasks</Text> and <Text style={styles.highlightText}>set new goals!</Text>
              </Text>
              <TouchableOpacity style={styles.editButton}>
                <View style={styles.editIconContainer}>
                  <Image 
                    source={Images.EditIcon}
                    style={styles.editIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.editText}>Edit log</Text>
              </TouchableOpacity>
            </View>
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: responsiveHeight(80),
    paddingTop: responsiveHeight(2),
  },
  header: {
    paddingHorizontal: responsiveWidth(6),
    paddingBottom: responsiveHeight(1),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveHeight(1),
  },
  headerTitle: {
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Inter500',
    color: '#000000',
  },
  closeButton: {
    padding: responsiveWidth(1),
  },
  closeIcon: {
    fontSize: responsiveFontSize(2),
    color: '#000000',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: responsiveHeight(0.5),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(1),
  },
  legendDot: {
    width: responsiveWidth(6),
    height: responsiveWidth(6),
    borderRadius: responsiveWidth(3),
    borderWidth: 2,
  },
  legendText: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: 'Inter400',
    color: '#000000',
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: responsiveWidth(4),
  },
  calendar: {
    paddingVertical: responsiveHeight(2),
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(4),
  },
  navButton: {
    padding: responsiveWidth(2),
    borderRadius: responsiveWidth(2),
    backgroundColor: '#f5f5f5',
  },
  navIcon: {
    fontSize: responsiveFontSize(2),
    fontFamily: 'Inter500',
    color: '#000000',
  },
  monthText: {
    fontSize: responsiveFontSize(1.4),
    fontFamily: 'Inter400',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: responsiveHeight(1),
  },
  dayHeader: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: 'Inter400',
    color: 'rgba(0, 0, 0, 0.5)',
    width: responsiveWidth(12),
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: responsiveWidth(1.2),
  },
  emptyDay: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    marginBottom: responsiveHeight(0.5),
  },
  dayContainer: {
    width: responsiveWidth(12),
    height: responsiveWidth(12),
    borderRadius: responsiveWidth(6),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveHeight(0.5),
  },
  dayNumber: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: 'Inter400',
    color: '#000000',
  },
  todayContainer: {
    alignItems: 'center',
  },
  todayLabel: {
    fontSize: responsiveFontSize(1),
    fontFamily: 'Rubik400',
    color: '#000000',
    marginBottom: 2,
  },
  todayNumber: {
    fontSize: responsiveFontSize(1.6),
    fontFamily: 'Inter400',
    color: '#000000',
  },
  periodContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodIcon: {
    fontSize: responsiveFontSize(1.8),
  },
  bottomInfo: {
    paddingHorizontal: responsiveWidth(6),
    paddingVertical: responsiveHeight(2),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 245, 207, 0.4)',
    borderColor: '#ffd933',
    borderWidth: 1,
    borderRadius: 12,
    padding: responsiveWidth(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoText: {
    fontSize: responsiveFontSize(1.2),
    fontFamily: 'Inter400',
    color: '#000000',
    flex: 1,
    marginRight: responsiveWidth(4),
  },
  highlightText: {
    fontFamily: 'Inter500',
    color: '#bb4471',
  },
  editButton: {
    alignItems: 'center',
  },
  editIconContainer: {
    width: responsiveWidth(9),
    height: responsiveWidth(9),
    borderRadius: responsiveWidth(4.5),
    backgroundColor: '#bb4471',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveHeight(0.5),
    shadowColor: '#ffb6d2',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editIcon: {
    width: responsiveWidth(4),
    height: responsiveWidth(4),
    tintColor: '#ffffff',
  },
  editText: {
    fontSize: responsiveFontSize(1),
    fontFamily: 'Inter500',
    color: '#bb4471',
  },
});

export default CalendarBottomSheet;
