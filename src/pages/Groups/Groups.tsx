import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './Groups.styles';
import { auth } from '../../lib/firebaseconfig';
import { groupsService, Group } from '../../services/groupsService';

type TabType = 'my' | 'discover';

export const Groups = () => {
    const { navigate } = useNavigation();
    const [activeTab, setActiveTab] = useState<TabType>('my');
    const [myGroups, setMyGroups] = useState<Group[]>([]);
    const [discoverGroups, setDiscoverGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupInterest, setNewGroupInterest] = useState('');

    useEffect(() => {
        loadMyGroups();
    }, []);

    const loadMyGroups = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) return;
            const groups = await groupsService.getUserGroups(user.uid);
            setMyGroups(groups);
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Erro', 'Você precisa estar logado para criar grupos');
                return;
            }

            if (!newGroupName.trim()) {
                Alert.alert('Atenção', 'Dê um nome para o grupo');
                return;
            }

            setCreating(true);
            const interest = newGroupInterest.trim().toLowerCase();
            const interests = interest ? [interest] : [];

            await groupsService.createGroup(
                user.uid,
                newGroupName,
                newGroupDescription,
                interests,
            );

            setNewGroupName('');
            setNewGroupDescription('');
            setNewGroupInterest('');
            await loadMyGroups();
            Alert.alert('Sucesso', 'Grupo criado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao criar grupo:', error);
            Alert.alert('Erro', error.message || 'Não foi possível criar o grupo');
        } finally {
            setCreating(false);
        }
    };

    const handleOpenGroup = (group: Group) => {
        navigate('GroupChat', { groupId: group.id });
    };

    const renderGroupCard = (group: Group) => (
        <TouchableOpacity
            key={group.id}
            style={styles.groupCard}
            onPress={() => handleOpenGroup(group)}
        >
            <View style={styles.groupAvatar}>
                <Text style={styles.groupAvatarText}>
                    {group.name.slice(0, 1).toUpperCase()}
                </Text>
            </View>
            <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                {group.description ? (
                    <Text style={styles.groupDescription} numberOfLines={1}>
                        {group.description}
                    </Text>
                ) : null}
                {group.interests?.length > 0 && (
                    <View style={styles.interestsRow}>
                        {group.interests.slice(0, 2).map((interest) => (
                            <View key={interest} style={styles.interestBadge}>
                                <Text style={styles.interestText}>#{interest}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <LinearGradient
            colors={['#28002b', '#1a1a2e', '#0a0a1a']}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigate('Home')} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Grupos</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'my' && styles.tabActive]}
                    onPress={() => setActiveTab('my')}
                >
                    <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
                        Meus grupos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
                    onPress={() => setActiveTab('discover')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'discover' && styles.tabTextActive,
                        ]}
                    >
                        Descobrir
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Conteúdo */}
            {activeTab === 'my' ? (
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    {/* Criar grupo */}
                    <View style={styles.createCard}>
                        <Text style={styles.sectionTitle}>Criar novo grupo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nome do grupo"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={newGroupName}
                            onChangeText={setNewGroupName}
                        />
                        <TextInput
                            style={[styles.input, styles.inputMultiline]}
                            placeholder="Descrição (opcional)"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={newGroupDescription}
                            onChangeText={setNewGroupDescription}
                            multiline
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Interesse principal (ex: games, música...)"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={newGroupInterest}
                            onChangeText={setNewGroupInterest}
                        />
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={handleCreateGroup}
                            disabled={creating}
                        >
                            <Text style={styles.createButtonText}>
                                {creating ? 'Criando...' : 'Criar grupo'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Lista de grupos */}
                    <Text style={styles.sectionTitle}>Meus grupos</Text>
                    {myGroups.length === 0 ? (
                        <Text style={styles.emptyText}>
                            Você ainda não participa de nenhum grupo.
                        </Text>
                    ) : (
                        myGroups.map(renderGroupCard)
                    )}
                </ScrollView>
            ) : (
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.sectionTitle}>Descobrir grupos por interesse</Text>
                    <Text style={styles.emptyText}>
                        Em breve: sugestões de grupos por interesse. Por enquanto, crie um grupo
                        na aba "Meus grupos".
                    </Text>
                </ScrollView>
            )}
        </LinearGradient>
    );
};

