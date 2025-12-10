import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './TopBar.styles';

type TabType = 'forYou' | 'live';

interface TopBarProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export const TopBar = ({ activeTab, onTabChange }: TopBarProps) => {
    const { navigate, currentScreen } = useNavigation();

    const handleTabPress = (tab: TabType) => {
        if (tab === 'forYou' && currentScreen !== 'Home') {
            navigate('Home');
        } else if (tab === 'live' && currentScreen !== 'Live') {
            navigate('Live' as any);
        }
        onTabChange(tab);
    };

    return (
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
                onPress={() => handleTabPress('live')}
            >
                <Text style={[styles.tabText, activeTab === 'live' && styles.tabTextActive]}>
                    Live
                </Text>
                {activeTab === 'live' && <View style={styles.tabUnderline} />}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.searchButton}
                onPress={() => navigate('Search' as any)}
            >
                <MaterialIcons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

