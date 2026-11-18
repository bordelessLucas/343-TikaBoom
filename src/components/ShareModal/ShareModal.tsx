import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  buildPostShareUrl,
  copyShareLink,
  shareNative,
  shareViaWhatsApp,
  SharePayload,
} from '../../lib/shareContent';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  videoId?: string;
  postId?: string;
  mediaUrl?: string;
  title?: string;
  username?: string;
}

const { width } = Dimensions.get('window');

type Option = {
  id: string;
  name: string;
  icon: string;
  iconType: 'FontAwesome5' | 'MaterialIcons';
  color: string;
};

const shareOptions: Option[] = [
  { id: 'system', name: 'Sistema', icon: 'share', iconType: 'MaterialIcons', color: '#C0F93C' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', iconType: 'FontAwesome5', color: '#25D366' },
  { id: 'copy', name: 'Copiar link', icon: 'link', iconType: 'MaterialIcons', color: '#4FC3F7' },
  { id: 'more', name: 'Mais', icon: 'more-horiz', iconType: 'MaterialIcons', color: '#FFFFFF' },
];

export const ShareModal = ({
  visible,
  onClose,
  postId,
  mediaUrl,
  title,
  username,
}: ShareModalProps) => {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const payload = (): SharePayload => {
    const url = buildPostShareUrl(postId, mediaUrl);
    const author = username ? `@${username}` : 'TikaBoom';
    return {
      title: title || 'Post no TikaBoom',
      message: `Olha isso no TikaBoom — ${author}${title ? `: ${title}` : ''}`,
      url,
    };
  };

  const handleShare = async (option: Option) => {
    if (busy) return;
    setBusy(true);
    try {
      const data = payload();
      if (option.id === 'copy') {
        await copyShareLink(data.url || '');
      } else if (option.id === 'whatsapp') {
        await shareViaWhatsApp(data);
      } else {
        await shareNative(data);
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Compartilhar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
              <MaterialIcons name="close" size={22} color="#161823" />
            </TouchableOpacity>
          </View>

          {busy ? (
            <View style={styles.busy}>
              <ActivityIndicator color="#161823" />
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              {shareOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionItem}
                  onPress={() => handleShare(option)}
                >
                  <View style={[styles.optionIcon, { backgroundColor: '#F1F1F2' }]}>
                    {option.iconType === 'FontAwesome5' ? (
                      <FontAwesome5 name={option.icon as any} size={26} color={option.color} />
                    ) : (
                      <MaterialIcons name={option.icon as any} size={28} color={option.color === '#FFFFFF' ? '#161823' : option.color} />
                    )}
                  </View>
                  <Text style={styles.optionName}>{option.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.hint}>
            “Sistema” e “Mais” abrem as opções nativas do celular (WhatsApp, Instagram, Drive…).
          </Text>
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D1D3',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    color: '#161823',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 8,
  },
  optionItem: {
    alignItems: 'center',
    width: width / 4 - 12,
    marginBottom: 18,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionName: {
    color: '#161823',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  busy: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  hint: {
    color: '#8A8B91',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
    lineHeight: 16,
  },
});
