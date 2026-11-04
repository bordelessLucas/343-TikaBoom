import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './TopBar.styles';

type TabType = 'forYou' | 'lives';

interface TopBarProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    liveMode?: 'lives' | 'battle';
    onLiveModeChange?: (mode: 'lives' | 'battle') => void;
}

export const TopBar = ({ activeTab, onTabChange, liveMode, onLiveModeChange }: TopBarProps) => {
    const { navigate, currentScreen } = useNavigation();

    const handleTabPress = (tab: TabType) => {
        if (tab === 'forYou' && currentScreen !== 'Home') {
            navigate('Home');
        } else if (tab === 'lives' && currentScreen !== 'Live') {
            navigate('Live' as any);
        }
        onTabChange(tab);
    };

    return (
        <LinearGradient
            colors={['rgba(0, 0, 0, 0.85)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.5)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradientContainer}
        >
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => handleTabPress('forYou')}
                >
                    <Text style={[styles.tabText, activeTab === 'forYou' && styles.tabTextActive]}>
                        Para você
                    </Text>
                    {activeTab === 'forYou' && <View style={styles.tabUnderline} />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => handleTabPress('lives')}
                >
                    <Text style={[styles.tabText, activeTab === 'lives' && styles.tabTextActive]}>
                        Lives
                    </Text>
                    {activeTab === 'lives' && <View style={styles.tabUnderline} />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => navigate('Search' as any)}
                >
                    <MaterialIcons name="search" size={22} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
            
            {/* Sub-menu para alternar entre Lives e Batalhas (apenas quando Lives está ativo) */}
            {activeTab === 'lives' && liveMode && onLiveModeChange && (
                <View style={styles.subMenuContainer}>
                    <TouchableOpacity
                        style={[styles.subMenuTab, liveMode === 'lives' && styles.subMenuTabActive]}
                        onPress={() => onLiveModeChange('lives')}
                    >
                        <Text style={[styles.subMenuText, liveMode === 'lives' && styles.subMenuTextActive]}>
                            Lives
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[styles.subMenuTab, liveMode === 'battle' && styles.subMenuTabActive]}
                        onPress={() => onLiveModeChange('battle')}
                    >
                        <Text style={[styles.subMenuText, liveMode === 'battle' && styles.subMenuTextActive]}>
                            Batalhas
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </LinearGradient>
    );
};

