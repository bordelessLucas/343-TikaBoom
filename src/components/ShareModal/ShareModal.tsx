import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

interface ShareModalProps {
    visible: boolean;
    onClose: () => void;
    videoId: string;
}

const { width, height } = Dimensions.get('window');

const shareOptions = [
    { id: '1', name: 'WhatsApp', icon: 'whatsapp', iconType: 'FontAwesome5' },
    { id: '2', name: 'Instagram', icon: 'instagram', iconType: 'FontAwesome5' },
    { id: '3', name: 'Twitter', icon: 'twitter', iconType: 'FontAwesome5' },
    { id: '4', name: 'Facebook', icon: 'facebook', iconType: 'FontAwesome5' },
    { id: '5', name: 'Copiar Link', icon: 'link', iconType: 'MaterialIcons' },
    { id: '6', name: 'Mais opções', icon: 'more-horiz', iconType: 'MaterialIcons' },
];

export const ShareModal = ({ visible, onClose, videoId }: ShareModalProps) => {
    const handleShare = (option: typeof shareOptions[0]) => {
        // Implementar lógica de compartilhamento depois
        console.log(`Compartilhar via ${option.name}`);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
                <LinearGradient
                    colors={['rgba(0,0,0,0.95)', 'rgba(40,0,43,0.95)']}
                    style={styles.modalContent}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Compartilhar</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.optionsContainer}>
                        {shareOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={styles.optionItem}
                                onPress={() => handleShare(option)}
                            >
                                <View style={styles.optionIcon}>
                                    {option.iconType === 'FontAwesome5' ? (
                                        <FontAwesome5 name={option.icon as any} size={30} color="#FFFFFF" />
                                    ) : (
                                        <MaterialIcons name={option.icon as any} size={30} color="#FFFFFF" />
                                    )}
                                </View>
                                <Text style={styles.optionName}>{option.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </LinearGradient>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: height * 0.5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    optionItem: {
        alignItems: 'center',
        width: width / 3 - 30,
        marginBottom: 20,
    },
    optionIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionName: {
        color: '#FFFFFF',
        fontSize: 12,
        textAlign: 'center',
    },
});

