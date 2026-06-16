import jsPDF from 'jspdf';

// Conversation message interface for PDF generation
interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// Level badge colors for PDF
const LEVEL_BADGE_COLORS: Record<string, { bg: number[]; text: number[] }> = {
  none: { bg: [229, 231, 235], text: [107, 114, 128] },
  Basic: { bg: [220, 252, 231], text: [21, 128, 61] },
  Silver: { bg: [226, 232, 240], text: [71, 85, 105] },
  Gold: { bg: [254, 243, 199], text: [180, 83, 9] },
  Premium: { bg: [209, 250, 229], text: [4, 120, 87] },
  Platinum: { bg: [241, 245, 249], text: [51, 65, 85] },
};

/**
 * Generate a VIEW-ONLY PDF of the conversation
 * HARD ENFORCEMENT: No download, no empty state, minimum 3 exchanges required
 * 
 * Document Structure (Non-Negotiable):
 * - HEADER: Title, Assistant label, Date
 * - BODY: Full chat transcript (verbatim, chronological)
 * - FOOTER: RewardFlow Engagement Summary with letter-style paragraph
 */
export const generateConversationPDF = (
  messages: ConversationMessage[],
  level: string = "none",
  points: number = 0,
  detectedSkill?: string,
  returnDataUrl: boolean = true
): string => {
  // FAILSAFE: Never generate empty document
  if (!messages || messages.length === 0 || !level) {
    return '';
  }
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Current date
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Calculate complete exchanges for maturity determination
  let exchangeCount = 0;
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === "user" && messages[i + 1]?.role === "assistant") {
      exchangeCount++;
      i++;
    }
  }
  
  // Determine title based on conversation maturity (3-4 exchanges = 6-8 messages)
  const isEarlyStage = exchangeCount < 4;
  const title = isEarlyStage ? "Conversation Snapshot (Informational)" : "Conversation Summary (Informational)";
  
  // Header - Simple, not FundMySME branded prominently
  doc.setFillColor(248, 250, 252); // Very light gray
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(title, margin, 18);
  
  // Date and key
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Assistant: Alex (AgriSMES)`, margin, 26);
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 50, 26);
  
  let y = 45;
  
  // Conversation section header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text("Conversation", margin, y);
  y += 8;
  
  // Separator line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  
  // Messages
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  for (const message of messages) {
    // Check if we need a new page
    if (y > pageHeight - 60) {
      doc.addPage();
      y = margin;
    }
    
    const speaker = message.role === "assistant" ? "Alex" : "User";
    const isAlex = message.role === "assistant";
    
    // Speaker label
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isAlex ? 34 : 71, isAlex ? 87 : 85, isAlex ? 64 : 105); // Green for Alex, Slate for User
    doc.text(`${speaker}:`, margin, y);
    
    // Message content
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85); // Slate-700
    
    const lines = doc.splitTextToSize(message.content, contentWidth);
    y += 5;
    
    for (const line of lines) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    }
    
    y += 6; // Space between messages
  }
  
  // Ensure space for RewardFlow section
  if (y > pageHeight - 100) {
    doc.addPage();
    y = margin;
  }
  
  // RewardFlow Engagement Summary section
  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;
  
  // Section title with small badge
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text("RewardFlow Engagement Summary", margin, y);
  
  // Level badge (small, subtle, right side)
  if (level && level !== "none") {
    const badgeColors = LEVEL_BADGE_COLORS[level] || LEVEL_BADGE_COLORS.none;
    const badgeText = `${level} • ${points} pts`;
    const badgeWidth = doc.getStringUnitWidth(badgeText) * 8 / doc.internal.scaleFactor + 8;
    const badgeX = pageWidth - margin - badgeWidth;
    
    doc.setFillColor(badgeColors.bg[0], badgeColors.bg[1], badgeColors.bg[2]);
    doc.roundedRect(badgeX, y - 4, badgeWidth, 7, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(badgeColors.text[0], badgeColors.text[1], badgeColors.text[2]);
    doc.text(badgeText, badgeX + 4, y + 1);
  }
  
  y += 10;
  
  // Letter-style engagement summary (not bullets)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  
  // Compose the letter based on conversation maturity
  let letterContent: string;
  
  if (isEarlyStage) {
    letterContent = `This document captures an initial exploration between a user and AgriSMES's AI assistant. ` +
      `The conversation reflects early-stage engagement, where context is still being gathered. ` +
      (detectedSkill ? `Early signals suggest interest in areas related to ${detectedSkill}. ` : '') +
      `As with all RewardFlow records, this snapshot is informational and reflects interaction quality only.`;
  } else {
    letterContent = `This document summarizes a structured conversation between a user and AgriSMES's AI assistant. ` +
      `The exchange demonstrates progressive engagement, with questions moving from general inquiry toward more specific trade-related details. ` +
      (detectedSkill ? `The conversation indicates developing clarity around ${detectedSkill}. ` : '') +
      `The user's current RewardFlow level of ${level || 'Basic'} reflects cumulative engagement depth and quality.`;
  }
  
  const letterLines = doc.splitTextToSize(letterContent, contentWidth);
  for (const line of letterLines) {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 5;
  }
  
  y += 8;
  
  // Governance statement (calm, integrated, not emphasized)
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const governanceText = "RewardFlow reflects engagement and interaction quality only. It does not represent approval, eligibility, certification, or endorsement by AgriSMES or any affiliated institution.";
  const govLines = doc.splitTextToSize(governanceText, contentWidth);
  for (const line of govLines) {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 4;
  }
  
  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text("AgriSMES – Trade Readiness Framework", margin, pageHeight - 15);
  doc.text("This document is for informational and continuity purposes only.", margin, pageHeight - 10);
  
  // Return as data URL for viewing, or save for download
  if (returnDataUrl) {
    return doc.output('dataurlstring');
  } else {
    const filename = `AgriSMES_Conversation_${now.toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    return filename;
  }
};

const addHeader = (doc: jsPDF, title: string) => {
  // Green header bar
  doc.setFillColor(34, 87, 64);
  doc.rect(0, 0, 210, 30, 'F');
  
  // Title in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AgriSMES', 20, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Trade Readiness Framework', 20, 24);
  
  // Document title
  doc.setTextColor(34, 87, 64);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 45);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
};

const addFooter = (doc: jsPDF) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('AgriSMES – Trade Readiness Framework', 20, pageHeight - 15);
  doc.text('This document is for assessment and preparation purposes only.', 20, pageHeight - 10);
};

const addFormField = (doc: jsPDF, label: string, y: number, width: number = 170): number => {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(label, 20, y);
  doc.setFont('helvetica', 'normal');
  doc.line(20, y + 5, width, y + 5);
  return y + 15;
};

const addSectionTitle = (doc: jsPDF, title: string, y: number): number => {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 87, 64);
  doc.text(title, 20, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  return y + 8;
};

const addBulletPoint = (doc: jsPDF, text: string, y: number): number => {
  doc.setFontSize(10);
  doc.text('•', 20, y);
  doc.text(text, 28, y);
  return y + 7;
};

const addParagraph = (doc: jsPDF, text: string, y: number, maxWidth: number = 170): number => {
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, 20, y);
  return y + (lines.length * 5) + 5;
};

export const generateSMEApplicationForm = () => {
  const doc = new jsPDF();
  
  addHeader(doc, 'SME Application Form');
  
  let y = 60;
  
  y = addParagraph(doc, 'Please complete all sections accurately. This form is used for trade readiness assessment purposes only.', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Business Information', y);
  y = addFormField(doc, 'Business Name:', y);
  y = addFormField(doc, 'Country of Operation:', y);
  y = addFormField(doc, 'Type of Business:', y);
  y = addFormField(doc, 'Years of Operation:', y);
  
  y = addSectionTitle(doc, 'Contact Information', y + 5);
  y = addFormField(doc, 'Contact Person (Full Name):', y);
  y = addFormField(doc, 'Phone Number:', y);
  y = addFormField(doc, 'Email Address:', y);
  
  y = addSectionTitle(doc, 'Business Activities', y + 5);
  doc.setFontSize(10);
  doc.text('Brief Description of Activities:', 20, y);
  y += 5;
  doc.rect(20, y, 170, 30);
  y += 40;
  
  y = addSectionTitle(doc, 'Declaration', y);
  y = addParagraph(doc, 'I declare that the information provided in this application is true and accurate to the best of my knowledge. I understand that this submission is for assessment purposes only and does not guarantee any services or outcomes.', y);
  
  y += 10;
  addFormField(doc, 'Signature:', y, 100);
  doc.text('Date:', 110, y);
  doc.line(125, y + 5, 190, y + 5);
  
  addFooter(doc);
  
  doc.save('AgriSMES_SME_Application_Form.pdf');
};

export const generateDocumentationChecklist = () => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Documentation Checklist');
  
  let y = 60;
  
  y = addParagraph(doc, 'The following documents are typically required for SME trade readiness assessment. Please prepare these documents for review.', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Business Registration', y);
  y = addBulletPoint(doc, 'Certificate of Incorporation / Business Registration', y);
  y = addBulletPoint(doc, 'Business License (current and valid)', y);
  y = addBulletPoint(doc, 'Memorandum and Articles of Association (if applicable)', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Tax Identification', y);
  y = addBulletPoint(doc, 'Tax Identification Number (TIN)', y);
  y = addBulletPoint(doc, 'Tax Clearance Certificate (if available)', y);
  y = addBulletPoint(doc, 'VAT Registration (if applicable)', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Bank Account Details', y);
  y = addBulletPoint(doc, 'Bank Account Statement (last 6 months)', y);
  y = addBulletPoint(doc, 'Bank Reference Letter (optional)', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Ownership Information', y);
  y = addBulletPoint(doc, 'Shareholder Register / List of Owners', y);
  y = addBulletPoint(doc, 'Identification Documents of Directors/Owners', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Basic Financial Records', y);
  y = addBulletPoint(doc, 'Audited Financial Statements (if available)', y);
  y = addBulletPoint(doc, 'Management Accounts (recent period)', y);
  y = addBulletPoint(doc, 'Income and Expense Records', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Export-Related Documents (if applicable)', y);
  y = addBulletPoint(doc, 'Export License', y);
  y = addBulletPoint(doc, 'Previous Export Documentation', y);
  y = addBulletPoint(doc, 'Quality Certifications', y);
  
  addFooter(doc);
  
  doc.save('AgriSMES_Documentation_Checklist.pdf');
};

export const generateTradeReadinessGuidelines = () => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Trade Readiness Guidelines');
  
  let y = 60;
  
  y = addSectionTitle(doc, 'What is Trade Readiness?', y);
  y = addParagraph(doc, 'Trade readiness refers to an SME\'s capacity to engage in formal trade activities, access markets, and meet the requirements of financial institutions and trading partners. It encompasses documentation, operational capacity, and business structure.', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Internal Assessment Stages', y);
  y = addParagraph(doc, 'The assessment process involves several stages designed to evaluate an SME\'s preparedness:', y);
  y = addBulletPoint(doc, 'Initial Review: Evaluation of submitted application and documentation', y);
  y = addBulletPoint(doc, 'Documentation Analysis: Verification of business records and compliance', y);
  y = addBulletPoint(doc, 'Capacity Assessment: Review of operational and financial capacity', y);
  y = addBulletPoint(doc, 'Gap Identification: Identification of areas requiring improvement', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Field Verification', y);
  y = addParagraph(doc, 'Where applicable and feasible, field verification may be conducted to:', y);
  y = addBulletPoint(doc, 'Confirm physical business presence', y);
  y = addBulletPoint(doc, 'Verify operational activities', y);
  y = addBulletPoint(doc, 'Assess infrastructure and resources', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Documentation Review', y);
  y = addParagraph(doc, 'All submitted documents undergo review for completeness, accuracy, and validity. SMEs may be asked to provide additional information or clarification during this process.', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Important Notice', y);
  doc.setFillColor(245, 245, 245);
  doc.rect(20, y, 170, 25, 'F');
  y += 5;
  y = addParagraph(doc, 'Participation in the trade readiness assessment process does not guarantee approval, funding, or engagement with any financial institution or trading partner. This process is for assessment and preparation purposes only.', y);
  
  addFooter(doc);
  
  doc.save('AgriSMES_Trade_Readiness_Guidelines.pdf');
};

export const generateFinancialStatementTemplate = () => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Financial Statement Template');
  
  let y = 60;
  
  y = addParagraph(doc, 'Use this template to prepare a summary of your business financial position. Complete all sections with accurate figures.', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Business Information', y);
  y = addFormField(doc, 'Business Name:', y);
  y = addFormField(doc, 'Period Covered:', y);
  y += 5;
  
  y = addSectionTitle(doc, 'Income Summary', y);
  doc.setFontSize(10);
  const incomeHeaders = ['Description', 'Amount'];
  const incomeCol1 = 20;
  const incomeCol2 = 140;
  
  doc.setFont('helvetica', 'bold');
  doc.text(incomeHeaders[0], incomeCol1, y);
  doc.text(incomeHeaders[1], incomeCol2, y);
  doc.setFont('helvetica', 'normal');
  y += 3;
  doc.line(20, y, 190, y);
  y += 7;
  
  const incomeItems = ['Sales Revenue', 'Service Income', 'Other Income', 'Total Income'];
  incomeItems.forEach(item => {
    doc.text(item, incomeCol1, y);
    doc.line(incomeCol2, y + 2, 190, y + 2);
    y += 8;
  });
  y += 5;
  
  y = addSectionTitle(doc, 'Expense Summary', y);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', incomeCol1, y);
  doc.text('Amount', incomeCol2, y);
  doc.setFont('helvetica', 'normal');
  y += 3;
  doc.line(20, y, 190, y);
  y += 7;
  
  const expenseItems = ['Cost of Goods/Services', 'Salaries & Wages', 'Rent & Utilities', 'Other Expenses', 'Total Expenses'];
  expenseItems.forEach(item => {
    doc.text(item, incomeCol1, y);
    doc.line(incomeCol2, y + 2, 190, y + 2);
    y += 8;
  });
  y += 5;
  
  y = addSectionTitle(doc, 'Assets & Liabilities', y);
  doc.setFont('helvetica', 'bold');
  doc.text('Assets', 20, y);
  doc.text('Liabilities', 110, y);
  doc.setFont('helvetica', 'normal');
  y += 3;
  doc.line(20, y, 100, y);
  doc.line(110, y, 190, y);
  y += 7;
  
  const balanceItems = ['Cash & Bank', 'Inventory', 'Equipment', 'Other Assets', 'Total'];
  const liabilityItems = ['Short-term Loans', 'Accounts Payable', 'Long-term Debt', 'Other Liabilities', 'Total'];
  
  balanceItems.forEach((item, i) => {
    doc.text(item, 20, y);
    doc.line(60, y + 2, 100, y + 2);
    doc.text(liabilityItems[i], 110, y);
    doc.line(160, y + 2, 190, y + 2);
    y += 8;
  });
  
  addFooter(doc);
  
  doc.save('AgriSMES_Financial_Statement_Template.pdf');
};

export const generateBusinessPlanTemplate = () => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Business Plan Template');
  
  let y = 60;
  
  y = addParagraph(doc, 'Use this template to prepare a summary business plan. Complete each section with relevant information about your business.', y);
  y += 5;
  
  y = addSectionTitle(doc, '1. Business Overview', y);
  doc.setFontSize(10);
  doc.text('Business Name:', 20, y);
  doc.line(55, y + 2, 190, y + 2);
  y += 10;
  doc.text('Description of Business:', 20, y);
  y += 5;
  doc.rect(20, y, 170, 20);
  y += 30;
  
  y = addSectionTitle(doc, '2. Products/Services', y);
  doc.text('Main Products or Services Offered:', 20, y);
  y += 5;
  doc.rect(20, y, 170, 20);
  y += 30;
  
  y = addSectionTitle(doc, '3. Market Overview', y);
  doc.text('Target Market and Customers:', 20, y);
  y += 5;
  doc.rect(20, y, 170, 15);
  y += 20;
  doc.text('Key Competitors:', 20, y);
  y += 5;
  doc.rect(20, y, 170, 15);
  y += 25;
  
  y = addSectionTitle(doc, '4. Operations', y);
  doc.text('Location and Facilities:', 20, y);
  y += 5;
  doc.rect(20, y, 170, 15);
  y += 20;
  doc.text('Number of Employees:', 20, y);
  doc.line(70, y + 2, 120, y + 2);
  y += 15;
  
  y = addSectionTitle(doc, '5. Financial Summary', y);
  doc.text('Annual Revenue (Last Year):', 20, y);
  doc.line(75, y + 2, 130, y + 2);
  y += 10;
  doc.text('Projected Revenue (Next Year):', 20, y);
  doc.line(80, y + 2, 130, y + 2);
  
  addFooter(doc);
  
  doc.save('AgriSMES_Business_Plan_Template.pdf');
};

export const generateExportDocumentationGuide = () => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Export Documentation Guide');
  
  let y = 60;
  
  y = addParagraph(doc, 'This guide provides an overview of common export documentation requirements. Specific requirements may vary by country and product type.', y);
  y += 5;
  
  y = addSectionTitle(doc, '1. Commercial Invoice', y);
  y = addParagraph(doc, 'A commercial invoice is a bill for goods from the seller to the buyer. It typically includes:', y);
  y = addBulletPoint(doc, 'Seller and buyer details', y);
  y = addBulletPoint(doc, 'Description of goods', y);
  y = addBulletPoint(doc, 'Quantity and unit price', y);
  y = addBulletPoint(doc, 'Total value and currency', y);
  y = addBulletPoint(doc, 'Terms of sale (Incoterms)', y);
  y += 5;
  
  y = addSectionTitle(doc, '2. Packing List', y);
  y = addParagraph(doc, 'A packing list details the contents of a shipment and includes:', y);
  y = addBulletPoint(doc, 'Number of packages', y);
  y = addBulletPoint(doc, 'Weight (gross and net)', y);
  y = addBulletPoint(doc, 'Dimensions', y);
  y = addBulletPoint(doc, 'Contents of each package', y);
  y += 5;
  
  y = addSectionTitle(doc, '3. Certificate of Origin', y);
  y = addParagraph(doc, 'A certificate of origin certifies the country where the goods were manufactured or produced. It may be required for:', y);
  y = addBulletPoint(doc, 'Customs clearance', y);
  y = addBulletPoint(doc, 'Preferential tariff rates', y);
  y = addBulletPoint(doc, 'Trade agreement compliance', y);
  y += 5;
  
  y = addSectionTitle(doc, '4. Shipping Documents', y);
  y = addParagraph(doc, 'Depending on the mode of transport, you may need:', y);
  y = addBulletPoint(doc, 'Bill of Lading (sea freight)', y);
  y = addBulletPoint(doc, 'Airway Bill (air freight)', y);
  y = addBulletPoint(doc, 'Road Consignment Note (road transport)', y);
  y += 5;
  
  y = addSectionTitle(doc, 'General Notes', y);
  doc.setFillColor(245, 245, 245);
  doc.rect(20, y, 170, 30, 'F');
  y += 5;
  y = addParagraph(doc, 'Documentation requirements vary by destination country, product type, and applicable trade agreements. Always verify current requirements with relevant authorities before shipping. This guide is for informational purposes only and does not constitute legal or regulatory advice.', y);
  
  addFooter(doc);
  
  doc.save('AgriSMES_Export_Documentation_Guide.pdf');
};

export const generateBuyerImporterChecklist = () => {
  const doc = new jsPDF();
  addHeader(doc, 'Buyer / Importer Checklist');
  let y = 60;
  y = addParagraph(doc, 'Use this checklist to verify suppliers and reduce import risks.', y);
  y = addSectionTitle(doc, 'Supplier Verification', y + 5);
  y = addBulletPoint(doc, 'Company registration documents verified', y);
  y = addBulletPoint(doc, 'Physical address confirmed', y);
  y = addBulletPoint(doc, 'Trade references checked', y);
  y = addBulletPoint(doc, 'Product samples tested', y);
  y = addSectionTitle(doc, 'Quality Assurance', y + 5);
  y = addBulletPoint(doc, 'Specifications clearly defined', y);
  y = addBulletPoint(doc, 'Third-party inspection arranged', y);
  y = addBulletPoint(doc, 'Lab testing requirements confirmed', y);
  y = addSectionTitle(doc, 'Payment Security', y + 5);
  y = addBulletPoint(doc, 'Payment terms agreed in writing', y);
  y = addBulletPoint(doc, 'LC/TT structure confirmed', y);
  y = addBulletPoint(doc, 'Bank instrument verified', y);
  addFooter(doc);
  doc.save('AgriSMES_Buyer_Importer_Checklist.pdf');
};

export const generateExporterReadinessChecklist = () => {
  const doc = new jsPDF();
  addHeader(doc, 'Exporter Readiness Checklist');
  let y = 60;
  y = addParagraph(doc, 'Prepare for export with this readiness checklist.', y);
  y = addSectionTitle(doc, 'Documentation', y + 5);
  y = addBulletPoint(doc, 'Export license obtained', y);
  y = addBulletPoint(doc, 'Phytosanitary certificate ready', y);
  y = addBulletPoint(doc, 'Certificate of Origin prepared', y);
  y = addSectionTitle(doc, 'Buyer Verification', y + 5);
  y = addBulletPoint(doc, 'Buyer company verified', y);
  y = addBulletPoint(doc, 'Payment terms confirmed', y);
  y = addBulletPoint(doc, 'Contract signed', y);
  y = addSectionTitle(doc, 'Logistics', y + 5);
  y = addBulletPoint(doc, 'Shipping line confirmed', y);
  y = addBulletPoint(doc, 'Container booking made', y);
  y = addBulletPoint(doc, 'Insurance arranged', y);
  addFooter(doc);
  doc.save('AgriSMES_Exporter_Readiness_Checklist.pdf');
};

export const generateRiskManagementChecklist = () => {
  const doc = new jsPDF();
  addHeader(doc, 'Risk Management Checklist');
  let y = 60;
  y = addParagraph(doc, 'Use this checklist to identify and mitigate trade risks.', y);
  y = addSectionTitle(doc, 'Counterparty Verification', y + 5);
  y = addBulletPoint(doc, 'Company registration verified', y);
  y = addBulletPoint(doc, 'Physical address confirmed', y);
  y = addBulletPoint(doc, 'Bank references checked', y);
  y = addSectionTitle(doc, 'Transaction Structure', y + 5);
  y = addBulletPoint(doc, 'Clear Incoterms agreed', y);
  y = addBulletPoint(doc, 'Payment milestones defined', y);
  y = addBulletPoint(doc, 'Dispute resolution clause included', y);
  y = addSectionTitle(doc, 'Documentation', y + 5);
  y = addBulletPoint(doc, 'All documents aligned to payment terms', y);
  y = addBulletPoint(doc, 'Quality certificates in place', y);
  y = addBulletPoint(doc, 'Shipping documents prepared', y);
  addFooter(doc);
  doc.save('AgriSMES_Risk_Management_Checklist.pdf');
};

export const generateLCvsTTOverview = () => {
  const doc = new jsPDF();
  addHeader(doc, 'LC vs TT Overview');
  let y = 60;
  y = addParagraph(doc, 'Comparison of Letters of Credit and Telegraphic Transfer payment methods.', y);
  y = addSectionTitle(doc, 'Letter of Credit (LC)', y + 5);
  y = addBulletPoint(doc, 'Bank-guaranteed payment upon document compliance', y);
  y = addBulletPoint(doc, 'Higher security for both parties', y);
  y = addBulletPoint(doc, 'More complex and costly to arrange', y);
  y = addBulletPoint(doc, 'Requires strict document compliance', y);
  y = addSectionTitle(doc, 'Telegraphic Transfer (TT)', y + 5);
  y = addBulletPoint(doc, 'Direct bank-to-bank transfer', y);
  y = addBulletPoint(doc, 'Simpler and faster to arrange', y);
  y = addBulletPoint(doc, 'Higher risk for the paying party', y);
  y = addBulletPoint(doc, 'Often used with advance or deferred payment', y);
  y = addSectionTitle(doc, 'When to Use', y + 5);
  y = addParagraph(doc, 'Use LC for new trading relationships or high-value transactions. Use TT for established partners with proven track records.', y);
  addFooter(doc);
  doc.save('AgriSMES_LC_vs_TT_Overview.pdf');
};

// Market Insights Report Data Types
interface CommodityMarketData {
  name: string;
  trend: "up" | "down" | "stable";
  priceContext: string;
  season: string;
  regions: string[];
  qualityNotes: string;
  weatherImpact: string;
  demandStatus: string;
}

interface WeatherData {
  region: string;
  temperature: number;
  humidity: number;
  description: string;
}

/**
 * Generate a Market Insights Report PDF for a specific commodity
 */
export const generateMarketInsightsReport = (
  commodity: CommodityMarketData,
  weatherData?: WeatherData[],
  returnDataUrl: boolean = false
): string => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Header with gradient effect
  doc.setFillColor(34, 87, 64); // Primary green
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Market Insights Report', margin, 22);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(commodity.name, margin, 32);
  
  // Date badge
  doc.setFontSize(9);
  doc.text(`Generated: ${dateStr}`, pageWidth - margin - 50, 32);
  
  let y = 55;
  
  // Trend indicator
  const trendText = commodity.trend === "up" ? "▲ Trending Up" : 
                    commodity.trend === "down" ? "▼ Trending Down" : "◆ Stable";
  const trendColor = commodity.trend === "up" ? [34, 87, 64] : 
                     commodity.trend === "down" ? [220, 38, 38] : [100, 116, 139];
  
  doc.setFillColor(trendColor[0], trendColor[1], trendColor[2]);
  doc.roundedRect(margin, y, 40, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(trendText, margin + 4, y + 5.5);
  
  y += 18;
  
  // Price Context
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Market Overview', margin, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const priceLines = doc.splitTextToSize(commodity.priceContext, contentWidth);
  doc.text(priceLines, margin, y);
  y += priceLines.length * 5 + 10;
  
  // Key Metrics Grid
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'F');
  
  const gridY = y + 8;
  const colWidth = contentWidth / 2;
  
  // Season
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('HARVEST SEASON', margin + 5, gridY);
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(commodity.season, margin + 5, gridY + 8);
  
  // Weather Impact
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('WEATHER IMPACT', margin + colWidth + 5, gridY);
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  const weatherLines = doc.splitTextToSize(commodity.weatherImpact, colWidth - 10);
  doc.text(weatherLines, margin + colWidth + 5, gridY + 8);
  
  // Demand Status
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('DEMAND STATUS', margin + 5, gridY + 22);
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(commodity.demandStatus, margin + 5, gridY + 30);
  
  // Quality Notes
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('QUALITY NOTES', margin + colWidth + 5, gridY + 22);
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(commodity.qualityNotes, margin + colWidth + 5, gridY + 30);
  
  y += 60;
  
  // Key Production Regions
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Key Production Regions', margin, y);
  y += 10;
  
  doc.setFillColor(34, 87, 64, 0.1);
  commodity.regions.forEach((region, index) => {
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(34, 87, 64);
    doc.text(`• ${region}`, margin + 5, y + 5.5);
    y += 12;
  });
  
  y += 5;
  
  // Weather Data Section (if available)
  if (weatherData && weatherData.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Current Weather Conditions', margin, y);
    y += 10;
    
    weatherData.forEach((weather) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 15, 2, 2, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(weather.region, margin + 5, y + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${weather.temperature}°C • ${weather.humidity}% humidity • ${weather.description}`, margin + 5, y + 12);
      
      y += 18;
    });
    
    y += 5;
  }
  
  // Disclaimer
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('Important Notice', margin + 5, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const disclaimerText = "This report provides AI-generated market context for informational purposes only. It does not constitute financial, investment, or trading advice. For specific pricing and trade inquiries, please consult with AgriSMES directly.";
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 10);
  doc.text(disclaimerLines, margin + 5, y + 14);
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('AgriSMES – Trade Readiness Framework', margin, pageHeight - 15);
  doc.text(`Report ID: MIR-${now.getTime().toString(36).toUpperCase()}`, margin, pageHeight - 10);
  
  if (returnDataUrl) {
    return doc.output('dataurlstring');
  } else {
    const filename = `AgriSMES_Market_Report_${commodity.name.replace(/[^a-zA-Z0-9]/g, '_')}_${now.toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    return filename;
  }
};
