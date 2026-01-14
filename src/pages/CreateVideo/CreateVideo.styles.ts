import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    camera: {
        flex: 1,
    },
    // Permission Screen
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
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 10,
    },
    closeButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addSoundButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    addSoundText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    refreshButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Side Options
    sideOptions: {
        position: 'absolute',
        right: 12,
        top: height * 0.2,
        alignItems: 'center',
        gap: 24,
    },
    sideOption: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 22,
    },
    divider: {
        width: 30,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginVertical: 4,
    },
    // Camera Status Indicator - Discreto
    cameraStatusIndicator: {
        position: 'absolute',
        top: 110,
        alignSelf: 'center',
    },
    cameraLoadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFD700',
        opacity: 0.8,
    },
    // Recording Indicator
    recordingIndicator: {
        position: 'absolute',
        top: 110,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    recordingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF0000',
    },
    recordingTime: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Bottom Controls
    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 30,
    },
    // Duration Selection
    durationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    durationButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    durationText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 15,
        fontWeight: '600',
    },
    durationTextActive: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    captureModeButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    captureModeButtonActive: {
        backgroundColor: '#FFFFFF',
    },
    captureModeText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 'bold',
    },
    captureModeTextActive: {
        color: '#000000',
    },
    // Capture Button
    captureContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginBottom: 24,
    },
    galleryButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        position: 'relative',
    },
    galleryBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF0050',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    galleryBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    captureButton: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    captureButtonRecording: {
        borderColor: '#FF0000',
    },
    captureButtonDisabled: {
        opacity: 0.4,
        borderColor: '#999999',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
    },
    captureButtonInnerRecording: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#FF0000',
    },
    captureButtonInnerDisabled: {
        backgroundColor: '#999999',
    },
    flipButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 22,
    },
    // Bottom Menu
    bottomMenu: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    bottomMenuItem: {
        paddingVertical: 8,
    },
    bottomMenuText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: 'bold',
    },
    bottomMenuTextActive: {
        color: '#FFFFFF',
    },
    // Gallery Modal
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyGallery: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyGalleryText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
        textAlign: 'center',
    },
    emptyGallerySubtext: {
        color: '#999',
        fontSize: 14,
        marginTop: 10,
        textAlign: 'center',
    },
    galleryGrid: {
        padding: 4,
    },
    galleryItem: {
        flex: 1,
        margin: 2,
        aspectRatio: 1,
        maxWidth: width / 3 - 8,
        position: 'relative',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
    },
    mediaTypeIndicator: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationIndicator: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    videoDurationText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    // Media Detail Modal
    detailModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailModalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
    },
    detailModalContent: {
        width: width * 0.9,
        maxHeight: height * 0.8,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        overflow: 'hidden',
    },
    detailImage: {
        width: '100%',
        height: height * 0.5,
        backgroundColor: '#000000',
    },
    detailInfo: {
        padding: 20,
        gap: 12,
    },
    detailInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailInfoText: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    detailActions: {
        flexDirection: 'row',
        padding: 20,
        paddingTop: 0,
        gap: 12,
    },
    detailActionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 12,
        borderRadius: 8,
    },
    detailActionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: 'rgba(255,68,68,0.2)',
    },
    deleteButtonText: {
        color: '#FF4444',
    },
    // Live Screen Styles
    liveContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    liveHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 20,
    },
    liveCloseButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    liveSearchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 12,
    },
    liveSearchDollar: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    liveSearchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
    },
    liveSearchRec: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginLeft: 8,
    },
    liveHeaderButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    liveHeaderButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    liveControlsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 30,
        gap: 20,
    },
    liveControlButton: {
        alignItems: 'center',
        gap: 8,
    },
    liveControlText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    liveStartButtonContainer: {
        paddingHorizontal: 40,
        paddingVertical: 20,
    },
    liveStartButton: {
        backgroundColor: '#FF0050',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    liveStartButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    liveSourceContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 20,
        gap: 20,
    },
    liveSourceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    liveSourceText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

