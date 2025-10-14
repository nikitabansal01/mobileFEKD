import Images from '@/assets/images';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
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
  const [selectedMonth, setSelectedMonth] = useState('Month');
  const cycleChartScrollRef = useRef<ScrollView>(null);
  

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
    <View style={[styles.hormoneQuest, { backgroundColor: bgColor }]}>
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
    </View>
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

        <View style={styles.actionPlanCard}>
          <Text style={styles.actionPlanText}>
            You completed <Text style={styles.highlightText}>80%</Text> of your action plan and your <Text style={styles.highlightText}>acne shifted from 7 → 5</Text> on the scale.
          </Text>
          
          <View style={styles.hormoneQuestsContainer}>
            <FlatList
              data={[
                {
                  id: '1',
                  title: 'Progesterone',
                  description: 'Balanced levels can reduce inflammation and calm breakouts',
                  progress: 10,
                  total: 14,
                  color: '#0188bd',
                  progessColor: '#CBF0FF',
                  bgColor: '#ecf6fa'
                },
                {
                  id: '2',
                  title: 'Testosterone',
                  description: 'Balanced levels support clearer skin by regulating oil production',
                  progress: 11,
                  total: 16,
                  color: '#a29aea',
                  progessColor: '#A29AEA',
                  bgColor: 'rgba(162, 154, 234, 0.15)'
                },
                {
                  id: '3',
                  title: 'Cortisol',
                  description: 'Stable levels supports calm, reduces stress-related flare-ups',
                  progress: 1,
                  total: 5,
                  color: '#ffa569',
                  progessColor: '#FFA569',
                  bgColor: 'rgba(255, 165, 105, 0.25)'
                }
              ]}
              renderItem={({ item }) => renderHormoneQuest(
                item.title,
                item.description,
                item.progress,
                item.total,
                item.color,
                item.progessColor,
                item.bgColor
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hormoneQuestsList}
              ItemSeparatorComponent={() => <View style={styles.hormoneQuestSeparator} />}
              snapToInterval={responsiveWidth(77.5)}
              decelerationRate="fast"
              snapToAlignment="start"
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
              ref={cycleChartScrollRef}
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
                    {/* Estrogen character at day 23 value */}
                    <View style={[styles.chartHormoneCharacter, { 
                      left: 14 + (22 * 40) + 20 - 18, // Center on day 23 line
                      top: 200 - (4 * 200 / 10) - 18 // Estrogen value 1 at day 23
                    }]}>
                      <Image 
                        source={require('../../assets/images/hormoneBuddy/ProgesteroneBothHand.png')} 
                        style={styles.chartCharacterImage}
                        resizeMode="contain"
                      />
                    </View>
                    
                    {/* Testosterone character at day 23 value */}
                    <View style={[styles.chartHormoneCharacter, { 
                      left: 14 + (22 * 40) + 20 - 18, // Center on day 23 line
                      top: 200 - (6 * 200 / 10) - 18 // Testosterone value 7 at day 23
                    }]}>
                      <Image 
                        source={require('../../assets/images/hormoneBuddy/TestosteroneBothHand.png')} 
                        style={styles.chartCharacterImage}
                        resizeMode="contain"
                      />
                    </View>
                    
                    {/* LH character at day 23 value */}
                    <View style={[styles.chartHormoneCharacter, { 
                      left: 14 + (22 * 40) + 20 - 18, // Center on day 23 line
                      top: 200 - (2 * 200 / 10) - 18 // LH value 2 at day 23
                    }]}>
                      <Image 
                        source={require('../../assets/images/hormoneBuddy/EstrogenBothHand.png')} 
                        style={styles.chartCharacterImage}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                  
                  {/* Line Chart Overlay - Positioned absolutely on top */}
                  <View style={styles.lineChartOverlay}>
                    <LineChart
                      data={[
                        { value: 3}, { value: 4 }, { value: 5 }, { value: 5 }, { value: 6 },
                        { value: 7 }, { value: 6 }, { value: 5 }, { value: 8 }, { value: 6 },
                        { value: 4 }, { value: 3 }, { value: 2 }, { value: 1},
                        { value: 1 }, { value: 3 }, { value: 8 }, { value: 7 },
                        { value: 6 }, { value: 5 }, { value: 4 }, { value: 3 },
                        { value: 3 }, { value: 2 }, { value: 1 }, { value: 1 },
                        { value: 1 }, { value: 1 }
                      ]}
                      data2={[
                        { value: 2 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 },
                        { value: 1 }, { value: 1 }, { value: 1 }, { value: 2 }, { value: 3 },
                        { value: 4 }, { value: 5 }, { value: 7 }, { value: 7 },
                        { value: 6 }, { value: 2 }, { value: 4 }, { value: 6 },
                        { value: 2 }, { value: 4 }, { value: 6 }, { value: 8 },
                        { value: 7 }, { value: 6 }, { value: 5 }, { value: 4 },
                        { value: 3 }, { value: 2 }
                      ]}
                      data3={[
                        { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 },
                        { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 },
                        { value: 7 }, { value: 5 }, { value: 4 }, { value: 8 },
                        { value: 4 }, { value: 3 }, { value: 1 }, { value: 1 },
                        { value: 1 }, { value: 2 }, { value: 4 }, { value: 2 },
                        { value: 4 }, { value: 4 }, { value: 3 }, { value: 2 },
                        { value: 2 }, { value: 1.5 }
                      ]}
                      color1="#FF69B4"
                      color2="#9370DB"
                      color3="#FFA500"
                      curved
                      thickness={2.5}
                      hideDataPoints={true}
                      showVerticalLines={false}
                      yAxisThickness={0}
                      xAxisThickness={0}
                      hideRules
                      height={200}
                      maxValue={10}
                      spacing={40}
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
                bgColor: 'rgba(251, 144, 187, 0.12)',
                image: Images.EstrogenBothHand,
              },
              {
                id: 'c2',
                title: 'Oil production shifts',
                description: 'Oil and inflammation can rise; watch pores',
                color: '#0E8FC1',
                arrow: '↑↓',
                bgColor: 'rgba(203, 240, 255, 0.25)',
                image: Images.ProgesteroneBothHand,
              },
              {
                id: 'c3',
                title: 'Inflammation risk',
                description: 'Skin may get reactive; keep routine gentle',
                color: '#FFA569',
                arrow: '↑',
                bgColor: 'rgba(255, 165, 105, 0.18)',
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
              <View style={[styles.concernSlide, { backgroundColor: item.bgColor }]}>
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
              </View>
            )}
          />
        </View>

        {renderDivider('Also, watch out for')}

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
            paddingHorizontal: responsiveWidth(5),
          }}
        />
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
    paddingTop: responsiveHeight(2),
    paddingBottom: verticalScale(20),
  },
  headerTitle: {
    fontSize: moderateScale(14, 1.5),
    fontFamily: 'NotoSerif-Medium',
    fontWeight: '500',
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
    paddingBottom: responsiveHeight(2),
  },
  navButton: {
    width: scale(36),
    height: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: moderateScale(22, 1.5),
    fontFamily: 'NotoSerif-SemiBold',
    fontWeight: '600',
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
    paddingBottom: responsiveHeight(2),
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
    shadowColor: '#D9D9D9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  progressText: {
    fontSize: moderateScale(14, 1.5),
    fontFamily: 'NotoSerif-Medium',
    fontWeight: '500',
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
          fontSize: 10,
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
    fontSize: moderateScale(10, 1.5),
    fontFamily: FONTS['Inter-Regular'],
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
    fontFamily: 'NotoSerif-Medium',
    fontWeight: '500',
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
    shadowColor: '#D9D9D9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 300,
  },
  actionPlanText: {
    fontSize: moderateScale(14, 1.5),
    fontFamily: 'NotoSerif-Medium',
    fontWeight: '500',
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
    // paddingLeft: responsiveWidth(5),
    paddingRight: responsiveWidth(1),
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
    fontFamily: 'NotoSerif-Medium',
    fontWeight: '500',
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
    marginBottom: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(2),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(40),
    borderRadius: 10,
    shadowColor: '#D9D9D9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  cycleText: {
    fontSize: moderateScale(14, 1.5),
    fontFamily: 'NotoSerif-Medium',
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    lineHeight: moderateScale(21, 1.5), // 150% of 14px
    letterSpacing: 0,
    marginBottom: responsiveHeight(2),
  },
  concernCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(2),
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(8),
    borderRadius: 10,
    shadowColor: '#D9D9D9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
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
    fontFamily: 'NotoSerif-Medium',
    fontWeight: '500',
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
    width: 1120, // 28 days × 40px spacing
    height: 200,
    pointerEvents: 'none',
    overflow: 'visible',
    zIndex: 50,
  },
  
  todayVerticalLine: {
    position: 'absolute',
    top: 40,
    bottom: 0, // Start from bottom X-axis
    left: 14 + (22 * 40) + 20, // Day 23 = index 22, so 22 * 40px + padding + center offset
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
    left: 14 + (22 * 40) +10, // Center on day 23 line
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
    width: 36,
    height: 36,
    zIndex: 100,
  },
  
  chartCharacterImage: {
    width: 36,
    height: 36,
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
});

export default InsightScreen;
