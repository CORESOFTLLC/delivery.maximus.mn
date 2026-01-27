import React, { useState, useEffect, useRef } from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Switch,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { AlertCircle, Smartphone, Copy, Lock, Hash } from 'lucide-react-native';
import * as Application from 'expo-application';
import { useAuthStore } from '../stores/delivery-auth-store';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Heading, 
  Button, 
  ButtonText, 
  ButtonSpinner,
  Icon,
  ScrollView,
  Center,
} from '../components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [employeeCode, setEmployeeCode] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '', '', '']); // 8 digits
  const [formErrors, setFormErrors] = useState<{ code?: string; pin?: string }>({});
  const [deviceId, setDeviceId] = useState<string>('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Refs for PIN inputs
  const pinRefs = useRef<(TextInput | null)[]>([]);

  // Load saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedCredentials = await AsyncStorage.getItem('delivery-saved-credentials');
        if (savedCredentials) {
          const { employeeCode: savedCode, pin: savedPin, rememberMe: savedRemember } = JSON.parse(savedCredentials);
          if (savedRemember && savedCode) {
            setEmployeeCode(savedCode);
            setRememberMe(true);
            if (savedPin) {
              // Convert saved PIN string to array
              const pinArray = savedPin.split('').slice(0, 8);
              while (pinArray.length < 8) pinArray.push('');
              setPin(pinArray);
            }
          }
        }
      } catch (error) {
        console.log('Failed to load saved credentials:', error);
      }
    };
    loadSavedCredentials();
  }, []);

  useEffect(() => {
    const getDeviceId = async () => {
      if (Platform.OS === 'ios') {
        const iosId = await Application.getIosIdForVendorAsync();
        setDeviceId(iosId || 'Unknown');
      } else if (Platform.OS === 'android') {
        setDeviceId(Application.getAndroidId() || 'Unknown');
      }
    };
    getDeviceId();
  }, []);

  const validateForm = (): boolean => {
    const errors: { code?: string; pin?: string } = {};

    if (!employeeCode.trim()) {
      errors.code = 'Ажилтны код оруулна уу';
    } else if (!/^\d{8}$/.test(employeeCode.trim())) {
      errors.code = 'Ажилтны код 8 оронтой байх ёстой';
    }

    const pinValue = pin.join('');
    if (!pinValue) {
      errors.pin = 'PIN код оруулна уу';
    } else if (pinValue.length !== 8) {
      errors.pin = 'PIN код 8 оронтой байх ёстой';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePinChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Clear error when user starts typing
    if (formErrors.pin) {
      setFormErrors((prev) => ({ ...prev, pin: undefined }));
    }

    // Auto focus next input
    if (value && index < 7) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async () => {
    clearError();

    if (!validateForm()) {
      return;
    }

    const pinValue = pin.join('');
    console.log('Login attempt:', { employee_code: employeeCode.trim(), system_pin: '********' });
    
    const success = await login(employeeCode.trim(), pinValue);
    console.log('Login result:', success);

    if (success) {
      // Save or clear credentials based on rememberMe
      try {
        if (rememberMe) {
          await AsyncStorage.setItem('delivery-saved-credentials', JSON.stringify({
            employeeCode: employeeCode.trim(),
            pin: pinValue,
            rememberMe: true,
          }));
        } else {
          await AsyncStorage.removeItem('delivery-saved-credentials');
        }
      } catch (error) {
        console.log('Failed to save credentials:', error);
      }
      
      router.replace('/(tabs)/warehouse');
    }
  };

  const clearPin = () => {
    setPin(['', '', '', '', '', '', '', '']);
    pinRefs.current[0]?.focus();
  };

  return (
    <Box className="flex-1 bg-background-0">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          <Box className="px-8 py-12">
            <VStack space="2xl" className="max-w-md w-full mx-auto">
              {/* Header Section with Logo */}
              <Center className="mb-6">
                <Image 
                  source={require('../assets/logos/maximus.png')}
                  style={{ width: 120, height: 120 }}
                  resizeMode="contain"
                />
                <Heading size="2xl" className="text-typography-950 font-bold mt-4">
                  Түгээлт
                </Heading>
                <Text size="md" className="text-typography-500 text-center mt-2">
                  Хүргэлтийн менежмент систем
                </Text>
              </Center>

              {/* Error Alert */}
              {error && (
                <Box className="bg-error-50 px-4 py-3 rounded-xl border border-error-200">
                  <HStack space="sm" className="items-center">
                    <Icon as={AlertCircle} size="sm" className="text-error-600" />
                    <Text size="sm" className="text-error-600 flex-1">
                      {error}
                    </Text>
                  </HStack>
                </Box>
              )}

              {/* Form */}
              <VStack space="xl">
                {/* Employee Code Input */}
                <View>
                  <Text size="sm" className="text-typography-700 font-medium mb-2">
                    Ажилтны код
                  </Text>
                  <View style={[styles.inputContainer, formErrors.code && styles.inputError]}>
                    <Hash size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="19260001"
                      placeholderTextColor="#9CA3AF"
                      value={employeeCode}
                      onChangeText={(text) => {
                        // Only allow digits
                        const cleaned = text.replace(/\D/g, '');
                        setEmployeeCode(cleaned.slice(0, 8));
                        if (formErrors.code) {
                          setFormErrors((prev) => ({ ...prev, code: undefined }));
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={8}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                  {formErrors.code && (
                    <HStack space="xs" className="items-center mt-1">
                      <AlertCircle size={14} color="#DC2626" />
                      <Text size="xs" className="text-error-600">{formErrors.code}</Text>
                    </HStack>
                  )}

                </View>

                {/* PIN Input - 8 digits */}
                <View>
                  <HStack className="justify-between items-center mb-2">
                    <Text size="sm" className="text-typography-700 font-medium">
                      Системд нэвтрэх PIN (8 орон)
                    </Text>
                    <TouchableOpacity onPress={clearPin}>
                      <Text size="xs" className="text-primary-600">Арилгах</Text>
                    </TouchableOpacity>
                  </HStack>
                  
                  <View style={styles.pinContainer}>
                    {pin.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (pinRefs.current[index] = ref)}
                        style={[
                          styles.pinInput,
                          digit && styles.pinInputFilled,
                          formErrors.pin && styles.pinInputError,
                        ]}
                        value={digit}
                        onChangeText={(value) => handlePinChange(value.slice(-1), index)}
                        onKeyPress={(e) => handlePinKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        secureTextEntry
                        editable={!isLoading}
                        selectTextOnFocus
                      />
                    ))}
                  </View>
                  
                  {formErrors.pin && (
                    <HStack space="xs" className="items-center mt-2">
                      <AlertCircle size={14} color="#DC2626" />
                      <Text size="xs" className="text-error-600">{formErrors.pin}</Text>
                    </HStack>
                  )}

                </View>

                {/* Remember Me Toggle */}
                <HStack className="justify-between items-center">
                  <Text size="sm" className="text-typography-700">
                    Нэвтрэх мэдээлэл хадгалах
                  </Text>
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                    thumbColor={rememberMe ? '#2563EB' : '#F3F4F6'}
                    ios_backgroundColor="#D1D5DB"
                  />
                </HStack>
              </VStack>

              {/* Login Button */}
              <Button
                size="xl"
                variant="solid"
                action="primary"
                onPress={handleLogin}
                isDisabled={isLoading}
                className="rounded-xl mt-4"
              >
                {isLoading ? (
                  <>
                    <ButtonSpinner className="mr-2" color="white" />
                    <ButtonText className="text-white font-semibold text-lg">
                      Нэвтэрч байна...
                    </ButtonText>
                  </>
                ) : (
                  <ButtonText className="text-white font-semibold text-lg">
                    Нэвтрэх
                  </ButtonText>
                )}
              </Button>

              {/* Footer */}
              <VStack space="xs" className="mt-8 items-center">
                <TouchableOpacity 
                  onPress={async () => {
                    await Clipboard.setStringAsync(deviceId);
                    Alert.alert('Хуулагдлаа', 'Device ID хуулагдлаа');
                  }}
                  activeOpacity={0.7}
                >
                  <HStack space="xs" className="items-center">
                    <Icon as={Smartphone} size="xs" className="text-typography-400" />
                    <Text size="xs" className="text-typography-400">
                      Device ID: {deviceId}
                    </Text>
                    <Icon as={Copy} size="xs" className="text-typography-400" />
                  </HStack>
                </TouchableOpacity>
                <Text size="xs" className="text-typography-400">
                  Delivery Maximus v1.0.0
                </Text>
                <Text size="sm" className="text-typography-400 mt-2">
                  © 2026 MAXIMUS DISTRIBUTION LLC
                </Text>
              </VStack>
            </VStack>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    height: 52,
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#111827',
    height: '100%',
    letterSpacing: 2,
    fontWeight: '600',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  pinInput: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  pinInputFilled: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  pinInputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
});