import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  TrendingUp,
  TrendingDown,
  LogOut,
  Shield,
  Home,
  BarChart3,
  Target,
} from 'lucide-react-native';
import { useAuthStore } from '../stores/auth-store';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  ButtonText,
  Icon,
  Card,
  Avatar,
  AvatarFallbackText,
  Progress,
  ProgressFilledTrack,
  ScrollView,
  Pressable,
} from '../components/ui';

// Types for dashboard data
interface Investment {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercentage: number;
  value: number;
}

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  icon: string;
}

// Mock data
const mockInvestments: Investment[] = [
  {
    id: '1',
    symbol: 'БОРЛУУЛАЛТ',
    name: 'Энэ сарын борлуулалт',
    currentPrice: 45_500_000,
    change: 2_500_000,
    changePercentage: 5.8,
    value: 45_500_000,
  },
  {
    id: '2',
    symbol: 'ЗАХИАЛГА',
    name: 'Идэвхтэй захиалга',
    currentPrice: 156,
    change: 12,
    changePercentage: 8.3,
    value: 156,
  },
  {
    id: '3',
    symbol: 'ХАРИЛЦАГЧ',
    name: 'Нийт харилцагч',
    currentPrice: 1243,
    change: 45,
    changePercentage: 3.8,
    value: 1243,
  },
];

