/**
 * Expo carrega .env antes deste arquivo.
 * Espelhamos chaves públicas em `extra` para o bundle não ficar sem elas
 * se o Metro tiver sido iniciado antes de editar o .env.
 */
module.exports = ({ config }) => {
  const dailyApiKey = (process.env.EXPO_PUBLIC_DAILY_API_KEY || '').trim();
  const deepArKey = (process.env.EXPO_PUBLIC_DEEPAR_LICENSE_KEY || '').trim();
  const deepArDomain = (process.env.EXPO_PUBLIC_DEEPAR_APP_DOMAIN || '').trim();
  const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      eas: config.extra?.eas,
      dailyApiKey,
      deepArLicenseKey: deepArKey,
      deepArAppDomain: deepArDomain,
      supabaseUrl,
      supabaseAnonKey,
    },
  };
};
