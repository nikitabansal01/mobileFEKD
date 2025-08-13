import { useRouter } from "expo-router";
import { useEffect } from "react";

const Index = () => {
  const router = useRouter();

  useEffect(() => {
    // Expo Router가 완전히 초기화된 후 네비게이션 실행
    const timer = setTimeout(() => {
      router.replace("/screens/OnboardingScreen");
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null; // 빈 화면을 렌더링
};

export default Index; 