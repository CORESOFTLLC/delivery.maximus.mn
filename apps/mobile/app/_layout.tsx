import '../global.css';
import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useFonts } from 'expo-font';
import { GluestackUIProvider, Box, VStack, HStack, Text, Heading, Button, ButtonText } from '../components/ui';
import { MapPin, AlertTriangle, RefreshCw } from 'lucide-react-native';

export default function RootLayout() {
  // Load GIP fonts
  const [fontsLoaded] = useFonts({
    'GIP-Thin': require('../assets/fonts/GIP-Thin.otf'),
    'GIP-UltraLight': require('../assets/fonts/GIP-UltraLight.otf'),
    'GIP-Light': require('../assets/fonts/GIP-Light.otf'),
    'GIP-Regular': require('../assets/fonts/GIP-Regular.otf'),
    'GIP-Medium': require('../assets/fonts/GIP-Medium.otf'),
    'GIP-SemiBold': require('../assets/fonts/GIP-SemiBold.otf'),
    'GIP-Bold': require('../assets/fonts/GIP-Bold.otf'),
    'GIP-ExtraBold': require('../assets/fonts/GIP-ExtraBold.otf'),
    'GIP-Heavy': require('../assets/fonts/GIP-Heavy.otf'),
    'GIP-Black': require('../assets/fonts/GIP-Black.otf'),
  });

  const [locationStatus, setLocationStatus] = useState<'checking' | 'granted' | 'denied' | 'error'>('checking');
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const checkAndRequestLocation = async () => {
    setLocationStatus('checking');
    setErrorMessage('');
    
    try {
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setLocationStatus('error');
        setErrorMessage('GPS унтраалттай байна. Тохиргоо хэсгээс GPS асаана уу.');
        return;
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        setErrorMessage('Байршил авах зөвшөөрөл олгогдоогүй байна.');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation(location);
      setLocationStatus('granted');
      console.log('Location obtained:', location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Location error:', error);
      setLocationStatus('error');
      setErrorMessage('Байршил авахад алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  useEffect(() => {
    checkAndRequestLocation();
  }, []);

  // Show loading screen while fonts or location loading
  if (!fontsLoaded || locationStatus === 'checking') {
    return (
      <SafeAreaProvider>
        <GluestackUIProvider mode="light">
          <StatusBar style="auto" />
          <Box className="flex-1 bg-white justify-center items-center p-6">
            <VStack space="lg" className="items-center">
              <Box className="bg-primary-100 p-6 rounded-full">
                <MapPin size={48} color="#2563EB" />
              </Box>
              <ActivityIndicator size="large" color="#2563EB" />
              <Heading size="xl" className="text-typography-900 text-center">
                Байршил шалгаж байна...
              </Heading>
              <Text size="md" className="text-typography-500 text-center">
                GPS байршил тодорхойлж байна
              </Text>
            </VStack>
          </Box>
        </GluestackUIProvider>
      </SafeAreaProvider>
    );
  }

  // Show error screen if location denied or error
  if (locationStatus === 'denied' || locationStatus === 'error') {
    return (
      <SafeAreaProvider>
        <GluestackUIProvider mode="light">
          <StatusBar style="auto" />
          <Box className="flex-1 bg-white justify-center items-center p-6">
            <VStack space="lg" className="items-center">
              <Box className="bg-warning-100 p-6 rounded-full">
                <AlertTriangle size={48} color="#D97706" />
              </Box>
              <Heading size="xl" className="text-typography-900 text-center">
                Байршил шаардлагатай
              </Heading>
              <Text size="md" className="text-typography-500 text-center px-4">
                {errorMessage}
              </Text>
              <Button
                size="lg"
                variant="solid"
                action="primary"
                onPress={checkAndRequestLocation}
                className="rounded-xl mt-4"
              >
                <HStack space="sm" className="items-center">
                  <RefreshCw size={20} color="white" />
                  <ButtonText className="text-white font-semibold">
                    Дахин оролдох
                  </ButtonText>
                </HStack>
              </Button>
            </VStack>
          </Box>
        </GluestackUIProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GluestackUIProvider mode="light">
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}
