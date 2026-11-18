import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    gradient: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingTop: 8,
        minHeight: 64,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.12)',
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: 2,
        minHeight: 48,
    },
    navLabel: {
        color: '#999',
        fontSize: 10,
    },
    navLabelActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    createButton: {
        width: 48,
        height: 48,
        marginBottom: 6,
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
    iconContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    unreadBadge: {
        position: 'absolute',
        top: -6,
        right: -8,
        backgroundColor: '#FF0000',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
        borderWidth: 2,
        borderColor: '#000000',
    },
    unreadBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
