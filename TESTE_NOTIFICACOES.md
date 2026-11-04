# 🧪 Guia de Testes - Sistema de Notificações

Este guia explica como testar todas as funcionalidades do sistema de notificações.

---

## 📋 Pré-requisitos

1. ✅ Índice composto criado no Firebase (`notifications`: `userId` + `createdAt`)
2. ✅ Regras do Firebase configuradas para a coleção `notifications`
3. ✅ Pelo menos 2 contas de usuário criadas no app
4. ✅ App rodando e funcionando

---

## 🧪 TESTE 1: Notificação de Follow (Seguir)

### Objetivo
Verificar se uma notificação é criada quando um usuário segue outro.

### Passos:
1. **Faça login com a Conta A** (ex: `usuario1@teste.com`)
2. **Faça login com a Conta B** (ex: `usuario2@teste.com`)
3. Na Conta B, vá para a aba **"Amigos"** (Friends)
4. Encontre a Conta A na lista de sugestões
5. **Clique em "Seguir"** na Conta A
6. **Faça logout** da Conta B
7. **Faça login** com a Conta A
8. Vá para a aba **"Mensagens"** (Messages)
9. Clique na aba **"Notificações"** (Notifications)

### ✅ Resultado Esperado:
- Deve aparecer uma notificação do tipo **"follow"**
- Deve mostrar: **"@usuario2 começou a seguir você"**
- Deve ter um ícone azul (person-add)
- Deve ter um ponto indicando que não foi lida

### 🔍 Verificação no Firebase:
1. Acesse o Firebase Console
2. Vá em **Firestore Database** > **Dados**
3. Abra a coleção `notifications`
4. Deve haver um documento com:
   - `type: "follow"`
   - `userId: "UID_DA_CONTA_A"`
   - `actorId: "UID_DA_CONTA_B"`
   - `read: false`

---

## 🧪 TESTE 2: Notificação de Like (Curtir)

### Objetivo
Verificar se uma notificação é criada quando um usuário curte um post.

### Passos:
1. **Faça login com a Conta A**
2. Vá para a aba **"Criar"** (CreateVideo)
3. **Crie e publique um vídeo** (ou use um vídeo existente)
4. **Anote o ID do post** (ou lembre-se do título)
5. **Faça logout** da Conta A
6. **Faça login** com a Conta B
7. Vá para a aba **"ForYou"** (Home)
8. Encontre o vídeo publicado pela Conta A
9. **Clique no botão de coração** para curtir
10. **Faça logout** da Conta B
11. **Faça login** com a Conta A
12. Vá para **"Mensagens"** > **"Notificações"**

### ✅ Resultado Esperado:
- Deve aparecer uma notificação do tipo **"like"**
- Deve mostrar: **"@usuario2 curtiu seu vídeo"**
- Deve mostrar o título do vídeo entre aspas
- Deve ter um ícone vermelho (favorite)
- Deve ter um ponto indicando que não foi lida

### 🔍 Verificação no Firebase:
1. No Firestore, coleção `notifications`
2. Deve haver um documento com:
   - `type: "like"`
   - `userId: "UID_DA_CONTA_A"`
   - `actorId: "UID_DA_CONTA_B"`
   - `postId: "ID_DO_POST"`
   - `postTitle: "Título do vídeo"`
   - `read: false`

---

## 🧪 TESTE 3: Notificação de Comment (Comentar)

### Objetivo
Verificar se uma notificação é criada quando um usuário comenta em um post.

### Passos:
1. **Faça login com a Conta A**
2. Vá para **"ForYou"** e encontre um vídeo seu (ou publique um novo)
3. **Anote o ID do post**
4. **Faça logout** da Conta A
5. **Faça login** com a Conta B
6. Vá para **"ForYou"**
7. Encontre o vídeo da Conta A
8. **Clique no botão de comentários**
9. **Digite um comentário** (ex: "Muito bom! 👏")
10. **Envie o comentário**
11. **Feche os comentários**
12. **Faça logout** da Conta B
13. **Faça login** com a Conta A
14. Vá para **"Mensagens"** > **"Notificações"**

### ✅ Resultado Esperado:
- Deve aparecer uma notificação do tipo **"comment"**
- Deve mostrar: **"@usuario2 comentou no seu vídeo"**
- Deve mostrar o título do vídeo entre aspas
- Deve mostrar o texto do comentário entre aspas
- Deve ter um ícone dourado (comment)
- Deve ter um ponto indicando que não foi lida

### 🔍 Verificação no Firebase:
1. No Firestore, coleção `notifications`
2. Deve haver um documento com:
   - `type: "comment"`
   - `userId: "UID_DA_CONTA_A"`
   - `actorId: "UID_DA_CONTA_B"`
   - `postId: "ID_DO_POST"`
   - `postTitle: "Título do vídeo"`
   - `commentText: "Muito bom! 👏"`
   - `read: false`

---

## 🧪 TESTE 4: Clique em Notificação de Follow

