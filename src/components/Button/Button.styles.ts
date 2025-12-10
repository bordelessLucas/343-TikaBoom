import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    button: {
        width: '100%',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    primaryButton: {
        backgroundColor: 'rgb(111, 1, 117)',
    },
    secondaryButton: {
        backgroundColor: '#2d2d44',
        borderWidth: 1,
        borderColor: 'rgb(111, 1, 117)',
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    primaryButtonText: {
        color: '#FFFFFF',
    },
    secondaryButtonText: {
        color: '#FFFFFF',
    },
});

