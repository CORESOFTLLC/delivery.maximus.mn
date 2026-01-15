import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface FormControlProps {
  className?: string;
  children?: React.ReactNode;
  isInvalid?: boolean;
  isDisabled?: boolean;
}

export const FormControl: React.FC<FormControlProps> = ({ 
  className = '', 
  children,
  isInvalid = false,
  isDisabled = false,
}) => {
  return (
    <View className={`${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { isInvalid, isDisabled });
        }
        return child;
      })}
    </View>
  );
};

interface FormControlLabelProps {
  className?: string;
  children?: React.ReactNode;
}

export const FormControlLabel: React.FC<FormControlLabelProps> = ({ 
  className = '',
  children 
}) => {
  return <View className={`mb-1 ${className}`}>{children}</View>;
};

interface FormControlLabelTextProps {
  className?: string;
  children?: React.ReactNode;
}

export const FormControlLabelText: React.FC<FormControlLabelTextProps> = ({ 
  className = '',
  children 
}) => {
  return <Text className={`text-sm font-medium text-typography-700 ${className}`}>{children}</Text>;
};

interface FormControlErrorProps {
  className?: string;
  children?: React.ReactNode;
}

export const FormControlError: React.FC<FormControlErrorProps> = ({ 
  className = '',
  children 
}) => {
  return <View className={`flex-row items-center mt-1 ${className}`}>{children}</View>;
};

interface FormControlErrorIconProps {
  as: React.ComponentType<any>;
  className?: string;
}

export const FormControlErrorIcon: React.FC<FormControlErrorIconProps> = ({ 
  as: IconComponent,
  className = '' 
}) => {
  return <IconComponent size={14} color="#ef4444" className={`mr-1 ${className}`} />;
};

interface FormControlErrorTextProps {
  className?: string;
  children?: React.ReactNode;
}

export const FormControlErrorText: React.FC<FormControlErrorTextProps> = ({ 
  className = '',
  children 
}) => {
  return <Text className={`text-sm text-error-500 ${className}`}>{children}</Text>;
};

export default FormControl;
