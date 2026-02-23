import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './Friends.styles';
import { useNavigation } from '../../routes/NavigationContext';
import { auth } from '../../lib/firebaseconfig';
import { usersService, UserProfile } from '../../services/usersService';
import { authService } from '../../services/authService';
import { messagesService } from '../../services/messagesService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Friends = () => {
  const { navigate } = useNavigation();
  const [suggested, setSuggested] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        navigate('Login');
        return;
      }

      // Carregar sugestões
      const suggestions = await usersService.getSuggestedUsers(user.uid, 10);
      setSuggested(suggestions);

      // Carregar seguindo
      const followingList = await usersService.getFollowing(user.uid);
      setFollowing(followingList);

      // Por enquanto, requests vazio (pode ser implementado depois)
      setRequests([]);
    } catch (error) {
      console.error('Erro ao carregar amigos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para seguir usuários');
        return;
      }

      console.log('🔄 Seguindo usuário:', { followerId: user.uid, followingId: userId });
      await usersService.followUser(user.uid, userId);
      console.log('✅ Usuário seguido com sucesso');
      
      // Criar chat automaticamente ao seguir
      try {
        await messagesService.getOrCreateChat(user.uid, userId);
        console.log('✅ Chat criado automaticamente ao seguir');
      } catch (error) {
        console.warn('⚠️ Não foi possível criar chat automaticamente:', error);
      }
      
      Alert.alert('Sucesso', 'Agora você está seguindo este usuário!');
      await loadFriends();
    } catch (error: any) {
      console.error('❌ Erro ao seguir usuário:', error);
      Alert.alert('Erro', error.message || 'Não foi possível seguir o usuário');
    }
  };

  const handleUserPress = async (user: UserProfile) => {
    try {
      // Salvar userId no AsyncStorage para o Profile acessar
      await AsyncStorage.setItem('viewingUserId', user.uid);
      navigate('Profile');
    } catch (error) {
      console.error('Erro ao navegar para perfil:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await usersService.unfollowUser(user.uid, userId);
      Alert.alert('Sucesso', 'Você deixou de seguir este usuário');
      await loadFriends();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível deixar de seguir');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await usersService.searchUsersByName(searchTerm.trim(), 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Erro ao buscar:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const renderAvatar = (user: UserProfile) => {
    if (user.photoURL) {
      return <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />;
    }
    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.displayName.slice(0, 1).toUpperCase()}</Text>
      </View>
    );
  };

  const renderUserCard = (user: UserProfile, showFollowButton: boolean = true) => {
    const currentUser = auth.currentUser;
    const isFollowingUser = following.some(f => f.uid === user.uid);
    const isCurrentUser = currentUser?.uid === user.uid;

    return (
      <View key={user.uid} style={styles.card}>
        <TouchableOpacity 
          style={styles.left}
          onPress={() => handleUserPress(user)}
          activeOpacity={0.7}
        >
          {renderAvatar(user)}
          <View style={styles.userInfo}>
            <Text style={styles.name}>{user.displayName}</Text>
            <Text style={styles.handle}>@{user.username}</Text>
            {user.bio && (
              <Text style={styles.bio} numberOfLines={1}>{user.bio}</Text>
            )}
          </View>
        </TouchableOpacity>
        {showFollowButton && !isCurrentUser && (
          <View style={styles.cardRight}>
            {isFollowingUser ? (
              <TouchableOpacity 
                style={styles.unfollowButton}
                onPress={() => handleUnfollow(user.uid)}
              >
                <Text style={styles.unfollowButtonText}>Seguindo</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => handleFollow(user.uid)}
              >
                <Text style={styles.addButtonText}>Seguir</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#28002b', '#1a1a2e', '#0a0a1a']} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#28002b', '#1a1a2e', '#0a0a1a']} style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('Home')} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Amigos</Text>
          <Text style={styles.subtitle}>Convide, descubra e desafie a galera</Text>
        </View>
        <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
          <MaterialIcons name="person-add-alt" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por @usuario ou nome"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchTerm.trim() && (
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              {searching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="search" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {searchTerm.trim() && searchResults.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Resultados da busca</Text>
            {searchResults.map(user => renderUserCard(user))}
          </>
        )}

        {!searchTerm.trim() && (
          <>
            <Text style={styles.sectionTitle}>Sugestões para você</Text>
            {suggested.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhuma sugestão no momento</Text>
              </View>
            ) : (
              suggested.map(user => renderUserCard(user))
            )}

            {requests.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Convites pendentes</Text>
                <View style={styles.inviteCard}>
                  {requests.map(user => renderUserCard(user, false))}
                </View>
              </>
            )}

            {following.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Você está seguindo</Text>
                {following.map(user => renderUserCard(user))}
              </>
            )}
          </>
        )}

        {searchTerm.trim() && searchResults.length === 0 && !searching && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};
