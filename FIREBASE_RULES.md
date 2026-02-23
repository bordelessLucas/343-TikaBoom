# Regras de Segurança do Firebase

## Firestore Rules

Configure as seguintes regras no Firebase Console (Firestore Database > Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para usuários
    match /users/{userId} {
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
    
    // Regras para posts
    match /posts/{postId} {
      allow read: if request.auth != null && (
        resource.data.isPrivate == false || 
        resource.data.authorId == request.auth.uid
      );
      // Criar: usar request.resource.data na criação (resource.data não existe ainda)
      allow create: if request.auth != null && request.auth.uid == request.resource.data.authorId;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.authorId ||
        // Permitir atualizar likes/saves/comments
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'saves', 'shares', 'views', 'comments', 'likedBy', 'savedBy', 'updatedAt'])
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
    
    // Regras para comentários
    match /comments/{commentId} {
      allow read: if request.auth != null;
      // Criar: usar request.resource.data na criação (resource.data não existe ainda)
      allow create: if request.auth != null && request.auth.uid == request.resource.data.authorId;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.authorId ||
        // Permitir atualizar likes
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'likedBy'])
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
    
    // Regras para chats
    // NOTA: Os chats usam IDs determinísticos no formato "userId1_userId2" (ordenados)
    match /chats/{chatId} {
      // Ler: permitir leitura se o documento não existe OU se o usuário está nos participantes
      // Usar try-catch implícito: se participants não existir, a verificação falha silenciosamente
      allow read: if request.auth != null && 
        (resource == null || request.auth.uid in resource.data.participants);
      // Criar: usuário deve estar nos participantes do novo documento E deve ter exatamente 2 participantes
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.participants &&
        request.resource.data.participants.size() == 2;
      // Atualizar: usuário deve estar nos participantes do documento existente
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      // Deletar: usuário deve estar nos participantes
      allow delete: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
    
    // Regras para mensagens
    match /messages/{messageId} {
      // Ler: qualquer usuário autenticado pode ler mensagens
      allow read: if request.auth != null;
      // Criar: usuário deve ser o remetente (usar request.resource.data na criação)
      allow create: if request.auth != null && request.auth.uid == request.resource.data.senderId;
      // Atualizar: usuário deve ser o remetente OU apenas marcar como lida
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.senderId ||
        // Permitir marcar como lida (qualquer usuário autenticado pode marcar mensagens como lidas)
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']) && request.resource.data.read == true)
      );
      // Deletar: apenas o remetente pode deletar
      allow delete: if request.auth != null && request.auth.uid == resource.data.senderId;
    }
  }
}
```

## Storage Rules

Configure as seguintes regras no Firebase Console (Storage > Rules):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Posts (fotos e vídeos)
    match /posts/{fileName} {
      // Ler: qualquer usuário autenticado pode ler posts
      allow read: if request.auth != null;
      // Escrever: qualquer usuário autenticado pode fazer upload
      // Validar tamanho do arquivo (máximo 50MB)
      allow write: if request.auth != null && 
        request.resource.size < 50 * 1024 * 1024 &&
        request.resource.contentType.matches('image/.*|video/.*');
    }
    
    // Fotos de perfil
    match /profilePhotos/{userId}/{fileName} {
      // Ler: qualquer usuário autenticado pode ler fotos de perfil
      allow read: if request.auth != null;
      // Escrever: apenas o próprio usuário pode fazer upload
      // Validar tamanho (máximo 5MB para fotos de perfil)
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.size < 5 * 1024 * 1024 &&
        request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Índices Compostos Necessários

No Firestore, você pode precisar criar índices compostos. O Firebase geralmente sugere criar automaticamente quando necessário, mas aqui estão os principais:

1. **chats**: `participants` (array-contains) + `updatedAt` (desc)
2. **messages**: `chatId` (==) + `createdAt` (desc)
3. **posts**: `isPrivate` (==) + `createdAt` (desc)
4. **posts**: `authorId` (==) + `createdAt` (desc)

## Como Configurar

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Firestore Database** > **Rules**
4. Cole as regras acima
5. Clique em **Publish**
6. Repita para **Storage** > **Rules**

## Nota

Se você receber erros de "Missing or insufficient permissions", verifique:
- Se as regras foram publicadas corretamente
- Se o usuário está autenticado (`request.auth != null`)
- Se os índices compostos foram criados (o Firebase geralmente sugere automaticamente)
