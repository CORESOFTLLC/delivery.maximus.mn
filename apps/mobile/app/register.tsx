import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react-native';

const API_BASE_URL = 'https://cloud.maximus.mn';

const COLORS = {
  primary: '#111827',
  accent: '#0051FE',
  background: '#F3F4F6',
  white: '#FFFFFF',
  gray100: '#F9FAFB',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray600: '#4B5563',
  error: '#DC2626',
  success: '#059669',
  successLight: '#D1FAE5',
};

interface FormErrors {
  lastName?: string;
  firstName?: string;
  registerNumber?: string;
  email?: string;
  phone?: string;
  password?: string;
  passwordConfirm?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!lastName.trim()) errors.lastName = 'Овог оруулна уу';
    if (!firstName.trim()) errors.firstName = 'Нэр оруулна уу';
    if (!registerNumber.trim()) {
      errors.registerNumber = 'Регистрийн дугаар оруулна уу';
    } else if (!/^[А-ЯӨҮа-яөү]{2}\d{8}$/.test(registerNumber.trim())) {
      errors.registerNumber = 'Регистр буруу байна (жш: АА12345678)';
    }
    if (!email.trim()) {
      errors.email = 'И-мэйл оруулна уу';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'И-мэйл буруу байна';
    }
    if (!phone.trim()) {
      errors.phone = 'Утасны дугаар оруулна уу';
    } else if (!/^\d{8}$/.test(phone.trim())) {
      errors.phone = 'Утас 8 оронтой байх ёстой';
    }
    if (!password.trim()) {
      errors.password = 'Нууц үг оруулна уу';
    } else if (password.trim().length < 6) {
      errors.password = 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой';
    }
    if (!passwordConfirm.trim()) {
      errors.passwordConfirm = 'Нууц үгийг давтана уу';
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = 'Нууц үг таарахгүй байна';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          last_name: lastName.trim(),
          first_name: firstName.trim(),
          register_number: registerNumber.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password: password.trim(),
          password_confirmation: passwordConfirm.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstError = data?.errors
          ? Object.values(data.errors).flat()[0]
          : null;
        setSubmitError(String(firstError || data?.message || 'Бүртгэл үүсгэхэд алдаа гарлаа'));
        return;
      }

      setInviteCode(data?.data?.user?.invite_code || '');
      setIsSuccess(true);
    } catch {
      setSubmitError('Сүлжээний алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.successContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Бүртгэл амжилттай!</Text>
          <Text style={styles.successMessage}>
            Таны бүртгэлийн хүсэлт илгээгдлээ.{'\n'}
            Администратор таны бүртгэлийг баталгаажуулсны дараа{'\n'}
            <Text style={{ color: COLORS.accent, fontFamily: 'GIP-SemiBold' }}>{email}</Text>
            {'\n'}хаягт мэдэгдэл ирнэ.
          </Text>

          {inviteCode ? (
            <View style={styles.inviteCard}>
              <Text style={styles.inviteLabel}>Урилгын код</Text>
              <Text style={styles.inviteCode}>{inviteCode}</Text>
            </View>
          ) : null}

          <View style={styles.successStepsCard}>
            <Text style={styles.successStepsTitle}>Цаашид хийх зүйлс:</Text>
            {[
              'Администратор таны бүртгэлийг баталгаажуулна',
              'И-мэйл хаягт нэвтрэх мэдээлэл ирнэ',
              'Системд нэвтэрч ажиллаж эхэлнэ',
            ].map((step, i) => (
              <View key={i} style={styles.successStep}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.backToLoginBtn}
            onPress={() => router.replace('/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.backToLoginText}>Нэвтрэх хуудас руу буцах</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../assets/logos/maximus.png')}
            style={{ width: 80, height: 80 }}
            resizeMode="contain"
          />
          <Text style={styles.title}>Бүртгүүлэх</Text>
          <Text style={styles.subtitle}>
            MAXIMUS Delivery системд бүртгэлтэй болохын тулд{'\n'}
            доорх мэдээллийг бөглөнө үү
          </Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Хувийн мэдээлэл</Text>

          <InputField
            label="Овог"
            icon={User}
            value={lastName}
            onChangeText={(t) => { setLastName(t); clearError('lastName'); }}
            placeholder="Овогоо оруулна уу"
            autoCapitalize="words"
            error={formErrors.lastName}
            editable={!isSubmitting}
          />

          <InputField
            label="Нэр"
            icon={User}
            value={firstName}
            onChangeText={(t) => { setFirstName(t); clearError('firstName'); }}
            placeholder="Нэрээ оруулна уу"
            autoCapitalize="words"
            error={formErrors.firstName}
            editable={!isSubmitting}
          />

          <InputField
            label="Регистрийн дугаар"
            icon={User}
            value={registerNumber}
            onChangeText={(t) => { setRegisterNumber(t.toUpperCase()); clearError('registerNumber'); }}
            placeholder="АА12345678"
            autoCapitalize="characters"
            autoCorrect={false}
            error={formErrors.registerNumber}
            editable={!isSubmitting}
          />

          <InputField
            label="И-мэйл"
            icon={Mail}
            value={email}
            onChangeText={(t) => { setEmail(t); clearError('email'); }}
            placeholder="example@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={formErrors.email}
            editable={!isSubmitting}
          />

          <InputField
            label="Утасны дугаар"
            icon={Phone}
            value={phone}
            onChangeText={(t) => { setPhone(t.replace(/\D/g, '').slice(0, 8)); clearError('phone'); }}
            placeholder="99001122"
            keyboardType="phone-pad"
            error={formErrors.phone}
            editable={!isSubmitting}
          />

          <InputField
            label="Нууц үг"
            icon={Lock}
            value={password}
            onChangeText={(t) => { setPassword(t); clearError('password'); }}
            placeholder="Хамгийн багадаа 6 тэмдэгт"
            secureTextEntry={!showPassword}
            error={formErrors.password}
            editable={!isSubmitting}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color={COLORS.gray400} /> : <Eye size={20} color={COLORS.gray400} />}
              </TouchableOpacity>
            }
          />

          <InputField
            label="Нууц үг давтах"
            icon={Lock}
            value={passwordConfirm}
            onChangeText={(t) => { setPasswordConfirm(t); clearError('passwordConfirm'); }}
            placeholder="Нууц үгийг дахин оруулна уу"
            secureTextEntry={!showPasswordConfirm}
            error={formErrors.passwordConfirm}
            editable={!isSubmitting}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}>
                {showPasswordConfirm ? <EyeOff size={20} color={COLORS.gray400} /> : <Eye size={20} color={COLORS.gray400} />}
              </TouchableOpacity>
            }
          />

          {submitError ? (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color={COLORS.error} />
              <Text style={styles.errorBoxText}>{submitError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <View style={styles.btnRow}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.submitBtnText}>Илгээж байна...</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>Бүртгэл үүсгэх</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            Бүртгүүлснээр та{' '}
            <Text
              style={styles.termsLink}
              onPress={() => Linking.openURL('https://www.privacypolicies.com/live/70312442-12a4-4cdf-af1f-a8753c879d79')}
            >
              Нууцлалын бодлого
            </Text>
            {' '}болон{' '}
            <Text
              style={styles.termsLink}
              onPress={() => Linking.openURL('https://www.privacypolicies.com/live/795d7442-23c2-4262-889a-13de9168ac09')}
            >
              Үйлчилгээний нөхцөл
            </Text>
            -ийг зөвшөөрч байна.
          </Text>
        </View>

        {/* Login link */}
        <View style={styles.loginLinkRow}>
          <Text style={styles.loginLinkText}>Бүртгэлтэй юу?</Text>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.loginLink}>Нэвтрэх</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2026 MAXIMUS DISTRIBUTION LLC</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  function clearError(field: keyof FormErrors) {
    if (formErrors[field]) setFormErrors((p) => ({ ...p, [field]: undefined }));
  }
}

