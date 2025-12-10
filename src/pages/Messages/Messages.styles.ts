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
    headerIcon: {
        padding: 5,
    },
    messagesList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    messageItem: {
        flexDirection: 'row',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    profileImageContainer: {
        position: 'relative',
        marginRight: 15,
    },
    profileImagePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    unreadText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    messageContent: {
        flex: 1,
        justifyContent: 'center',
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    messageUsername: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    messageTime: {
        color: '#999',
        fontSize: 12,
    },
    messageText: {
        color: '#999',
        fontSize: 14,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#FFFFFF',
    },
    tabText: {
        color: '#999',
        fontSize: 16,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    notificationsList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    notificationItem: {
        flexDirection: 'row',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        alignItems: 'flex-start',
    },
    notificationItemUnread: {
        // Sem estilo adicional para notificações não lidas
    },
    notificationIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    notificationUsername: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    notificationTime: {
        color: '#999',
        fontSize: 12,
    },
    notificationMessage: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 4,
    },
    notificationVideoTitle: {
        color: '#999',
        fontSize: 13,
        fontStyle: 'italic',
        marginTop: 2,
    },
    notificationComment: {
        color: '#999',
        fontSize: 13,
        fontStyle: 'italic',
        marginTop: 2,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF6B6B',
        marginTop: 10,
        marginLeft: 10,
    },
});

