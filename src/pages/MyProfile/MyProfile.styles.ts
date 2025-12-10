import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const videoWidth = (width - 4) / 3;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    editButton: {
        padding: 5,
    },
    editActions: {
        flexDirection: 'row',
        gap: 15,
    },
    cancelButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    cancelText: {
        color: '#999',
        fontSize: 16,
    },
    saveButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    saveText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    profileSection: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    profileImageContainer: {
        marginBottom: 15,
        position: 'relative',
    },
    profileImagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    editImageOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: 'rgba(111, 1, 117, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
        paddingHorizontal: 20,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 5,
    },
    displayName: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    editInput: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
        paddingVertical: 5,
        width: '100%',
    },
    username: {
        color: '#999',
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 40,
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        color: '#999',
        fontSize: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
        paddingHorizontal: 20,
        width: '100%',
    },
    messageButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    messageButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    iconButton: {
        width: 45,
        height: 45,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    descriptionContainer: {
        paddingHorizontal: 20,
        marginBottom: 15,
        width: '100%',
    },
    description: {
        color: '#FFFFFF',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    editDescriptionInput: {
        color: '#FFFFFF',
        fontSize: 14,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
        paddingVertical: 5,
        minHeight: 60,
    },
    gridSelector: {
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    gridButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 10,
    },
    gridUnderline: {
        height: 2,
        backgroundColor: '#FFFFFF',
        marginTop: 5,
    },
    videosGrid: {
        paddingHorizontal: 2,
        paddingBottom: 100,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    videoThumbnail: {
        width: videoWidth,
        marginBottom: 2,
    },
    thumbnailContainer: {
        width: '100%',
        aspectRatio: 9 / 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 5,
    },
    thumbnailPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    videoInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 5,
    },
    viewCount: {
        color: '#FFFFFF',
        fontSize: 11,
    },
});

