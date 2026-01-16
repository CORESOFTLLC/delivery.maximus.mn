import React from 'react';
import { ScrollView } from 'react-native';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react-native';
import { Box, VStack, HStack, Text, Heading, Pressable, Button, ButtonText } from '../../components/ui';

export default function CartScreen() {
  // Mock cart data - will be replaced with real store
  const cartItems: any[] = [];
  const cartTotal = 0;

  return (
    <Box className="flex-1 bg-background-50">
      {cartItems.length > 0 ? (
        <>
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            <VStack space="md">
              {cartItems.map((item: any) => (
                <Box key={item.id} className="bg-white rounded-2xl p-4 border border-outline-100">
                  <HStack space="md" className="items-center">
                    <Box className="w-16 h-16 bg-background-100 rounded-xl items-center justify-center">
                      <ShoppingCart size={24} color="#9CA3AF" />
                    </Box>
                    <VStack className="flex-1" space="xs">
                      <Text size="md" className="text-typography-900 font-medium">
                        {item.name}
                      </Text>
                      <Text size="sm" className="text-primary-600 font-semibold">
                        {item.price?.toLocaleString()}₮
                      </Text>
                    </VStack>
                    <HStack space="sm" className="items-center">
                      <Pressable className="w-8 h-8 bg-background-100 rounded-lg items-center justify-center">
                        <Minus size={16} color="#6B7280" />
                      </Pressable>
                      <Text size="md" className="text-typography-900 font-medium w-8 text-center">
                        {item.quantity}
                      </Text>
                      <Pressable className="w-8 h-8 bg-primary-100 rounded-lg items-center justify-center">
                        <Plus size={16} color="#2563EB" />
                      </Pressable>
                    </HStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </ScrollView>

          {/* Cart Footer */}
          <Box className="bg-white px-4 py-5 border-t border-outline-100">
            <HStack className="items-center justify-between mb-4">
              <Text size="lg" className="text-typography-600">
                Нийт дүн:
              </Text>
              <Heading size="xl" className="text-primary-600">
                {cartTotal.toLocaleString()}₮
              </Heading>
            </HStack>
            <Button size="xl" variant="solid" action="primary" className="rounded-xl">
              <ButtonText className="font-semibold">Захиалга өгөх</ButtonText>
            </Button>
          </Box>
        </>
      ) : (
        <Box className="flex-1 justify-center items-center p-6">
          <Box className="bg-primary-50 p-6 rounded-full mb-4">
            <ShoppingCart size={48} color="#2563EB" />
          </Box>
          <Heading size="lg" className="text-typography-700 text-center">
            Сагс хоосон байна
          </Heading>
          <Text size="md" className="text-typography-500 text-center mt-2">
            Бүтээгдэхүүн нэмээгүй байна
          </Text>
        </Box>
      )}
    </Box>
  );
}
