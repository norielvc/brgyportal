import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'approved' | 'pending' | 'rejected' | 'review' | 'released' | 'high' | 'medium' | 'low' | 'default';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
}) => {
  const getBadgeStyle = () => {
    switch (variant.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'settled':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          text: colors.emerald[400],
          border: 'rgba(16, 185, 129, 0.3)',
        };
      case 'pending':
      case 'under_review':
      case 'active':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          text: colors.amber[500],
          border: 'rgba(245, 158, 11, 0.3)',
        };
      case 'rejected':
      case 'high':
      case 'urgent':
        return {
          bg: 'rgba(244, 63, 94, 0.15)',
          text: colors.rose[500],
          border: 'rgba(244, 63, 94, 0.3)',
        };
      case 'released':
      case 'claimed':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          text: colors.purple[500],
          border: 'rgba(168, 85, 247, 0.3)',
        };
      case 'medium':
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          text: colors.blue[500],
          border: 'rgba(59, 130, 246, 0.3)',
        };
      case 'low':
        return {
          bg: 'rgba(100, 116, 139, 0.15)',
          text: colors.slate[400],
          border: 'rgba(100, 116, 139, 0.3)',
        };
      default:
        return {
          bg: 'rgba(100, 116, 139, 0.15)',
          text: colors.slate[300],
          border: 'rgba(100, 116, 139, 0.3)',
        };
    }
  };

  const style = getBadgeStyle();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: style.bg,
          borderColor: style.border,
          paddingHorizontal: isSm ? 6 : 10,
          paddingVertical: isSm ? 2 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: style.text,
            fontSize: isSm ? 10 : 12,
            textTransform: 'uppercase',
          },
        ]}
      >
        {label.replace(/_/g, ' ')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
