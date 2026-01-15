import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';

interface AvatarProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children?: React.ReactNode;
}

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
};

export const Avatar: React.FC<AvatarProps> = ({ 
  className = '', 
  size = 'md',
  children,
}) => {
  const sizeClass = sizeMap[size];
  
  return (
    <View className={`${sizeClass} rounded-full bg-primary-500 items-center justify-center overflow-hidden ${className}`}>
      {children}
    </View>
  );
};

interface AvatarFallbackTextProps {
  className?: string;
  children?: React.ReactNode;
}

export const AvatarFallbackText: React.FC<AvatarFallbackTextProps> = ({ 
  className = '',
  children 
}) => {
  return <Text className={`text-white font-semibold ${className}`}>{children}</Text>;
};

interface AvatarImageProps {
  className?: string;
  source: ImageSourcePropType;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({ 
  className = '',
  source 
}) => {
  return <Image source={source} className={`w-full h-full ${className}`} />;
};

export default Avatar;
