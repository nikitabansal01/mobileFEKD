import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import Svg, { Circle, ClipPath, Defs, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { FONT_FAMILIES } from '../../constants/fonts';
const IconEdit = require('../../assets/icons/IconEdit.png');


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isAndroid = Platform.OS === 'android';

// Colors
const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  grey: '#6F6F6F',
  lightGrey: '#949494',
  primary: '#1573FE',
  warmPurple: '#C17EC9',
  lightGray: '#F5F5F5',
  gradientStart: '#A29AEA',
  gradientEnd: '#C17EC9',
};

interface ProfileProps {
  navigation?: any;
}

export default function Profile({ navigation: propNavigation }: ProfileProps) {
  const hookNavigation = useNavigation();
  const navigation = propNavigation || hookNavigation;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationInsightsEnabled, setLocationInsightsEnabled] = useState(true);

  const navigateToIndex = () => {
    navigation.goBack();
  };


  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const toggleLocationInsights = () => {
    setLocationInsightsEnabled(!locationInsightsEnabled);
  };

  const handlePersonalization = () => {
    // Navigate to paywall screen
    navigation.navigate('PaywallScreen');
  };

  const handleHealthConcerns = () => {
    // Navigate to health concerns page
    console.log('Navigate to health concerns');
  };

  const handleMenuAction = (action: string) => {
    console.log(`Menu action: ${action}`);
    // Handle different menu actions
    if (action === 'Get Auvra Pro') {
      navigation.navigate('PaywallScreen');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Background with Clip Path */}
        <View style={styles.headerBackgroundContainer}>
          <Svg width={screenWidth} height={verticalScale(170)} style={styles.headerSvg}>
            <Defs>
              <ClipPath id="headerClip">
                <Path
                  d={`M0,0 L${screenWidth},0 L${screenWidth},${verticalScale(140)} Q${screenWidth/2},${verticalScale(170)} 0,${verticalScale(140)} Z`}
                  fill="white"
                />
              </ClipPath>
            </Defs>
            <SvgLinearGradient
              id="headerGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <Stop offset="14.79%" stopColor="#C7C2F2" />
              <Stop offset="38.58%" stopColor="#DAB2DF" />
              <Stop offset="51.96%" stopColor="#E5B4D5" />
              <Stop offset="69.06%" stopColor="#F2B9CD" />
              <Stop offset="89.13%" stopColor="#FEDDE3" />
            </SvgLinearGradient>
            <Path
              d={`M0,0 L${screenWidth},0 L${screenWidth},${verticalScale(140)} Q${screenWidth/2},${verticalScale(170)} 0,${verticalScale(140)} Z`}
              fill="url(#headerGradient)"
              clipPath="url(#headerClip)"
            />
          </Svg>
        </View>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../../assets/images/auvra-avatar-1.png')}
                style={styles.avatar}
                resizeMode="cover"
              />
              <TouchableOpacity style={styles.editButton}>
                <View style={styles.editIconContainer}>
                  <Image source={require('../../assets/icons/IconEdit.png')} style={styles.editIcon} />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Jessica</Text>
              <Text style={styles.userEmail}>jessica03@gmail.com</Text>
            </View>
          </View>

          {/* Personalization Card */}
          <TouchableOpacity style={styles.personalizationCard} onPress={handlePersonalization}>
            <View style={styles.personalizationContent}>
              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                  <View style={styles.progressCircle}>
                    <Svg width={scale(50)} height={scale(50)}>
                      <Defs>
                        <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                          <Stop offset="14.79%" stopColor="#A29AEA" />
                          <Stop offset="38.58%" stopColor="#C17EC9" />
                          <Stop offset="51.96%" stopColor="#D482B9" />
                          <Stop offset="69.06%" stopColor="#E98BAC" />
                          <Stop offset="89.13%" stopColor="#FDC6D1" />
                        </SvgLinearGradient>
                      </Defs>

                      {/* Background Circle */}
                      <Circle
                        cx={scale(25)}
                        cy={scale(25)}
                        r={scale(15)}
                        stroke="#E5E5E5"
                        strokeWidth={scale(5)}
                        fill="none"
                      />

                      {/* Progress Circle with gradient */}
                      <Circle
                        cx={scale(25)}
                        cy={scale(25)}
                        r={scale(15)}
                        stroke="url(#grad)"
                        strokeWidth={scale(5)}
                        fill="none"
                        strokeDasharray={scale(94.25)} // 2 * π * r
                        strokeDashoffset={scale(47.125)} // 50% of circumference
                        strokeLinecap="round"
                        rotation="-90"
                        originX={scale(25)}
                        originY={scale(25)}
                      />
                    </Svg>
                    <View style={styles.progressTextContainer}>
                      <Text style={styles.progressText}>50%</Text>
                    </View>
                  </View>
              </View>

              {/* Text Content */}
              <View style={styles.personalizationText}>
                <MaskedView
                  style={styles.personalizationTitleGradient}
                  maskElement={
                    <Text style={styles.personalizationTitle}>Continue Personalization</Text>
                  }
                >
                  <LinearGradient
                    colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                    locations={[0.1479, 0.3858, 0.5196, 0.6906, 0.8913]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.personalizationTitleGradient}
                  />
                </MaskedView>
                <Text style={styles.personalizationSubtitle}>Upload Blood report for high accuracy</Text>
              </View>

              {/* Arrow */}
              <View style={styles.arrowContainer}>
                <Text style={styles.arrowIcon}><Ionicons name="chevron-forward-outline" size={24} color={COLORS.black} /></Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Settings Menu */}
        <View style={styles.settingsContainer}>
          {/* Health Section */}
          <TouchableOpacity style={styles.healthSection} onPress={handleHealthConcerns}>
            <View style={styles.healthContent}>
              <View style={styles.healthIcon}>
                <Text style={styles.healthIconText}><Ionicons name="add-outline" size={24} color={COLORS.black} /></Text>
              </View>
              <View style={styles.healthText}>
                <Text style={styles.healthTitle}>Change top concerns/diagnosis</Text>
                <View style={styles.healthDetails}>
                  <Text style={styles.healthDetail}>Concerns: #1 Acne, Bloating, Period Pain</Text>
                  <Text style={styles.healthDetail}>Diagnosis: PCOS</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuAction('Get Auvra Pro')}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}><Ionicons name="pricetag-outline" size={24} color={COLORS.black} /></Text>
              </View>
              <Text style={styles.menuText}>Get Auvra Pro</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuAction('Integration with Cycle app')}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}><Ionicons name="calendar-outline" size={24} color={COLORS.black} /></Text>
              </View>
              <Text style={styles.menuText}>Integration with Cycle app</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuAction('Invite your friend')}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}><Ionicons name="people-outline" size={24} color={COLORS.black} /></Text>
              </View>
              <Text style={styles.menuText}>Invite your friend</Text>
            </TouchableOpacity>

            {/* Notifications Toggle */}
            <View style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="notifications-outline" size={24} color={COLORS.black} />
              </View>
              <Text style={styles.menuText}>Notifications</Text>
              <TouchableOpacity 
                style={styles.toggleContainer} 
                onPress={toggleNotifications}
              >
                {notificationsEnabled ? (
                  <LinearGradient
                    colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                    locations={[0.1479, 0.3858, 0.5196, 0.6906, 0.8913]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.toggleGradient}
                  >
                    <View style={styles.toggleThumbActive} />
                  </LinearGradient>
                ) : (
                  <View style={styles.toggle}>
                    <View style={styles.toggleThumb} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Location Insights Toggle */}
            <View style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="location-outline" size={24} color={COLORS.black} />
              </View>
              <Text style={styles.menuText}>Location based insights</Text>
              <TouchableOpacity 
                style={styles.toggleContainer} 
                onPress={toggleLocationInsights}
              >
                {locationInsightsEnabled ? (
                  <LinearGradient
                    colors={['#A29AEA', '#C17EC9', '#D482B9', '#E98BAC', '#FDC6D1']}
                    locations={[0.1479, 0.3858, 0.5196, 0.6906, 0.8913]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.toggleGradient}
                  >
                    <View style={styles.toggleThumbActive} />
                  </LinearGradient>
                ) : (
                  <View style={styles.toggle}>
                    <View style={styles.toggleThumb} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuAction('Contact us')}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}><Ionicons name="chatbox-outline" size={24} color={COLORS.black} /></Text>
              </View>
              <Text style={styles.menuText}>Contact us</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuAction('Help & Support')}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}><Ionicons name="help-circle-outline" size={24} color={COLORS.black} /></Text>
              </View>
              <Text style={styles.menuText}>Help & Support</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuAction('Privacy policy')}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}><Ionicons name="lock-closed-outline" size={24} color={COLORS.black} /></Text>
              </View>
              <Text style={styles.menuText}>Privacy policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(170),
    zIndex: 0,
  },
  headerSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: verticalScale(170),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(100), // Add bottom padding to prevent content from being hidden behind navbar
  },
  profileHeader: {
    paddingTop: verticalScale(95),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
    zIndex: 1,
    position: 'relative',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: verticalScale(5),
  },
  avatar: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(23),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    // shadowColor: COLORS.black,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  editIconContainer: {
    width: scale(15),
    height: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    width: scale(13),
    height: scale(13),
    tintColor: 'rgba(0, 0, 0, 0.9)', // White at 10% opacity
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: moderateScale(22, 1.5),
    fontWeight: '600',
    fontFamily: 'serif',
    color: COLORS.black,
    marginBottom: verticalScale(3),
    textAlign: 'center',
  },
  userEmail: {
    fontSize: moderateScale(12, 1.5),
    color: COLORS.grey,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
    textAlign: 'center',
  },
  personalizationCard: {
    backgroundColor: COLORS.white,
    borderRadius: scale(12),
    padding: scale(16),
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  personalizationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    marginRight: scale(12),
  },
  progressCircle: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  progressText: {
    fontSize: moderateScale(8, 1.5),
    fontWeight: '500',
    color: '#A65D50',
    fontFamily: FONT_FAMILIES['Inter-Medium'],
  },
  personalizationText: {
    flex: 1,
  },
  personalizationTitleGradient: {
    marginBottom: verticalScale(6),
    height: moderateScale(18),
  },
  personalizationTitle: {
    fontSize: moderateScale(14, 1.5),
    fontWeight: '500',
    fontFamily: FONT_FAMILIES['Inter-Medium'],
    color: 'black',
  },
  personalizationSubtitle: {
    fontSize: moderateScale(12, 1.5),
    color: COLORS.black,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
  },
  arrowContainer: {
    marginLeft: scale(8),
  },
  arrowIcon: {
    fontSize: moderateScale(18, 1.5),
    color: COLORS.black,
    fontWeight: 'bold',
  },
  settingsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: scale(12),
    marginHorizontal: scale(20),
    marginBottom: verticalScale(20),
    padding: scale(20),
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  healthSection: {
    marginBottom: verticalScale(15),
  },
  healthContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  healthIcon: {
    width: scale(24),
    height: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(9),
  },
  healthIconText: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: COLORS.black,
  },
  healthText: {
    flex: 1,
  },
  healthTitle: {
    fontSize: moderateScale(14, 1.5),
    fontWeight: '500',
    fontFamily: FONT_FAMILIES['Inter-Medium'],
    color: COLORS.black,
    marginBottom: verticalScale(8),
  },
  healthDetails: {
    gap: verticalScale(3),
  },
  healthDetail: {
    fontSize: moderateScale(12, 1.5),
    color: COLORS.lightGrey,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
  },
  menuSection: {
    gap: verticalScale(8),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    minHeight: scale(24),
  },
  menuIcon: {
    width: scale(24),
    height: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(13),
  },
  menuIconText: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: COLORS.black,
  },
  menuText: {
    flex: 1,
    fontSize: moderateScale(14, 1.5),
    color: COLORS.black,
    fontFamily: FONT_FAMILIES['Inter-Regular'],
  },
  toggleContainer: {
    marginLeft: 'auto',
  },
  toggle: {
    width: scale(40),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    paddingHorizontal: scale(2),
  },
  toggleGradient: {
    width: scale(40),
    height: scale(20),
    borderRadius: scale(10),
    justifyContent: 'center',
    paddingHorizontal: scale(2),
  },
  toggleThumb: {
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: COLORS.white,
    alignSelf: 'flex-end',
  },
});
