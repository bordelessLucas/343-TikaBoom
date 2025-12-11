import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './BottomNavigation.styles';

export const BottomNavigation = () => {
    const { currentScreen, navigate } = useNavigation();

    const navItems = [
        { id: 'home', label: 'Início', icon: 'home', screen: 'Home' as const },
        { id: 'friends', label: 'Amigos', icon: 'people', screen: 'Friends' as const },
        { id: 'create', label: '', icon: 'add', screen: 'CreateVideo' as const },
        { id: 'messages', label: 'Mensagens', icon: 'message', screen: 'Messages' as const },
        { id: 'profile', label: 'Perfil', icon: 'person', screen: 'MyProfile' as const },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.98)']}
                style={styles.gradient}
            >
                {navItems.map((item) => {
                    const isActive = currentScreen === item.screen;
                    const isCreate = item.id === 'create';

                    if (isCreate) {
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.createButton}
                                onPress={() => item.screen && navigate(item.screen)}
                            >
                                <View style={styles.createButtonWrapper}>
                                    <View style={styles.createButtonContainer}>
                                        <LinearGradient
                                            colors={['#FFFFFF', '#FFFFFF']}
                                            style={styles.createButtonGradient}
                                        >
                                            <MaterialIcons name="add" size={28} color="#000000" />
                                        </LinearGradient>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.navItem}
                            onPress={() => item.screen && navigate(item.screen)}
                            disabled={!item.screen}
                        >
                            <MaterialIcons
                                name={item.icon as any}
                                size={24}
                                color={isActive ? '#FFFFFF' : '#999'}
                            />
                            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </LinearGradient>
        </View>
    );
};

