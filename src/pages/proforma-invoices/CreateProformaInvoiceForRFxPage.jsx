import ProformaOfferForm from "@/components/proforma-invoices/ProformaOfferForm";

const CreateProformaInvoiceForRFxPage = () => (
  <ProformaOfferForm
    mode="rfx"
    allowedRole="sales manager"
    heading="Proforma invoice for RFx"
    hasItems
    defaultDescription="RFx response"
  />
);

export default CreateProformaInvoiceForRFxPage;
