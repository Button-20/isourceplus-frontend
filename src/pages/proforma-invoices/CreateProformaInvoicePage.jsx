import ProformaOfferForm from "@/components/proforma-invoices/ProformaOfferForm";

const CreateProformaInvoicePage = () => (
  <ProformaOfferForm
    mode="waybill"
    allowedRole="logistics manager"
    heading="Create proforma invoice"
    hasItems
    defaultDescription="Event response"
    backTo="/dashboard/waybills"
  />
);

export default CreateProformaInvoicePage;