// ─── Reusable Input Component ──────────────────────────────────────────────

function InputField({
  label,
  icon: Icon,
  error,
  rightIcon,
  ...inputProps
}: {
  label: string;
  icon: any;
  error?: string;
  rightIcon?: React.ReactNode;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, !!error && styles.inputContainerError]}>
        <Icon size={18} color={COLORS.gray400} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.gray400}
          {...inputProps}
        />
        {rightIcon}
      </View>
      {error ? (
        <View style={styles.fieldErrorRow}>
          <AlertCircle size={13} color={COLORS.error} />
          <Text style={styles.fieldErrorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'GIP-Bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'GIP-SemiBold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'GIP-Medium',
    color: COLORS.gray600,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    paddingHorizontal: 12,
    height: 50,
  },
  inputContainerError: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'GIP-Regular',
    color: COLORS.primary,
    height: '100%',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  fieldErrorText: {
    fontSize: 12,
    fontFamily: 'GIP-Regular',
    color: COLORS.error,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  errorBoxText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: COLORS.error,
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'GIP-SemiBold',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  termsText: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  termsLink: {
    color: COLORS.accent,
    fontFamily: 'GIP-Medium',
  },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  loginLinkText: {
    fontSize: 14,
    fontFamily: 'GIP-Regular',
    color: COLORS.gray600,
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: COLORS.accent,
  },
  footer: {
    fontSize: 11,
    fontFamily: 'GIP-Regular',
    color: COLORS.gray400,
    textAlign: 'center',
    marginBottom: 8,
  },
  // Success screen
  successContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'GIP-Bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    fontFamily: 'GIP-Regular',
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  inviteCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: 12,
    fontFamily: 'GIP-Medium',
    color: COLORS.gray600,
    marginBottom: 6,
  },
  inviteCode: {
    fontSize: 28,
    letterSpacing: 2,
    fontFamily: 'GIP-Bold',
    color: COLORS.accent,
    textAlign: 'center',
  },
  successStepsCard: {
    backgroundColor: COLORS.successLight,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  successStepsTitle: {
    fontSize: 14,
    fontFamily: 'GIP-SemiBold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  successStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontFamily: 'GIP-Bold',
    color: COLORS.white,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'GIP-Regular',
    color: COLORS.primary,
  },
  backToLoginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginText: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: 'GIP-SemiBold',
  },
});
