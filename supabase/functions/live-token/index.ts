// Supabase Edge Function — gera token LiveKit (host ou viewer)
// Secrets: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { AccessToken } from 'https://esm.sh/livekit-server-sdk@2.9.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LIVEKIT_API_KEY') || '';
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET') || '';
    const livekitUrl = (Deno.env.get('LIVEKIT_URL') || '').replace(/\/$/, '');

    if (!apiKey || !apiSecret || !livekitUrl) {
      return json(
        {
          error:
            'LiveKit não configurado. Defina LIVEKIT_URL, LIVEKIT_API_KEY e LIVEKIT_API_SECRET nos secrets da function.',
        },
        500
      );
    }

    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return json({ error: 'Não autenticado' }, 401);
    }

    const body = await req.json();
    const roomName = String(body.roomName || '')
      .slice(0, 64)
      .replace(/[^a-zA-Z0-9_-]/g, '-');
    const displayName = String(body.displayName || user.email || 'user').slice(0, 64);
    const asHost = Boolean(body.asHost);

    if (!roomName) {
      return json({ error: 'roomName obrigatório' }, 400);
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: displayName,
      ttl: '6h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: asHost,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    const embedUrl =
      `https://meet.livekit.io/custom?` +
      `liveKitUrl=${encodeURIComponent(livekitUrl)}&token=${encodeURIComponent(token)}`;

    return json({
      token,
      url: livekitUrl,
      roomName,
      embedUrl,
      provider: 'livekit',
    });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
