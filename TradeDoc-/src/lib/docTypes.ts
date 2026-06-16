export interface DocField{id:string;label:string;type:'text'|'textarea'|'number'|'date'|'select';placeholder?:string;required?:boolean;options?:string[];helpText?:string;}
export interface DocType{id:string;label:string;description:string;icon:string;proOnly:boolean;fields:DocField[];}
export const DOC_TYPES:DocType[]=[
{id:'commercial_invoice',label:'Commercial Invoice',description:'Invoice for international trade',icon:'INV',proOnly:false,fields:[
  {id:'invoice_number',label:'Invoice Number',type:'text',placeholder:'INV-2026-001',required:true},
  {id:'invoice_date',label:'Invoice Date',type:'date',required:true},
  {id:'seller_name',label:'Seller / Exporter',type:'text',required:true},
  {id:'seller_address',label:'Seller Address',type:'textarea',required:true},
  {id:'buyer_name',label:'Buyer / Importer',type:'text',required:true},
  {id:'buyer_address',label:'Buyer Address',type:'textarea',required:true},
  {id:'description',label:'Product Description',type:'textarea',required:true},
  {id:'hs_code',label:'HS Code (Optional)',type:'text',placeholder:'Auto-suggested based on product',required:false,helpText:'Leave blank to receive an automatic suggestion'},
  {id:'quantity_kg',label:'Quantity (kg)',type:'number',required:true},
  {id:'unit_price_usd',label:'Unit Price (USD/kg)',type:'number',required:true},
  {id:'total_usd',label:'Total Value (USD)',type:'number',required:true},
  {id:'incoterms',label:'Incoterms',type:'select',options:['FOB','CIF','CFR','EXW','DDP'],required:true},
  {id:'port_of_loading',label:'Port of Loading',type:'text',placeholder:'Dar es Salaam'},
  {id:'port_of_discharge',label:'Port of Discharge',type:'text'},
  {id:'payment_terms',label:'Payment Terms',type:'text'}
]},
{id:'packing_list',label:'Packing List',description:'Cargo contents and weights',icon:'PKG',proOnly:false,fields:[
  {id:'pl_number',label:'Packing List No.',type:'text',required:true},
  {id:'pl_date',label:'Date',type:'date',required:true},
  {id:'shipper',label:'Shipper',type:'text',required:true},
  {id:'consignee',label:'Consignee',type:'text',required:true},
  {id:'product',label:'Product',type:'textarea',required:true},
  {id:'grade',label:'Grade',type:'text',placeholder:'WW320'},
  {id:'number_of_cartons',label:'No. of Cartons',type:'number',required:true},
  {id:'total_net_weight',label:'Total Net Weight (kg)',type:'number',required:true},
  {id:'container_number',label:'Container Number',type:'text'},
  {id:'seal_number',label:'Seal Number',type:'text'}
]},
{id:'stuffing_report',label:'Stuffing Report',description:'Container loading verification report',icon:'STF',proOnly:false,fields:[
  {id:'report_number',label:'Report Number',type:'text',placeholder:'STF-2026-001',required:true},
  {id:'stuffing_date',label:'Loading Date',type:'date',required:true},
  {id:'container_number',label:'Container Number',type:'text',required:true},
  {id:'seal_number',label:'Seal Number',type:'text',required:true},
  {id:'loading_location',label:'Loading Location',type:'text',required:true,placeholder:'Factory / Warehouse address'},
  {id:'product_loaded',label:'Product Loaded',type:'text',required:true},
  {id:'grade',label:'Grade',type:'text',placeholder:'WW320'},
  {id:'quantity_loaded_kg',label:'Quantity Loaded (kg)',type:'number',required:true},
  {id:'carton_count',label:'Carton Count',type:'number'},
  {id:'shipper',label:'Shipper Name',type:'text',required:true},
  {id:'consignee',label:'Consignee',type:'text',required:true},
  {id:'port_of_loading',label:'Port of Loading',type:'text',placeholder:'Dar es Salaam'},
  {id:'witness_name',label:'Witness Name',type:'text'},
  {id:'witness_company',label:'Witness Company',type:'text'},
  {id:'remarks',label:'Remarks',type:'textarea'}
]},
{id:'release_order',label:'Release Order',description:'Factory gate authorization',icon:'REL',proOnly:false,fields:[
  {id:'ro_number',label:'Release Order No.',type:'text',required:true},
  {id:'ro_date',label:'Date',type:'date',required:true},
  {id:'factory_name',label:'Factory Name',type:'text',required:true},
  {id:'batch_number',label:'Batch Number',type:'text',required:true},
  {id:'product_description',label:'Product',type:'textarea',required:true},
  {id:'grade',label:'Grade',type:'text'},
  {id:'net_weight_kg',label:'Net Weight (kg)',type:'number',required:true},
  {id:'driver_name',label:'Driver Name',type:'text',required:true},
  {id:'driver_id',label:'Driver ID',type:'text',required:true},
  {id:'truck_plate',label:'Truck Plate No.',type:'text',required:true},
  {id:'destination',label:'Destination',type:'text',required:true},
  {id:'levy_paid',label:'District Levy Paid (TZS)',type:'number'},
  {id:'levy_receipt_no',label:'Levy Receipt No.',type:'text'}
]},
{id:'qa_report',label:'QA Report',description:'Quality assurance — grade and moisture',icon:'QAR',proOnly:false,fields:[
  {id:'qa_number',label:'QA Report No.',type:'text',required:true},
  {id:'qa_date',label:'Date',type:'date',required:true},
  {id:'batch_number',label:'Batch Number',type:'text',required:true},
  {id:'product',label:'Product',type:'text',required:true},
  {id:'w180_kg',label:'WW180 Output (kg)',type:'number'},
  {id:'w240_kg',label:'WW240 Output (kg)',type:'number'},
  {id:'w320_kg',label:'WW320 Output (kg)',type:'number'},
  {id:'total_kernel_output',label:'Total Output (kg)',type:'number',required:true},
  {id:'outturn_pct',label:'Outturn %',type:'number'},
  {id:'moisture_pct',label:'Moisture %',type:'number'},
  {id:'aflatoxin_ppb',label:'Aflatoxin (ppb)',type:'text',placeholder:'<1'},
  {id:'inspector_name',label:'Inspector',type:'text',required:true}
]},
{id:'loi',label:'Letter of Intent',description:'Intent to enter a trade agreement',icon:'LOI',proOnly:false,fields:[
  {id:'loi_date',label:'Date',type:'date',required:true},
  {id:'from_company',label:'From Company',type:'text',required:true},
  {id:'from_address',label:'From Address',type:'textarea',required:true},
  {id:'to_company',label:'To Company',type:'text',required:true},
  {id:'product',label:'Product',type:'text',required:true},
  {id:'quantity',label:'Quantity',type:'text',required:true},
  {id:'intent_details',label:'Intent Details',type:'textarea',required:true},
  {id:'signatory_name',label:'Signatory Name',type:'text',required:true}
]},
{id:'lpo',label:'Local Purchase Order',description:'Purchase order for local suppliers',icon:'LPO',proOnly:false,fields:[
  {id:'lpo_number',label:'LPO Number',type:'text',required:true},
  {id:'lpo_date',label:'Date',type:'date',required:true},
  {id:'buyer_company',label:'Buyer Company',type:'text',required:true},
  {id:'supplier_name',label:'Supplier Name',type:'text',required:true},
  {id:'items_description',label:'Items / Services',type:'textarea',required:true},
  {id:'quantity',label:'Quantity',type:'text',required:true},
  {id:'total_tzs',label:'Total (TZS)',type:'number',required:true},
  {id:'approved_by',label:'Approved By',type:'text',required:true}
]},
{id:'business_proposal',label:'Business Proposal',description:'Professional proposal for partnerships',icon:'PRO',proOnly:false,fields:[
  {id:'proposal_date',label:'Date',type:'date',required:true},
  {id:'proposing_company',label:'Proposing Company',type:'text',required:true},
  {id:'recipient_name',label:'Recipient',type:'text',required:true},
  {id:'proposal_title',label:'Proposal Title',type:'text',required:true},
  {id:'executive_summary',label:'Executive Summary',type:'textarea',required:true},
  {id:'products_services',label:'Products / Services',type:'textarea',required:true},
  {id:'contact_email',label:'Contact Email',type:'text',required:true}
]},
{id:'business_contract',label:'Business Contract',description:'Formal supply or service agreement',icon:'CON',proOnly:true,fields:[
  {id:'contract_number',label:'Contract Number',type:'text',required:true},
  {id:'contract_date',label:'Date',type:'date',required:true},
  {id:'party_a',label:'Party A',type:'text',required:true},
  {id:'party_a_address',label:'Party A Address',type:'textarea',required:true},
  {id:'party_b',label:'Party B',type:'text',required:true},
  {id:'party_b_address',label:'Party B Address',type:'textarea',required:true},
  {id:'product_service',label:'Product / Service',type:'textarea',required:true},
  {id:'contract_value',label:'Contract Value',type:'text',required:true},
  {id:'payment_schedule',label:'Payment Schedule',type:'textarea',required:true}
]},
{id:'export_readiness',label:'Export Readiness Checklist',description:'Verify shipment readiness',icon:'EXP',proOnly:true,fields:[
  {id:'exporter_name',label:'Exporter',type:'text',required:true},
  {id:'shipment_ref',label:'Shipment Ref',type:'text',required:true},
  {id:'check_date',label:'Date',type:'date',required:true},
  {id:'product',label:'Product',type:'text',required:true},
  {id:'destination_country',label:'Destination',type:'text',required:true},
  {id:'buyer_name',label:'Buyer',type:'text',required:true},
  {id:'quantity_kg',label:'Quantity (kg)',type:'number',required:true},
  {id:'container_size',label:'Container',type:'select',options:['20ft','40ft'],required:true}
]},
{id:'bank_letter',label:'Bank Letter',description:'Official correspondence to bank',icon:'BNK',proOnly:true,fields:[
  {id:'letter_date',label:'Date',type:'date',required:true},
  {id:'from_company',label:'From Company',type:'text',required:true},
  {id:'bank_name',label:'Bank Name',type:'text',required:true},
  {id:'account_number',label:'Account Number',type:'text',required:true},
  {id:'subject',label:'Subject',type:'text',required:true},
  {id:'letter_body',label:'Letter Content',type:'textarea',required:true},
  {id:'signatory',label:'Signatory',type:'text',required:true}
]},
{id:'loan_request',label:'Loan Request Letter',description:'Request for trade finance',icon:'LNR',proOnly:true,fields:[
  {id:'letter_date',label:'Date',type:'date',required:true},
  {id:'applicant_name',label:'Applicant / Company',type:'text',required:true},
  {id:'bank_name',label:'Bank / Lender',type:'text',required:true},
  {id:'loan_amount',label:'Amount Requested',type:'text',required:true},
  {id:'currency',label:'Currency',type:'select',options:['TZS','USD','EUR']},
  {id:'purpose',label:'Purpose',type:'textarea',required:true},
  {id:'signatory',label:'Signatory',type:'text',required:true}
]},
];
export const getDocType=(id:string)=>DOC_TYPES.find(d=>d.id===id);
