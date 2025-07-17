import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Plus, Save, X, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getCookie } from "@/utility/getCookie";
import { format, formatDistanceToNow } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

const WaybillsPage = () => {
  const { authAxios, jobTitle, BASE_URL } = useAuth();
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [waybillToDelete, setWaybillToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const canCreateWaybill = ["lead buyer", "sales manager"].includes(jobTitle);

  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    status: "draft",
    procedure: "open",
    spend_category: "communications",
    priority: "non urgent",
    start_datetime: new Date().toISOString().slice(0, 16),
    submission_datetime: new Date().toISOString().slice(0, 16),
    departure_datetime: new Date().toISOString().slice(0, 16),
    delivery_datetime: new Date().toISOString().slice(0, 16),
    is_approved: true,
    reach: {
      region: "region",
      district: "district",
      city: "city",
      town: "town",
    },
    items: [
      {
        name: "",
        description: "",
        unit_of_measure: "pc",
        quantity: 1,
        special_handles: [],
      },
    ],
  });

  const fetchWaybills = async () => {
    try {
      const isBuyerOrSales = ["lead buyer", "sales manager"].includes(jobTitle);
      const endpoint = isBuyerOrSales ? "waybills/issued/" : "waybills/";
      console.log(`Fetching waybills from: ${BASE_URL}${endpoint}`);
      const response = await authAxios.get(endpoint);
      const data = isBuyerOrSales ? response.data : response.data.results;
      setWaybills(data);
    } catch (error) {
      toast.error("Failed to load waybills.");
      console.error("Fetch waybills error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaybills();
  }, [authAxios, jobTitle, BASE_URL]);

  const handleChange = (e, itemIndex = null, field = null, handleIndex = null) => {
    const { name, value, type, checked } = e.target;
    if (field === "reach") {
      setFormValues((prev) => ({
        ...prev,
        reach: { ...prev.reach, [name]: value },
      }));
    } else if (itemIndex !== null && field === "special_handles" && handleIndex !== null) {
      setFormValues((prev) => {
        const items = [...prev.items];
        items[itemIndex].special_handles[handleIndex].handling_description = value;
        return { ...prev, items };
      });
    } else if (itemIndex !== null) {
      setFormValues((prev) => {
        const items = [...prev.items];
        items[itemIndex][name] = value;
        return { ...prev, items };
      });
    } else {
      setFormValues((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const addItem = () => {
    setFormValues((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: "",
          description: "",
          unit_of_measure: "pc",
          quantity: 1,
          special_handles: [],
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormValues((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const addSpecialHandle = useCallback(
    (itemIndex) => {
      setFormValues((prev) => {
        const items = [...prev.items];
        if (!items[itemIndex].special_handles.some((handle) => handle.handling_description === "")) {
          items[itemIndex].special_handles.push({ handling_description: "" });
        }
        return { ...prev, items };
      });
    },
    []
  );

  const removeSpecialHandle = (itemIndex, handleIndex) => {
    setFormValues((prev) => {
      const items = [...prev.items];
      items[itemIndex].special_handles = items[itemIndex].special_handles.filter(
        (_, i) => i !== handleIndex
      );
      return { ...prev, items };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const csrfToken = getCookie("csrftoken");
    try {
      const formData = new FormData();
      formData.append("title", formValues.title);
      formData.append("description", formValues.description);
      formData.append("status", formValues.status);
      formData.append("procedure", formValues.procedure);
      formData.append("spend_category", formValues.spend_category);
      formData.append("priority", formValues.priority);
      formData.append("start_datetime", formValues.start_datetime);
      formData.append("submission_datetime", formValues.submission_datetime);
      formData.append("departure_datetime", formValues.departure_datetime);
      formData.append("delivery_datetime", formValues.delivery_datetime);
      formData.append("is_approved", formValues.is_approved.toString());
      formData.append("reach[region]", formValues.reach.region);
      formData.append("reach[district]", formValues.reach.district);
      formData.append("reach[city]", formValues.reach.city);
      formData.append("reach[town]", formValues.reach.town);

      formValues.items.forEach((item, index) => {
        formData.append(`items[${index}][name]`, item.name);
        formData.append(`items[${index}][description]`, item.description);
        formData.append(`items[${index}][unit_of_measure]`, item.unit_of_measure);
        formData.append(`items[${index}][quantity]`, item.quantity.toString());
        item.special_handles.forEach((handle, handleIndex) => {
          formData.append(
            `items[${index}][special_handles][${handleIndex}][handling_description]`,
            handle.handling_description
          );
        });
      });

      const response = await authAxios.post("waybills/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-CSRFToken": csrfToken,
        },
      });
      toast.success("Waybill created successfully!");
      navigate(`/dashboard/waybills/${response.data.ref_num}`);
      setShowForm(false);
      setFormValues({
        title: "",
        description: "",
        status: "draft",
        procedure: "open",
        spend_category: "communications",
        priority: "non urgent",
        start_datetime: new Date().toISOString().slice(0, 16),
        submission_datetime: new Date().toISOString().slice(0, 16),
        departure_datetime: new Date().toISOString().slice(0, 16),
        delivery_datetime: new Date().toISOString().slice(0, 16),
        is_approved: true,
        reach: {
          region: "region",
          district: "district",
          city: "city",
          town: "town",
        },
        items: [
          {
            name: "",
            description: "",
            unit_of_measure: "pc",
            quantity: 1,
            special_handles: [],
          },
        ],
      });
    } catch (error) {
      toast.error("Failed to create waybill.");
      console.error("Create waybill error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWaybill = async () => {
    setDeleteLoading(true);
    const csrfToken = getCookie("csrftoken");
    try {
      await authAxios.delete(`waybills/${waybillToDelete.ref_num}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });
      toast.success("Waybill deleted successfully!");
      setShowDeleteModal(false);
      setWaybillToDelete(null);
      await fetchWaybills(); // Refresh the list
    } catch (error) {
      toast.error("Failed to delete waybill.");
      console.error("Delete waybill error:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = (waybill) => {
    setWaybillToDelete(waybill);
    setShowDeleteModal(true);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return {
      formatted: format(date, "dd MMM yyyy, HH:mm:ss"),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Waybills</h1>
        {canCreateWaybill && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Waybill
          </button>
        )}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create Waybill</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formValues.title}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formValues.description}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formValues.status}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="draft">Open</option>
                  <option value="published">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Procedure
                </label>
                <select
                  name="procedure"
                  value={formValues.procedure}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="open">Open</option>
                  <option value="sealed">Sealed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spend Category
                </label>
                <select
                  name="spend_category"
                  value={formValues.spend_category}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="communications">Communications</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formValues.priority}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="non urgent">Non-Urgent</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  name="start_datetime"
                  value={formValues.start_datetime}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submission Date
                </label>
                <input
                  type="datetime-local"
                  name="submission_datetime"
                  value={formValues.submission_datetime}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Date
                </label>
                <input
                  type="datetime-local"
                  name="departure_datetime"
                  value={formValues.departure_datetime}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date
                </label>
                <input
                  type="datetime-local"
                  name="delivery_datetime"
                  value={formValues.delivery_datetime}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approve
                </label>
                <input
                  type="checkbox"
                  name="is_approved"
                  checked={formValues.is_approved}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Reach</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <select
                      name="region"
                      value={formValues.reach.region}
                      onChange={(e) => handleChange(e, null, "reach")}
                      className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="region">Test Region</option>
                      <option value="region2">Test Region2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District
                    </label>
                    <select
                      name="district"
                      value={formValues.reach.district}
                      onChange={(e) => handleChange(e, null, "reach")}
                      className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="district">Test District</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <select
                      name="city"
                      value={formValues.reach.city}
                      onChange={(e) => handleChange(e, null, "reach")}
                      className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="city">Test City</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Town
                    </label>
                    <select
                      name="town"
                      value={formValues.reach.town}
                      onChange={(e) => handleChange(e, null, "reach")}
                      className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="town">Test Town</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Add Item
                  </button>
                </div>
                {formValues.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="mb-4 p-4 border rounded-md relative">
                    {formValues.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(itemIndex)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={item.name}
                        onChange={(e) => handleChange(e, itemIndex)}
                        className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        maxLength="128"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={item.description}
                        onChange={(e) => handleChange(e, itemIndex)}
                        className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        maxLength="225"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit of Measure
                      </label>
                      <select
                        name="unit_of_measure"
                        value={item.unit_of_measure}
                        onChange={(e) => handleChange(e, itemIndex)}
                        className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="kg">Kilogram</option>
                        <option value="g">Gram</option>
                        <option value="mg">Milligram</option>
                        <option value="t">Ton</option>
                        <option value="lb">Pound</option>
                        <option value="oz">Ounce</option>
                        <option value="st">Stone</option>
                        <option value="L">Liter</option>
                        <option value="mL">Milliliter</option>
                        <option value="m³">Cubic meter</option>
                        <option value="cm³">Cubic centimeter</option>
                        <option value="gal">Gallon</option>
                        <option value="qt">Quart</option>
                        <option value="pt">Pint</option>
                        <option value="fl oz">Fluid ounce</option>
                        <option value="bbl">Barrel</option>
                        <option value="cup">Cup</option>
                        <option value="m">Meter</option>
                        <option value="cm">Centimeter</option>
                        <option value="mm">Millimeter</option>
                        <option value="km">Kilometer</option>
                        <option value="in">Inch</option>
                        <option value="ft">Foot</option>
                        <option value="yd">Yard</option>
                        <option value="mi">Mile</option>
                        <option value="m²">Square meter</option>
                        <option value="km²">Square kilometer</option>
                        <option value="ha">Hectare</option>
                        <option value="ac">Acre</option>
                        <option value="ft²">Square foot</option>
                        <option value="yd²">Square yard</option>
                        <option value="pc">Pieces</option>
                        <option value="dz">Dozen</option>
                        <option value="144 pcs">Gross</option>
                        <option value="20 pcs">Score</option>
                        <option value="500 sheets">Ream</option>
                        <option value="ct">Carat</option>
                        <option value="bsl">Bushel</option>
                        <option value="ble">Bale</option>
                        <option value="cd">Cord</option>
                        <option value="ke">Keg</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleChange(e, itemIndex)}
                        className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                        max="2147483647"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Special Handling
                        </label>
                        <button
                          type="button"
                          onClick={() => addSpecialHandle(itemIndex)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          Add Special Handle
                        </button>
                      </div>
                      {item.special_handles.map((handle, handleIndex) => (
                        <div key={handleIndex} className="flex items-center mb-2">
                          <textarea
                            name="handling_description"
                            value={handle.handling_description}
                            onChange={(e) => handleChange(e, itemIndex, "special_handles", handleIndex)}
                            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            maxLength="500"
                          />
                          <button
                            type="button"
                            onClick={() => removeSpecialHandle(itemIndex, handleIndex)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? "Saving..." : "Save Waybill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border border-gray-200 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-gray-900">Delete Waybill</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6 font-medium">
              Are you sure you want to delete the waybill "{waybillToDelete?.title}" ({waybillToDelete?.ref_num})? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWaybill}
                disabled={deleteLoading}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center disabled:opacity-50"
              >
                {deleteLoading ? (
                  <Loader2 className="animate-spin w-5 h-5 mr-2" />
                ) : (
                  <Trash2 className="w-5 h-5 mr-2" />
                )}
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issuing Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {waybills.map((waybill) => (
              <tr key={waybill.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {waybill.ref_num}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {waybill.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {waybill.issuing_company_info}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {waybill.status === "draft" ? "Open" : "Closed"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="relative group">
                    <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                      {formatDateTime(waybill.created_at).formatted}
                    </span>
                    <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                      {formatDateTime(waybill.created_at).relative}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-4">
                    <Link
                      to={`/dashboard/waybills/${waybill.ref_num}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View Details
                    </Link>
                    {canCreateWaybill && (
                      <button
                        onClick={() => openDeleteModal(waybill)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WaybillsPage;