
import jsPDF from 'jspdf';

interface TradeData {
  origin_country?: string;
  destination_country?: string;
  grade?: string;
  incoterm?: string;
  quantity_mt?: number;
  price_usd_mt?: number;
  gross_margin_pct?: number;
  net_yield_per_mt?: number;
  total_net_yield?: number;
  breakeven_price?: number;
  total_costs?: number;
  freight_usd_mt?: number;
  decision_signal?: string;
  name?: string;
  created_at?: string;
  user_input?: string;
}

const SIGNAL_COLORS: Record<string, [number, number, number]> = {
  PROCEED: [16, 185, 129],
  CAUTION: [245, 158, 11],
  DANGER:  [239, 68, 68],
};

export function exportTradePDF(trade: TradeData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const MARGIN = 18;
  const COL = W - MARGIN * 2;
  let y = 0;

  // ─ Header bar
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, W, 36, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('AgriSMES', MARGIN, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('Trade Margin Verification Report', MARGIN, 23);
  doc.text('agrismes.com', W - MARGIN, 23, { align: 'right' });
  y = 44;

  // ─ Trade title
  const title = trade.name ||
    (trade.origin_country && trade.destination_country
      ? trade.origin_country + ' to ' + trade.destination_country
      : 'Trade Analysis');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(title, MARGIN, y);
  y += 6;

  // Date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  const dateStr = trade.created_at
    ? new Date(trade.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text('Generated: ' + dateStr, MARGIN, y);
  y += 10;

  // ─ Signal badge
  const signal = trade.decision_signal || 'CAUTION';
  const sigColor = SIGNAL_COLORS[signal] || SIGNAL_COLORS.CAUTION;
  doc.setFillColor(...sigColor);
  doc.roundedRect(MARGIN, y, 36, 8, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(signal, MARGIN + 18, y + 5.2, { align: 'center' });
  y += 16;

  // ─ Section helper
  const section = (label: string) => {
    doc.setFillColor(245, 245, 245);
    doc.rect(MARGIN, y, COL, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(label.toUpperCase(), MARGIN + 3, y + 4.8);
    y += 10;
  };

  // Row helper
  const row = (label: string, value: string, highlight = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(label, MARGIN, y);
    doc.setFont('helvetica', 'bold');
    if (highlight) {
      const col = signal === 'PROCEED' ? [16,185,129] : signal === 'DANGER' ? [239,68,68] : [245,158,11];
      doc.setTextColor(...(col as [number,number,number]));
    } else {
      doc.setTextColor(20, 20, 20);
    }
    doc.text(value || 'N/A', W - MARGIN, y, { align: 'right' });
    y += 6;
    // divider
    doc.setDrawColor(235, 235, 235);
    doc.line(MARGIN, y - 1, W - MARGIN, y - 1);
  };

  // ─ Trade Parameters
  section('Trade Parameters');
  if (trade.origin_country)    row('Origin',          trade.origin_country);
  if (trade.destination_country) row('Destination',   trade.destination_country);
  if (trade.grade)             row('Grade',           trade.grade);
  if (trade.incoterm)          row('Incoterm',        trade.incoterm);
  if (trade.quantity_mt)       row('Quantity',        trade.quantity_mt + ' MT');
  if (trade.price_usd_mt)      row('Price',           '$' + trade.price_usd_mt.toLocaleString() + ' / MT');
  y += 4;

  // ─ Margin Analysis
  section('Margin Analysis');
  if (trade.gross_margin_pct != null)  row('Gross Margin',      trade.gross_margin_pct + '%', true);
  if (trade.net_yield_per_mt != null)  row('Net Yield / MT',    '$' + trade.net_yield_per_mt.toLocaleString(), true);
  if (trade.total_net_yield != null)   row('Total Net Yield',   '$' + trade.total_net_yield.toLocaleString(), true);
  if (trade.breakeven_price != null)   row('Breakeven Price',   '$' + trade.breakeven_price.toLocaleString() + ' / MT');
  if (trade.total_costs != null)       row('Total Costs',       '$' + trade.total_costs.toLocaleString() + ' / MT');
  if (trade.freight_usd_mt != null)    row('Freight',           '$' + trade.freight_usd_mt.toLocaleString() + ' / MT');
  y += 4;

  // ─ User input if present
  if (trade.user_input) {
    section('Trade Input');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(trade.user_input, COL);
    doc.text(lines, MARGIN, y);
    y += lines.length * 4.5 + 6;
  }

  // ─ Footer
  const footerY = 287;
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN, footerY, W - MARGIN, footerY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('AgriSMES | agrismes.com | Powered by LenDigital Solutions', MARGIN, footerY + 4);
  doc.text('This report is for informational purposes. Verify all assumptions before committing capital.', MARGIN, footerY + 8);

  // Save
  const filename = 'AgriSMES-' + title.replace(/[^a-zA-Z0-9]/g, '-') + '-' + new Date().toISOString().slice(0, 10) + '.pdf';
  doc.save(filename);
}