### Objetivo
Verificar se ao clicar em uma notificação de follow, navega para o perfil do usuário.

### Passos:
1. **Tenha uma notificação de follow** (crie seguindo o Teste 1)
2. Na aba **"Notificações"**, encontre a notificação de follow
3. **Clique na notificação**

### ✅ Resultado Esperado:
- Deve navegar para a tela de **"Perfil"** (Profile)
- Deve mostrar o perfil do usuário que seguiu (Conta B)
- A notificação deve ser marcada como lida (ponto desaparece)
- Ao voltar para notificações, a notificação não deve mais ter o ponto

### 🔍 Verificação no Firebase:
1. No Firestore, coleção `notifications`
2. O documento da notificação deve ter:
   - `read: true` (foi atualizado)

---

## 🧪 TESTE 5: Clique em Notificação de Like

### Objetivo
Verificar se ao clicar em uma notificação de like, navega para o post.

### Passos:
1. **Tenha uma notificação de like** (crie seguindo o Teste 2)
2. Na aba **"Notificações"**, encontre a notificação de like
3. **Clique na notificação**

### ✅ Resultado Esperado:
- Deve navegar para a tela **"ForYou"** (Home)
- Deve fazer scroll até o post que foi curtido
- O post deve estar visível na tela
- A notificação deve ser marcada como lida

### 🔍 Verificação no Firebase:
1. No Firestore, coleção `notifications`
2. O documento da notificação deve ter:
   - `read: true`

---

## 🧪 TESTE 6: Clique em Notificação de Comment

### Objetivo
Verificar se ao clicar em uma notificação de comment, navega para o post e abre os comentários.

### Passos:
1. **Tenha uma notificação de comment** (crie seguindo o Teste 3)
2. Na aba **"Notificações"**, encontre a notificação de comment
3. **Clique na notificação**

### ✅ Resultado Esperado:
- Deve navegar para a tela **"ForYou"** (Home)
- Deve fazer scroll até o post que foi comentado
- Deve abrir automaticamente a seção de comentários
- O comentário deve estar visível
- A notificação deve ser marcada como lida

### 🔍 Verificação no Firebase:
1. No Firestore, coleção `notifications`
2. O documento da notificação deve ter:
   - `read: true`

---

## 🧪 TESTE 7: Não Criar Notificação ao Curtir Próprio Post

### Objetivo
Verificar que não é criada notificação quando o próprio autor curte seu post.

### Passos:
1. **Faça login com a Conta A**
2. Vá para **"ForYou"**
3. Encontre um vídeo seu
4. **Curta o próprio vídeo**
5. Vá para **"Mensagens"** > **"Notificações"**

### ✅ Resultado Esperado:
- **NÃO** deve aparecer uma notificação de like
- A lista de notificações não deve ter uma nova notificação

### 🔍 Verificação no Firebase:
1. No Firestore, coleção `notifications`
2. Não deve haver uma nova notificação com:
   - `type: "like"`
   - `userId: "UID_DA_CONTA_A"`
   - `actorId: "UID_DA_CONTA_A"` (mesmo usuário)

---

## 🧪 TESTE 8: Não Criar Notificação ao Comentar no Próprio Post

### Objetivo
Verificar que não é criada notificação quando o próprio autor comenta em seu post.

### Passos:
1. **Faça login com a Conta A**
2. Vá para **"ForYou"**
3. Encontre um vídeo seu
4. **Comente no próprio vídeo**
5. Vá para **"Mensagens"** > **"Notificações"**

### ✅ Resultado Esperado:
- **NÃO** deve aparecer uma notificação de comment
- A lista de notificações não deve ter uma nova notificação

### 🔍 Verificação no Firebase:
1. No Firestore, coleção `notifications`
2. Não deve haver uma nova notificação com:
   - `type: "comment"`
   - `userId: "UID_DA_CONTA_A"`
   - `actorId: "UID_DA_CONTA_A"` (mesmo usuário)

---

## 🧪 TESTE 9: Múltiplas Notificações

### Objetivo
Verificar se múltiplas notificações são exibidas corretamente.

### Passos:
1. **Faça login com a Conta A**
2. Publique 3 vídeos diferentes
3. **Faça logout** da Conta A
4. **Faça login com a Conta B**
5. **Curta os 3 vídeos** da Conta A
6. **Comente em 1 vídeo** da Conta A
7. **Siga a Conta A**
8. **Faça logout** da Conta B
9. **Faça login com a Conta A**
10. Vá para **"Mensagens"** > **"Notificações"**

### ✅ Resultado Esperado:
- Deve aparecer **pelo menos 5 notificações**:
  - 1 notificação de follow
  - 3 notificações de like
  - 1 notificação de comment
- As notificações devem estar ordenadas por data (mais recentes primeiro)
- Todas devem ter o ponto indicando que não foram lidas

---

## 🧪 TESTE 10: Estado Vazio (Sem Notificações)

