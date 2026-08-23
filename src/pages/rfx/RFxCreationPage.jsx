import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Plus, Save, X, Trash2, RefreshCw, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getCookie } from "@/utility/getCookie";
import { format, isValid, parseISO } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

// NO CHANGES
const checkLocalStorageAvailability = () => {
  try {
    const testKey = "__test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (err) {
    console.error("localStorage is not available:", err);
    return false;
  }
};

// NO CHANGES
const validateStoredData = (data, expectedKeys) => {
  if (!data || typeof data !== "object") return false;
  return expectedKeys.every((key) => {
    if (key === "items") {
      return Array.isArray(data[key]) && data[key].every((item) => item && typeof item === "object");
    }
    return key in data;
  });
};

const RFxCreationPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  // NEW ADDITION: Added state for collapsible Reach section
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [reachOpen, setReachOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(true);
  const isLocalStorageAvailable = checkLocalStorageAvailability();

  // UPDATED: Added region, district, city, town to initialFormValues
  const initialFormValues = {
    title: "",
    note: "",
    type: "information",
    procedure: "open",
    spend_category: "communications",
    priority: "non urgent",
    start_datetime: new Date().toISOString().slice(0, 16),
    submission_datetime: new Date().toISOString().slice(0, 16),
    is_approved: true,
    region: "",
    district: "",
    city: "",
    town: "",
    items: [
      {
        name: "",
        description: "",
        unit_of_measure: "pc",
        quantity: 1,
        special_handles: [],
      },
    ],
  };

  const reachFields = ["region", "district", "city", "town"];

  // UPDATED: Added region, district, city, town to expectedKeys
  const [formValues, setFormValues] = useState(() => {
    if (!isLocalStorageAvailable) {
      toast.warning("Local storage is unavailable; form data will not persist across refreshes.");
      return initialFormValues;
    }
    try {
      const savedData = localStorage.getItem("rfxFormValues");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        const expectedKeys = [
          "title",
          "note",
          "type",
          "procedure",
          "spend_category",
          "priority",
          "start_datetime",
          "submission_datetime",
          "is_approved",
          "region",
          "district",
          "city",
          "town",
          "items",
        ];
        if (validateStoredData(parsed, expectedKeys)) {
          console.log("Loaded form data from localStorage:", parsed);
          return {
            ...initialFormValues,
            ...parsed,
            items: parsed.items.map((item) => ({
              ...initialFormValues.items[0],
              ...item,
              special_handles: Array.isArray(item.special_handles)
                ? item.special_handles.map((handle) => ({
                    handling_description: handle.handling_description || "",
                  }))
                : [],
            })),
          };
        }
      }
      return initialFormValues;
    } catch (err) {
      console.error("Error loading form data from localStorage:", err);
      return initialFormValues;
    }
  });

  // NO CHANGES
  useEffect(() => {
    if (isLocalStorageAvailable) {
      try {
        localStorage.setItem("rfxFormValues", JSON.stringify(formValues));
      } catch (err) {
        console.error("Error saving form data to localStorage:", err);
        toast.error("Failed to save form data to localStorage.");
      }
    }
  }, [formValues, isLocalStorageAvailable]);

  // NO CHANGES
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

  // NO CHANGES
  const removeItem = (index) => {
    setFormValues((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`items[${index}]`];
      return newErrors;
    });
  };

  // NO CHANGES
  const addSpecialHandle = (itemIndex) => {
    setFormValues((prev) => {
      const newItems = [...prev.items];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        special_handles: [
          ...newItems[itemIndex].special_handles,
          { handling_description: "" },
        ],
      };
      return { ...prev, items: newItems };
    });
  };

  // NO CHANGES
  const removeSpecialHandle = (itemIndex, handleIndex) => {
    setFormValues((prev) => {
      const newItems = [...prev.items];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        special_handles: newItems[itemIndex].special_handles.filter(
          (_, i) => i !== handleIndex
        ),
      };
      return { ...prev, items: newItems };
    });
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`items[${itemIndex}].special_handles[${handleIndex}]`];
      return newErrors;
    });
  };

  // UPDATED: Added validation for reach fields
  const validateForm = () => {
    const errors = {};
    if (!formValues.title) errors.title = "Title is required";
    if (!formValues.spend_category) errors.spend_category = "Spend category is required";
    if (!formValues.type) errors.type = "Type is required";
    if (!formValues.procedure) errors.procedure = "Procedure is required";
    if (!formValues.priority) errors.priority = "Priority is required";
    if (!formValues.start_datetime) errors.start_datetime = "Start date is required";
    if (!formValues.submission_datetime)
      errors.submission_datetime = "Submission date is required";
    if (!isValid(parseISO(formValues.start_datetime)))
      errors.start_datetime = "Invalid start date";
    if (!isValid(parseISO(formValues.submission_datetime)))
      errors.submission_datetime = "Invalid submission date";
    if (
      formValues.start_datetime &&
      formValues.submission_datetime &&
      new Date(formValues.start_datetime) > new Date(formValues.submission_datetime)
    ) {
      errors.submission_datetime = "Submission date must be after start date";
    }

    // NEW ADDITION: Validate reach fields
    // const reachFields = ["region", "district", "city", "town"];
    const hasReachData = reachFields.some((field) => formValues[field]);
    if (hasReachData && !formValues.region) {
      errors.region = "Region is required if any reach field is provided";
    }
    reachFields.forEach((field) => {
      if (formValues[field] && formValues[field].length > 255) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be 255 characters or less`;
      }
    });

    // NO CHANGES
    if (formValues.items.length === 0) {
      errors.items = "At least one item is required";
    } else {
      formValues.items.forEach((item, index) => {
        if (!item.name) errors[`items[${index}].name`] = "Item name is required";
        if (!item.quantity || item.quantity <= 0)
          errors[`items[${index}].quantity`] = "Quantity must be greater than 0";
        if (!item.unit_of_measure)
          errors[`items[${index}].unit_of_measure`] = "Unit of measure is required";
        item.special_handles.forEach((handle, hIndex) => {
          if (!handle.handling_description)
            errors[`items[${index}].special_handles[${hIndex}].handling_description`] =
              "Handling description is required";
        });
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // UPDATED: Added reach to FormData
 const handleSubmit = async (e) => {
    e.preventDefault();
    if (jobTitle !== "lead buyer") {
      toast.error("Only lead buyers can create RFxs.");
      return;
    }
    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      return;
    }
    setLoading(true);
    const data = new FormData();
    data.append("title", formValues.title);
    data.append("note", formValues.note);
    data.append("type", formValues.type);
    data.append("procedure", formValues.procedure);
    data.append("spend_category", formValues.spend_category);
    data.append("priority", formValues.priority);
    data.append("start_datetime", formValues.start_datetime);
    data.append("submission_datetime", formValues.submission_datetime);
    data.append("is_approved", formValues.is_approved);

    // NEW ADDITION: Append reach fields individually
    const reachFields = ["region", "district", "city", "town"];
    if (reachFields.some((field) => formValues[field])) {
      reachFields.forEach((field) => {
        if (formValues[field]) {
          data.append(`reach[${field}]`, formValues[field]);
        }
      });
    }

    formValues.items.forEach((item, index) => {
      data.append(`items[${index}][name]`, item.name);
      data.append(`items[${index}][description]`, item.description || "");
      data.append(`items[${index}][quantity]`, item.quantity);
      data.append(`items[${index}][unit_of_measure]`, item.unit_of_measure);
      item.special_handles.forEach((handle, hIndex) => {
        data.append(
          `items[${index}][special_handles][${hIndex}][handling_description]`,
          handle.handling_description
        );
      });
    });

    const csrfToken = getCookie("csrftoken");
    try {
      const response = await authAxios.post("/rfxs/", data, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });
      console.log("RFx created:", response.data);
      toast.success("RFx created successfully!");
      if (isLocalStorageAvailable) {
        localStorage.removeItem("rfxFormValues");
      }
      navigate("/dashboard/rfxs");
    } catch (error) {
      


      const errorMessage = error.response?.data?.detail || error.response?.data?.reach?.city || error.response?.data?.reach?.district || error.response?.data?.reach?.region || error.response?.data?.reach?.town || "Failed to create RFx.";
      toast.error(errorMessage);
      console.error("Create RFx error:", error);  
    } finally {
      setLoading(false);
    }
  };

  // NO CHANGES
  const resetForm = () => {
    setFormValues(initialFormValues);
    setFormErrors({});
    if (isLocalStorageAvailable) {
      localStorage.removeItem("rfxFormValues");
    }
    toast.info("Form has been reset.");
  };

  // NO CHANGES
  const handleChange = (e, index, field, subfield = null) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => {
      if (field === "item") {
        const newItems = [...prev.items];
        newItems[index] = { ...newItems[index], [subfield]: value };
        return { ...prev, items: newItems };
      } else if (field === "special_handle") {
        const newItems = [...prev.items];
        newItems[index].special_handles[subfield] = {
          ...newItems[index].special_handles[subfield],
          handling_description: value,
        };
        return { ...prev, items: newItems };
      } else {
        return {
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        };
      }
    });
  };

  // NO CHANGES
  if (jobTitle !== "lead buyer") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">Access Denied</p>
          <p className="text-gray-600 mb-6">Only lead buyers can create RFxs.</p>
          <button
            onClick={() => navigate("/dashboard/rfxs")}
            className="flex items-center justify-center w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200 shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to RFxs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Create RFx</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">RFx Details</h2>
              <span className="flex items-center text-gray-600 font-medium">
                {detailsOpen ? "Collapse" : "Expand"}
                {detailsOpen ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
              </span>
            </button>
          </div>
          {detailsOpen && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formValues.title}
                    onChange={(e) => handleChange(e)}
                    className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                      formErrors.title ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter RFx title"
                  />
                  {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spend Category</label>
                  <select
                    name="spend_category"
                    value={formValues.spend_category}
                    onChange={(e) => handleChange(e)}
                    className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                      formErrors.spend_category ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="communications">Communications</option>
                    <option value="it">IT</option>
                    <option value="logistics">Logistics</option>
                    <option value="consulting">Consulting</option>
                  </select>
                  {formErrors.spend_category && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.spend_category}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    name="type"
                    value={formValues.type}
                    onChange={(e) => handleChange(e)}
                    className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                      formErrors.type ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="information">Information</option>
                    <option value="quotation">Quotation</option>
                    <option value="proposal">Proposal</option>
                  </select>
                  {formErrors.type && <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Procedure</label>
                  <select
                    name="procedure"
                    value={formValues.procedure}
                    onChange={(e) => handleChange(e)}
                    className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                      formErrors.procedure ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="open">Open</option>
                    <option value="sealed">Sealed</option>
                  </select>
                  {formErrors.procedure && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.procedure}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formValues.priority}
                    onChange={(e) => handleChange(e)}
                    className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                      formErrors.priority ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="non urgent">Non Urgent</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  {formErrors.priority && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.priority}</p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    name="start_datetime"
                    value={formValues.start_datetime}
                    onChange={(e) => handleChange(e)}
                    className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                      formErrors.start_datetime ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.start_datetime && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.start_datetime}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Submission Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="submission_datetime"
                    value={formValues.submission_datetime}
                    onChange={(e) => handleChange(e)}
                    className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                      formErrors.submission_datetime ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.submission_datetime && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.submission_datetime}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                  <textarea
                    name="note"
                    value={formValues.note}
                    onChange={(e) => handleChange(e)}
                    className="w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 border-gray-300"
                    placeholder="Enter any additional notes"
                    rows={4}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_approved"
                    checked={formValues.is_approved}
                    onChange={(e) => handleChange(e)}
                    className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">
                    Approved
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NEW ADDITION: Reach Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setReachOpen(!reachOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Reach (Optional)</h2>
              <span className="flex items-center text-gray-600 font-medium">
                {reachOpen ? "Collapse" : "Expand"}
                {reachOpen ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
              </span>
            </button>
          </div>
          {reachOpen && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input
                  type="text"
                  name="region"
                  value={formValues.region}
                  onChange={(e) => handleChange(e)}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                    formErrors.region ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter region"
                  maxLength={255}
                />
                {formErrors.region && <p className="text-red-500 text-sm mt-1">{formErrors.region}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input
                  type="text"
                  name="district"
                  value={formValues.district}
                  onChange={(e) => handleChange(e)}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                    formErrors.district ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter district"
                  maxLength={255}
                />
                {formErrors.district && <p className="text-red-500 text-sm mt-1">{formErrors.district}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formValues.city}
                  onChange={(e) => handleChange(e)}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                    formErrors.city ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter city"
                  maxLength={255}
                />
                {formErrors.city && <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
                <input
                  type="text"
                  name="town"
                  value={formValues.town}
                  onChange={(e) => handleChange(e)}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                    formErrors.town ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter town"
                  maxLength={255}
                />
                {formErrors.town && <p className="text-red-500 text-sm mt-1">{formErrors.town}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setItemsOpen(!itemsOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Items</h2>
              <span className="flex items-center text-gray-600 font-medium">
                {itemsOpen ? "Collapse" : "Expand"}
                {itemsOpen ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
              </span>
            </button>
          </div>
          {itemsOpen && (
            <div className="p-6 space-y-6">
              {formValues.items.map((item, index) => (
                <div key={index} className="border border-gray-200 p-4 rounded-md shadow-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleChange(e, index, "item", "name")}
                        className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                          formErrors[`items[${index}].name`] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Enter item name"
                      />
                      {formErrors[`items[${index}].name`] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors[`items[${index}].name`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleChange(e, index, "item", "description")}
                        className="w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 border-gray-300"
                        placeholder="Enter item description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleChange(e, index, "item", "quantity")}
                        className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                          formErrors[`items[${index}].quantity`] ? "border-red-500" : "border-gray-300"
                        }`}
                        min={1}
                      />
                      {formErrors[`items[${index}].quantity`] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors[`items[${index}].quantity`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                      <select
                        value={item.unit_of_measure}
                        onChange={(e) => handleChange(e, index, "item", "unit_of_measure")}
                        className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                          formErrors[`items[${index}].unit_of_measure`] ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        <option value="pc">Piece</option>
                        <option value="kg">Kilogram</option>
                        <option value="m">Meter</option>
                        <option value="l">Liter</option>
                      </select>
                      {formErrors[`items[${index}].unit_of_measure`] && (
                        <p className="text-red-500 text-sm mt-1">
                          {formErrors[`items[${index}].unit_of_measure`]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Handling
                    </label>
                    {item.special_handles.map((handle, hIndex) => (
                      <div key={hIndex} className="flex items-center mb-2">
                        <input
                          type="text"
                          value={handle.handling_description}
                          onChange={(e) => handleChange(e, index, "special_handle", hIndex)}
                          className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${
                            formErrors[`items[${index}].special_handles[${hIndex}].handling_description`]
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="Enter handling description"
                          maxLength={500}
                        />
                        <button
                          type="button"
                          onClick={() => removeSpecialHandle(index, hIndex)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        {formErrors[`items[${index}].special_handles[${hIndex}].handling_description`] && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors[`items[${index}].special_handles[${hIndex}].handling_description`]}
                          </p>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSpecialHandle(index)}
                      className="mt-2 text-gray-600 hover:text-gray-800 flex items-center"
                    >
                      <Plus className="w-5 h-5 mr-1" /> Add Special Handle
                    </button>
                  </div>
                  {formValues.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="mt-4 text-red-600 hover:text-red-800 flex items-center"
                    >
                      <Trash2 className="w-5 h-5 mr-1" /> Remove Item
                    </button>
                  )}
                </div>
              ))}
              {formErrors.items && <p className="text-red-500 text-sm mt-1">{formErrors.items}</p>}
              <button
                type="button"
                onClick={addItem}
                className="mt-4 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" /> Add Item
              </button>
            </div>
          )}
        </div>

        {/* Submit and Action Buttons */}
        <div className="mt-6 flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {loading ? "Creating..." : "Create RFx"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 flex items-center shadow-md hover:shadow-lg"
          >
            <RefreshCw className="w-5 h-5 mr-2" /> Reset Form
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              navigate("/dashboard/rfxs");
            }}
            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 flex items-center shadow-md hover:shadow-lg"
          >
            <X className="w-5 h-5 mr-2" /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RFxCreationPage;