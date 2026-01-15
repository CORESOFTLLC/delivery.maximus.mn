import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Users, 
  Package,
  ArrowRight,
} from 'lucide-react-native';
import { useAuthStore } from '../../stores/auth-store';
import { Box, VStack, HStack, Text, Heading, Card, Pressable } from '../../components/ui';

// Dashboard Statistics Card
function StatCard({ 
  title, 
  value, 
  change, 
  changePercent, 
  icon: Icon, 
  color 
}: { 
  title: string;
  value: string;
  change: number;
  changePercent: number;
  icon: any;
  color: string;
}) {
  const isPositive = change >= 0;
  
  return (
    <View style={styles.statCard}>
      <HStack className="justify-between items-start mb-3">
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon size={22} color={color} />
        </View>
        <HStack space="xs" className="items-center">
          {isPositive ? (
            <TrendingUp size={16} color="#10B981" />
          ) : (
            <TrendingDown size={16} color="#EF4444" />
          )}
          <Text 
            size="sm" 
            className={isPositive ? 'text-success-600' : 'text-error-600'}
          >
            {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
          </Text>
        </HStack>
      </HStack>
      <Text size="sm" className="text-typography-500 mb-1">{title}</Text>
      <Heading size="xl" className="text-typography-900">{value}</Heading>
    </View>
  );
}

// Quick Action Button
function QuickAction({ icon: Icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <Icon size={24} color="#2563EB" />
      </View>
      <Text size="sm" className="text-typography-700 mt-2 text-center">{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const stats = [
    { 
      title: 'Энэ сарын борлуулалт', 
      value: '₮45.5M', 
      change: 2500000, 
      changePercent: 5.8, 
      icon: TrendingUp,
      color: '#2563EB'
    },
    { 
      title: 'Идэвхтэй захиалга', 
      value: '156', 
      change: 12, 
      changePercent: 8.3, 
      icon: ShoppingCart,
      color: '#10B981'
    },
    { 
      title: 'Нийт харилцагч', 
      value: '1,243', 
      change: 45, 
      changePercent: 3.8, 
      icon: Users,
      color: '#8B5CF6'
    },
    { 
      title: 'Бараа төрөл', 
      value: '892', 
      change: -12, 
      changePercent: -1.3, 
      icon: Package,
      color: '#F59E0B'
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <Box className="px-4 pt-4 pb-6 bg-primary-600">
        <VStack space="xs">
          <Text size="md" className="text-white opacity-80">Тавтай морил 👋</Text>
          <Heading size="xl" className="text-white">{user?.name || 'Хэрэглэгч'}</Heading>
        </VStack>
      </Box>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <HStack className="justify-between items-center mb-4 px-4">
          <Heading size="md" className="text-typography-900">Түргэн үйлдэл</Heading>
          <Pressable>
            <HStack space="xs" className="items-center">
              <Text size="sm" className="text-primary-600">Бүгдийг харах</Text>
              <ArrowRight size={16} color="#2563EB" />
            </HStack>
          </Pressable>
        </HStack>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
          <QuickAction icon={ShoppingCart} label="Шинэ захиалга" onPress={() => {}} />
          <QuickAction icon={Users} label="Харилцагч" onPress={() => {}} />
          <QuickAction icon={Package} label="Бараа хайх" onPress={() => {}} />
          <QuickAction icon={TrendingUp} label="Тайлан" onPress={() => {}} />
        </ScrollView>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Heading size="md" className="text-typography-900 mb-4 px-4">Сүүлийн үйл ажиллагаа</Heading>
        <VStack space="sm" className="px-4">
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <VStack className="flex-1 ml-3">
                <Text size="sm" className="text-typography-800 font-medium">
                  Захиалга #{1000 + index} баталгаажсан
                </Text>
                <Text size="xs" className="text-typography-500">
                  2 цагийн өмнө
                </Text>
              </VStack>
              <Text size="sm" className="text-success-600 font-medium">
                ₮{(125000 + index * 50000).toLocaleString()}
              </Text>
            </View>
          ))}
        </VStack>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  statsContainer: {
    marginTop: -20,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 24,
  },
  quickActionsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  quickAction: {
    width: 80,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
});
