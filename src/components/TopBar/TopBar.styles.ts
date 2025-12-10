import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        zIndex: 100,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    tabText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    tabUnderline: {
        position: 'absolute',
        bottom: 0,
        left: '20%',
        right: '20%',
        height: 2,
        backgroundColor: '#FFFFFF',
    },
    searchButton: {
        padding: 8,
        marginLeft: 10,
    },
});

