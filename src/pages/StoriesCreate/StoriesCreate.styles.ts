import { StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    camera: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
        paddingHorizontal: 40,
    },
    permissionText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    permissionButton: {
        backgroundColor: '#FF0050',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    bottomContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    publishButton: {
        backgroundColor: '#FF0050',
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 16,
    },
    publishButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    recordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    helpText: {
        color: '#FFFFFF',
        fontSize: 13,
        maxWidth: '60%',
    },
    recordButtonOuter: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordButtonOuterActive: {
        borderColor: '#FF0050',
    },
    recordButtonInner: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#FF0050',
    },
    recordButtonInnerActive: {
        borderRadius: 10,
        width: 32,
        height: 32,
    },
});

