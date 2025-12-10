import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './Search.styles';

export const Search = () => {
    const { navigate } = useNavigation();

    return (
        <LinearGradient
            colors={['#28002b', '#1a1a2e', '#0a0a1a']}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigate('Home')} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pesquisar</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                <MaterialIcons name="search" size={80} color="rgba(255,255,255,0.3)" />
                <Text style={styles.placeholderText}>
                    Página de pesquisa
                </Text>
                <Text style={styles.placeholderSubtext}>
                    Em breve você poderá pesquisar usuários e vídeos aqui
                </Text>
            </View>
        </LinearGradient>
    );
};

