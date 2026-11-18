# live-token

Gera JWT LiveKit para host/viewer.

## Secrets (Dashboard → Edge Functions → Secrets)

```
LIVEKIT_URL=wss://xxxx.livekit.cloud
LIVEKIT_API_KEY=APIxxxx
LIVEKIT_API_SECRET=secretxxxx
```

## Deploy

```bash
npx supabase login
npx supabase link --project-ref cadesrvtxizfxxhhfjxj
npx supabase secrets set LIVEKIT_URL=wss://xxxx.livekit.cloud LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=...
npx supabase functions deploy live-token
```

Ou faça upload da pasta no Dashboard → Edge Functions.
