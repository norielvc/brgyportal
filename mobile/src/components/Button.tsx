import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const handlePress = () => {
    if (loading || disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    onPress();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          btn: { backgroundColor: colors.emerald[600], borderColor: colors.emerald[500] },
          text: { color: colors.white },
        };
      case 'secondary':
        return {
          btn: { backgroundColor: colors.slate[800], borderColor: colors.slate[700] },
          text: { color: colors.slate[100] },
        };
      case 'danger':
        return {
          btn: { backgroundColor: colors.rose[600], borderColor: colors.rose[500] },
          text: { color: colors.white },
        };
      case 'outline':
        return {
          btn: { backgroundColor: 'transparent', borderColor: colors.emerald[500], borderWidth: 1.5 },
          text: { color: colors.emerald[400] },
        };
      case 'ghost':
        return {
          btn: { backgroundColor: 'transparent', borderColor: 'transparent' },
          text: { color: colors.slate[300] },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 12, fontSize: 13, borderRadius: 8 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 24, fontSize: 16, borderRadius: 14 };
      case 'md':
      default:
        return { paddingVertical: 12, paddingHorizontal: 18, fontSize: 15, borderRadius: 10 };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyle.btn,
        {
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          borderRadius: sizeStyle.borderRadius,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyle.text.color}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              variantStyle.text,
              { fontSize: sizeStyle.fontSize, marginLeft: icon ? 8 : 0 },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
