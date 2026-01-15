import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth-store';

export default function Index() {
  const { isAuthenticated } = useAuthStore();

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
