import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 12,
    },
    backButton: {
        padding: 5,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 2,
    },
    messagesList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    messagesContent: {
        paddingBottom: 12,
    },
    messageBubble: {
        maxWidth: '80%',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginBottom: 8,
    },
    messageMine: {
        alignSelf: 'flex-end',
        backgroundColor: '#A300A8',
    },
    messageOther: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    messageSender: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        marginBottom: 2,
    },
    messageText: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginTop: 20,
        textAlign: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    input: {
        flex: 1,
        maxHeight: 80,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: '#FFFFFF',
        fontSize: 14,
        marginRight: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#A300A8',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

