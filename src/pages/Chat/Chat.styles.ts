import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        padding: 5,
    },
    headerInfo: {
        flex: 1,
        alignItems: 'center',
    },
    headerUsername: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerStatus: {
        color: '#999',
        fontSize: 12,
    },
    headerIcon: {
        padding: 5,
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        padding: 20,
        paddingBottom: 10,
    },
    messageContainer: {
        marginBottom: 15,
    },
    messageContainerMe: {
        alignItems: 'flex-end',
    },
    messageContainerOther: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '75%',
        borderRadius: 16,
        padding: 12,
    },
    messageBubbleMe: {
        backgroundColor: 'rgb(111, 1, 117)',
        borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 14,
        marginBottom: 4,
    },
    messageTextMe: {
        color: '#FFFFFF',
    },
    messageTextOther: {
        color: '#FFFFFF',
    },
    messageTime: {
        fontSize: 10,
        alignSelf: 'flex-end',
    },
    messageTimeMe: {
        color: 'rgba(255,255,255,0.7)',
    },
    messageTimeOther: {
        color: '#999',
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        gap: 10,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 5,
        alignItems: 'center',
        maxHeight: 100,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        maxHeight: 100,
    },
    inputIcons: {
        flexDirection: 'row',
        gap: 10,
        marginLeft: 10,
    },
    iconButton: {
        padding: 5,
    },
    sendButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgb(111, 1, 117)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});

