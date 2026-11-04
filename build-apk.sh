#!/bin/bash

echo "🚀 Iniciando build do APK do TikaBoom..."
echo ""

# Verificar se está logado no EAS
echo "Verificando login no EAS..."
npx eas-cli whoami

if [ $? -ne 0 ]; then
    echo "❌ Você não está logado no EAS. Execute: npx eas-cli login"
    exit 1
fi

echo ""
echo "📦 Gerando APK Android..."
echo "⚠️  Quando solicitado, escolha 'Yes' para gerar um novo Android Keystore"
echo ""

# Executar o build
npx eas-cli build --platform android --profile preview

echo ""
echo "✅ Build iniciado! O APK será gerado na nuvem e você receberá um link para download."

