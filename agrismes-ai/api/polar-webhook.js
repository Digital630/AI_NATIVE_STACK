import {
  extractPolarSubscription,
  getSupabaseAdmin,
  readRawBody,
  upsertSubscription,
  verifyPolarSignature,
} from '../server/subscription-utils.js';
import { captureError } from './_observability.js';

const HANDLED_EVENTS = new Set([
  'order.created',
  'order.paid',
  'subscription.created',
  'subscription.active',
  'subscription.updated',
  'subscription.canceled',
  'benefit_grant.created',
  'benefit_grant.revoked',
  'checkout.updated',
]);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let eventId = null;
  let eventType = null;

  try {
    const rawBody = await readRawBody(req);
    const signatureValid = verifyPolarSignature({
      rawBody,
      headers: req.headers,
      secret: process.env.POLAR_WEBHOOK_SECRET,
    });

    if (!signatureValid) {
      console.warn('[polar-webhook] Invalid signature rejected');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody);
    eventId = event.id || req.headers['webhook-id'] || req.headers['svix-id'];
    eventType = event.type || event.event_type;

    if (!eventId || !eventType) {
      return res.status(400).json({ error: 'Invalid Polar event payload' });
    }

    const supabase = getSupabaseAdmin();
    const { data: existingEvent } = await supabase
      .from('polar_webhook_events')
      .select('id, processed')
      .eq('polar_event_id', eventId)
      .maybeSingle();

    if (existingEvent?.processed) {
      console.info(`[polar-webhook] Duplicate event ignored: ${eventType} ${eventId}`);
      return res.status(200).json({ ok: true, duplicate: true });
    }

    const eventRecord = existingEvent
      ? existingEvent
      : (
          await supabase
            .from('polar_webhook_events')
            .insert({
              polar_event_id: eventId,
              event_type: eventType,
              processed: false,
              payload: event,
            })
            .select('id, processed')
            .single()
        ).data;

    if (!eventRecord?.id) {
      throw new Error('Unable to store Polar webhook event.');
    }

    if (!HANDLED_EVENTS.has(eventType)) {
      await supabase
        .from('polar_webhook_events')
        .update({ processed: true, error: null })
        .eq('id', eventRecord.id);
      return res.status(200).json({ ok: true, ignored: eventType });
    }

    const subscription = extractPolarSubscription(event);
    const subscriptionRow = await upsertSubscription(supabase, subscription);

    await supabase
      .from('polar_webhook_events')
      .update({ processed: true, error: null })
      .eq('id', eventRecord.id);

    console.info(
      `[polar-webhook] Processed ${eventType} for ${subscriptionRow.email} (${subscriptionRow.status}/${subscriptionRow.plan})`
    );

    return res.status(200).json({
      ok: true,
      event_type: eventType,
      subscription_id: subscriptionRow.id,
      status: subscriptionRow.status,
    });
  } catch (error) {
    console.error(`[polar-webhook] Failed ${eventType || 'unknown'} ${eventId || ''}:`, error);
    captureError(error, { handler: 'polar-webhook', eventType, eventId });

    try {
      if (eventId) {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('polar_webhook_events')
          .upsert(
            {
              polar_event_id: eventId,
              event_type: eventType || 'unknown',
              processed: false,
              error: error.message,
            },
            { onConflict: 'polar_event_id' }
          );
      }
    } catch (logError) {
      console.error('[polar-webhook] Failed to record webhook error:', logError);
    }

    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
