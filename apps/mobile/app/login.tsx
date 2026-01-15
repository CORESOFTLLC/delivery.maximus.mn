import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react-native';
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
} from '../components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'И-мэйл хаяг оруулна уу';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'И-мэйл хаяг буруу байна';
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

    console.log('Login attempt:', { email: email.trim(), password: '***' });
    
    const success = await login(email.trim(), password);
    console.log('Login result:', success);

    if (success) {
      router.replace('/(tabs)');
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Box className="flex-1 bg-background-0 px-5 pt-16">
        <VStack space="xl" className="flex-1">
          {/* Header */}
          <VStack space="xs" className="mb-8">
            <Heading size="2xl" className="text-typography-900">
              Нэвтрэх
            </Heading>
            <Text size="lg" className="text-typography-500">
              Sales Maximus системд нэвтрэхийн тулд мэдээллээ оруулна уу
            </Text>
          </VStack>

          {/* Error Alert */}
          {error && (
            <Box className="bg-error-50 px-4 py-3 rounded-lg border border-error-200">
              <HStack space="sm" className="items-center">
                <Icon as={AlertCircle} size="sm" className="text-error-600" />
                <Text size="sm" className="text-error-600 flex-1">
                  {error}
                </Text>
              </HStack>
            </Box>
          )}

          {/* Form */}
          <VStack space="lg">
            {/* Email Input */}
            <View>
              <Text className="text-typography-700 font-medium mb-2">И-мэйл хаяг</Text>
              <View style={[styles.inputContainer, formErrors.email && styles.inputError]}>
                <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="example@maximus.mn"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (formErrors.email) {
                      setFormErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {formErrors.email && (
                <HStack space="xs" className="mt-1 items-center">
                  <AlertCircle size={14} color="#DC2626" />
                  <Text size="sm" className="text-error-600">{formErrors.email}</Text>
                </HStack>
              )}
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-typography-700 font-medium mb-2">Нууц үг</Text>
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
                <TouchableOpacity onPress={handleTogglePassword} style={styles.eyeButton}>
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
              {formErrors.password && (
                <HStack space="xs" className="mt-1 items-center">
                  <AlertCircle size={14} color="#DC2626" />
                  <Text size="sm" className="text-error-600">{formErrors.password}</Text>
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
            className="mt-4 rounded-lg"
          >
            {isLoading ? (
              <>
                <ButtonSpinner className="mr-2" color="white" />
                <ButtonText className="text-white font-semibold">
                  Нэвтэрч байна...
                </ButtonText>
              </>
            ) : (
              <ButtonText size="lg" className="text-white font-semibold">
                Нэвтрэх
              </ButtonText>
            )}
          </Button>

          {/* Footer */}
          <View className="mt-auto mb-8 items-center">
            <Text size="sm" className="text-typography-400">
              © 2026 Sales Maximus
            </Text>
          </View>
        </VStack>
      </Box>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    height: 56,
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
    color: '#1F2937',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
