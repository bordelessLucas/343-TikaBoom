import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MaterialIcons } from '@expo/vector-icons';
import type { Post } from '../../types/models';

type Props = {
  post: Pick<Post, 'mediaType' | 'mediaURL' | 'thumbnailURL'>;
};

function looksLikeVideoUrl(url?: string) {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes('.mp4') || u.includes('video/') || u.includes('/video_');
}

/** Preview de post no grid do perfil (foto ou 1º frame do vídeo). */
export function PostGridThumb({ post }: Props) {
  const isPhoto = post.mediaType === 'photo';
  const thumbIsImage =
    !!post.thumbnailURL && !looksLikeVideoUrl(post.thumbnailURL) && post.thumbnailURL !== post.mediaURL;

  if (isPhoto || thumbIsImage) {
    const uri = isPhoto ? post.mediaURL : post.thumbnailURL!;
    return (
      <View style={styles.fill}>
        <Image source={{ uri }} style={styles.fill} resizeMode="cover" />
      </View>
    );
  }

  return <VideoThumb uri={post.mediaURL} />;
}

function VideoThumb({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = true;
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Garante frame inicial no preview
        player.currentTime = 0.05;
        player.play();
        await new Promise((r) => setTimeout(r, 120));
        if (!cancelled) player.pause();
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
      try {
        player.pause();
      } catch {
        // ignore
      }
    };
  }, [player, uri]);

  return (
    <View style={styles.fill}>
      <VideoView
        player={player}
        style={styles.fill}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.playBadge}>
        <MaterialIcons name="play-arrow" size={14} color="#FFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  playBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
