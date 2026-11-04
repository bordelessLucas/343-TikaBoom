import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#FFFFFF',
    },
    tabText: {
        color: '#999',
        fontSize: 15,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    createCard: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 10,
    },
    inputMultiline: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    createButton: {
        marginTop: 4,
        backgroundColor: '#A300A8',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginTop: 8,
    },
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    groupAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(163, 0, 168, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    groupAvatarText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    groupDescription: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginTop: 2,
    },
    interestsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    interestBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    interestText: {
        color: '#FFFFFF',
        fontSize: 11,
    },
});

