// api/signals.js — AgriSMES signals dashboard
// Hardcoded Supabase key REMOVED. Uses SUPABASE_SERVICE_ROLE_KEY env var.
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const SB_URL = process.env.SUPABASE_URL || 'https://blwahyqkwqvffdqxzuzn.supabase.co';

async function q(path) {
  if (!KEY) return { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' };
  const r = await fetch(SB_URL + path, {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
  });
  return r.json();
}

export default async function handler(req, res) {
  // Only allow admin requests
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const [calcs, wl] = await Promise.all([
      q('/rest/v1/agrismes_calculations?select=*&limit=500&order=calculated_at.desc'),
      q('/rest/v1/agrismes_waitlist?select=*&order=captured_at.desc')
    ]);
    if (!Array.isArray(calcs)) return res.status(200).json({ error: 'DB error', detail: calcs });

    const gc = {}, rc = {}, rlc = {};
    let tm = 0, mc = 0, pc = 0, rj = 0;
    calcs.forEach(c => {
      if (c.grade) gc[c.grade] = (gc[c.grade] || 0) + 1;
      const rt = (c.origin_port || '?') + ' to ' + (c.destination_port || '?');
      rc[rt] = (rc[rt] || 0) + 1;
      if (c.role) rlc[c.role] = (rlc[c.role] || 0) + 1;
      if (c.gross_margin_pct != null) { tm += c.gross_margin_pct; mc++; }
      if (['PROCEED', 'SELL NOW'].includes(c.decision_signal)) pc++;
      if (['REJECT', 'LOSS', 'HOLD'].includes(c.decision_signal)) rj++;
    });
    const tg = Object.entries(gc).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const tr = Object.entries(rc).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const trl = Object.entries(rlc).sort((a, b) => b[1] - a[1]);
    const sigs = [];
    if (tg[0]) sigs.push({ priority: 'HIGH', type: 'DEMAND', title: tg[0][0] + ' is most analysed', detail: tg[0][1] + ' analyses', value: tg[0][1] });
    if (Array.isArray(wl) && wl.length > 0) sigs.push({ priority: 'HIGH', type: 'REVENUE', title: wl.length + ' Pro requests', detail: wl.slice(0, 3).map(w => w.email).join(', '), value: wl.length });
    if (tr[0] && !tr[0][0].includes('?')) sigs.push({ priority: 'HIGH', type: 'ROUTE', title: 'Hot route: ' + tr[0][0], detail: tr[0][1] + ' analyses', value: tr[0][1] });
    if (trl[0]) sigs.push({ priority: 'LOW', type: 'AUDIENCE', title: trl[0][0] + 's are primary users', detail: trl[0][1] + ' of ' + calcs.length, value: trl[0][1] });

    return res.status(200).json({
      summary: { total: calcs.length, pro_requests: Array.isArray(wl) ? wl.length : 0, avg_margin: mc ? Math.round(tm / mc * 10) / 10 : 0, proceed_rate: calcs.length ? Math.round(pc / calcs.length * 100) : 0 },
      signals: sigs, top_grades: tg, top_routes: tr, top_roles: trl,
      waitlist: Array.isArray(wl) ? wl.slice(0, 10) : []
    });
  } catch (e) { return res.status(200).json({ error: e.message }); }
}
