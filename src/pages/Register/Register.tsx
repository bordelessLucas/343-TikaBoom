import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from "../../routes/NavigationContext";
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

    const handleRegister = () => {
        setError("");
        
        if (!formData.name.trim()) {
            setError("Por favor, insira seu nome");
            return;
        }
    
        if (!formData.nickname.trim()) {
            setError("Por favor, insira seu nickname");
            return;
        }
    
        if (!formData.email.trim()) {
            setError("Por favor, insira seu email");
            return;
        }
    
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Por favor, insira um email válido");
            return;
        }    
        
        if (!formData.password.trim()) {
            setError("Por favor, insira sua senha");
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setError("As senhas são diferentes!");
            return;
        }    

        navigate("Login");
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
