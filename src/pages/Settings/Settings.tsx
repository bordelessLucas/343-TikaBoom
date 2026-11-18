import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '../../routes/NavigationContext';
import { auth, supabase } from '../../lib/supabase';
import { authService } from '../../services/authService';
import { styles } from './Settings.styles';
import { useSafePad } from '../../hooks/useSafePad';

const PREFS_KEY = '@tikaboom_notification_prefs';

type Prefs = {
  notificationsEnabled: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  commentsNotifications: boolean;
  likesNotifications: boolean;
  messagesNotifications: boolean;
};

const defaultPrefs: Prefs = {
  notificationsEnabled: true,
  pushNotifications: true,
  emailNotifications: false,
  commentsNotifications: true,
  likesNotifications: true,
  messagesNotifications: true,
};

export const Settings = () => {
  const { navigate } = useNavigation();
  const safe = useSafePad();
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [isPrivate, setIsPrivate] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREFS_KEY);
        if (raw) setPrefs({ ...defaultPrefs, ...JSON.parse(raw) });
      } catch {
        // ignore
      }
      const uid = auth.currentUser?.uid;
      if (uid) {
        const profile = await authService.getUserProfile(uid);
        if (profile) setIsPrivate(!!profile.isPrivate);
      }
    })();
  }, []);

  const updatePref = async <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    const next = { ...prefs, [key]: value };
    if (key === 'notificationsEnabled' && value === false) {
      next.pushNotifications = false;
    }
    setPrefs(next);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  const handleLogout = () => {
    Alert.alert('Sair da Conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.logout();
            await AsyncStorage.multiRemove([
              'currentChatId',
              'currentChatOtherUser',
              'savedEmail',
              'savedPassword',
              'rememberMe',
              'viewingUserId',
              'viewingPostId',
            ]);
            navigate('Login');
          } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível fazer logout');
          }
        },
      },
    ]);
  };

  const handleTogglePrivate = async (value: boolean) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setIsPrivate(value);
    try {
      await authService.updateUserProfile(uid, { isPrivate: value });
    } catch (e: any) {
      setIsPrivate(!value);
      Alert.alert('Erro', e.message || 'Não foi possível atualizar a privacidade');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Senha', 'Use pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Senha', 'As senhas não coincidem.');
      return;
    }
    try {
      setSavingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Sucesso', 'Senha atualizada.');
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Não foi possível alterar a senha');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert('Limpar Cache', 'Isso remove mídias locais e dados temporários do app.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar',
        onPress: async () => {
          await AsyncStorage.multiRemove([
            '@tikaboom_captured_media',
            '@tikaboom_posts',
            'viewingPostId',
            'openComments',
            'shouldOpenComments',
            '@tikaboom_active_live_room',
            '@tikaboom_active_daily_room',
          ]);
          Alert.alert('Sucesso', 'Cache limpo.');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'Seu perfil será anonimizado e você sairá do app. Esta ação não pode ser desfeita facilmente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const uid = auth.currentUser?.uid;
            if (!uid) return;
            try {
              await authService.updateUserProfile(uid, {
                displayName: 'Conta removida',
                username: `deleted_${uid.slice(0, 8)}`,
                bio: '',
                photoURL: '',
                isPrivate: true,
              });
              await authService.logout();
              await AsyncStorage.clear();
              navigate('Login');
              Alert.alert('Conta encerrada', 'Seu perfil foi desativado neste dispositivo.');
            } catch (e: any) {
              Alert.alert('Erro', e.message || 'Não foi possível excluir a conta');
            }
          },
        },
      ]
    );
  };

  const openEditProfile = async () => {
    await AsyncStorage.setItem('@tikaboom_open_profile_edit', '1');
    navigate('MyProfile');
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      {!!title && <Text style={styles.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showArrow = true,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingItemLeft}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon as any} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.settingItemText}>
          <Text style={styles.settingItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent ||
        (showArrow && onPress && <MaterialIcons name="chevron-right" size={24} color="#999" />)}
    </TouchableOpacity>
  );

  const SwitchItem = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
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
    <LinearGradient colors={['#28002b', '#1a1a2e', '#0a0a1a']} style={styles.container}>
      <View style={[styles.header, { paddingTop: safe.paddingTop }]}>
        <TouchableOpacity onPress={() => navigate('MyProfile')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SettingSection title="Notificações">
          <SwitchItem
            icon="notifications"
            title="Notificações"
            subtitle="Ativar preferências de notificação"
            value={prefs.notificationsEnabled}
            onValueChange={(v) => updatePref('notificationsEnabled', v)}
          />
          {prefs.notificationsEnabled && (
            <>
              <SwitchItem
                icon="notifications-active"
                title="Notificações Push"
                subtitle="Receber no dispositivo"
                value={prefs.pushNotifications}
                onValueChange={(v) => updatePref('pushNotifications', v)}
              />
              <SwitchItem
                icon="email"
                title="Notificações por Email"
                value={prefs.emailNotifications}
                onValueChange={(v) => updatePref('emailNotifications', v)}
              />
              <SwitchItem
                icon="comment"
                title="Comentários"
                value={prefs.commentsNotifications}
                onValueChange={(v) => updatePref('commentsNotifications', v)}
              />
              <SwitchItem
                icon="favorite"
                title="Curtidas"
                value={prefs.likesNotifications}
                onValueChange={(v) => updatePref('likesNotifications', v)}
              />
              <SwitchItem
                icon="message"
                title="Mensagens"
                value={prefs.messagesNotifications}
                onValueChange={(v) => updatePref('messagesNotifications', v)}
              />
            </>
          )}
        </SettingSection>

        <SettingSection title="Privacidade">
          <SwitchItem
            icon="lock"
            title="Conta privada"
            subtitle="Apenas quem você aprovar vê seus posts"
            value={isPrivate}
            onValueChange={handleTogglePrivate}
          />
        </SettingSection>

        <SettingSection title="Presente Real">
          <SettingItem
            icon="card-giftcard"
            title="Medidas + Endereço"
            subtitle="Cadastro para receber presentes na live"
            onPress={() => navigate('GiftProfile')}
          />
        </SettingSection>

        <SettingSection title="Conta">
          <SettingItem
            icon="person"
            title="Editar Perfil"
            subtitle="Nome, username, bio e foto"
            onPress={openEditProfile}
          />
          <SettingItem
            icon="security"
            title="Alterar senha"
            subtitle="Definir uma nova senha"
            onPress={() => setPasswordModal(true)}
          />
          <SettingItem
            icon="email"
            title="Email da conta"
            subtitle={auth.currentUser?.email || '—'}
            showArrow={false}
          />
        </SettingSection>

        <SettingSection title="Conteúdo">
          <SettingItem icon="storage" title="Limpar Cache" subtitle="Mídias e dados temporários" onPress={handleClearCache} />
        </SettingSection>

        <SettingSection title="Sobre">
          <SettingItem
            icon="info"
            title="Sobre o TikaBoom"
            onPress={() =>
              Alert.alert('Sobre o TikaBoom', 'Versão 1.0.0\nPlataforma de vídeos curtos.')
            }
          />
          <SettingItem
            icon="help"
            title="Ajuda e Suporte"
            onPress={() => Alert.alert('Ajuda', 'suporte@tikaboom.com')}
          />
        </SettingSection>

        <SettingSection title="">
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#FF6B6B" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <MaterialIcons name="delete-forever" size={24} color="#FF6B6B" />
            <Text style={styles.deleteText}>Excluir Conta</Text>
          </TouchableOpacity>
        </SettingSection>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
      </ScrollView>

      <Modal visible={passwordModal} transparent animationType="fade" onRequestClose={() => setPasswordModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
              Nova senha
            </Text>
            <TextInput
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 10,
              }}
              placeholder="Nova senha"
              placeholderTextColor="#888"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 16,
              }}
              placeholder="Confirmar senha"
              placeholderTextColor="#888"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => setPasswordModal(false)}>
                <Text style={{ color: '#aaa', fontWeight: '600', padding: 8 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleChangePassword} disabled={savingPassword}>
                <Text style={{ color: '#C0F93C', fontWeight: '800', padding: 8 }}>
                  {savingPassword ? 'Salvando…' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};
