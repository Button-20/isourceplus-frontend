import ProformaOfferForm from "@/components/proforma-invoices/ProformaOfferForm";

const CreateProformaInvoiceForTenderPage = () => (
  <ProformaOfferForm
    mode="tender"
    allowedRole="sales manager"
    heading="Proforma invoice for tender"
    defaultDescription="Tender response"
  />
);

export default CreateProformaInvoiceForTenderPage;
