import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

webpush.setVapidDetails(
  'mailto:contact@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  const body = await request.json();
  const plaque = body.plaque || 'une moto';
  const gare = body.gare ? ` (${body.gare})` : '';

  const { data: subs, error } = await supabase.rpc('get_all_push_subscriptions');
  if (error || !subs) {
    return Response.json({ sent: 0, error: error?.message }, { status: 200 });
  }

  const payload = JSON.stringify({
    title: '🚨 Moto signalée volée',
    body: `Plaque ${plaque}${gare} — restez vigilant.`,
  });

  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      const subscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      try {
        await webpush.sendNotification(subscription, payload);
        sent += 1;
      } catch (e) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase.rpc('remove_push_subscription', { p_endpoint: s.endpoint });
        }
      }
    })
  );

  return Response.json({ sent });
}
