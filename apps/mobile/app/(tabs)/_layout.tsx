import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Briefcase, Clock, Menu, X, Wallet, CalendarClock } from 'lucide-react-native';
import { Text, VStack, HStack, Heading, Pressable, Box } from '../../components/ui';
import { useAuthStore } from '../../stores/auth-store';

// Drawer Menu Component
function DrawerMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, logout } = useAuthStore();

  if (!isOpen) return null;

  const menuItems = [
    { icon: Wallet, label: 'Санхүү', route: '/finance' },
    { icon: CalendarClock, label: 'Цаг бүртгэл', route: '/attendance' },
  ];

  return (
    <View style={styles.drawerOverlay}>
      <TouchableOpacity style={styles.drawerBackdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.drawerContent}>
        {/* Header */}
        <View style={styles.drawerHeader}>
          <HStack className="items-center justify-between w-full">
            <VStack>
              <Heading size="lg" className="text-typography-900">
                {user?.name || 'Хэрэглэгч'}
              </Heading>
              <Text size="sm" className="text-typography-500">
                {user?.email || ''}
              </Text>
            </VStack>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </HStack>
        </View>

        {/* Menu Items */}
        <VStack className="flex-1 mt-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => {
                onClose();
                // Navigate to route
              }}
            >
              <HStack space="md" className="items-center">
                <View style={styles.menuIconContainer}>
                  <item.icon size={22} color="#2563EB" />
                </View>
                <Text size="lg" className="text-typography-800 font-medium">
                  {item.label}
                </Text>
              </HStack>
            </TouchableOpacity>
          ))}
        </VStack>

        {/* Logout */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            logout();
            onClose();
          }}
        >
          <Text className="text-error-600 font-semibold">Гарах</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.headerMenuButton}
              onPress={() => setDrawerOpen(true)}
            >
              <Menu size={24} color="#1F2937" />
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Нүүр',
            headerTitle: 'MAXIMUS Sales',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="work"
          options={{
            title: 'Ажил',
            headerTitle: 'Ажлын жагсаалт',
            tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'Ирц',
            headerTitle: 'Цаг бүртгэл',
            tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
          }}
        />
      </Tabs>
      
      <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 85,
    paddingTop: 8,
    paddingBottom: 25,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerMenuButton: {
    marginLeft: 16,
    padding: 8,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  drawerHeader: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});
