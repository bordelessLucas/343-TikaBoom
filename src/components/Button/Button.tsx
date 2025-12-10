import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { styles } from './Button.styles';

interface ButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
}

export const Button = ({ 
    title, 
    onPress, 
    loading = false, 
    disabled = false,
    variant = 'primary' 
}: ButtonProps) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
                (disabled || loading) && styles.disabledButton
            ]}
            onPress={onPress}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text style={[
                    styles.buttonText,
                    variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

