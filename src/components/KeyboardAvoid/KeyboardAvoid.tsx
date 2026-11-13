import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Quando false, não usa ScrollView (ex.: chat com lista própria) */
  scroll?: boolean;
  offset?: number;
};

/**
 * Evita o teclado cobrir inputs em iOS/Android.
 */
export function KeyboardAvoid({
  children,
  style,
  contentContainerStyle,
  scroll = true,
  offset = Platform.OS === 'ios' ? 12 : 0,
}: Props) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.grow, contentContainerStyle]}
          bounces={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    width: '100%',
  },
  grow: {
    flexGrow: 1,
  },
});