### Objetivo
Verificar a exibição quando não há notificações.

### Passos:
1. **Crie uma nova conta** (Conta C) que nunca interagiu com ninguém
2. **Faça login** com a Conta C
3. Vá para **"Mensagens"** > **"Notificações"**

### ✅ Resultado Esperado:
- Deve mostrar uma mensagem: **"Nenhuma notificação ainda"**
- Deve ter um ícone de notificação vazia
- Não deve haver lista de notificações

---

## 🧪 TESTE 11: Formatação de Tempo

### Objetivo
Verificar se o tempo relativo está sendo exibido corretamente.

### Passos:
1. **Crie uma notificação** (qualquer tipo)
2. Vá para **"Notificações"**
3. **Observe o tempo exibido**

### ✅ Resultado Esperado:
- Se criada há menos de 1 minuto: **"agora"**
- Se criada há 5 minutos: **"5m"**
- Se criada há 2 horas: **"2h"**
- Se criada há 3 dias: **"3d"**

---

## 🧪 TESTE 12: Ícones e Cores por Tipo

### Objetivo
Verificar se cada tipo de notificação tem o ícone e cor corretos.

### Passos:
1. **Crie notificações de todos os tipos**:
   - 1 follow
   - 1 like
   - 1 comment
2. Vá para **"Notificações"**
3. **Observe os ícones e cores**

### ✅ Resultado Esperado:
- **Follow**: Ícone `person-add`, cor azul (#1DA1F2)
- **Like**: Ícone `favorite`, cor vermelha (#FF6B6B)
- **Comment**: Ícone `comment`, cor dourada (#FFD700)

---

## 🔍 Verificações Adicionais no Firebase Console

### Verificar Estrutura dos Documentos:
1. Acesse **Firestore Database** > **Dados**
2. Abra a coleção `notifications`
3. Clique em um documento
4. Verifique se tem os campos:
   - `id` (string)
   - `userId` (string) - UID do usuário que recebe
   - `type` (string) - "follow", "like" ou "comment"
   - `actorId` (string) - UID do usuário que fez a ação
   - `actorUsername` (string)
   - `actorPhotoURL` (string, opcional)
   - `postId` (string, opcional - apenas para like/comment)
   - `postTitle` (string, opcional - apenas para like/comment)
   - `commentText` (string, opcional - apenas para comment)
   - `read` (boolean)
   - `createdAt` (timestamp)

### Verificar Índice:
1. Vá em **Firestore Database** > **Indexes**
2. Procure pelo índice de `notifications`
3. Verifique se está **"Enabled"** (Habilitado)
4. Campos devem ser:
   - `userId` (Ascending)
   - `createdAt` (Descending)

---

## 🐛 Troubleshooting (Solução de Problemas)

### Problema: Notificações não aparecem
**Soluções:**
1. Verifique se o índice composto foi criado e está habilitado
2. Verifique se as regras do Firebase foram publicadas
3. Verifique no console do app se há erros
4. Verifique no Firebase Console se os documentos foram criados

### Problema: Erro "Missing or insufficient permissions"
**Soluções:**
1. Verifique se as regras do Firebase incluem as regras de `notifications`
2. Verifique se as regras foram publicadas
3. Verifique se o usuário está autenticado

### Problema: Notificações não são marcadas como lidas
**Soluções:**
1. Verifique se as regras de `update` estão corretas
2. Verifique no console se há erros ao marcar como lida
3. Verifique se o `notificationId` está correto

### Problema: Clique não navega corretamente
**Soluções:**
1. Verifique se o `AsyncStorage` está sendo usado corretamente
2. Verifique se o `navigate` está funcionando
3. Verifique se o `postId` ou `actorId` estão presentes na notificação

---

## 📝 Checklist de Testes

Use este checklist para garantir que todos os testes foram executados:

- [ ] Teste 1: Notificação de Follow
- [ ] Teste 2: Notificação de Like
- [ ] Teste 3: Notificação de Comment
- [ ] Teste 4: Clique em Notificação de Follow
- [ ] Teste 5: Clique em Notificação de Like
- [ ] Teste 6: Clique em Notificação de Comment
- [ ] Teste 7: Não criar notificação ao curtir próprio post
- [ ] Teste 8: Não criar notificação ao comentar no próprio post
- [ ] Teste 9: Múltiplas notificações
- [ ] Teste 10: Estado vazio
- [ ] Teste 11: Formatação de tempo
- [ ] Teste 12: Ícones e cores por tipo

---

## 🎯 Resultado Final Esperado

Após todos os testes, você deve ter:
- ✅ Sistema de notificações funcionando completamente
- ✅ Notificações sendo criadas automaticamente
- ✅ Notificações sendo exibidas corretamente
- ✅ Cliques navegando para os lugares corretos
- ✅ Notificações sendo marcadas como lidas
- ✅ Sem notificações duplicadas ou desnecessárias

---

**Boa sorte com os testes! 🚀**
