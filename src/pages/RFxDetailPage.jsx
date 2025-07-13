import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function RFxDetailPage() {
  const { authAxios } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [rfx, setRfx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await authAxios.get(`rfxs/${refNum}/`);
        setRfx(response.data);
      } catch (err) {
        toast.error(err.response?.data?.detail || "Failed to load RFx details");
        console.error("Fetch RFx details error:", err);
        navigate("/dashboard/rfxs", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [authAxios, refNum, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  if (!rfx) return null;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/dashboard/rfxs")}
        className="mb-4 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
      >
        Back to RFx List
      </button>
      <h2 className="text-lg font-medium mb-4">{rfx.title}</h2>
      <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
        <p><strong>Reference Number:</strong> {rfx.ref_num}</p>
        <p><strong>Status:</strong> {rfx.status === "draft" ? "Open" : "Closed"}</p>
        <p><strong>Type:</strong> {rfx.type.charAt(0).toUpperCase() + rfx.type.slice(1)}</p>
        <p><strong>Procedure:</strong> {rfx.procedure.charAt(0).toUpperCase() + rfx.procedure.slice(1)}</p>
        <p><strong>Spend Category:</strong> {rfx.spend_category.charAt(0).toUpperCase() + rfx.spend_category.slice(1)}</p>
        <p><strong>Priority:</strong> {rfx.priority.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</p>
        <p><strong>Note:</strong> {rfx.note || "N/A"}</p>
        <p><strong>Start Date-Time:</strong> {rfx.start_datetime ? new Date(rfx.start_datetime).toLocaleString() : "N/A"}</p>
        <p><strong>Submission Due Date-Time:</strong> {rfx.submission_datetime ? new Date(rfx.submission_datetime).toLocaleString() : "N/A"}</p>
        <div>
          <strong>Reach:</strong>
          {rfx.reach ? (
            <ul className="list-disc pl-5">
              <li>Region: {rfx.reach.region}</li>
              <li>District: {rfx.reach.district}</li>
              <li>City: {rfx.reach.city}</li>
              <li>Town: {rfx.reach.town}</li>
            </ul>
          ) : (
            <p>N/A</p>
          )}
        </div>
        <div>
          <strong>Items:</strong>
          {rfx.items && rfx.items.length > 0 ? (
            <ul className="list-disc pl-5">
              {rfx.items.map((item, index) => (
                <li key={item.id}>
                  {item.name || "Unnamed Item"}: {item.description || "No description"}, {item.quantity || "N/A"} {item.unit_of_measure}
                  {item.attachment && (
                    <a href={item.attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                      (View Attachment)
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No items</p>
          )}
        </div>
        <p><strong>Issuing Company:</strong> {rfx.issuing_company_info}</p>
        <p><strong>Is Active:</strong> {rfx.is_active ? "Yes" : "No"}</p>
        <p><strong>Is Approved:</strong> {rfx.is_approved ? "Yes" : "No"}</p>
        <p><strong>Created At:</strong> {new Date(rfx.created_at).toLocaleString()}</p>
        <p><strong>Updated At:</strong> {new Date(rfx.updated_at).toLocaleString()}</p>
      </div>
    </div>
  );
}