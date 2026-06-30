import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { Resend } from 'resend';
import { createServiceClient } from '../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Sécurité : Vercel Cron envoie un header Authorization avec CRON_SECRET
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'non autorisé' }, { status: 401 });
  }

  const supabase = createServiceClient();

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('reminder_sent', false)
    .gt('reminder_days_before', 0);

  if (!events || events.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueEvents = events.filter(ev => {
    const evDate = new Date(ev.date + 'T00:00:00');
    const diffDays = Math.round((evDate - today) / 86400000);
    return diffDays === ev.reminder_days_before;
  });

  if (dueEvents.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const { data: subs } = await supabase.from('push_subscriptions').select('*');
  const { data: profiles } = await supabase.from('profiles').select('*');

  let pushCount = 0, emailCount = 0;

  for (const ev of dueEvents) {
    const title = `Rappel : ${ev.title}`;
    const body = `Le ${new Date(ev.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}${ev.time ? ' à ' + ev.time : ''}${ev.location ? ' · ' + ev.location : ''}`;

    // Push web
    for (const s of subs || []) {
      try {
        await webpush.sendNotification(s.subscription, JSON.stringify({ title, body, url: '/agenda' }));
        pushCount++;
      } catch (e) {
        // abonnement expiré ou invalide : on l'ignore (nettoyage possible plus tard)
      }
    }

    // Email
    if (resend) {
      for (const p of profiles || []) {
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: p.email,
            subject: title,
            html: `<p>${body}</p><p>${ev.description ? ev.description.replace(/\n/g, '<br>') : ''}</p>`
          });
          emailCount++;
        } catch (e) {}
      }
    }

    await supabase.from('events').update({ reminder_sent: true }).eq('id', ev.id);
  }

  return NextResponse.json({ ok: true, events: dueEvents.length, pushCount, emailCount });
}
