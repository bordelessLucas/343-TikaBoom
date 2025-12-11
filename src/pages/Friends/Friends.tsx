import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './Friends.styles';
import { useNavigation } from '../../routes/NavigationContext';

const suggested = [
  { id: '1', name: 'Lia Silva', handle: '@liasl', status: 'Live agora' },
  { id: '2', name: 'Caio Plays', handle: '@caioplays', status: 'Postou um vídeo' },
  { id: '3', name: 'Pri Gamer', handle: '@prigamer', status: 'Aceitou batalha' },
];

const requests = [
  { id: 'r1', name: 'Bruno Flash', handle: '@brunoflash' },
  { id: 'r2', name: 'Dani Beats', handle: '@danibeats' },
];

export const Friends = () => {
  const { navigate } = useNavigation();

  const renderAvatar = (name: string) => (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{name.slice(0, 1)}</Text>
    </View>
  );

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
          <Text style={styles.searchText}>Buscar por @usuario ou nome</Text>
        </View>

        <Text style={styles.sectionTitle}>Sugestões para você</Text>
        {suggested.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.left}>
              {renderAvatar(item.name)}
              <View style={styles.userInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.handle}>{item.handle}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <View style={styles.badge}>
                <Text style={styles.badgeText} numberOfLines={1}>{item.status}</Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Convites pendentes</Text>
        <View style={styles.inviteCard}>
          {requests.map((item) => (
            <View key={item.id} style={styles.requestCard}>
              <View style={styles.left}>
                {renderAvatar(item.name)}
                <View style={styles.userInfo}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.handle}>{item.handle}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.acceptButton}>
                <Text style={styles.acceptButtonText}>Aceitar</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.tipRow}>
            <View style={styles.dot} />
            <Text style={styles.muted}>Dica: convide amigos e ganhe boosts de batalha.</Text>
          </View>
          <View style={styles.inviteRow}>
            <TouchableOpacity style={styles.invitePill}>
              <MaterialIcons name="contacts" size={16} color="#FFFFFF" />
              <Text style={styles.pillText}>Importar contatos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.invitePill}>
              <MaterialIcons name="link" size={16} color="#FFFFFF" />
              <Text style={styles.pillText}>Criar link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

