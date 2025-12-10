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
    headerRight: {
        flexDirection: 'row',
        gap: 15,
    },
    headerIcon: {
        padding: 5,
    },
    profileSection: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    profileImageContainer: {
        marginBottom: 15,
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
    profileInfo: {
        alignItems: 'center',
        marginBottom: 20,
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
    followButton: {
        flex: 0.8,
        flexDirection: 'row',
        backgroundColor: 'rgba(163, 0, 168, 0.49)',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    followButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    messageButton: {
        flex: 0.8,
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    messageButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
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
        alignItems: 'center',
    },
    description: {
        color: '#FFFFFF',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    liveContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 20,
    },
    liveIcon: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF0000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    liveText: {
        color: '#FF0000',
        fontSize: 14,
        fontWeight: 'bold',
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
    watchedContainer: {
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    thumbnailPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    playIconContainer: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 20,
        height: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    watchedOverlay: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    watchedText: {
        color: '#FFFFFF',
        fontSize: 12,
        marginTop: 5,
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

