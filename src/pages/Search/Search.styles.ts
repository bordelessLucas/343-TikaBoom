import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
        gap: 12,
    },
    backButton: {
        padding: 5,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabActive: {
        backgroundColor: '#FF0050',
    },
    tabText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    section: {
        marginTop: 24,
        marginBottom: 8,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 8,
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    userAvatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    userUsername: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginTop: 2,
    },
    userBio: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginTop: 4,
    },
    userStats: {
        alignItems: 'flex-end',
    },
    userStatNumber: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    userStatLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
    postItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 8,
    },
    postThumbnail: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
    },
    postThumbnailPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    postInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    postTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    postAuthor: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginBottom: 8,
    },
    postStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    postStatIcon: {
        marginLeft: 12,
    },
    postStatText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    hashtagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 8,
    },
    hashtagInfo: {
        flex: 1,
        marginLeft: 12,
    },
    hashtagText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    hashtagCount: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 16,
        marginTop: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
    },
});