const mockFinancialGoals: FinancialGoal[] = [
  {
    id: '1',
    title: 'Сарын зорилт',
    targetAmount: 100_000_000,
    currentAmount: 45_500_000,
    progress: 45.5,
    icon: 'target',
  },
  {
    id: '2',
    title: 'Шинэ харилцагч',
    targetAmount: 50,
    currentAmount: 32,
    progress: 64,
    icon: 'trending-up',
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<'portfolio' | 'goals'>('portfolio');

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) {
      return `₮${(amount / 1_000_000).toFixed(1)}M`;
    }
    return `₮${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getGoalIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield':
        return Shield;
      case 'home':
        return Home;
      case 'trending-up':
        return BarChart3;
      default:
        return Target;
    }
  };

  return (
    <Box className="flex-1 bg-background-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Box className="px-4 pt-12 pb-8">
          <VStack space="xl">
            {/* Header with Welcome */}
            <HStack className="justify-between items-center">
              <VStack space="xs">
                <Text size="lg" className="text-typography-500">
                  Тавтай морил 👋
                </Text>
                <Heading size="xl" className="text-typography-900">
                  {user?.name || 'Хэрэглэгч'}
                </Heading>
              </VStack>
              <HStack space="md" className="items-center">
                <Avatar size="md" className="bg-primary-500">
                  <AvatarFallbackText>
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallbackText>
                </Avatar>
                <Pressable onPress={handleLogout}>
                  <Icon as={LogOut} size="lg" className="text-typography-500" />
                </Pressable>
              </HStack>
            </HStack>

            {/* Portfolio Overview */}
            <Card
              size="lg"
              variant="elevated"
              className="p-5 bg-primary-600 rounded-2xl"
            >
              <VStack space="lg">
                <HStack className="justify-between items-center">
                  <VStack space="xs">
                    <Text size="md" className="text-white opacity-80">
                      Нийт борлуулалт
                    </Text>
                    <Heading size="2xl" className="text-white">
                      ₮125,430,500
                    </Heading>
                  </VStack>
                  <VStack className="items-end">
                    <HStack space="xs" className="items-center">
                      <Icon as={TrendingUp} size="sm" className="text-success-300" />
                      <Text size="sm" className="text-success-300">
                        +₮15,430,500 (+14.02%)
                      </Text>
                    </HStack>
                    <Text size="xs" className="text-white opacity-60">
                      Өнгөрсөн сартай харьцуулахад
                    </Text>
                  </VStack>
                </HStack>

                <HStack space="lg">
                  <VStack className="flex-1">
                    <Text size="sm" className="text-white opacity-60">
                      Өнөөдөр
                    </Text>
                    <HStack space="xs" className="items-center">
                      <Icon as={TrendingUp} size="xs" className="text-success-300" />
                      <Text size="lg" className="text-white font-semibold">
                        +₮1,250,750
                      </Text>
                    </HStack>
                  </VStack>
                  <VStack className="flex-1">
                    <Text size="sm" className="text-white opacity-60">
                      Захиалга
                    </Text>
                    <Text size="lg" className="text-white font-semibold">
                      156 ширхэг
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </Card>

            {/* Tab Navigation */}
            <HStack space="lg" className="border-b border-typography-200">
              <Pressable
                onPress={() => setSelectedTab('portfolio')}
                className={`pb-3 border-b-2 ${
                  selectedTab === 'portfolio' ? 'border-primary-600' : 'border-transparent'
                }`}
              >
                <Text
                  size="md"
                  className={`font-medium ${
                    selectedTab === 'portfolio' ? 'text-primary-600' : 'text-typography-500'
                  }`}
                >
                  Үзүүлэлтүүд
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedTab('goals')}
                className={`pb-3 border-b-2 ${
                  selectedTab === 'goals' ? 'border-primary-600' : 'border-transparent'
                }`}
              >
                <Text
                  size="md"
                  className={`font-medium ${
                    selectedTab === 'goals' ? 'text-primary-600' : 'text-typography-500'
                  }`}
                >
                  Зорилтууд
                </Text>
              </Pressable>
            </HStack>

            {/* Portfolio Tab */}
            {selectedTab === 'portfolio' && (
              <VStack space="lg">
                <Heading size="lg" className="text-typography-900">
                  Үндсэн үзүүлэлтүүд
                </Heading>

                <VStack space="md">
                  {mockInvestments.map((item) => (
                    <Card
                      key={item.id}
                      size="md"
                      variant="elevated"
                      className="p-4 rounded-xl bg-white"
                    >
                      <HStack space="md" className="items-center">
                        <Box className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center">
                          <Text size="xs" className="text-primary-700 font-bold">
                            {item.symbol.charAt(0)}
                          </Text>
                        </Box>
                        <VStack className="flex-1">
                          <HStack className="justify-between items-center">
                            <VStack>
                              <Text size="md" className="text-typography-900 font-semibold">
                                {item.symbol}
                              </Text>
                              <Text size="sm" className="text-typography-500">
                                {item.name}
                              </Text>
                            </VStack>
                            <VStack className="items-end">
                              <Text size="md" className="text-typography-900 font-semibold">
                                {item.value >= 1000
                                  ? formatCurrency(item.value)
                                  : formatNumber(item.value)}
                              </Text>
                              <HStack space="xs" className="items-center">
                                <Icon
                                  as={item.change >= 0 ? TrendingUp : TrendingDown}
                                  size="xs"
                                  className={item.change >= 0 ? 'text-success-600' : 'text-error-600'}
                                />
                                <Text
                                  size="sm"
                                  className={item.change >= 0 ? 'text-success-600' : 'text-error-600'}
                                >
                                  {formatPercentage(item.changePercentage)}
                                </Text>
                              </HStack>
                            </VStack>
                          </HStack>
                        </VStack>
                      </HStack>
                    </Card>
                  ))}
                </VStack>
              </VStack>
            )}

            {/* Goals Tab */}
            {selectedTab === 'goals' && (
              <VStack space="lg">
                <Heading size="lg" className="text-typography-900">
                  Зорилтууд
                </Heading>

                <VStack space="md">
                  {mockFinancialGoals.map((goal) => (
                    <Card
                      key={goal.id}
                      size="md"
                      variant="elevated"
                      className="p-4 rounded-xl bg-white"
                    >
                      <HStack space="md" className="items-center">
                        <Box className="w-12 h-12 bg-background-100 rounded-full items-center justify-center">
                          <Icon
                            as={getGoalIcon(goal.icon)}
                            size="lg"
                            className="text-typography-900"
                          />
                        </Box>

                        <VStack space="md" className="flex-1">
                          <HStack className="justify-between items-center">
                            <Text size="md" className="text-typography-900 font-semibold">
                              {goal.title}
                            </Text>
                            <Text size="sm" className="text-typography-900 font-semibold">
                              {goal.progress.toFixed(0)}%
                            </Text>
                          </HStack>
                          <Text size="sm" className="text-typography-500">
                            {goal.currentAmount >= 1000000
                              ? formatCurrency(goal.currentAmount)
                              : formatNumber(goal.currentAmount)}{' '}
                            /{' '}
                            {goal.targetAmount >= 1000000
                              ? formatCurrency(goal.targetAmount)
                              : formatNumber(goal.targetAmount)}
                          </Text>
                          <Progress value={goal.progress} size="sm" className="bg-background-200">
                            <ProgressFilledTrack className="bg-primary-600" value={goal.progress} />
                          </Progress>
                        </VStack>
                      </HStack>
                    </Card>
                  ))}
                </VStack>
              </VStack>
            )}
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
