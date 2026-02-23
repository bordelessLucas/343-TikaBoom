# 🔥 Configuração Completa do Firebase - Guia Passo a Passo

## 📋 ÍNDICE
1. [Acessar o Firebase Console](#1-acessar-o-firebase-console)
2. [Configurar Regras do Firestore](#2-configurar-regras-do-firestore)
3. [Configurar Regras do Storage](#3-configurar-regras-do-storage)
4. [Criar Índices Compostos (se necessário)](#4-criar-índices-compostos-se-necessário)
5. [Verificar Configurações](#5-verificar-configurações)

---

## 1. ACESSAR O FIREBASE CONSOLE

### Passo 1.1: Abrir o Console
1. Acesse: **https://console.firebase.google.com/**
2. Faça login com sua conta Google
3. Selecione o projeto **TikaBoom** (ou o nome do seu projeto)

### Passo 1.2: Navegar para Firestore
1. No menu lateral esquerdo, clique em **"Firestore Database"**
2. Você verá a aba **"Dados"** (Data) e **"Regras"** (Rules)
3. Clique na aba **"Regras"** (Rules)

---

## 2. CONFIGURAR REGRAS DO FIRESTORE

### Passo 2.1: Localizar o Editor de Regras
1. Na aba **"Regras"**, você verá um editor de código
2. Por padrão, deve ter algo como:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

### Passo 2.2: Substituir as Regras Completas
**⚠️ IMPORTANTE: Substitua TODO o conteúdo do editor pelas regras abaixo:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // REGRAS PARA USUÁRIOS
    // ============================================
    match /users/{userId} {
      // Qualquer usuário autenticado pode ler perfis
      allow read: if request.auth != null;
      
      // Permitir criar o próprio perfil durante o registro
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Permitir atualizar o próprio perfil OU atualizar apenas campos de seguidores
      allow update: if request.auth != null && (
        // Pode atualizar seu próprio perfil completamente
        request.auth.uid == userId ||
        // OU pode atualizar apenas followers/followersList de outros usuários (para seguir)
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['followers', 'followersList']))
      );
      
      // Permitir deletar o próprio perfil
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // ============================================
    // REGRAS PARA POSTS
    // ============================================
    match /posts/{postId} {
      // Ler posts públicos OU posts privados do próprio usuário
      allow read: if request.auth != null && (
        resource.data.isPrivate == false || 
        resource.data.authorId == request.auth.uid
      );
      
      // Criar post (apenas o autor)
      allow create: if request.auth != null && request.auth.uid == resource.data.authorId;
      
      // Atualizar post
      allow update: if request.auth != null && (
        // O autor pode atualizar tudo
        request.auth.uid == resource.data.authorId ||
        // OU qualquer usuário pode atualizar apenas likes/saves/comments (interações)
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'saves', 'shares', 'views', 'comments', 'likedBy', 'savedBy', 'updatedAt']))
      );
      
      // Deletar post (apenas o autor)
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
    
    // ============================================
    // REGRAS PARA COMENTÁRIOS
    // ============================================
    match /comments/{commentId} {
      // Qualquer usuário autenticado pode ler comentários
      allow read: if request.auth != null;
      
      // Criar comentário (apenas o autor)
      allow create: if request.auth != null && request.auth.uid == resource.data.authorId;
      
      // Atualizar comentário
      allow update: if request.auth != null && (
        // O autor pode atualizar tudo
        request.auth.uid == resource.data.authorId ||
        // OU qualquer usuário pode atualizar apenas likes
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'likedBy']))
      );
      
      // Deletar comentário (apenas o autor)
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
    
    // ============================================
    // REGRAS PARA CHATS
    // ============================================
    match /chats/{chatId} {
      // Ler chat apenas se o usuário for participante
      allow read: if request.auth != null && request.auth.uid in resource.data.participants;
      
      // Criar chat apenas se o usuário for participante
      allow create: if request.auth != null && request.auth.uid in resource.data.participants;
      
      // Atualizar chat apenas se o usuário for participante
      allow update: if request.auth != null && request.auth.uid in resource.data.participants;
      
      // Deletar chat apenas se o usuário for participante
      allow delete: if request.auth != null && request.auth.uid in resource.data.participants;
    }
    
    // ============================================
    // REGRAS PARA MENSAGENS
    // ============================================
    match /messages/{messageId} {
      // Qualquer usuário autenticado pode ler mensagens
      allow read: if request.auth != null;
      
      // Criar mensagem (apenas o remetente)
      allow create: if request.auth != null && request.auth.uid == resource.data.senderId;
      
      // Atualizar mensagem
      allow update: if request.auth != null && (
        // O remetente pode atualizar tudo
        request.auth.uid == resource.data.senderId ||
        // OU qualquer usuário pode marcar como lida
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']))
      );
      
      // Deletar mensagem (apenas o remetente)
      allow delete: if request.auth != null && request.auth.uid == resource.data.senderId;
    }
  }
}
```

### Passo 2.3: Publicar as Regras
1. Após colar as regras, clique no botão **"Publicar"** (Publish) no topo do editor
2. Aguarde a confirmação: **"Regras publicadas com sucesso"**
3. ⚠️ **IMPORTANTE**: As regras podem levar alguns segundos para serem aplicadas

### Passo 2.4: Verificar se Funcionou
1. Volte para a aba **"Dados"** (Data)
2. Tente criar um novo documento manualmente para testar
3. Se aparecer erro de permissão, verifique se as regras foram publicadas corretamente

---

## 3. CONFIGURAR REGRAS DO STORAGE

### Passo 3.1: Navegar para Storage
1. No menu lateral esquerdo, clique em **"Storage"**
2. Se for a primeira vez, clique em **"Começar"** (Get Started)
3. Escolha um local (ex: `us-central1`) e confirme
4. Clique na aba **"Regras"** (Rules)

### Passo 3.2: Substituir as Regras do Storage
**⚠️ IMPORTANTE: Substitua TODO o conteúdo do editor pelas regras abaixo:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // ============================================
    // REGRAS PARA POSTS (FOTOS E VÍDEOS)
    // ============================================
    match /posts/{fileName} {
      // Qualquer usuário autenticado pode ler
      allow read: if request.auth != null;
      
      // Qualquer usuário autenticado pode fazer upload
      allow write: if request.auth != null;
    }
    
    // ============================================
    // REGRAS PARA FOTOS DE PERFIL
    // ============================================
    match /profilePhotos/{userId}/{fileName} {
      // Qualquer usuário autenticado pode ler
      allow read: if request.auth != null;
      
      // Apenas o próprio usuário pode fazer upload
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Passo 3.3: Publicar as Regras do Storage
1. Clique no botão **"Publicar"** (Publish)
2. Aguarde a confirmação

---

## 4. CRIAR ÍNDICES COMPOSTOS (SE NECESSÁRIO)

### Passo 4.1: Quando os Índices são Necessários
O Firebase pode solicitar índices compostos quando você usa queries com múltiplos filtros. Se aparecer um erro sugerindo criar um índice:

### Passo 4.2: Criar Índice Automaticamente
1. Quando aparecer o erro, clique no link que o Firebase fornece
2. Será redirecionado para a página de criação de índices
3. Clique em **"Criar Índice"** (Create Index)
4. Aguarde alguns minutos até o índice ser criado

### Passo 4.3: Índices Recomendados (Criar Manualmente se Precisar)

#### Índice 1: Chats por Participante e Data
- **Coleção**: `chats`
- **Campos**:
  - `participants` (Array-contains, Ascending)
  - `updatedAt` (Descending)

#### Índice 2: Mensagens por Chat e Data
- **Coleção**: `messages`
- **Campos**:
  - `chatId` (Ascending)
  - `createdAt` (Descending)

#### Índice 3: Posts Públicos por Data
- **Coleção**: `posts`
- **Campos**:
  - `isPrivate` (Ascending)
  - `createdAt` (Descending)

#### Índice 4: Posts por Autor e Data
- **Coleção**: `posts`
- **Campos**:
  - `authorId` (Ascending)
  - `createdAt` (Descending)

### Passo 4.4: Como Criar Índices Manualmente
1. No Firestore, vá em **"Índices"** (Indexes) no menu lateral
2. Clique em **"Criar Índice"** (Create Index)
3. Selecione a coleção
4. Adicione os campos conforme acima
5. Clique em **"Criar"** (Create)
6. Aguarde alguns minutos

---

## 5. VERIFICAR CONFIGURAÇÕES

### Passo 5.1: Verificar Firestore
1. Vá em **Firestore Database** > **Dados**
2. Verifique se as coleções existem:
   - `users`
   - `posts`
   - `comments`
   - `chats`
   - `messages`

### Passo 5.2: Verificar Storage
1. Vá em **Storage**
2. Verifique se as pastas existem:
   - `posts/`
   - `profilePhotos/`

### Passo 5.3: Testar no App
1. Tente criar uma nova conta
2. Tente fazer login
3. Tente criar um post
4. Tente seguir outro usuário
5. Tente curtir um post

---

## 🔧 TROUBLESHOOTING (Solução de Problemas)

### Erro: "Missing or insufficient permissions"
**Causa**: Regras não foram publicadas ou estão incorretas
**Solução**:
1. Verifique se as regras foram publicadas
2. Verifique se copiou as regras completas
3. Aguarde alguns segundos após publicar

### Erro: "Index required"
**Causa**: Falta de índice composto
**Solução**:
1. Clique no link do erro
2. Crie o índice sugerido
3. Aguarde alguns minutos

### Erro: "Right operand of 'in' is not an object"
**Causa**: Tentando usar `in` em campo que não é array
**Solução**:
1. Verifique se os arrays `followingList` e `followersList` foram inicializados
2. Verifique as regras do Firestore

### Erro ao Seguir Usuário
**Causa**: Regras não permitem atualizar perfil de outro usuário
**Solução**:
1. Verifique se a regra de `update` para `users` permite atualizar `followers` e `followersList`
2. Verifique se as regras foram publicadas

---

## 📝 CHECKLIST FINAL

Antes de testar, verifique:

- [ ] Regras do Firestore foram publicadas
- [ ] Regras do Storage foram publicadas
- [ ] Índices compostos foram criados (se necessário)
- [ ] Usuário está autenticado no app
- [ ] Arrays `followingList` e `followersList` foram inicializados nos perfis

---

## 🆘 PRECISA DE AJUDA?

Se ainda tiver problemas:
1. Verifique os logs do console no app
2. Verifique os logs do Firebase Console (Firestore > Usage)
3. Verifique se o usuário está autenticado
4. Verifique se as regras foram publicadas recentemente

---

## 📸 ONDE ENCONTRAR CADA COISA NO FIREBASE CONSOLE

### Firestore Rules:
**Menu Lateral** → **Firestore Database** → **Regras** (Rules)

### Storage Rules:
**Menu Lateral** → **Storage** → **Regras** (Rules)

### Índices:
**Menu Lateral** → **Firestore Database** → **Índices** (Indexes)

### Dados:
**Menu Lateral** → **Firestore Database** → **Dados** (Data)

---

**Última atualização**: Agora você tem todas as instruções detalhadas para configurar o Firebase corretamente! 🎉
