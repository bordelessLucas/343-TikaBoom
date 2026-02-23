import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { auth } from '../../lib/firebaseconfig';
import { authService } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './Settings.styles';

export const Settings = () => {
    const { navigate } = useNavigation();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [commentsNotifications, setCommentsNotifications] = useState(true);
    const [likesNotifications, setLikesNotifications] = useState(true);
    const [messagesNotifications, setMessagesNotifications] = useState(true);

    const handleLogout = () => {
        Alert.alert(
            'Sair da Conta',
            'Tem certeza que deseja sair?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authService.logout();
                            await AsyncStorage.removeItem('currentChatId');
                            await AsyncStorage.removeItem('currentChatOtherUser');
                            await AsyncStorage.removeItem('savedEmail');
                            await AsyncStorage.removeItem('savedPassword');
                            await AsyncStorage.removeItem('rememberMe');
                            navigate('Login');
                        } catch (error: any) {
                            console.error('Erro ao fazer logout:', error);
                            Alert.alert('Erro', error.message || 'Não foi possível fazer logout');
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Excluir Conta',
            'Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente excluídos.',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Confirmação Final',
                            'Tem CERTEZA ABSOLUTA que deseja excluir sua conta?',
                            [
                                {
                                    text: 'Cancelar',
                                    style: 'cancel',
                                },
                                {
                                    text: 'Sim, excluir',
                                    style: 'destructive',
                                    onPress: () => {
                                        Alert.alert('Em desenvolvimento', 'Esta funcionalidade estará disponível em breve.');
                                    },
                                },
                            ]
                        );
                    },
                },
            ]
        );
    };

    const handlePrivacyPolicy = () => {
        Alert.alert('Política de Privacidade', 'Abrindo política de privacidade...');
        // Linking.openURL('https://example.com/privacy');
    };

    const handleTermsOfService = () => {
        Alert.alert('Termos de Serviço', 'Abrindo termos de serviço...');
        // Linking.openURL('https://example.com/terms');
    };

    const handleAbout = () => {
        Alert.alert(
            'Sobre o TikaBoom',
            'Versão 1.0.0\n\nUma plataforma de vídeos curtos para compartilhar seus momentos especiais.',
            [{ text: 'OK' }]
        );
    };

    const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );

    const SettingItem = ({ 
        icon, 
        title, 
        subtitle, 
        onPress, 
        rightComponent,
        showArrow = true 
    }: { 
        icon: string; 
        title: string; 
        subtitle?: string; 
        onPress?: () => void;
        rightComponent?: React.ReactNode;
        showArrow?: boolean;
    }) => (
        <TouchableOpacity 
            style={styles.settingItem} 
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.settingItemLeft}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name={icon as any} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.settingItemText}>
                    <Text style={styles.settingItemTitle}>{title}</Text>
                    {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            {rightComponent || (showArrow && onPress && (
                <MaterialIcons name="chevron-right" size={24} color="#999" />
            ))}
        </TouchableOpacity>
    );

    const SwitchItem = ({ 
        icon, 
        title, 
        subtitle, 
        value, 
        onValueChange 
    }: { 
        icon: string; 
        title: string; 
        subtitle?: string; 
        value: boolean; 
        onValueChange: (value: boolean) => void;
    }) => (
        <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name={icon as any} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.settingItemText}>
                    <Text style={styles.settingItemTitle}>{title}</Text>
                    {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#3e3e3e', true: '#6F0175' }}
                thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
            />
        </View>
    );

    return (
        <LinearGradient
            colors={['#28002b', '#1a1a2e', '#0a0a1a']}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigate('MyProfile')} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configurações</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Notificações */}
                <SettingSection title="Notificações">
                    <SwitchItem
                        icon="notifications"
                        title="Notificações"
                        subtitle="Ativar todas as notificações"
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                    />
                    {notificationsEnabled && (
                        <>
                            <SwitchItem
                                icon="notifications-active"
                                title="Notificações Push"
                                subtitle="Receber notificações no dispositivo"
                                value={pushNotifications}
                                onValueChange={setPushNotifications}
                            />
                            <SwitchItem
                                icon="email"
                                title="Notificações por Email"
                                subtitle="Receber notificações por email"
                                value={emailNotifications}
                                onValueChange={setEmailNotifications}
                            />
                            <SwitchItem
                                icon="comment"
                                title="Comentários"
                                subtitle="Notificar sobre novos comentários"
                                value={commentsNotifications}
                                onValueChange={setCommentsNotifications}
                            />
                            <SwitchItem
                                icon="favorite"
                                title="Curtidas"
                                subtitle="Notificar sobre curtidas"
                                value={likesNotifications}
                                onValueChange={setLikesNotifications}
                            />
                            <SwitchItem
                                icon="message"
                                title="Mensagens"
                                subtitle="Notificar sobre novas mensagens"
                                value={messagesNotifications}
                                onValueChange={setMessagesNotifications}
                            />
                        </>
                    )}
                </SettingSection>

                {/* Privacidade */}
                <SettingSection title="Privacidade">
                    <SettingItem
                        icon="lock"
                        title="Privacidade da Conta"
                        subtitle="Gerenciar quem pode ver seu conteúdo"
                        onPress={() => navigate('MyProfile')}
                    />
                    <SettingItem
                        icon="block"
                        title="Contas Bloqueadas"
                        subtitle="Gerenciar contas bloqueadas"
                        onPress={() => Alert.alert('Em desenvolvimento', 'Esta funcionalidade estará disponível em breve.')}
                    />
                    <SettingItem
                        icon="visibility"
                        title="Quem pode me encontrar"
                        subtitle="Controlar visibilidade do perfil"
                        onPress={() => Alert.alert('Em desenvolvimento', 'Esta funcionalidade estará disponível em breve.')}
                    />
                </SettingSection>

                {/* Conta */}
                <SettingSection title="Conta">
                    <SettingItem
                        icon="person"
                        title="Editar Perfil"
                        subtitle="Alterar informações do perfil"
                        onPress={() => navigate('MyProfile')}
                    />
                    <SettingItem
                        icon="security"
                        title="Segurança"
                        subtitle="Senha e autenticação"
                        onPress={() => Alert.alert('Em desenvolvimento', 'Esta funcionalidade estará disponível em breve.')}
                    />
                    <SettingItem
                        icon="language"
                        title="Idioma"
                        subtitle="Português (Brasil)"
                        onPress={() => Alert.alert('Em desenvolvimento', 'Esta funcionalidade estará disponível em breve.')}
                    />
                </SettingSection>

                {/* Conteúdo */}
                <SettingSection title="Conteúdo">
                    <SettingItem
                        icon="storage"
                        title="Limpar Cache"
                        subtitle="Liberar espaço de armazenamento"
                        onPress={() => {
                            Alert.alert(
                                'Limpar Cache',
                                'Tem certeza que deseja limpar o cache?',
                                [
                                    { text: 'Cancelar', style: 'cancel' },
                                    {
                                        text: 'Limpar',
                                        onPress: () => {
                                            Alert.alert('Sucesso', 'Cache limpo com sucesso!');
                                        },
                                    },
                                ]
                            );
                        }}
                    />
                    <SettingItem
                        icon="download"
                        title="Downloads"
                        subtitle="Gerenciar downloads"
                        onPress={() => Alert.alert('Em desenvolvimento', 'Esta funcionalidade estará disponível em breve.')}
                    />
                </SettingSection>

                {/* Sobre */}
                <SettingSection title="Sobre">
                    <SettingItem
                        icon="info"
                        title="Sobre o TikaBoom"
                        onPress={handleAbout}
                    />
                    <SettingItem
                        icon="description"
                        title="Política de Privacidade"
                        onPress={handlePrivacyPolicy}
                    />
                    <SettingItem
                        icon="gavel"
                        title="Termos de Serviço"
                        onPress={handleTermsOfService}
                    />
                    <SettingItem
                        icon="help"
                        title="Ajuda e Suporte"
                        onPress={() => Alert.alert('Ajuda', 'Entre em contato através do email: suporte@tikaboom.com')}
                    />
                </SettingSection>

                {/* Ações Destrutivas */}
                <SettingSection title="">
                    <TouchableOpacity 
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <MaterialIcons name="logout" size={24} color="#FF6B6B" />
                        <Text style={styles.logoutText}>Sair da Conta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={handleDeleteAccount}
                    >
                        <MaterialIcons name="delete-forever" size={24} color="#FF6B6B" />
                        <Text style={styles.deleteText}>Excluir Conta</Text>
                    </TouchableOpacity>
                </SettingSection>

                {/* Versão */}
                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Versão 1.0.0</Text>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};
