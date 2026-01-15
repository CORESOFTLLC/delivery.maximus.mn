import React from 'react';
import { 
  TextInput, 
  TextInputProps, 
  View, 
  TouchableOpacity 
} from 'react-native';

interface InputProps extends TextInputProps {
  className?: string;
  variant?: 'outline' | 'underlined' | 'rounded';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isDisabled?: boolean;
  isInvalid?: boolean;
}

const sizeMap = {
  sm: 'h-8 text-sm px-2',
  md: 'h-10 text-base px-3',
  lg: 'h-12 text-lg px-4',
  xl: 'h-14 text-xl px-4',
};

const variantMap = {
  outline: 'border border-typography-300 rounded-lg',
  underlined: 'border-b border-typography-300',
  rounded: 'border border-typography-300 rounded-full',
};

export const Input: React.FC<InputProps> = ({ 
  className = '', 
  variant = 'outline',
  size = 'md',
  isDisabled = false,
  isInvalid = false,
  ...props 
}) => {
  const sizeClass = sizeMap[size];
  const variantClass = variantMap[variant];
  const invalidClass = isInvalid ? 'border-error-500' : '';
  const disabledClass = isDisabled ? 'opacity-50' : '';
  
  return (
    <TextInput 
      className={`${sizeClass} ${variantClass} ${invalidClass} ${disabledClass} text-typography-900 ${className}`}
      editable={!isDisabled}
      placeholderTextColor="#9ca3af"
      {...props} 
    />
  );
};

interface InputFieldProps extends TextInputProps {
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ className = '', ...props }) => {
  return (
    <TextInput 
      className={`flex-1 text-typography-900 ${className}`}
      placeholderTextColor="#9ca3af"
      {...props} 
    />
  );
};

interface InputSlotProps {
  className?: string;
  children?: React.ReactNode;
  onPress?: () => void;
}

export const InputSlot: React.FC<InputSlotProps> = ({ className = '', children, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity className={`justify-center ${className}`} onPress={onPress}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View className={`justify-center ${className}`}>{children}</View>;
};

interface InputGroupProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'outline' | 'underlined' | 'rounded';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isDisabled?: boolean;
  isInvalid?: boolean;
}

const groupSizeMap = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
  xl: 'h-14',
};

export const InputGroup: React.FC<InputGroupProps> = ({ 
  className = '', 
  children,
  variant = 'outline',
  size = 'md',
  isDisabled = false,
  isInvalid = false,
}) => {
  const sizeClass = groupSizeMap[size];
  const variantClass = variantMap[variant];
  const invalidClass = isInvalid ? 'border-error-500' : '';
  const disabledClass = isDisabled ? 'opacity-50' : '';
  
  return (
    <View className={`flex-row items-center ${sizeClass} ${variantClass} ${invalidClass} ${disabledClass} ${className}`}>
      {children}
    </View>
  );
};

export default Input;
