import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 85,
        zIndex: 1000,
    },
    gradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: 4,
    },
    navLabel: {
        color: '#999',
        fontSize: 11,
    },
    navLabelActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    createButton: {
        width: 50,
        height: 50,
        marginBottom:15,
    },
    createButtonWrapper: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    createButtonContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    createButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
  
});

