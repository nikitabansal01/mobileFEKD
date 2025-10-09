import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';

const { width: screenWidth } = Dimensions.get('window');

interface CustomDatePickerProps {
  /** Selected date */
  value: Date;
  /** Function called when date changes */
  onDateChange: (date: Date) => void;
  /** Whether the picker is visible */
  visible: boolean;
  /** Function to close the picker */
  onClose: () => void;
  /** Minimum selectable date */
  minimumDate?: Date;
  /** Maximum selectable date */
  maximumDate?: Date;
  /** Placeholder text */
  placeholder?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onDateChange,
  visible,
  onClose,
  minimumDate = new Date(1900, 0, 1),
  maximumDate = new Date(2100, 11, 31),
  placeholder = "Select Date"
}) => {
  const [selectedYear, setSelectedYear] = useState(value.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(value.getMonth());
  const [selectedDay, setSelectedDay] = useState(value.getDate());

  // Scroll references for auto-scrolling to selected values
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);
  
  // Debug: Log the years array to understand the range
  console.log('Years array range:', years[0], 'to', years[years.length - 1]);
  console.log('Years array length:', years.length);
  console.log('Current year:', currentYear);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (visible) {
      setSelectedYear(value.getFullYear());
      setSelectedMonth(value.getMonth());
      setSelectedDay(value.getDate());
      
      // Auto-scroll to selected values after a short delay to ensure the picker is rendered
      setTimeout(() => {
        console.log('Auto-scrolling to selected values:', {
          month: selectedMonth,
          day: selectedDay,
          year: selectedYear
        });
        
        // Calculate item height more accurately based on actual styles
        // Using a more reasonable item height that accounts for text size and spacing
        const itemHeight = 50; // This should work well for most cases
        
        // Scroll to selected month
        const monthScrollY = selectedMonth * itemHeight;
        monthScrollRef.current?.scrollTo({
          y: monthScrollY,
          animated: true,
        });
        console.log('Scrolling to month:', selectedMonth, 'at position:', monthScrollY);
        
        // Scroll to selected day
        const dayScrollY = (selectedDay - 1) * itemHeight;
        dayScrollRef.current?.scrollTo({
          y: dayScrollY,
          animated: true,
        });
        console.log('Scrolling to day:', selectedDay, 'at position:', dayScrollY);
        
        // Try a much simpler approach - just scroll to the middle and then to the year
        console.log('Simple year scrolling for:', selectedYear);
        
        // First scroll to middle of the year range
        const middleIndex = Math.floor(years.length / 2);
        const middleScrollY = middleIndex * 50;
        console.log('Scrolling to middle first:', middleScrollY);
        yearScrollRef.current?.scrollTo({
          y: middleScrollY,
          animated: false,
        });
        
        // Then scroll to the actual year
        setTimeout(() => {
          const yearIndex = years.findIndex(year => year === selectedYear);
          console.log('Year index found:', yearIndex);
          
          if (yearIndex !== -1) {
            const scrollY = yearIndex * 50;
            console.log('Scrolling to year position:', scrollY);
            yearScrollRef.current?.scrollTo({
              y: scrollY,
              animated: true,
            });
          } else {
            // If year not found, try a different calculation
            const startYear = years[0];
            const yearDiff = selectedYear - startYear;
            const calcScrollY = yearDiff * 50;
            console.log('Using calculated position:', calcScrollY);
            yearScrollRef.current?.scrollTo({
              y: calcScrollY,
              animated: true,
            });
          }
        }, 300);
      }, 300); // Increased delay to ensure proper rendering
      
      // Fallback scroll after a longer delay in case the first one doesn't work
      setTimeout(() => {
        console.log('Fallback scroll attempt');
        const itemHeight = 50; // Consistent with main scroll calculation
        
        // Fallback scroll to month
        monthScrollRef.current?.scrollTo({
          y: selectedMonth * itemHeight,
          animated: true,
        });
        
        // Fallback scroll to day
        dayScrollRef.current?.scrollTo({
          y: (selectedDay - 1) * itemHeight,
          animated: true,
        });
        
        // Try different item heights for year scrolling
        console.log('Fallback year scrolling for:', selectedYear);
        const yearIndex = years.findIndex(year => year === selectedYear);
        console.log('Fallback year index:', yearIndex);
        
        if (yearIndex !== -1) {
          // Try different item heights
          const scrollY1 = yearIndex * 40; // Smaller height
          const scrollY2 = yearIndex * 60; // Larger height
          const scrollY3 = yearIndex * 50; // Original height
          
          console.log('Trying different heights:', { scrollY1, scrollY2, scrollY3 });
          
          // Try the smaller height first
          yearScrollRef.current?.scrollTo({
            y: scrollY1,
            animated: false,
          });
          
          // Then try the larger height
          setTimeout(() => {
            yearScrollRef.current?.scrollTo({
              y: scrollY2,
              animated: false,
            });
          }, 100);
          
          // Finally try the original height
          setTimeout(() => {
            yearScrollRef.current?.scrollTo({
              y: scrollY3,
              animated: true,
            });
          }, 200);
        }
      }, 600);
    }
  }, [visible, value, selectedMonth, selectedDay, selectedYear]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Calculate precise scroll position for year
  const calculateYearScrollPosition = (targetYear: number) => {
    const startYear = years[0];
    const yearIndex = targetYear - startYear;
    const clampedIndex = Math.max(0, Math.min(yearIndex, years.length - 1));
    
    // Use consistent item height with other calculations
    const actualItemHeight = 50;
    const scrollPosition = clampedIndex * actualItemHeight;
    
    console.log('Year scroll calculation:', {
      targetYear,
      startYear,
      yearIndex,
      clampedIndex,
      scrollPosition,
      yearsLength: years.length,
      actualItemHeight,
      yearsArray: years.slice(0, 10), // Show first 10 years
      yearsArrayEnd: years.slice(-10) // Show last 10 years
    });
    
    return scrollPosition;
  };

  const getDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    
    // Validate date constraints
    if (newDate < minimumDate || newDate > maximumDate) {
      return;
    }
    
    onDateChange(newDate);
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderPickerColumn = (
    data: (string | number)[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    label: string,
    scrollRef?: React.RefObject<ScrollView>
  ) => (
    <View style={styles.pickerColumn}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.pickerScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pickerContent}
      >
        {data.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.pickerItem,
              selectedValue === index && styles.selectedPickerItem
            ]}
            onPress={() => onValueChange(index)}
          >
            <Text style={[
              styles.pickerItemText,
              selectedValue === index && styles.selectedPickerItemText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

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

          {/* Date Display */}
          <View style={styles.dateDisplay}>
            <Text style={styles.dateDisplayText}>
              {formatDate(new Date(selectedYear, selectedMonth, selectedDay))}
            </Text>
          </View>

          {/* Picker */}
          <View style={styles.pickerContainer}>
            {renderPickerColumn(
              months,
              selectedMonth,
              setSelectedMonth,
              'Month',
              monthScrollRef
            )}
            {renderPickerColumn(
              getDays(),
              selectedDay - 1,
              (index) => setSelectedDay(index + 1),
              'Day',
              dayScrollRef
            )}
            {renderPickerColumn(
              years,
              selectedYear - years[0],
              (index) => setSelectedYear(years[index]),
              'Year',
              yearScrollRef
            )}
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
    paddingBottom: 34, // Safe area for iPhone
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
  dateDisplay: {
    alignItems: 'center',
    paddingVertical: responsiveHeight(2),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateDisplayText: {
    fontSize: responsiveFontSize(2.3),
    fontFamily: 'Inter400',
    color: '#333333',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: responsiveHeight(25),
    paddingHorizontal: responsiveWidth(2),
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: responsiveWidth(1),
  },
  columnLabel: {
    textAlign: 'center',
    fontSize: responsiveFontSize(1.5),
    fontFamily: 'Inter400',
    color: '#333333',
    marginBottom: responsiveHeight(1),
  },
  pickerScroll: {
    flex: 1,
  },
  pickerContent: {
    paddingVertical: responsiveHeight(2),
  },
  pickerItem: {
    paddingVertical: responsiveHeight(1.2),
    paddingHorizontal: responsiveWidth(2),
    marginVertical: responsiveHeight(0.3),
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedPickerItem: {
    backgroundColor: '#c17ec9',
  },
  pickerItemText: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: 'Inter400',
    color: '#333333',
  },
  selectedPickerItemText: {
    color: '#ffffff',
    fontFamily: 'Inter500',
  },
});

export default CustomDatePicker;
