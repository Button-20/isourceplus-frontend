import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit, X } from "lucide-react";
import { getCookie } from "@/utility/getCookie";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

export default function RFxPage() {
  const { authAxios, companyId, jobTitle } = useAuth();
  const [rfxs, setRfxs] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [type, setType] = useState("quotation");
  const [procedure, setProcedure] = useState("open");
  const [spendCategory, setSpendCategory] = useState("communications");
  const [priority, setPriority] = useState("urgent");
  const [note, setNote] = useState("");
  const [startDatetime, setStartDatetime] = useState("");
  const [submissionDatetime, setSubmissionDatetime] = useState("");
  const [reach, setReach] = useState({ region: "region", district: "district", city: "city", town: "town" });
  const [items, setItems] = useState([{ name: "", description: "", unit_of_measure: "pc", quantity: "", attachment: null }]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteRfxRefNum, setDeleteRfxRefNum] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (companyId) {
      (async () => {
        try {
          const response = await authAxios.get("rfxs/");
          setRfxs(response.data.results || []);
        } catch (err) {
          if (err.response?.status === 404) {
            setRfxs([]);
          } else {
            toast.error("Failed to load RFx records");
            console.error("Fetch RFx error:", err);
          }
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [authAxios, companyId]);

  const addItem = () => {
    setItems([...items, { name: "", description: "", unit_of_measure: "pc", quantity: "", attachment: null }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const csrfToken = getCookie("csrftoken");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("status", status);
      formData.append("type", type);
      formData.append("procedure", procedure);
      formData.append("spend_category", spendCategory);
      formData.append("priority", priority);
      if (note) formData.append("note", note);
      if (startDatetime) formData.append("start_datetime", startDatetime);
      if (submissionDatetime) formData.append("submission_datetime", submissionDatetime);
      Object.entries(reach).forEach(([key, value]) => {
        formData.append(`reach[${key}]`, value);
      });
      items.forEach((item, index) => {
        if (item.name) formData.append(`items[${index}][name]`, item.name);
        if (item.description) formData.append(`items[${index}][description]`, item.description);
        if (item.unit_of_measure) formData.append(`items[${index}][unit_of_measure]`, item.unit_of_measure);
        if (item.quantity) formData.append(`items[${index}][quantity]`, item.quantity);
        if (item.attachment) formData.append(`items[${index}][attachment]`, item.attachment);
      });
      await authAxios.post("rfxs/", formData, {
        headers: { "X-CSRFToken": csrfToken },
      });
      toast.success("RFx created successfully!");
      const response = await authAxios.get("rfxs/");
      setRfxs(response.data.results || []);
      setViewMode("list");
      setTitle("");
      setStatus("draft");
      setType("quotation");
      setProcedure("open");
      setSpendCategory("communications");
      setPriority("urgent");
      setNote("");
      setStartDatetime("");
      setSubmissionDatetime("");
      setReach({ region: "region", district: "district", city: "city", town: "town" });
      setItems([{ name: "", description: "", unit_of_measure: "pc", quantity: "", attachment: null }]);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create RFx");
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (refNum) => {
    setDeleteRfxRefNum(refNum);
    setIsModalOpen(true);
  };

  const handleDelete = async (refNum) => {
    setSubmitting(true);
    try {
      const csrfToken = getCookie("csrftoken");
      await authAxios.delete(`rfxs/${refNum}/`, {
        headers: { "X-CSRFToken": csrfToken },
      });
      toast.success("RFx deleted successfully!");
      const response = await authAxios.get("rfxs/");
      setRfxs(response.data.results || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Deletion failed");
      console.error("Delete error:", err);
    } finally {
      setSubmitting(false);
      setIsModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {viewMode === "list" ? (
        <div>
          <h2 className="text-lg font-medium mb-4">RFx List</h2>
          <button
            onClick={() => setViewMode("add")}
            className="mb-4 bg-black text-white py-2 px-4 rounded hover:bg-gray-800 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Add New RFx
          </button>
          {rfxs.length === 0 ? (
            <p className="text-gray-500">No RFx records found.</p>
          ) : (
            <div className="grid gap-4">
              {rfxs.map((rfx) => (
                <div key={rfx.id} className="bg-gray-50 p-4 rounded-lg border flex justify-between items-center">
                  <div>
                    <p className="font-medium">{rfx.title}</p>
                    <p className="text-sm text-gray-600">Status: {rfx.status === "draft" ? "Open" : "Closed"}</p>
                    <p className="text-sm text-gray-600">Ref: {rfx.ref_num}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/dashboard/rfxs/${rfx.ref_num}`)}
                      className="bg-black text-white py-1 px-3 rounded hover:bg-gray-800"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openDeleteModal(rfx.ref_num)}
                      className="text-red-600 hover:text-red-800"
                      disabled={submitting}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-lg font-medium mb-4">Add New RFx</h2>
          <div>
            <label className="block mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={128}
              required
              className="w-full border rounded p-2"
              placeholder="e.g., Supply of computers and accessories"
            />
          </div>
          <div>
            <label className="block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="draft">Open</option>
              <option value="finalized">Closed</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="quotation">Quotation</option>
              <option value="proposal">Proposal</option>
              <option value="information">Information</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Procedure</label>
            <select
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="open">Open</option>
              <option value="sealed">Sealed</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Spend Category</label>
            <select
              value={spendCategory}
              onChange={(e) => setSpendCategory(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="communications">Communications</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="less urgent">Less Urgent</option>
              <option value="urgent">Urgent</option>
              <option value="very urgent">Very Urgent</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Provide event details"
            />
          </div>
          <div>
            <label className="block mb-1">Start Date-Time</label>
            <input
              type="datetime-local"
              value={startDatetime}
              onChange={(e) => setStartDatetime(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1">Submission Due Date-Time</label>
            <input
              type="datetime-local"
              value={submissionDatetime}
              onChange={(e) => setSubmissionDatetime(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1">Reach</label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={reach.region}
                onChange={(e) => setReach({ ...reach, region: e.target.value })}
                required
                className="border rounded p-2"
              >
                <option value="region">Test Region</option>
              </select>
              <select
                value={reach.district}
                onChange={(e) => setReach({ ...reach, district: e.target.value })}
                required
                className="border rounded p-2"
              >
                <option value="district">Test District</option>
              </select>
              <select
                value={reach.city}
                onChange={(e) => setReach({ ...reach, city: e.target.value })}
                required
                className="border rounded p-2"
              >
                <option value="city">Test City</option>
              </select>
              <select
                value={reach.town}
                onChange={(e) => setReach({ ...reach, town: e.target.value })}
                required
                className="border rounded p-2"
              >
                <option value="town">Test Town</option>
              </select>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-3">Items</h3>
            {items.map((item, index) => (
              <div key={index} className="border p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block mb-1">Item Name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      maxLength={128}
                      className="w-full border rounded p-2"
                      placeholder="e.g., Monitor"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      maxLength={225}
                      className="w-full border rounded p-2"
                      placeholder="e.g., Dell precision m 300, 1tb, 16 gig ram"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Unit of Measure</label>
                    <select
                      value={item.unit_of_measure}
                      onChange={(e) => updateItem(index, "unit_of_measure", e.target.value)}
                      className="w-full border rounded p-2"
                    >
                      <option value="pc">Piece</option>
                      <option value="kg">Kilogram</option>
                      <option value="ream">Ream</option>
                      {/* Add more options as needed */}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      min={0}
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Attachment</label>
                    <input
                      type="file"
                      onChange={(e) => updateItem(index, "attachment", e.target.files[0])}
                      className="w-full border rounded p-2"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
            >
              Add Item
            </button>
          </div>
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title}
              className="bg-black text-white py-2 px-6 rounded flex items-center disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Saving…
                </>
              ) : (
                "Create RFx"
              )}
            </button>
          </div>
        </form>
      )}
      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => handleDelete(deleteRfxRefNum)}
        docType="RFx"
        docId={deleteRfxRefNum}
      />
    </div>
  );
}