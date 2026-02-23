import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "../../routes/NavigationContext";
import { authService } from '../../services/authService';
import { styles } from '../Login/Login.styles';
const logo = require('../../../assets/tikafundo.png');
	
export const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const {navigate} = useNavigation();

    // Carregar credenciais salvas ao abrir a tela
    useEffect(() => {
        loadSavedCredentials();
    }, []);

    const loadSavedCredentials = async () => {
        try {
            const savedEmail = await AsyncStorage.getItem('savedEmail');
            const savedPassword = await AsyncStorage.getItem('savedPassword');
            const rememberMeValue = await AsyncStorage.getItem('rememberMe');

            if (rememberMeValue === 'true' && savedEmail && savedPassword) {
                setFormData({
                    email: savedEmail,
                    password: savedPassword,
                });
                setRememberMe(true);
            }
        } catch (error) {
            console.log('Erro ao carregar credenciais:', error);
        }
    };
    const handleLogin = async () => {
        setError("");
        setLoading(true);
        
        if (!formData.email.trim()) {
            setError("Por favor, insira seu email");
            setLoading(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Por favor, insira um email válido");
            setLoading(false);
            return;
        }

        if (!formData.password.trim()) {
            setError("Por favor, insira sua senha");
            setLoading(false);
            return;
        }

        try {
            // Login com Firebase
            await authService.login(formData.email, formData.password);
            
            // Salvar ou remover credenciais baseado no "Manter login"
            if (rememberMe) {
                await AsyncStorage.setItem('savedEmail', formData.email);
                await AsyncStorage.setItem('savedPassword', formData.password);
                await AsyncStorage.setItem('rememberMe', 'true');
            } else {
                await AsyncStorage.removeItem('savedEmail');
                await AsyncStorage.removeItem('savedPassword');
                await AsyncStorage.setItem('rememberMe', 'false');
            }
            
            navigate("Home");
        } catch (error: any) {
            setError(error.message || "Erro ao fazer login. Verifique suas credenciais.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#28002b', '#1a1a2e', '#0a0a1a']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Image source={logo} style={styles.logo} />
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput 
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
                secureTextEntry={true}
                autoCapitalize="none"
            />
            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}
            
            {/* Checkbox de Manter Login */}
            <TouchableOpacity 
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
            >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && (
                        <MaterialIcons name="check" size={16} color="#FFFFFF" />
                    )}
                </View>
                <Text style={styles.rememberMeText}>Manter login</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
            >
                <Text style={styles.loginButtonText}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigate("Register")}
            >
                <Text style={styles.registerLinkText}>
                    Não tem uma conta? Cadastre-se
                </Text>
            </TouchableOpacity>
        </LinearGradient>
    );
};

