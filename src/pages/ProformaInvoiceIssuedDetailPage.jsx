import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, FileText, Trash2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ProformaInvoiceIssuedDetailPage = () => {
  const { authAxios, jobTitle, BASE_URL } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (jobTitle !== "logistics manager") {
      return;
    }
    const fetchInvoiceDetails = async () => {
      try {
        const response = await authAxios.get(`proforma-invoices/${refNum}/`);
        console.log("ProformaInvoiceIssuedDetailPage: Fetched invoice details:", response.data);
        setInvoice(response.data);
      } catch (error) {
        toast.error("Failed to load proforma invoice details.");
        console.error("Fetch invoice details error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceDetails();
  }, [authAxios, refNum, jobTitle]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this proforma invoice?")) {
      setDeleting(true);
      try {
        await authAxios.delete(`proforma-invoices/${refNum}/`);
        toast.success("Proforma invoice deleted successfully.");
        navigate("/dashboard/proforma-invoices/issued");
      } catch (error) {
        toast.error("Failed to delete proforma invoice.");
        console.error("Delete invoice error:", error);
      } finally {
        setDeleting(false);
      }
    }
  };

  if (jobTitle !== "logistics manager") {
    return <div>Access Denied</div>;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
        <p className="mt-4 text-gray-600 text-lg">Loading Invoice Details...</p>
      </div>
    );
  }

  if (!invoice) {
    return <div>Invoice not found.</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <FileText className="w-8 h-8 mr-2 text-indigo-600" />
        Proforma Invoice Details
      </h1>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold">Reference Number</h2>
            <p>{invoice.ref_num}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Title</h2>
            <p>{invoice.title}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Issuing Company</h2>
            <p>{invoice.issuing_company_name}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Status</h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                invoice.status === "draft"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {invoice.status === "draft" ? "Open" : "Closed"}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Priority</h2>
            <p>{invoice.priority}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Total Cost</h2>
            <p>{invoice.total_cost}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Spend Category</h2>
            <p>{invoice.spend_category}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Description</h2>
            <p>{invoice.description}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Start DateTime</h2>
            <p>{new Date(invoice.start_datetime).toLocaleString()}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Submission DateTime</h2>
            <p>{new Date(invoice.submission_datetime).toLocaleString()}</p>
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-4">Items</h2>
        {invoice.items.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit of Measure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Extended Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.description || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.unit_of_measure}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.unit_price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.extended_value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No items available.</p>
        )}
        <div className="mt-6">
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : (
              <Trash2 className="h-5 w-5 mr-2" />
            )}
            Delete Invoice
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProformaInvoiceIssuedDetailPage;