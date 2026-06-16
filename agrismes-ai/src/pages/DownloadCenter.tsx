import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText, Download } from "lucide-react";
import {
  generateSMEApplicationForm,
  generateDocumentationChecklist,
  generateTradeReadinessGuidelines,
  generateFinancialStatementTemplate,
  generateBusinessPlanTemplate,
  generateExportDocumentationGuide,
  generateBuyerImporterChecklist,
  generateExporterReadinessChecklist,
  generateRiskManagementChecklist,
  generateLCvsTTOverview
} from "@/utils/pdfGenerators";

const documents = [
  {
    title: "Buyer / Importer Checklist",
    description: "Due diligence checklist for importers and buyers",
    fileName: "AgriSMES_Buyer_Importer_Checklist.pdf",
    generator: generateBuyerImporterChecklist
  },
  {
    title: "Exporter Readiness Checklist",
    description: "Preparation checklist for exporters and suppliers",
    fileName: "AgriSMES_Exporter_Readiness_Checklist.pdf",
    generator: generateExporterReadinessChecklist
  },
  {
    title: "Trade Document Checklist",
    description: "Basic trade documentation requirements",
    fileName: "AgriSMES_Documentation_Checklist.pdf",
    generator: generateDocumentationChecklist
  },
  {
    title: "Risk Management Checklist",
    description: "Due diligence and risk mitigation checklist",
    fileName: "AgriSMES_Risk_Management_Checklist.pdf",
    generator: generateRiskManagementChecklist
  },
  {
    title: "LC vs TT Overview",
    description: "Comparison of Letters of Credit and Telegraphic Transfer",
    fileName: "AgriSMES_LC_vs_TT_Overview.pdf",
    generator: generateLCvsTTOverview
  },
  {
    title: "SME Application Form",
    description: "Standard application form for trade readiness assessment",
    fileName: "AgriSMES_SME_Application_Form.pdf",
    generator: generateSMEApplicationForm
  },
  {
    title: "Trade Readiness Guidelines",
    description: "Overview of the trade readiness assessment process",
    fileName: "AgriSMES_Trade_Readiness_Guidelines.pdf",
    generator: generateTradeReadinessGuidelines
  },
  {
    title: "Financial Statement Template",
    description: "Template for preparing financial documentation",
    fileName: "AgriSMES_Financial_Statement_Template.pdf",
    generator: generateFinancialStatementTemplate
  },
  {
    title: "Business Plan Template",
    description: "Recommended format for SME business plans",
    fileName: "AgriSMES_Business_Plan_Template.pdf",
    generator: generateBusinessPlanTemplate
  },
  {
    title: "Export Documentation Guide",
    description: "Guide to export documentation requirements",
    fileName: "AgriSMES_Export_Documentation_Guide.pdf",
    generator: generateExportDocumentationGuide
  }
];

const DownloadCenter = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const handleDownload = (generator: () => void) => {
    generator();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container-institutional py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-dark mb-4">Download Center</h1>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Access forms, templates, and documentation resources for SME trade readiness.
          </p>
          
          <div className="grid gap-4 max-w-3xl">
            {documents.map((doc, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <button 
                    onClick={() => handleDownload(doc.generator)}
                    className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm font-medium">Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg max-w-3xl">
            <h2 className="text-lg font-semibold text-primary-dark mb-2">Need assistance?</h2>
            <p className="text-muted-foreground">
              For document-related inquiries, contact us at{" "}
              <a href="mailto:lentachai@gmail.com" className="text-primary hover:underline">
                lentachai@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DownloadCenter;