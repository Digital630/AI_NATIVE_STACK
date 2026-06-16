export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.AGRISMES_FROM_EMAIL || 'AgriSMES <margin@agrismes.com>';

  // Send email via Resend with 3-attempt fallback
  async function sendEmail(to, subject, html) {
    const froms = [
      process.env.AGRISMES_FROM_EMAIL || 'AgriSMES <margin@agrismes.com>',
      'AgriSMES <margin@agrismes.com>',
      'AgriSMES <onboarding@resend.dev>',
    ];
    for (const from of froms) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RESEND_KEY },
          body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, html,
            reply_to: 'margin@agrismes.com' })
        });
        const d = await r.json();
        if (r.ok && d.id) { console.log('email sent via', from, d.id); return { ok: true, id: d.id }; }
        console.error('email attempt failed:', from, r.status, JSON.stringify(d).slice(0, 100));
      } catch (e) { console.error('email exception:', e.message); }
    }
    return { ok: false, error: 'All email attempts failed' };
  }

  try {
    const body = req.body || {};
    const action = body.action;

    // ─── SUBMIT_UPGRADE_REQUEST — full payment submission with admin + customer emails ───
    if (action === 'submit_upgrade_request') {
      const { email, full_name, company_name, payment_method, reference, amount, currency, plan, notes } = body;
      if (!email || !reference) return res.status(400).json({ error: 'Email and transaction reference are required.' });

      const ref = String(reference).trim().toUpperCase().replace(/\s+/g, '-');
      if (ref.length < 4) return res.status(400).json({ error: 'Reference too short.' });

      // Log submission
      console.log('AgriSMES upgrade request:', { email, full_name, company_name, ref, amount, plan });

      // Generate a simple activation token
      const token = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      // ── Admin email ──
      const adminHtml = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0d1117;padding:32px;border-radius:12px">
          <div style="font-size:22px;font-weight:900;color:#2ea043;margin-bottom:4px">AgriSMES</div>
          <div style="font-size:13px;color:#8b949e;margin-bottom:24px">Payment Verification Required</div>
          <h2 style="font-size:18px;color:#f0f6fc;font-weight:800;margin-bottom:20px">[AgriSMES Pro] New USD Payment Submission</h2>
          <div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:18px;margin-bottom:20px">
            ${[
              ['Customer', `${full_name || '—'} / ${company_name || '—'}`],
              ['Email', email],
              ['Reference', ref],
              ['Amount', `$${amount || '9'} ${currency || 'USD'}`],
              ['Plan', plan || 'pro_monthly'],
              ['Method', payment_method || 'usd_wire'],
              ['Notes', notes || '—'],
              ['Submitted', new Date().toISOString()],
            ].map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #21262d;font-size:13px"><span style="color:#8b949e">${k}</span><span style="color:#f0f6fc;font-family:${k==='Reference'?'monospace':'Arial'};font-weight:${k==='Reference'?700:400}">${v}</span></div>`).join('')}
          </div>
          <div style="background:#1a3a2a;border:1px solid #2ea043;border-radius:8px;padding:18px;margin-bottom:20px;text-align:center">
            <div style="font-size:13px;color:#8b949e;margin-bottom:12px">ACTION REQUIRED: Verify payment before activating</div>
            <div style="font-size:12px;color:#6e7681;margin-top:12px">
              To activate: Reply to this email confirming payment verified, or use the AgriSMES admin panel.
            </div>
          </div>
          <div style="font-size:12px;color:#6e7681;text-align:center">
            Do not activate unless payment is verified in CRDB account. Reference: <strong style="color:#58a6ff;font-family:monospace">${ref}</strong>
          </div>
        </div>`;

      // ── Customer confirmation email ──
      const customerHtml = `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0d1117;padding:32px;border-radius:12px">
          <div style="font-size:22px;font-weight:900;color:#2ea043;margin-bottom:4px">AgriSMES</div>
          <div style="font-size:13px;color:#8b949e;margin-bottom:24px">Payment Received — Verification in Progress</div>
          <h2 style="font-size:18px;color:#f0f6fc;font-weight:800;margin-bottom:8px">Your reference has been submitted</h2>
          <p style="color:#8b949e;font-size:14px;line-height:1.6;margin-bottom:20px">
            Thank you, ${full_name || 'valued customer'}. We have received your payment reference for AgriSMES Pro.
            Our team will verify the USD wire transfer and activate your account — usually within a few hours.
          </p>
          <div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:16px;margin-bottom:20px">
            ${[
              ['Reference', ref],
              ['Plan', 'AgriSMES Pro — $9/month'],
              ['Payment', 'USD Wire Transfer — CRDB Bank PLC'],
              ['Status', 'Pending verification'],
            ].map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #21262d;font-size:12px"><span style="color:#8b949e">${k}</span><span style="color:${k==='Reference'?'#58a6ff':'#f0f6fc'};font-family:${k==='Reference'?'monospace':'Arial'};font-weight:${k==='Reference'?700:400}">${v}</span></div>`).join('')}
          </div>
          <p style="font-size:12px;color:#6e7681;text-align:center;line-height:1.6">
            Questions? Email <a href="mailto:margin@agrismes.com" style="color:#58a6ff">margin@agrismes.com</a>
          </p>
        </div>`;

      // Send both emails
      const [adminResult, customerResult] = await Promise.all([
        sendEmail('margin@agrismes.com', '[AgriSMES Pro] New USD Payment Submission — ' + ref, adminHtml),
        sendEmail(email, 'Payment Received — AgriSMES Pro Verification', customerHtml),
      ]);

      console.log('admin email:', adminResult.ok, '| customer email:', customerResult.ok);

      return res.status(200).json({
        success: true,
        status: 'pending_verification',
        reference: ref,
        token,
        admin_email_sent: adminResult.ok,
        customer_email_sent: customerResult.ok,
        message: 'Payment reference submitted. Admin notified for verification.',
      });
    }

    // ─── LEGACY: simple notify (email + role only) ───
    if (action === 'notify' || !action) {
      const { email, role } = body;
      if (!email) return res.status(400).json({ error: 'email required' });
      const result = await sendEmail(
        'margin@agrismes.com',
        'New Pro Upgrade Request — AgriSMES',
        `<h2 style="color:#2ea043">New Pro Request</h2>
         <p><strong>Email:</strong> ${email}</p>
         <p><strong>Role:</strong> ${role || 'not specified'}</p>
         <p><strong>Time:</strong> ${new Date().toISOString()}</p>`
      );
      return res.status(200).json({ ok: result.ok, error: result.error });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('notify-pro error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

