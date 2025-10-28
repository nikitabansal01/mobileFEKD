import Images from '@/assets/images';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import Svg, { Line } from 'react-native-svg';
import { FONT_FAMILIES as FONTS } from '../../constants/fonts';

const { width: screenWidth } = Dimensions.get('window');

const InsightScreen = () => {
  const navigation = useNavigation();
  const [selectedMonth, setSelectedMonth] = useState('Month');
  const cycleChartScrollRef = useRef<ScrollView>(null);

  // Disable back gesture when using horizontal scrolling
  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        gestureEnabled: false,
      });

      return () => {
        navigation.setOptions({
          gestureEnabled: true,
        });
      };
    }, [navigation])
  );


  // Auto-scroll to day 23 when page loads
  useEffect(() => {
    if (cycleChartScrollRef.current) {
      setTimeout(() => {
        cycleChartScrollRef.current?.scrollTo({
          x: (22 * 40) - 100, // Day 23 position
          animated: true
        });
      }, 1000); // Delay to ensure chart is rendered
    }
  }, []);

  const getCharacterImage = (title: string) => {
    switch (title) {
      case 'Progesterone':
        return require('../../assets/images/hormoneBuddy/ProgesteroneBothHand.png');
      case 'Testosterone':
        return require('../../assets/images/hormoneBuddy/TestosteroneBothHand.png');
      case 'Cortisol':
        return require('../../assets/images/hormoneBuddy/CortisolBothHand.png');
      default:
        return require('../../assets/images/hormoneBuddy/ProgesteroneBothHand.png');
    }
  };

  const getGradientColors = (color: string): [string, string] => {
    // Handle RGB format
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return [
        `rgba(${r}, ${g}, ${b}, 0.25)`,
        `rgba(${r}, ${g}, ${b}, 0)`
      ];
    }

    // Convert hex color to RGB for gradient
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb = hexToRgb(color);
    if (!rgb) return ['rgba(162, 154, 234, 0.25)', 'rgba(162, 154, 234, 0)'];

    return [
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`
    ];
  };


  const renderPrevButton = () => (
    <TouchableOpacity style={styles.navButton}>
      <Ionicons name="chevron-back" size={24} color="#6F6F6F" />
    </TouchableOpacity>
  );

  const renderNextButton = () => (
    <TouchableOpacity style={styles.navButton}>
      <Ionicons name="chevron-forward" size={24} color="#6F6F6F" />
    </TouchableOpacity>
  );

  const renderMonthSelector = () => (
    <View style={styles.monthSelector}>
      <Text style={styles.monthText}>August 2025</Text>
      <TouchableOpacity style={styles.monthDropdown}>
        <Text style={styles.monthDropdownText}>{selectedMonth}</Text>
        <Ionicons name="chevron-down" size={12} color="#404040" />
      </TouchableOpacity>
    </View>
  );

  const renderProgressChart = () => (
    <View style={styles.progressCard}>
      <Text style={styles.progressText}>
        You reported <Text style={styles.highlightText}>3 more clear-skin days</Text> compared to last month
      </Text>

      <View style={styles.chartContainer}>

        {/* Bar Chart with Line Graph - Matching Figma Design */}
        <View style={styles.chartVisualization}>
          <View style={styles.chartVisualizationContainer}>
            {/* Bars with equal height but different widths */}
            <View style={styles.barsContainer}>
              {/* Menstrual Bar */}
              <View style={[styles.chartBar, styles.standardBar]}>
                <Text style={styles.barLabel}>Menstrual</Text>
              </View>

              {/* Follicular Bar */}
              <View style={[styles.chartBar, styles.standardBar]}>
                <Text style={styles.barLabel}>Follicular</Text>
              </View>

              {/* Ovulation Bar */}
              <View style={[styles.chartBar, styles.standardBar]}>
                <Text style={styles.barLabel}>Ovulation</Text>
              </View>

              {/* Luteal Bar - Wider */}
              <View style={[styles.chartBar, styles.wideBar]}>
                <Text style={styles.barLabel}>Luteal</Text>
              </View>
            </View>

            {/* Line Graph Overlay - Matching Figma Design */}
            <View style={styles.lineGraphOverlay}>
              <View style={styles.lineGraph}>
                {/* Connecting lines between data points */}
                <View style={[styles.lineSegment, { left: 28, top: 33, width: 70, transform: [{ rotate: '18deg' }] }]} />
                <View style={[styles.lineSegment, { left: 92, top: 53, width: 70, transform: [{ rotate: '16deg' }] }]} />
                <View style={[styles.lineSegment, { left: 156, top: 48, width: 88, transform: [{ rotate: '-20deg' }] }]} />
                <View style={[styles.lineSegment, { left: 240, top: 37, width: 50, transform: [{ rotate: '15deg' }] }]} />

                {/* Data points positioned to match Figma */}
                <View style={[styles.dataPoint, { left: 28, top: 20 }]} />
                <View style={[styles.dataPoint, { left: 92, top: 40 }]} />
                <View style={[styles.dataPoint, { left: 156, top: 60 }]} />
                <View style={[styles.dataPoint, { left: 240, top: 30 }]} />
                <View style={[styles.dataPoint, { left: 284, top: 40 }]} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.chartLabels}>
          <Text style={styles.chartLabel}>Aug{'\n'}Wk 1</Text>
          <Text style={styles.chartLabel}>Aug{'\n'}Wk 2</Text>
          <Text style={styles.chartLabel}>Aug{'\n'}Wk 3</Text>
          <Text style={styles.chartLabel}>Aug{'\n'}Wk 4</Text>
          <Text style={styles.chartLabel}>Aug{'\n'}Wk 5</Text>
        </View>
      </View>
    </View>
  );

  const renderHormoneQuest = (title: string, description: string, progress: number, total: number, color: string, progessColor: string, bgColor: string) => (
    <LinearGradient
      colors={getGradientColors(color)}
      start={{ x: 0.59, y: 0.18 }}
      end={{ x: 0.41, y: 0.82 }}
      style={styles.hormoneQuest}
    >
      <View style={styles.hormoneQuestContent}>
        <View style={styles.hormoneInfo}>
          <Text style={[styles.hormoneTitle, { color }]}>{title}</Text>
          <Text style={styles.hormoneDescription}>{description}</Text>
        </View>
        <View style={styles.actionPlanHormoneCharacter}>
          {/* Character illustration */}
          <Image
            source={getCharacterImage(title)}
            style={styles.actionPlanCharacterImage}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: progessColor, width: `${(progress / total) * 100}%` }]} />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.hormoneProgressText}>{progress}/{total} actions completed</Text>
          <Ionicons name="chevron-forward" size={16} color="#949494" />
        </View>
      </View>
    </LinearGradient>
  );

  const renderActionItem = (emoji: string, label: string) => (
    <View style={styles.actionItem}>
      <View style={styles.actionIcon}>
        <Text style={styles.actionEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );

  const renderDivider = (text: string) => (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLineContainer}>
        <Svg width="100%" height="1">
          <Line
            x1="0"
            y1="0"
            x2="100%"
            y2="0"
            stroke="#CFCFCF"
            strokeWidth="1"
            strokeDasharray="4,2"
          />
        </Svg>
      </View>
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.dividerLineContainer}>
        <Svg width="100%" height="1">
          <Line
            x1="0"
            y1="0"
            x2="100%"
            y2="0"
            stroke="#CFCFCF"
            strokeWidth="1"
            strokeDasharray="4,2"
          />
        </Svg>
      </View>
    </View>
  );

  const renderCycleDivider = (text: string) => (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLineContainer}>
        <View style={styles.dividerLine} />
      </View>
      <Text style={styles.cycleDividerText}>{text}</Text>
      <View style={styles.dividerLineContainer}>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Insights on top concerns</Text>
        </View>

        <View style={styles.titleSection}>
          {renderPrevButton()}
          <Text style={styles.mainTitle}>Acne</Text>
          {renderNextButton()}
        </View>

        {renderMonthSelector()}

        {renderProgressChart()}

        {renderDivider('Your hormone quests till now')}

        {/* <View style={styles.concernCard}>
          <View style={styles.concernHeader}>
            <View style={styles.concernDot} />
            <Text style={styles.concernTitle}>Acne can potentially worsen</Text>
          </View>

       

        </View>
        <View style={{ flex: 1 }}>
          <FlatList
            horizontal
            data={[
              {
                id: 'c1x',
                title: 'Lower calming support',
                description: 'less skin-calming effect, so acne can worsen',
                color: '#FF87B4',
                arrow: '↓',
                bgColor: 'rgba(251, 144, 187, 0.12)',
                image: Images.EstrogenBothHand,
              },
              {
                id: 'c2x',
                title: 'Oil production shifts',
                description: 'Oil and inflammation can rise; watch pores',
                color: '#0E8FC1',
                arrow: '↑↓',
                bgColor: 'rgba(203, 240, 255, 0.25)',
                image: Images.ProgesteroneBothHand,
              }
            ]}
            keyExtractor={(item) => item.id}
            // showsHorizontalScrollIndicator={true}
            // contentContainerStyle={styles.concernSliderContainer}
            // ItemSeparatorComponent={() => <View style={{ flex: 1, width: responsiveWidth(3) }} />}
            snapToInterval={responsiveWidth(100)}
            decelerationRate="fast"
            snapToAlignment="start"
            renderItem={({ item }) => (
              <TouchableWithoutFeedback onPress={() => { }}>
                <View>
                 
                  <Text style={styles.concernSlideDraft}>{item.description}</Text>
                </View>
              </TouchableWithoutFeedback>
            )}
          />
        </View> */}

        <View style={styles.actionPlanCard}>
          <Text style={styles.actionPlanText}>
            You completed <Text style={styles.highlightText}>80%</Text> of your action plan and your <Text style={styles.highlightText}>acne shifted from 7 → 5</Text> on the scale.
          </Text>


          <View style={styles.hormoneQuestsContainer}>

            <FlatList
              horizontal
              data={[

                {
                  id: 'list2',
                  title: 'Testosterone',
                  description: 'Balanced levels support clearer skin by regulating oil production',
                  progress: 11,
                  total: 16,
                  color: '#a29aea',
                  progessColor: '#A29AEA',
                  bgColor: 'rgba(162, 154, 234, 0.15)'
                },
                {
                  id: 'list1',
                  title: 'Progesterone',
                  description: 'Balanced levels can reduce inflammation and calm breakouts',
                  progress: 10,
                  total: 14,
                  color: '#0188BD',
                  progessColor: '#CBF0FF',
                  bgColor: 'rgb(203, 240, 255)'
                },
                {
                  id: 'list3',
                  title: 'Cortisol',
                  description: 'Stable levels supports calm, reduces stress-related flare-ups',
                  progress: 1,
                  total: 5,
                  color: '#ffa569',
                  progessColor: '#FFA569',
                  bgColor: 'rgb(255, 165, 105)'
                },

              ]}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hormoneQuestsList}
              ItemSeparatorComponent={() => <View style={styles.hormoneQuestSeparator} />}
              snapToInterval={responsiveWidth(77.5)}
              decelerationRate="fast"
              snapToAlignment="start"
              renderItem={({ item }) =>
                <LinearGradient
                  colors={getGradientColors(item.bgColor)}
                  start={{ x: 0.4, y: 0.18 }}
                  end={{ x: 0.5, y: 1.5 }}
                  style={styles.hormoneQuest}
                >
                  <View style={styles.hormoneQuestContent}>
                    <View style={styles.hormoneInfo}>
                      <Text style={[styles.hormoneTitle, { color: item.color }]}>{item.title}</Text>
                      <Text style={styles.hormoneDescription}>{item.description}</Text>
                    </View>
                    <View style={styles.actionPlanHormoneCharacter}>
                      {/* Character illustration */}
                      <Image
                        source={getCharacterImage(item.title)}
                        style={styles.actionPlanCharacterImage}
                        resizeMode="contain"
                      />
                    </View>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { backgroundColor: item.progessColor, width: `${(item.progress / item.total) * 100}%` }]} />
                    </View>
                    <View style={styles.progressInfo}>
                      <Text style={styles.hormoneProgressText}>{item.progress}/{item.total} actions completed</Text>
                      <Ionicons name="chevron-forward" size={16} color="#949494" />
                    </View>
                  </View>
                </LinearGradient>
              }

            />
          </View>
        </View>

        {renderDivider("What doesn't work for you")}

        <View style={styles.actionItemsContainer}>
          {renderActionItem('🍞', 'Carb-heavy meals')}
          {renderActionItem('😰', 'Chronic\nStress')}
          {renderActionItem('☕️', 'Caffeine')}
          {renderActionItem('🥛', 'Dairy')}

        </View>

        <Text style={styles.disclaimerText}>* Based on your weekly check-ins</Text>

        {renderCycleDivider('Your Cycle phase predictions')}

        <View style={styles.cycleCard}>
          <Text style={styles.cycleText}>
            You are in your <Text style={styles.highlightText}>Luteal phase (Day 15-28)</Text>
          </Text>

          {/* 28-Day Hormone Cycle Chart */}

          <ScrollView
            // ref={cycleChartScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cyclePhaseChartScrollView}
          >
            <View style={styles.cyclePhaseChartScrollContent}>
              <View style={styles.chartWithOverlay}>
                {/* Bar Chart Background */}
                <BarChart
                  data={[
                    {
                      value: 100,
                      frontColor: '#F7F7FF',
                      spacing: 4,
                      barWidth: 5 * 40,
                      topLabelComponent: () => (
                        <Text style={styles.barLabelText}>Menstrual</Text>
                      )
                    },
                    {
                      value: 100,
                      frontColor: '#F7F7FF',
                      spacing: 4,
                      barWidth: 7 * 40,
                      topLabelComponent: () => (
                        <Text style={styles.barLabelText}>Follicular</Text>
                      )
                    },
                    {
                      value: 100,
                      frontColor: '#F7F7FF',
                      spacing: 4,
                      barWidth: 2 * 40,
                      topLabelComponent: () => (
                        <Text style={styles.barLabelText}>Ovulation</Text>
                      )
                    },
                    {
                      value: 100,
                      frontColor: '#F7F7FF',
                      spacing: 4,
                      barWidth: 14 * 40,
                      topLabelComponent: () => (
                        <Text style={styles.barLabelText}>Luteal</Text>
                      )
                    },
                  ]}
                  height={200}
                  noOfSections={1}
                  yAxisThickness={0}
                  xAxisThickness={0}
                  hideRules
                  hideYAxisText={true}
                  barBorderRadius={8}
                  hideAxesAndRules={true}
                  isAnimated
                  animationDuration={800}
                  spacing={0}
                />

                {/* Today's vertical line - Day 23 */}
                <View style={styles.todayVerticalLine}>
                  <View style={styles.todayLine} />
                </View>

                {/* Hormone characters at today's intersection points */}
                <View style={styles.chartHormoneCharacters}>
                  {/* Progesterone character at day 23 value */}
                  <View style={[styles.chartHormoneCharacter, {
                    left: 14 + (44 * 20) + 10 - 21, // Center on day 23 line (index 44)
                    top: 200 - (5.5 * 200 / 10) - 21 // center vertically based on new data
                  }]}>
                    <Image
                      source={require('../../assets/images/hormoneBuddy/ProgesteroneBothHand.png')}
                      style={styles.chartCharacterImage}
                      resizeMode="contain"
                    />
                  </View>
                  {/* Estrogen character at day 23 value */}
                  <View style={[styles.chartHormoneCharacter, {
                    left: 14 + (44 * 20) + 10 - 21, // Center on day 23 line (index 44)
                    top: 200 - (3.8 * 200 / 10) - 21 // center vertically based on new data
                  }]}>
                    <Image
                      source={require('../../assets/images/hormoneBuddy/EstrogenBothHand.png')}
                      style={styles.chartCharacterImage}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Testosterone character at day 23 value */}
                  <View style={[styles.chartHormoneCharacter, {
                    left: 14 + (44 * 20) + 10 - 21, // Center on day 23 line (index 44)
                    top: 200 - (0.6 * 200 / 10) - 21 // center vertically based on new data
                  }]}>
                    <Image
                      source={require('../../assets/images/hormoneBuddy/TestosteroneBothHand.png')}
                      style={styles.chartCharacterImage}
                      resizeMode="contain"
                    />
                  </View>

                  {/* LHCharacterBothHand */}
                  {/* <View style={[styles.chartHormoneCharacter, {
                    left: 14 + (20 * 40) + 20 - 21, // Center on day 21 line (42px icon)
                    top: 200 - (0.6 * 200 / 10) - 21 // center vertically based on new data
                  }]}>
                    <Image
                      source={require('../../assets/images/hormoneBuddy/LHCharacterBothHand.png')}
                      style={styles.chartCharacterImage}
                      resizeMode="contain"
                    />
                  </View> */}


                </View>

                {/* Line Chart Overlay - Positioned absolutely on top */}
                <View style={styles.lineChartOverlay}>
                  {/* <LineChart
                    data={[
                      // Progesterone (Blue) - Half-day data points (56 total)
                      // Day 1
                      { value: 0.3 }, { value: 0.3 },
                      // Day 2
                      { value: 0.3 }, { value: 0.3 },
                      // Day 3
                      { value: 0.3 }, { value: 0.3 },
                      // Day 4
                      { value: 0.3 }, { value: 0.3 },
                      // Day 5
                      { value: 0.3 }, { value: 0.3 },
                      // Day 6
                      { value: 0.3 }, { value: 0.3 },
                      // Day 7
                      { value: 0.3 }, { value: 0.3 },
                      // Day 8
                      { value: 0.3 }, { value: 0.3 },
                      // Day 9
                      { value: 0.3 }, { value: 0.3 },
                      // Day 10
                      { value: 0.3 }, { value: 0.3 },
                      // Day 11
                      { value: 0.3 }, { value: 0.3 },
                      // Day 12
                      { value: 0.3 }, { value: 0.3 },
                      // Day 13
                      { value: 0.4 }, { value: 0.6 },
                      // Day 14
                      { value: 0.8 }, { value: 1.2 },
                      // Day 15
                      { value: 1.6 }, { value: 2.4 },
                      // Day 16
                      { value: 3.2 }, { value: 4.4 },
                      // Day 17
                      { value: 5.1 }, { value: 5.9 },
                      // Day 18
                      { value: 6.2 }, { value: 6.6 },
                      // Day 19
                      { value: 6.8 }, { value: 7.0 },
                      // Day 20
                      { value: 7.1 }, { value: 7.2 },
                      // Day 21
                      { value: 7.0 }, { value: 6.8 },
                      // Day 22
                      { value: 6.5 }, { value: 6.2 },
                      // Day 23
                      { value: 5.8 }, { value: 5.4 },
                      // Day 24
                      { value: 5.0 }, { value: 4.6 },
                      // Day 25
                      { value: 4.2 }, { value: 3.8 },
                      // Day 26
                      { value: 3.4 }, { value: 3.0 },
                      // Day 27
                      { value: 2.6 }, { value: 2.2 },
                      // Day 28
                      { value: 1.8 }, { value: 1.4 },
                      // Day 29
                      { value: 1.0 }, { value: 0.6 },
                      // Day 30
                      { value: 0.4 }, { value: 0.3 }
                    ]}
                    data2={[
                      // Estrogen (Pink) - Half-day data points (56 total)
                      // Day 1
                      { value: 1.3 }, { value: 1.3 },
                      // Day 2
                      { value: 1.3 }, { value: 1.3 },
                      // Day 3
                      { value: 1.3 }, { value: 1.3 },
                      // Day 4
                      { value: 1.33 }, { value: 1.351 },
                      // Day 5
                      { value: 1.4 }, { value: 1.450 },
                      // Day 6
                      { value: 1.5 }, { value: 1.550 },
                      // Day 7
                      { value: 1.6 }, { value: 1.650 },
                      // Day 8
                      { value: 1.7 }, { value: 1.75 },
                      // Day 9
                      { value: 1.82 }, { value: 1.89},
                      // Day 10
                      { value: 2.1 }, { value: 2.3 },
                      // Day 11
                      { value: 2.6 }, { value: 3.0 },
                      // Day 12
                      { value: 3.38 }, { value: 4.0 },
                      // Day 13
                      { value: 5.5 }, { value: 8.3 },
                      // Day 14
                      { value: 8.3 }, { value: 5.5 },
                      // Day 15
                      { value: 2.5 }, { value: 2.0 },
                      // Day 16
                      { value: 2.75 }, { value: 3.5 },
                      // Day 17
                      { value: 4 }, { value: 4.5 },
                      // Day 18
                      { value: 4.85 }, { value: 5.15 },
                      // Day 19
                      { value: 5.35 }, { value: 5.55},
                      // Day 20
                      { value: 5.65 }, { value: 5.6 },
                      // Day 21
                      { value: 5.5 }, { value: 5.2 },
                      // Day 22
                      { value: 4.9 }, { value: 4.6 },
                      // Day 23
                      { value: 4.2 }, { value: 3.85 },
                      // Day 24
                      { value: 3.6 }, { value: 3.25 },
                      // Day 25
                      { value: 3 }, { value: 2.65 },
                      // Day 26
                      { value: 2.25 }, { value: 1.98 },
                      // Day 27
                      { value: 1.8 }, { value: 1.7 },
                      // Day 28
                      { value: 1.8 }, { value: 2 },
                      // Day 29
                      { value: 2.2 }, { value: 2.0 },
                      // Day 30
                      { value: 1.6 }, { value: 1.3 }
                    ]}
                    data3={[
                      // Testosterone (Purple) - Half-day data points (56 total)
                      // Day 1
                      { value: 0.8 }, { value: 0.8 },
                      // Day 2
                      { value: 0.8 }, { value: 0.8 },
                      // Day 3
                      { value: 0.8 }, { value: 0.8 },
                      // Day 4
                      { value: 0.8 }, { value: 0.8 },
                      // Day 5
                      { value: 0.8 }, { value: 0.8 },
                      // Day 6
                      { value: 0.8 }, { value: 0.8 },
                      // Day 7
                      { value: 0.8 }, { value: 0.8 },
                      // Day 8
                      { value: 0.8 }, { value: 0.8 },
                      // Day 9
                      { value: 0.8 }, { value: 0.8 },
                      // Day 10
                      { value: 0.8 }, { value: 0.8 },
                      // Day 11
                      { value: 0.8 }, { value: 0.8 },
                      // Day 12
                      { value: 0.8 }, { value: 0.9 },
                      // Day 13
                      { value: 1.0 }, { value: 1.2 },
                      // Day 14
                      { value: 1.5 }, { value: 2.0 },
                      // Day 15
                      { value: 2.5 }, { value: 2.0 },
                      // Day 16
                      { value: 1.5 }, { value: 1.2 },
                      // Day 17
                      { value: 1.0 }, { value: 0.9 },
                      // Day 18
                      { value: 0.8 }, { value: 0.8 },
                      // Day 19
                      { value: 0.8 }, { value: 0.8 },
                      // Day 20
                      { value: 0.8 }, { value: 0.8 },
                      // Day 21
                      { value: 0.8 }, { value: 0.8 },
                      // Day 22
                      { value: 0.8 }, { value: 0.8 },
                      // Day 23
                      { value: 0.8 }, { value: 0.8 },
                      // Day 24
                      { value: 0.8 }, { value: 0.8 },
                      // Day 25
                      { value: 0.8 }, { value: 0.8 },
                      // Day 26
                      { value: 0.8 }, { value: 0.8 },
                      // Day 27
                      { value: 0.8 }, { value: 0.8 },
                      // Day 28
                      { value: 0.8 }, { value: 0.8 },
                      // Day 29
                      { value: 0.8 }, { value: 0.8 },
                      // Day 30
                      { value: 0.8 }, { value: 0.8 }
                    ]}
                    data4={[
                      // LH (Black) - Half-day data points (56 total)
                      // Day 1
                      { value: 1.1 }, { value: 1.1 },
                      // Day 2
                      { value: 1.1 }, { value: 1.1 },
                      // Day 3
                      { value: 1.1 }, { value: 1.1 },
                      // Day 4
                      { value: 1.1 }, { value: 1.1 },
                      // Day 5
                      { value: 1.1 }, { value: 1.1 },
                      // Day 6
                      { value: 1.1 }, { value: 1.1 },
                      // Day 7
                      { value: 1.1 }, { value: 1.1 },
                      // Day 8
                      { value: 1.1 }, { value: 1.1 },
                      // Day 9
                      { value: 1.1 }, { value: 1.1 },
                      // Day 10
                      { value: 1.1 }, { value: 1.1 },
                      // Day 11
                      { value: 1.1 }, { value: 1.1 },
                      // Day 12
                      { value: 1.1 }, { value: 1.2 },
                      // Day 13
                      { value: 1.3 }, { value: 1.8 },
                      // Day 14
                      { value: 2.5 }, { value: 5.0 },
                      // Day 15
                      { value: 7.5 }, { value: 4.0 },
                      // Day 16
                      { value: 2.5 }, { value: 1.8 },
                      // Day 17
                      { value: 1.5 }, { value: 1.2 },
                      // Day 18
                      { value: 1.1 }, { value: 1.1 },
                      // Day 19
                      { value: 1.1 }, { value: 1.1 },
                      // Day 20
                      { value: 1.1 }, { value: 1.1 },
                      // Day 21
                      { value: 1.1 }, { value: 1.1 },
                      // Day 22
                      { value: 1.1 }, { value: 1.1 },
                      // Day 23
                      { value: 1.1 }, { value: 1.1 },
                      // Day 24
                      { value: 1.1 }, { value: 1.1 },
                      // Day 25
                      { value: 1.1 }, { value: 1.1 },
                      // Day 26
                      { value: 1.1 }, { value: 1.1 },
                      // Day 27
                      { value: 1.1 }, { value: 1.1 },
                      // Day 28
                      { value: 1.1 }, { value: 1.1 },
                      // Day 29
                      { value: 1.1 }, { value: 1.1 },
                      // Day 30
                      { value: 1.1 }, { value: 1.1 }
                    ]}

                    color1="#0188BD"  // Progesterone (Blue)
                    color2="#FF69B4"  // Estrogen (Pink) 
                    color3="#9370DB"  // Testosterone (Purple)
                    color4="#FFC0C0"  // LH (Black)
                    curved
                    thickness={2.5}
                    hideDataPoints={true}
                    showVerticalLines={false}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    hideRules
                    height={200}
                    maxValue={10}
                    spacing={20}
                    adjustToWidth={true}
                    isAnimated
                    initialSpacing={0}
                    animationDuration={900}
                    hideYAxisText
                  /> */}
                  <LineChart
  data={[
    // Progesterone (Blue) - Stays flat until after ovulation, then rises smoothly
    // Day 1
    { value: 0.3 }, { value: 0.3 },
    // Day 2
    { value: 0.3 }, { value: 0.3 },
    // Day 3
    { value: 0.3 }, { value: 0.3 },
    // Day 4
    { value: 0.3 }, { value: 0.3 },
    // Day 5
    { value: 0.3 }, { value: 0.3 },
    // Day 6
    { value: 0.3 }, { value: 0.3 },
    // Day 7
    { value: 0.3 }, { value: 0.3 },
    // Day 8
    { value: 0.3 }, { value: 0.3 },
    // Day 9
    { value: 0.3 }, { value: 0.3 },
    // Day 10
    { value: 0.3 }, { value: 0.3 },
    // Day 11
    { value: 0.3 }, { value: 0.3 },
    // Day 12
    { value: 0.3 }, { value: 0.3 },
    // Day 13
    { value: 0.3 }, { value: 0.3 },
    // Day 14
    { value: 0.4 }, { value: 0.6 },
    // Day 15
    { value: 1.0 }, { value: 1.6 },
    // Day 16
    { value: 2.4 }, { value: 3.4 },
    // Day 17
    { value: 4.5 }, { value: 5.5 },
    // Day 18
    { value: 6.3 }, { value: 6.9 },
    // Day 19
    { value: 7.3 }, { value: 7.5 },
    // Day 20
    { value: 7.6 }, { value: 7.6 },
    // Day 21
    { value: 7.5 }, { value: 7.3 },
    // Day 22
    { value: 7.0 }, { value: 6.6 },
    // Day 23
    { value: 6.1 }, { value: 5.5 },
    // Day 24
    { value: 4.9 }, { value: 4.3 },
    // Day 25
    { value: 3.7 }, { value: 3.1 },
    // Day 26
    { value: 2.6 }, { value: 2.1 },
    // Day 27
    { value: 1.7 }, { value: 1.3 },
    // Day 28
    { value: 1.0 }, { value: 0.7 },
    // Day 29
    { value: 0.5 }, { value: 0.4 },
    // Day 30
    { value: 0.3 }, { value: 0.3 }
  ]}
  data2={[
    // Estrogen (Pink) - Keep your updated values
    // Day 1
    { value: 1.3 }, { value: 1.3 },
    // Day 2
    { value: 1.3 }, { value: 1.3 },
    // Day 3
    { value: 1.3 }, { value: 1.3 },
    // Day 4
    { value: 1.33 }, { value: 1.351 },
    // Day 5
    { value: 1.4 }, { value: 1.450 },
    // Day 6
    { value: 1.5 }, { value: 1.550 },
    // Day 7
    { value: 1.6 }, { value: 1.650 },
    // Day 8
    { value: 1.7 }, { value: 1.75 },
    // Day 9
    { value: 1.82 }, { value: 1.89},
    // Day 10
    { value: 2.1 }, { value: 2.3 },
    // Day 11
    { value: 2.6 }, { value: 3.0 },
    // Day 12
    { value: 3.38 }, { value: 4.0 },
    // Day 13
    { value: 5.5 }, { value: 8.3 },
    // Day 14
    { value: 8.3 }, { value: 5.5 },
    // Day 15
    { value: 2.5 }, { value: 2.0 },
    // Day 16
    { value: 2.75 }, { value: 3.5 },
    // Day 17
    { value: 4 }, { value: 4.5 },
    // Day 18
    { value: 4.85 }, { value: 5.15 },
    // Day 19
    { value: 5.35 }, { value: 5.55},
    // Day 20
    { value: 5.65 }, { value: 5.6 },
    // Day 21
    { value: 5.5 }, { value: 5.2 },
    // Day 22
    { value: 4.9 }, { value: 4.6 },
    // Day 23
    { value: 4.2 }, { value: 3.85 },
    // Day 24
    { value: 3.6 }, { value: 3.25 },
    // Day 25
    { value: 3 }, { value: 2.65 },
    // Day 26
    { value: 2.25 }, { value: 1.98 },
    // Day 27
    { value: 1.8 }, { value: 1.7 },
    // Day 28
    { value: 1.8 }, { value: 2 },
    // Day 29
    { value: 2.2 }, { value: 2.0 },
    // Day 30
    { value: 1.6 }, { value: 1.3 }
  ]}
  data3={[
    // Testosterone (Purple) - Flat line with tiny peak at ovulation only
    // Day 1
    { value: 0.8 }, { value: 0.8 },
    // Day 2
    { value: 0.8 }, { value: 0.8 },
    // Day 3
    { value: 0.8 }, { value: 0.8 },
    // Day 4
    { value: 0.8 }, { value: 0.8 },
    // Day 5
    { value: 0.8 }, { value: 0.8 },
    // Day 6
    { value: 0.8 }, { value: 0.8 },
    // Day 7
    { value: 0.8 }, { value: 0.8 },
    // Day 8
    { value: 0.8 }, { value: 0.8 },
    // Day 9
    { value: 0.8 }, { value: 0.8 },
    // Day 10
    { value: 0.8 }, { value: 0.8 },
    // Day 11
    { value: 0.8 }, { value: 0.8 },
    // Day 12
    { value: 0.8 }, { value: 0.85 },
    // Day 13
    { value: 1.1 }, { value: 1.5 },
    // Day 14
    { value: 2.2 }, { value: 2.2 },
    // Day 15
    { value: 1.35 }, { value: 1 },
    // Day 16
    { value: 0.85 }, { value: 0.8 },
    // Day 17
    { value: 0.8 }, { value: 0.8 },
    // Day 18
    { value: 0.8 }, { value: 0.8 },
    // Day 19
    { value: 0.8 }, { value: 0.8 },
    // Day 20
    { value: 0.8 }, { value: 0.8 },
    // Day 21
    { value: 0.8 }, { value: 0.8 },
    // Day 22
    { value: 0.8 }, { value: 0.8 },
    // Day 23
    { value: 0.8 }, { value: 0.8 },
    // Day 24
    { value: 0.8 }, { value: 0.8 },
    // Day 25
    { value: 0.8 }, { value: 0.8 },
    // Day 26
    { value: 0.8 }, { value: 0.8 },
    // Day 27
    { value: 0.8 }, { value: 0.8 },
    // Day 28
    { value: 0.8 }, { value: 0.8 },
    // Day 29
    { value: 0.8 }, { value: 0.8 },
    // Day 30
    { value: 0.8 }, { value: 0.8 }
  ]}
  data4={[
    // LH (Black) - Flat with very sharp, narrow peak at ovulation
    // Day 1
    { value: 1 }, { value: 1 },
    // Day 2
    { value: 1 }, { value: 1 },
    // Day 3
    { value: 1 }, { value: 1 },
    // Day 4
    { value: 1 }, { value: 1 },
    // Day 5
    { value: 1 }, { value: 1 },
    // Day 6
    { value: 1 }, { value: 1 },
    // Day 7
    { value: 1 }, { value: 1 },
    // Day 8
    { value: 1 }, { value: 1 },
    // Day 9
    { value: 1 }, { value: 1 },
    // Day 10
    { value: 1 }, { value: 1 },
    // Day 11
    { value: 1 }, { value: 1 },
    // Day 12
    { value: 1 }, { value: 1 },
    // Day 13
    { value: 1.25 }, { value: 2.45 },
    // Day 14
    { value: 7.65 }, { value: 7.5 },
    // Day 15
    { value: 2.25 }, { value: 1.15 },
    // Day 16
    { value: 1.05 }, { value: 1.05 },
    // Day 17
    { value: 1 }, { value: 1 },
    // Day 18
    { value: 1 }, { value: 1 },
    // Day 19
    { value: 1 }, { value: 1 },
    // Day 20
    { value: 1 }, { value: 1 },
    // Day 21
    { value: 1 }, { value: 1 },
    // Day 22
    { value: 1 }, { value: 1 },
    // Day 23
    { value: 1 }, { value: 1 },
    // Day 24
    { value: 1 }, { value: 1 },
    // Day 25
    { value: 1 }, { value: 1 },
    // Day 26
    { value: 1 }, { value: 1 },
    // Day 27
    { value: 1 }, { value: 1 },
    // Day 28
    { value: 1 }, { value: 1 },
    // Day 29
    { value: 1 }, { value: 1 },
    // Day 30
    { value: 1 }, { value: 1 }
  ]}

  color1="#0188BD"  // Progesterone (Blue)
  color2="#FF69B4"  // Estrogen (Pink) 
  color3="#9370DB"  // Testosterone (Purple)
  color4="#FFC0C0"  // LH (Black)
  curved
  thickness={2.5}
  hideDataPoints={true}
  showVerticalLines={false}
  yAxisThickness={0}
  xAxisThickness={0}
  hideRules
  height={200}
  maxValue={10}
  spacing={20}
  adjustToWidth={true}
  isAnimated
  initialSpacing={0}
  animationDuration={900}
  hideYAxisText
/>
                </View>
              </View>

              {/* Day scale below - scrolls with chart */}
              <View style={styles.dayScaleContainer}>
                {Array.from({ length: 28 }, (_, i) => (
                  <View key={i} style={styles.dayScaleLine} />
                ))}
              </View>

              {/* Date label for day 23 */}
              <View style={styles.todayDateLabel}>
                <Text style={styles.todayDateText}>Wed{'\n'}Sep 10</Text>
              </View>
            </View>
          </ScrollView>

        </View>

        {renderDivider('What this means for your concern?')}

        <View style={styles.concernCard}>
          <View style={styles.concernHeader}>
            <View style={styles.concernDot} />
            <Text style={styles.concernTitle}>Acne can potentially worsen</Text>
          </View>

          {/* Concern slider */}
          <FlatList
            horizontal
            data={[
              {
                id: 'c1',
                title: 'Lower calming support',
                description: 'less skin-calming effect, so acne can worsen',
                color: '#FF87B4',
                arrow: '↓',
                bgColor: 'rgb(251, 144, 187)',
                image: Images.EstrogenBothHand,
              },
              {
                id: 'c2',
                title: 'Oil production shifts',
                description: 'Oil and inflammation can rise; watch pores',
                color: '#0E8FC1',
                arrow: '↑↓',
                bgColor: 'rgb(203, 240, 255)',
                image: Images.ProgesteroneBothHand,
              },
              {
                id: 'c3',
                title: 'Inflammation risk',
                description: 'Skin may get reactive; keep routine gentle',
                color: '#FFA569',
                arrow: '↑',
                bgColor: 'rgb(255, 165, 105)',
                image: Images.CortisolBothHand,
              },
            ]}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.concernSliderContainer}
            ItemSeparatorComponent={() => <View style={{ width: responsiveWidth(3) }} />}
            snapToInterval={responsiveWidth(48)}
            decelerationRate="fast"
            snapToAlignment="start"
            renderItem={({ item }) => (
              <LinearGradient
                colors={getGradientColors(item.bgColor)}
                start={{ x: 0.4, y: 0.18 }}
                end={{ x: 0.5, y: 1.5 }}
                style={styles.concernSlide}
              >
                <View style={styles.concernSlideHeader}>
                  <Image source={item.image} style={styles.concernSlideImage} resizeMode="contain" />
                  <Ionicons
                    name={item.arrow === '↓' ? 'arrow-down' : item.arrow === '↑' ? 'arrow-up' : 'swap-vertical'}
                    size={35}
                    color={item.color}
                    style={styles.concernSlideArrowIcon}
                  />
                </View>
                <Text style={styles.concernSlideDescription}>{item.description}</Text>
              </LinearGradient>
            )}
          />
        </View>

        {renderDivider('Also, watch out for')}

        <View style={styles.watchOutContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { id: 'w1', emoji: '🎈', label: 'Bloating' },
              { id: 'w2', emoji: '🤕', label: 'Headaches/\nMigranes' },
              { id: 'w3', emoji: '😴️', label: 'Low energy' },
              { id: 'w4', emoji: '🍽️', label: 'Digestion issues' },
              { id: 'w5', emoji: '🍫️', label: 'Cravings' },
            ]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ marginRight: responsiveWidth(4) }}>
                {renderActionItem(item.emoji, item.label)}
              </View>
            )}
            contentContainerStyle={{
              paddingLeft: 0,
              paddingRight: responsiveWidth(5),
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(80),
  },
  header: {
    paddingHorizontal: responsiveWidth(5),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(15),
  },
  headerTitle: {
    fontSize: moderateScale(14, 1.5),
    // fontFamily: 'NotoSerif-Medium',
    fontFamily: "NotoSerif500",
    // fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    lineHeight: moderateScale(21, 1.5), // 150% of 14px
    letterSpacing: 0,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: verticalScale(15),
  },
  navButton: {
    width: scale(36),
    height: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: moderateScale(22, 1.5),
    // fontFamily: 'NotoSerif-SemiBold',
    fontFamily: "NotoSerif600",
    // fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    lineHeight: moderateScale(27.5, 1.5), // 125% of 22px
    letterSpacing: 0,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: verticalScale(20),
  },
  monthText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    fontWeight: '400',
    color: '#000000',
    lineHeight: moderateScale(15, 1.5), // 125% of 12px
    letterSpacing: 0,
    textAlignVertical: 'center',
  },
  monthDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#949494',
    borderRadius: 20,
    paddingHorizontal: responsiveWidth(2.5),
    paddingVertical: responsiveHeight(0.7),
  },
  monthDropdownText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#6F6F6F',
    marginRight: responsiveWidth(1),
  },
  progressCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: responsiveWidth(5),
    // marginBottom: responsiveHeight(2),
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(8),
    borderRadius: 10,
    shadowColor: '#868585',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.6,
    shadowRadius: Platform.OS === 'ios' ? 6 : 10,
    elevation: Platform.OS === 'ios' ? 2 : 6,
  },
  progressText: {
    fontSize: moderateScale(14, 1.5),
    // fontFamily: 'NotoSerif-Medium',
    fontFamily: "NotoSerif500",
    // fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    lineHeight: moderateScale(21, 1.5), // 150% of 14px
    letterSpacing: 0,
    marginBottom: responsiveHeight(2.5),
  },
  highlightText: {
    color: '#C17EC9',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartVisualization: {
    marginBottom: responsiveHeight(1),
    position: 'relative',
  },
  chartVisualizationContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  barsContainer: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    width: '100%',
  },
  chartBar: {
    backgroundColor: '#F7F7FF',
    height: 150,
    borderRadius: 6,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 6,
    maxHeight: 150,
  },
  standardBar: {
    flex: 1,
    marginHorizontal: 2,
  },
  wideBar: {
    flex: 1.5,
    marginHorizontal: 2,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: FONTS['Inter-Regular'],
    color: '#DDC2E9',
    textAlign: 'center',
  },
  lineGraphOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  lineGraph: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#DDC2E9',
    borderRadius: 1,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDC2E9',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: responsiveWidth(5),
  },
  chartLabel: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-SemiBold'],
    color: '#949494',
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(20),
    paddingHorizontal: responsiveWidth(5),
  },
  dividerLineContainer: {
    flex: 1,
    height: 1,
    justifyContent: 'center',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#949494',
    width: '100%',
  },
  dividerText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#949494',
    marginHorizontal: responsiveWidth(2.5),
  },
  cycleDividerText: {
    fontSize: moderateScale(14, 1.5),
    // fontFamily: 'NotoSerif-Medium',
    fontFamily: "NotoSerif500",
    // fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    lineHeight: moderateScale(21, 1.5), // 150% of 14px
    letterSpacing: 0,
    marginHorizontal: responsiveWidth(2.5),
  },
  actionPlanCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: responsiveWidth(5),
    // marginBottom: responsiveHeight(2),
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(8),
    borderRadius: 10,
    shadowColor: '#868585',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.5,
    shadowRadius: Platform.OS === 'ios' ? 6 : 10,
    elevation: Platform.OS === 'ios' ? 2 : 5,
    zIndex: 300,
  },
  actionPlanText: {
    fontSize: moderateScale(14, 1.5),
    // fontFamily: 'NotoSerif-Medium',
    fontFamily: "NotoSerif500",
    // fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    lineHeight: moderateScale(21, 1.5), // 150% of 14px
    letterSpacing: 0,
    marginBottom: scale(20),
  },
  hormoneQuestsContainer: {
    marginBottom: 0,
  },
  hormoneQuestsList: {
    paddingLeft: 0,
    // paddingRight: responsiveWidth(1),
    paddingRight: responsiveWidth(5),
  },
  hormoneQuestSeparator: {
    width: responsiveWidth(2.5),
  },
  hormoneQuest: {
    borderRadius: 10,
    padding: responsiveWidth(5),
    width: responsiveWidth(75),
    marginBottom: responsiveHeight(1),
  },
  hormoneQuestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  hormoneInfo: {
    flex: 1,
    marginRight: scale(3),
  },
  hormoneTitle: {
    fontSize: moderateScale(14, 1.5),
    // fontFamily: 'NotoSerif-Medium',
    fontFamily: "NotoSerif500",
    // fontWeight: '500',
    color: '#000000',
    // textAlign: 'center',
    lineHeight: moderateScale(21, 1.5), // 150% of 14px
    letterSpacing: 0,
    marginBottom: responsiveHeight(1),
  },
  hormoneDescription: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#6F6F6F',
  },
  progressSection: {
    marginTop: responsiveHeight(1),
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(214, 214, 214, 0.4)',
    borderRadius: 15,
    marginBottom: verticalScale(10),
  },
  progressBar: {
    height: '100%',
    borderRadius: 15,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hormoneProgressText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#949494',
    textAlign: 'center',
    lineHeight: 15,
  },
  actionItemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(8),
    marginBottom: responsiveHeight(1),
  },
  actionItem: {
    alignItems: 'center',
    width: responsiveWidth(22),
  },
  actionIcon: {
    width: scale(40),
    height: scale(40),
    backgroundColor: '#ffe1e7',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveHeight(0.5),
  },
  actionEmoji: {
    fontSize: moderateScale(22, 1.5),
  },
  actionLabel: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#000000',
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: moderateScale(10, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#949494',
    textAlign: 'center',
    marginVertical: scale(20),
  },
  cycleCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: responsiveWidth(5),
    // marginBottom: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(2),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(40),
    borderRadius: 10,
    shadowColor: '#868585',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.5,
    shadowRadius: Platform.OS === 'ios' ? 6 : 10,
    elevation: Platform.OS === 'ios' ? 2 : 5,
  },
  cycleText: {
    fontSize: moderateScale(14, 1.5),
    // fontFamily: 'NotoSerif-Medium',
    fontFamily: "NotoSerif500",
    // fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    lineHeight: moderateScale(21, 1.5), // 150% of 14px
    letterSpacing: 0,
    marginBottom: responsiveHeight(2),
  },
  concernCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: responsiveWidth(5),
    // marginTop: verticalScale(10),
    // marginBottom: verticalScale(10),
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(8),
    borderRadius: 10,
    shadowColor: '#868585',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.5,
    shadowRadius: Platform.OS === 'ios' ? 6 : 10,
    elevation: Platform.OS === 'ios' ? 2 : 5,
  },
  concernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: verticalScale(20),
  },
  concernDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: '#FF3B30',
    marginRight: responsiveWidth(1.5),
  },
  concernTitle: {
    fontSize: moderateScale(14, 1.5),
    // fontFamily: 'NotoSerif-Medium',
    fontFamily: "NotoSerif500",
    // fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    lineHeight: moderateScale(21, 1.5), // 150% of 14px
    letterSpacing: 0,
  },
  concernSliderContainer: {
    paddingLeft: 0,
    paddingRight: responsiveWidth(5),
    paddingBottom: responsiveHeight(1),
  },
  concernSlide: {
    width: responsiveWidth(45),
    borderRadius: 10,
    backgroundColor: '#F7F7FF',
    padding: responsiveWidth(4),
  },
  concernSlideDraft: {
    width: responsiveWidth(60),
    borderRadius: 10,
    backgroundColor: '#F7F7FF',
    padding: responsiveWidth(5),
  },
  concernSlideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(1),
  },
  concernSlideImage: {
    width: scale(52),
    height: scale(52),
    marginRight: responsiveWidth(1),
  },
  concernSlideArrow: {
    marginLeft: responsiveWidth(2),
    fontSize: moderateScale(28, 1.5),
    lineHeight: moderateScale(30, 1.5),
    fontFamily: FONTS['Inter-Bold'],
    color: '#404040',
  },
  concernSlideArrowIcon: {
    marginLeft: responsiveWidth(1),
  },
  concernSlideDescription: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#6F6F6F',
    lineHeight: moderateScale(15, 1.5),
    textAlign: 'center',
  },

  // Cycle Phase Chart Styles



  cyclePhaseChartScrollView: {
    height: 270, // Height for chart + day labels + date label
  },

  cyclePhaseChartScrollContent: {
    paddingHorizontal: 10,
    // minWidth: 1200, // Ensure enough width for 28 days × 40px spacing
  },

  dayScaleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
  },


  dayScaleLine: {
    width: 1,
    height: 8,
    backgroundColor: '#DDC2E9',
    marginHorizontal: 19.5, // (40 - 1) / 2 = 19.5 to center the line
  },


  barLabelText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-SemiBold'],
    color: '#333',
    textAlign: 'center',
  },

  chartWithOverlay: {
    position: 'relative',
    overflow: 'visible',
  },

  lineChartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1120, // 56 half-days × 20px spacing = 1120px
    height: 200,
    pointerEvents: 'none',
    overflow: 'visible',
    zIndex: 50,
  },

  todayVerticalLine: {
    position: 'absolute',
    top: 40,
    bottom: 0, // Start from bottom X-axis
    left: 14 + (44 * 20) + 10, // Day 23 = index 44 (22 * 2), so 44 * 20px + padding + center offset
    height: 200, // Full height from X-axis to top
    width: 1,
    pointerEvents: 'none',
  },

  todayLine: {
    width: 1,
    height: 200,
    backgroundColor: '#949494',
  },


  todayDateLabel: {
    position: 'absolute',
    bottom: 0, // Position below the X-axis
    left: 14 + (44 * 20) + 5, // Center on day 23 line (index 44)
    alignItems: 'center',
  },

  todayDateText: {
    fontSize: moderateScale(10, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#949494',
    textAlign: 'center',
  },

  // Chart-specific hormone character styles
  chartHormoneCharacters: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 200,
  },

  chartHormoneCharacter: {
    position: 'absolute',
    width: 42,
    height: 42,
    zIndex: 100,
  },

  chartCharacterImage: {
    width: 45,
    height: 45,
  },

  // Action plan specific hormone character styles
  actionPlanHormoneCharacter: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionPlanCharacterImage: {
    width: scale(60),
    height: scale(60),
  },

  watchOutContainer: {
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: verticalScale(40),
  },
});

export default InsightScreen;
