# 343-TikaBoom

## Gerar APK

Para gerar o APK do aplicativo, siga estes passos:

### Pré-requisitos
1. Ter uma conta Expo (https://expo.dev)
2. Estar logado no EAS CLI

### Passos

1. **Verificar login:**
```bash
npx eas-cli whoami
```

2. **Se não estiver logado, faça login:**
```bash
npx eas-cli login
```

3. **Executar o build do APK:**
```bash
./build-apk.sh
```

Ou diretamente:
```bash
npx eas-cli build --platform android --profile preview
```

4. **Quando solicitado sobre o Keystore:**
   - Escolha `Yes` para gerar um novo Android Keystore (é seguro, o Expo gerencia isso)

5. **Aguardar o build:**
   - O build será executado na nuvem do Expo
   - Você receberá um link para download do APK quando estiver pronto
   - Pode verificar o status em: https://expo.dev/accounts/[seu-usuario]/projects/TikaBoom/builds

### Configurações

- O APK será gerado com o package name: `com.tikaboom.app`
- O perfil usado é "preview" (configurado em `eas.json`)
- O build é executado na nuvem do Expo EAS