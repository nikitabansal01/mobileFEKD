import Images from '@/assets/images';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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
import { LineChart } from 'react-native-gifted-charts';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import Svg, { Line } from 'react-native-svg';
import { FONT_FAMILIES as FONTS } from '../../constants/fonts';

const { width: screenWidth } = Dimensions.get('window');

const InsightScreen = () => {
  const [selectedMonth, setSelectedMonth] = useState('Month');

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
      <Text style={styles.arrowText}>‹</Text>
    </TouchableOpacity>
  );

  const renderNextButton = () => (
    <TouchableOpacity style={styles.navButton}>
      <Text style={styles.arrowText}>›</Text>
    </TouchableOpacity>
  );

  const renderMonthSelector = () => (
    <View style={styles.monthSelector}>
      <Text style={styles.monthText}>August 2025</Text>
      <TouchableOpacity style={styles.monthDropdown}>
        <Text style={styles.monthDropdownText}>{selectedMonth}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProgressChart = () => (
    <View style={styles.progressCard}>
      <Text style={styles.progressText}>
        You reported <Text style={styles.highlightText}>3 more clear-skin days</Text> compared to last month
      </Text>
      
      <View style={styles.chartContainer}>
        {/* <View style={styles.chartBackground}>
          <View style={styles.chartPhase}>
            <Text style={styles.phaseText}>Menstrual</Text>
          </View>
          <View style={styles.chartPhase}>
            <Text style={styles.phaseText}>Follicular</Text>
          </View>
          <View style={styles.chartPhase}>
            <Text style={styles.phaseText}>Ovulation</Text>
          </View>
          <View style={styles.chartPhase}>
            <Text style={styles.phaseText}>Luteal</Text>
          </View>
        </View> */}
        
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
        <View style={styles.hormoneCharacter}>
          {/* Character illustration */}
          <Image 
            source={getCharacterImage(title)} 
            style={styles.characterImage}
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

        {renderDivider('Your Cycle phase predictions')}

        <View style={styles.cycleCard}>
          <Text style={styles.cycleText}>
            You are in your <Text style={styles.highlightText}>Luteal phase (Day 15-28)</Text>
          </Text>
          
          <View style={styles.cycleChart}>
            <View style={styles.cyclePhases}>
              <View style={styles.cyclePhase}>
                <Text style={styles.cyclePhaseText}>Follicular</Text>
              </View>
              <View style={styles.cyclePhase}>
                <Text style={styles.cyclePhaseText}>Luteal</Text>
              </View>
              <View style={styles.cyclePhase}>
                <Text style={styles.cyclePhaseText}>Menstrual</Text>
              </View>
            </View>
            
            {/* Daily Progress Chart - Using react-native-gifted-charts */}
            <View style={styles.dailyProgressChart}>
              <View style={styles.graphArea}>
                <View style={styles.chartWrapper}>
                <LineChart
                data={[
                  { value: 30 },
                  { value: 20 },
                  { value: 40 },
                  { value: 60 },
                  { value: 80 },
                  { value: 70 },
                  { value: 50 },
                  { value: 60 },
                  { value: 80 },
                  { value: 70 },
                  { value: 50 },
                  { value: 60 },
                  { value: 80 },
                  { value: 70 },
                  { value: 50 },
                  { value: 60 },
                  { value: 80 },
                  { value: 70 },
                  { value: 50 },
                ]}
                data2={[
                  { value: 20 },
                  { value: 30 },
                  { value: 50 },
                  { value: 70 },
                  { value: 60 },
                  { value: 40 },
                  { value: 30 },
                  { value: 50 },
                  { value: 70 },
                  { value: 60 },
                  { value: 40 },
                  { value: 30 },
                  { value: 50 },
                  { value: 70 },
                  { value: 60 },
                  { value: 40 },
                  { value: 30 },
                ]}
                height={164}
                color="#FF87B4"
                color2="#A29AEA"
                thickness={3}
                thickness2={3}
                hideDataPoints={true}
                hideYAxisText
                hideAxesAndRules
                curved
                showVerticalLines={false}
                areaChart
                areaChart2
                startFillColor="#FF87B4"
                startFillColor2="#A29AEA"
                endFillColor="#FF87B4"
                endFillColor2="#A29AEA"
                startOpacity={0.3}
                startOpacity2={0.3}
                endOpacity={0.1}
                endOpacity2={0.1}
              />
              </View>
              
              {/* Small vertical tick marks on x-axis */}
              <View style={styles.xAxisTicks}>
                {Array.from({ length: 7 }, (_, i) => (
                  <View key={i} style={[styles.xAxisTick, { left: (i * 50) + 8 }]} />
                ))}
              </View>
              </View>
              
              {/* Date label */}
              <View style={styles.dailyDateContainer}>
                <Text style={styles.dailyDateText}>Wed</Text>
                <Text style={styles.dailyDateText}>Sep 10</Text>
              </View>
            </View>
          </View>
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
                description: 'Less skin-calming effect; breakouts may increase',
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
    paddingBottom: responsiveHeight(1),
  },
  headerTitle: {
    fontSize: moderateScale(14, 1.5),
    fontFamily: FONTS['Inter-Medium'],
    color: '#000000',
    textAlign: 'center',
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
    fontFamily: FONTS['Inter-SemiBold'],
    color: '#000000',
    textAlign: 'center',
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
    color: '#000000',
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
    fontFamily: FONTS['NotoSerif-Regular'],
    fontWeight: '500',
    color: '#404040',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: responsiveHeight(2.5),
  },
  highlightText: {
    color: '#C17EC9',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartBackground: {
    flexDirection: 'row',
    backgroundColor: '#f7f7ff',
    borderRadius: 6,
    paddingVertical: responsiveHeight(0.7),
    paddingHorizontal: responsiveWidth(2.5),
    marginBottom: responsiveHeight(1),
  },
  chartPhase: {
    flex: 1,
    alignItems: 'center',
  },
  phaseText: {
    fontSize: moderateScale(10, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#DDC2E9',
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
        arrowText: {
          fontSize: 24,
          color: '#000000',
          fontWeight: 'bold',
        },
        dropdownArrow: {
          fontSize: 12,
          color: '#000000',
          marginLeft: 5,
        },
        arrowIcon: {
          fontSize: 12,
          color: '#949494',
        },
        cycleVisualizationText: {
          fontSize: 12,
          color: '#DDC2E9',
          textAlign: 'center',
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
  dividerText: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#949494',
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
  },
  actionPlanText: {
    fontSize: moderateScale(14, 1.5),
    fontFamily: FONTS['NotoSerif-Regular'],
    fontWeight: '500',
    color: '#404040',
    textAlign: 'center',
    lineHeight: 21,
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
    fontFamily: FONTS['Inter-Medium'],
    marginBottom: responsiveHeight(0.5),
  },
  hormoneDescription: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#6F6F6F',
  },
  hormoneCharacter: {
    width: scale(75),
    height: scale(75),
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterImage: {
    width: scale(70),
    height: scale(80),
  },
  characterPlaceholder: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
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
    fontFamily: FONTS['Inter-Medium'],
    color: '#6F6F6F',
    textAlign: 'center',
    marginBottom: responsiveHeight(2),
  },
  cycleChart: {
    alignItems: 'center',
  },
  cyclePhases: {
    flexDirection: 'row',
    backgroundColor: '#f7f7ff',
    borderRadius: 6,
    paddingVertical: responsiveHeight(0.7),
    paddingHorizontal: responsiveWidth(2.5),
    marginBottom: responsiveHeight(1),
  },
  cyclePhase: {
    flex: 1,
    alignItems: 'center',
  },
  cyclePhaseText: {
    fontSize: moderateScale(10, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#DDC2E9',
  },
  cycleVisualization: {
    marginBottom: responsiveHeight(1),
  },
  dailyProgressChart: {
    width: '100%',
    height: verticalScale(200),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  graphArea: {
    backgroundColor: '#F7F7FF',
    borderRadius: moderateScale(6),
    paddingVertical: verticalScale(10),
    paddingBottom: verticalScale(0),
    paddingHorizontal: verticalScale(0),
    width: '100%',
    height: verticalScale(164),
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  chartWrapper: {
    // width: '100%',
    marginLeft: scale(-15),
    marginRight: scale(-15),
    width: screenWidth - scale(20),
  },
  dailyBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: verticalScale(164),
    gap: verticalScale(18),
    marginBottom: verticalScale(5),
    backgroundColor: '#F7F7FF',
    paddingHorizontal: verticalScale(20),
    paddingVertical: verticalScale(10),
  },
  dailyBar: {
    width: verticalScale(4),
    backgroundColor: '#DDC2E9',
    borderRadius: 2,
  },
  dailyDateContainer: {
    alignItems: 'center',
    marginTop: verticalScale(15),
    position: 'absolute',
    bottom: verticalScale(-15),
    left: '50%',
    marginLeft: -25,
  },
  dailyDateText: {
    fontSize: moderateScale(10, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#949494',
    textAlign: 'center',
    lineHeight: verticalScale(12.5),
  },
  xAxisTicks: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(10),
  },
  xAxisTick: {
    position: 'absolute',
    bottom: 0,
    width: 1,
    height: verticalScale(8),
    backgroundColor: '#DDC2E9',
  },
  dailyLineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  dailyCurvedLine: {
    position: 'absolute',
    top: verticalScale(45),
    left: verticalScale(20),
    right: 20,
    height: verticalScale(2),
    backgroundColor: '#FF87B4',
    borderRadius: moderateScale(1),
    transform: [{ scaleY: 0.5 }],
  },
  dailyCurvedLineSecondary: {
    top: verticalScale(74),
    backgroundColor: '#A29AEA',
  },
  dailySvgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
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
    fontFamily: FONTS['Inter-Medium'],
    color: '#6F6F6F',
    textAlign: 'center',
  },
  concernDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  concernSlideTitle: {
    fontSize: moderateScale(13, 1.5),
    fontFamily: FONTS['Inter-Medium'],
    color: '#000000',
    marginBottom: responsiveHeight(0.5),
  },
  concernSlideDescription: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#6F6F6F',
    lineHeight: moderateScale(15, 1.5),
    textAlign: 'center',
  },
  concernItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(1),
  },
  concernCharacter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(0.5),
  },
  concernArrow: {
    fontSize: moderateScale(24, 1.5),
    fontFamily: FONTS['Inter-Bold'],
    color: '#FF87B4',
    marginLeft: responsiveWidth(1),
  },
  concernDescription: {
    fontSize: moderateScale(12, 1.5),
    fontFamily: FONTS['Inter-Regular'],
    color: '#949494',
    textAlign: 'center',
  },
  watchOutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(5),
  },
});

export default InsightScreen;
