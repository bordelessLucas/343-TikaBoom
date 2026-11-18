import AsyncStorage from '@react-native-async-storage/async-storage';

/** Abre o feed na Home já posicionado no post. */
export async function openPostInFeed(postId: string, openComments = false) {
  await AsyncStorage.setItem('viewingPostId', postId);
  if (openComments) {
    await AsyncStorage.setItem('openComments', 'true');
  } else {
    await AsyncStorage.removeItem('openComments');
  }
}
