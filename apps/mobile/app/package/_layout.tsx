import { Stack } from 'expo-router';

export default function PackageLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontFamily: 'GIP-SemiBold',
          fontSize: 17,
        },
        headerTintColor: '#1F2937',
        headerShadowVisible: false,
        headerBackVisible: false,
      }}
    />
  );
}
