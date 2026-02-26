import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from "../../routes/NavigationContext";
import { authService } from '../../services/authService';
import { styles } from './Register.styles';
const logo = require('../../../assets/tikafundo.png');

export const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        nickname: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { navigate  } = useNavigation();

    const handleRegister = async () => {
        setError("");
        setLoading(true);
        
        if (!formData.name.trim()) {
            setError("Por favor, insira seu nome");
            setLoading(false);
            return;
        }
    
        if (!formData.nickname.trim()) {
            setError("Por favor, insira seu nickname");
            setLoading(false);
            return;
        }
    
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
        
        if (formData.password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres");
            setLoading(false);
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setError("As senhas são diferentes!");
            setLoading(false);
            return;
        }

        try {
            // Registrar com Firebase (a verificação de username será feita internamente após autenticação)
            await authService.register(
                formData.email,
                formData.password,
                formData.nickname,
                formData.name
            );
            
            Alert.alert(
                'Sucesso!',
                'Conta criada com sucesso! Faça login para continuar.',
                [{ text: 'OK', onPress: () => navigate("Login") }]
            );
        } catch (error: any) {
            console.error('Erro no registro:', error);
            // Mensagens de erro mais amigáveis
            let errorMessage = error.message || "Erro ao criar conta. Tente novamente.";
            
            if (error.message?.includes('permission') || error.code === 'permission-denied') {
                errorMessage = "Erro de permissão. Verifique as regras de segurança do Firestore no Firebase Console. O usuário precisa ter permissão para criar seu próprio perfil.";
            } else if (error.message?.includes('email-already-in-use') || error.code === 'auth/email-already-in-use') {
                errorMessage = "Este email já está em uso. Tente fazer login ou use outro email.";
            } else if (error.message?.includes('weak-password') || error.code === 'auth/weak-password') {
                errorMessage = "A senha é muito fraca. Use pelo menos 6 caracteres.";
            } else if (error.message?.includes('invalid-email') || error.code === 'auth/invalid-email') {
                errorMessage = "Email inválido. Verifique o formato do email.";
            } else if (error.message?.includes('username')) {
                errorMessage = "Este username já está em uso. Escolha outro.";
            }
            
            setError(errorMessage);
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
                placeholder="Nome"
                placeholderTextColor="#999"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                autoCapitalize="words"
            />

            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
                value={formData.nickname}
                onChangeText={(text) => setFormData({ ...formData, nickname: text })}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={true}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Confirmar Senha"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry={true}
                autoCapitalize="none"
            />

            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
            >
                <Text style={styles.registerButtonText}>
                    {loading ? 'Cadastrando...' : 'Cadastrar'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigate("Login")}
            >
                <Text style={styles.loginLinkText}>
                    Já tem uma conta? Fazer login
                </Text>
            </TouchableOpacity>
        </LinearGradient>
    );
};
