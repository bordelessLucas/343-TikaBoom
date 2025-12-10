import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
    container:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        width: 400,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 40,
    },
    title:{
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 40,
        textAlign: 'center',
    },
    input:{
        width: '100%',
        height: 50,
        backgroundColor: '#2d2d44',
        borderRadius: 12,
        paddingHorizontal: 16,
        color: '#FFFFFF',
        fontSize: 16,
        marginBottom: 16,
    },
    errorText:{
        color: '#FF6B6B',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
        width: '100%',
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginBottom: 16,
        marginTop: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    checkboxChecked: {
        backgroundColor: 'rgb(111, 1, 117)',
        borderColor: 'rgb(111, 1, 117)',
    },
    rememberMeText: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    loginButton:{
        width: "100%",
        height: 50,
        backgroundColor: 'rgb(111, 1, 117)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 16,
    },
    loginButtonText:{
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerLink:{
        marginTop: 16,
        paddingVertical: 8,
    },
    registerLinkText:{
        color: 'rgb(111, 1, 117)',
        textShadowColor: 'rgb(255, 255, 255)',
        textShadowOffset: {width: 0.2, height: 0.1},
        textShadowRadius: 0.6,
        fontSize: 14,
        textAlign: 'center',
    },




});