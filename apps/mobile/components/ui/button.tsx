import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  Text,
  ActivityIndicator,
  View 
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  className?: string;
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  action?: 'primary' | 'secondary' | 'positive' | 'negative';
  isDisabled?: boolean;
  isLoading?: boolean;
}

const sizeMap = {
  sm: 'h-8 px-3',
  md: 'h-10 px-4',
  lg: 'h-12 px-6',
  xl: 'h-14 px-8',
};

const getVariantStyles = (variant: string, action: string) => {
  if (variant === 'solid') {
    switch (action) {
      case 'primary': return 'bg-primary-600 active:bg-primary-700';
      case 'secondary': return 'bg-typography-600 active:bg-typography-700';
      case 'positive': return 'bg-success-600 active:bg-success-700';
      case 'negative': return 'bg-error-600 active:bg-error-700';
      default: return 'bg-primary-600 active:bg-primary-700';
    }
  }
  if (variant === 'outline') {
    return 'bg-transparent border border-primary-600';
  }
  if (variant === 'ghost') {
    return 'bg-transparent';
  }
  return '';
};

export const Button: React.FC<ButtonProps> = ({ 
  className = '', 
  variant = 'solid',
  size = 'md',
  action = 'primary',
  isDisabled = false,
  isLoading = false,
  children,
  ...props 
}) => {
  const sizeClass = sizeMap[size];
  const variantClass = getVariantStyles(variant, action);
  const disabledClass = isDisabled ? 'opacity-50' : '';
  
  return (
    <TouchableOpacity 
      className={`flex-row items-center justify-center rounded-lg ${sizeClass} ${variantClass} ${disabledClass} ${className}`}
      disabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading && <ActivityIndicator color="white" className="mr-2" />}
      {children}
    </TouchableOpacity>
  );
};

interface ButtonTextProps {
  className?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const textSizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export const ButtonText: React.FC<ButtonTextProps> = ({ 
  className = '', 
  size = 'md',
  children 
}) => {
  const sizeClass = textSizeMap[size];
  return (
    <Text 
      className={`${sizeClass} font-semibold text-white ${className}`}
      style={{ fontFamily: 'GIP-SemiBold' }}
    >
      {children}
    </Text>
  );
};

interface ButtonSpinnerProps {
  className?: string;
  color?: string;
}

export const ButtonSpinner: React.FC<ButtonSpinnerProps> = ({ 
  className = '',
  color = 'white' 
}) => {
  return <ActivityIndicator color={color} className={className} />;
};

interface ButtonIconProps {
  className?: string;
  as: React.ComponentType<any>;
  size?: number;
  color?: string;
}

export const ButtonIcon: React.FC<ButtonIconProps> = ({ 
  className = '',
  as: IconComponent,
  size = 20,
  color = 'white'
}) => {
  return <IconComponent size={size} color={color} className={className} />;
};

export default Button;
