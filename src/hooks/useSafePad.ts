import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Padding dinâmico para headers/footers — evita cortes em notch/status bar. */
export function useSafePad(extraTop = 12, extraBottom = 8) {
  const insets = useSafeAreaInsets();
  return {
    insets,
    paddingTop: insets.top + extraTop,
    paddingBottom: insets.bottom + extraBottom,
    top: insets.top + extraTop,
    bottom: insets.bottom + extraBottom,
  };
}
