import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { responsiveWidth, responsiveHeight, responsiveFontSize } from 'react-native-responsive-dimensions';
import AuvraCharacter from '@/components/AuvraCharacter';
import Images from "@/assets/images";
import { useRouter } from 'expo-router';
import GraphicProgesterone1 from '@/assets/images/SVG/GraphicProgesterone1';
import GraphicTestosterone1 from '@/assets/images/SVG/GraphicTestosterone1';

const ICON_INSIGHT = 'http://localhost:3845/assets/1819b895989e78684cffaac7ff874579eced7513.png';

const ResultScreen = () => {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/screens/ResultLoadingScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 스크롤 가능한 콘텐츠 */}
      <View style={styles.scrollContent}>
        <AuvraCharacter size={responsiveWidth(16)} />
        <Text style={styles.title}>{'Some of your hormone\nbuddies are feeling off'}</Text>
        <View style={styles.cardsContainer}>
          <View style={styles.hormoneCard}>
            <View style={styles.hormoneIconContainer}>
              <GraphicProgesterone1 
                width={responsiveWidth(18)} 
                height={responsiveWidth(18) * (54/68)} 
              />
            </View>
            <View style={styles.hormoneTextBlock}>
              <Text style={styles.hormoneTitle}>Progesterone <Text style={styles.hormoneSub}>The calmer</Text></Text>
              <Text style={styles.hormoneDesc}>🔻 Lower levels may be contributing to painful periods, and mood changes.</Text>
            </View>
          </View>
          <View style={styles.hormoneCard}>
            <View style={styles.hormoneIconContainer}>
              <GraphicTestosterone1 
                width={responsiveWidth(18)} 
                height={responsiveWidth(18) * (54/68)} 
            />
            </View>
            <View style={styles.hormoneTextBlock}>
              <Text style={styles.hormoneTitle}>Testosterone <Text style={styles.hormoneSub}>The titan</Text></Text>
              <Text style={styles.hormoneDesc}>🔺 Higher levels may be contributing to acne, excess hair, and mood swings — common in PCOS.</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* 하단 고정 영역 */}
      <View style={styles.bottomFixedArea}>
        <View style={styles.bottomBox}>
          {/* 분홍색 원형 배경 */}
          <View style={styles.pinkCircle} />
          <View style={styles.bottomRow}>
            <Image source={Images.IconInsight} style={styles.iconInsight} />
            <Text style={styles.bottomText}>Upload your blood report later{"\n"}for more precise analysis</Text>
          </View>
          <Image source={Images.BloodReport} style={styles.bloodReport} />
        </View>
        <TouchableOpacity style={styles.ctaButton} onPress={handleContinue}>
          <Text style={styles.ctaButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: responsiveHeight(7),
    paddingHorizontal: responsiveWidth(5),
  },
  bottomFixedArea: {
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(2),
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins600',
    fontSize: responsiveFontSize(3.3),
    color: '#bb4471',
    textAlign: 'center',
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(3),
    width: responsiveWidth(85),
    lineHeight: responsiveFontSize(4.2), // 3.5 → 4.2로 증가
    paddingVertical: 2, // 위아래 여유 공간 추가
  },
  cardsContainer: {
    width: responsiveWidth(100),
    gap: responsiveHeight(2),
    marginBottom: responsiveHeight(3),
    alignItems: 'center',
  },
  hormoneCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(185, 231, 252, 0.47)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    justifyContent: 'center',
    width: '80%',
    gap: 15,
  },
  hormoneIcon: {
    width: '20%',
    aspectRatio: 1,
    resizeMode: 'contain',
    marginRight: 10,
  },
  hormoneIconContainer: {
    width: '20%',
    aspectRatio: 1,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hormoneTextBlock: {
    flex: 1,
  },
  hormoneTitle: {
    fontFamily: 'Poppins600',
    fontSize: responsiveFontSize(1.5),
    color: '#bb4471',
  },
  hormoneSub: {
    fontFamily: 'Poppins400',
    fontSize: responsiveFontSize(1.1),
    color: '#bb4471',
  },
  hormoneDesc: {
    fontFamily: 'Poppins400',
    fontSize: responsiveFontSize(1.2),
    color: '#000',
    marginTop: 2,
  },
  bottomBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '100%', 
    height: responsiveHeight(7),
    justifyContent: 'center',
    paddingLeft : 14,
    marginBottom: responsiveHeight(2),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    borderWidth: 0.884,
    borderColor: '#FFF',
    overflow: 'hidden', // 원이 box 밖으로 안 나가게
    position: 'relative', // absolute 자식 배치용
  },
  pinkCircle: {
    position: 'absolute',
    right: '-10%', // 부모 기준 오른쪽에서 10% 삐져나오게
    width: '40%', // 부모 기준 가로 60%
    height: '200%', // 부모 기준 세로 120%
    borderRadius: 9999, // 완전한 원
    backgroundColor: '#FCE2E2',
    justifyContent: 'center',
    zIndex: 0,
  },
  bloodReport: {
    position: 'absolute',
    right: '8%',
    height: '80%',
    aspectRatio: 46/49,
    resizeMode: 'contain',
    zIndex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1, // 내용이 원 위에 오도록
  },
  iconInsight: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  bottomText: {
    fontFamily: 'Inter400',
    fontSize: responsiveFontSize(1.3),
    color: '#000',
    flex: 1,
  },
  ctaButton: {
    backgroundColor: '#bb4471',
    borderRadius: 21,
    width: responsiveWidth(80),
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#fff',
    fontFamily: 'Inter500',
    fontSize: responsiveFontSize(2),
  },
});

export default ResultScreen; 