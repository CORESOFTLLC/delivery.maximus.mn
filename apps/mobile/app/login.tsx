import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Image, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, User, Lock, AlertCircle, Smartphone } from 'lucide-react-native';
import * as Application from 'expo-application';
import { useAuthStore } from '../stores/auth-store';
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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string }>({});
  const [deviceId, setDeviceId] = useState<string>('');

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
    const errors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      errors.username = 'Хэрэглэгчийн нэр оруулна уу';
    }

    if (!password.trim()) {
      errors.password = 'Нууц үг оруулна уу';
    } else if (password.length < 4) {
      errors.password = 'Нууц үг хамгийн багадаа 4 тэмдэгт байх ёстой';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    clearError();

    if (!validateForm()) {
      return;
    }

    console.log('Login attempt:', { username: username.trim(), password: '***' });
    
    const success = await login(username.trim(), password);
    console.log('Login result:', success);

    if (success) {
      router.replace('/(tabs)');
    }
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
                  Нэвтрэх
                </Heading>
                <Text size="md" className="text-typography-500 text-center mt-2">
                  Байгууллагын дотоод борлуулалтын апп
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
                {/* Username Input */}
                <View>
                  <Text size="sm" className="text-typography-700 font-medium mb-2">
                    Хэрэглэгчийн нэр
                  </Text>
                  <View style={[styles.inputContainer, formErrors.username && styles.inputError]}>
                    <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="101012501"
                      placeholderTextColor="#9CA3AF"
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        if (formErrors.username) {
                          setFormErrors((prev) => ({ ...prev, username: undefined }));
                        }
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                  {formErrors.username && (
                    <HStack space="xs" className="items-center mt-1">
                      <AlertCircle size={14} color="#DC2626" />
                      <Text size="xs" className="text-error-600">{formErrors.username}</Text>
                    </HStack>
                  )}
                </View>

                {/* Password Input */}
                <View>
                  <Text size="sm" className="text-typography-700 font-medium mb-2">
                    Нууц үг
                  </Text>
                  <View style={[styles.inputContainer, formErrors.password && styles.inputError]}>
                    <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Нууц үгээ оруулна уу"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (formErrors.password) {
                          setFormErrors((prev) => ({ ...prev, password: undefined }));
                        }
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                      {showPassword ? (
                        <EyeOff size={20} color="#9CA3AF" />
                      ) : (
                        <Eye size={20} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {formErrors.password && (
                    <HStack space="xs" className="items-center mt-1">
                      <AlertCircle size={14} color="#DC2626" />
                      <Text size="xs" className="text-error-600">{formErrors.password}</Text>
                    </HStack>
                  )}
                </View>
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
                <HStack space="xs" className="items-center">
                  <Icon as={Smartphone} size="xs" className="text-typography-400" />
                  <Text size="xs" className="text-typography-400">
                    Device ID: {deviceId}
                  </Text>
                </HStack>
                <Text size="xs" className="text-typography-400">
                  App Version: 2.0.1
                </Text>
                <Text size="sm" className="text-typography-400 mt-2">
                  © 2026 Sales Maximus
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
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
});