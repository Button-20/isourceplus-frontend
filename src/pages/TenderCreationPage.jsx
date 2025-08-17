import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Plus, Save, X, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getCookie } from "@/utility/getCookie";
import { format, isValid, parseISO } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

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

const validateStoredData = (data, expectedKeys) => {
  if (!data || typeof data !== "object") return false;
  return expectedKeys.every((key) => {
    if (key === "items" || key === "attachments") {
      return Array.isArray(data[key]) && data[key].every((item) => item && typeof item === "object");
    }
    return key in data;
  });
};

const TenderCreationPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [reachOpen, setReachOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(true);
  const [attachmentsOpen, setAttachmentsOpen] = useState(true);
  const isLocalStorageAvailable = checkLocalStorageAvailability();

  const initialFormValues = {
    title: "",
    spend_category: "",
    type: "nct",
    procedure: "open",
    method: "general sourcing",
    priority: "non urgent",
    note: "",
    start_datetime: new Date().toISOString().slice(0, 16),
    submission_datetime: new Date().toISOString().slice(0, 16),
    delivery_datetime: new Date().toISOString().slice(0, 16),
    is_approved: true,
    region: "",
    district: "",
    city: "",
    town: "",
    items: [
      {
        name: "",
        description: "",
        quantity: 1,
        unit_of_measure: "pc",
        special_handling: [],
      },
    ],
    attachments: [],
  };

  // Initialize formValues from localStorage immediately
  const [formValues, setFormValues] = useState(() => {
    if (!isLocalStorageAvailable) {
      toast.warning("Local storage is unavailable; form data will not persist across refreshes.");
      return initialFormValues;
    }
    try {
      const savedData = localStorage.getItem("tenderFormValues");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        const expectedKeys = [
          "title",
          "spend_category",
          "type",
          "procedure",
          "method",
          "priority",
          "note",
          "start_datetime",
          "submission_datetime",
          "delivery_datetime",
          "is_approved",
          "region",
          "district",
          "city",
          "town",
          "items",
          "attachments",
        ];
        if (validateStoredData(parsed, expectedKeys)) {
          console.log("Loaded form data from localStorage:", parsed);
          toast.info(`Form data restored. Loaded keys: ${Object.keys(parsed).join(", ")}`);
          return {
            ...initialFormValues,
            ...parsed,
            items: parsed.items.map((item) => ({
              ...initialFormValues.items[0],
              ...item,
              special_handling: Array.isArray(item.special_handling)
                ? item.special_handling.map((handle) => ({
                    handling_description: handle.handling_description || "",
                  }))
                : [],
            })),
            attachments: parsed.attachments.map((attachment) => ({
              name: attachment.name || "",
              file: null, // Files are not persisted in localStorage
            })),
          };
        } else {
          console.warn("Invalid stored values in localStorage, using initial values.");
          localStorage.removeItem("tenderFormValues");
        }
      }
    } catch (err) {
      console.error("Failed to load form data from localStorage:", err);
      toast.error("Unable to restore form data. Local storage may be disabled.");
    }
    return initialFormValues;
  });

  // Save form values to localStorage on change
  useEffect(() => {
    if (!isLocalStorageAvailable) return;
    try {
      const storableValues = {
        ...formValues,
        attachments: formValues.attachments.map((attachment) => ({
          name: attachment.name,
          file: null, // Do not store file objects
        })),
      };
      console.log("Saving form data to localStorage:", storableValues);
      localStorage.setItem("tenderFormValues", JSON.stringify(storableValues));
    } catch (err) {
      console.error("Failed to save form data to localStorage:", err);
      toast.error("Unable to save form data. Local storage may be disabled.");
    }
  }, [formValues, isLocalStorageAvailable]);

  const validateForm = () => {
    const errors = {};
    if (!formValues.title.trim()) {
      errors.title = "Title is required";
    } else if (formValues.title.length > 128) {
      errors.title = "Title must be 128 characters or less";
    }
    if (!formValues.spend_category) {
      errors.spend_category = "Spend category is required";
    }
    if (!formValues.type) {
      errors.type = "Type is required";
    }
    if (!formValues.procedure) {
      errors.procedure = "Procedure is required";
    }
    if (!formValues.method) {
      errors.method = "Method is required";
    }
    if (formValues.note && formValues.note.length > 500) {
      errors.note = "Note must be 500 characters or less";
    }
    if (!formValues.region.trim()) {
      errors.region = "Region is required";
    } else if (formValues.region.length > 100) {
      errors.region = "Region must be 100 characters or less";
    }
    if (!formValues.district.trim()) {
      errors.district = "District is required";
    } else if (formValues.district.length > 100) {
      errors.district = "District must be 100 characters or less";
    }
    if (!formValues.city.trim()) {
      errors.city = "City is required";
    } else if (formValues.city.length > 100) {
      errors.city = "City must be 100 characters or less";
    }
    if (!formValues.town.trim()) {
      errors.town = "Town is required";
    } else if (formValues.town.length > 100) {
      errors.town = "Town must be 100 characters or less";
    }
    if (formValues.items.length === 0) {
      errors.items = "At least one item is required";
    }
    formValues.items.forEach((item, index) => {
      if (!item.name.trim()) {
        errors[`items[${index}].name`] = "Item name is required";
      } else if (item.name.length > 255) {
        errors[`items[${index}].name`] = "Item name must be 255 characters or less";
      }
      if (item.description && item.description.length > 500) {
        errors[`items[${index}].description`] = "Item description must be 500 characters or less";
      }
      if (!item.quantity || item.quantity <= 0) {
        errors[`items[${index}].quantity`] = "Quantity must be greater than 0";
      }
      if (!item.unit_of_measure.trim()) {
        errors[`items[${index}].unit_of_measure`] = "Unit of measure is required";
      }
      item.special_handling.forEach((handle, hIndex) => {
        if (!handle.handling_description.trim()) {
          errors[`items[${index}].special_handling[${hIndex}].handling_description`] =
            "Handling description is required";
        } else if (handle.handling_description.length > 500) {
          errors[`items[${index}].special_handling[${hIndex}].handling_description`] =
            "Handling description must be 500 characters or less";
        }
      });
    });
    formValues.attachments.forEach((attachment, index) => {
      if (attachment.name && !attachment.file) {
        errors[`attachments[${index}].file`] = "File is required if name is provided";
      } else if (attachment.file && !attachment.name.trim()) {
        errors[`attachments[${index}].name`] = "Attachment name is required if file is provided";
      } else if (attachment.name && attachment.name.length > 255) {
        errors[`attachments[${index}].name`] = "Attachment name must be 255 characters or less";
      }
    });
    const startDate = parseISO(formValues.start_datetime);
    const submissionDate = parseISO(formValues.submission_datetime);
    const deliveryDate = parseISO(formValues.delivery_datetime);
    if (!isValid(startDate)) {
      errors.start_datetime = "Invalid start date";
    }
    if (!isValid(submissionDate)) {
      errors.submission_datetime = "Invalid submission date";
    } else if (submissionDate < startDate) {
      errors.submission_datetime = "Submission date must be after start date";
    }
    if (!isValid(deliveryDate)) {
      errors.delivery_datetime = "Invalid delivery date";
    } else if (deliveryDate < submissionDate) {
      errors.delivery_datetime = "Delivery date must be after submission date";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e, itemIndex = null, field = null, handleIndex = null) => {
    const { name, value, type, checked, files } = e.target;
    setFormValues((prev) => {
      let updatedValues = { ...prev };
      if (itemIndex !== null && field === "special_handling" && handleIndex !== null) {
        updatedValues.items = [...prev.items];
        updatedValues.items[itemIndex].special_handling = [...updatedValues.items[itemIndex].special_handling];
        updatedValues.items[itemIndex].special_handling[handleIndex].handling_description = value;
      } else if (itemIndex !== null && field === "attachment") {
        updatedValues.attachments = [...prev.attachments];
        updatedValues.attachments[itemIndex] = {
          ...updatedValues.attachments[itemIndex],
          file: files ? files[0] : null,
        };
      } else if (itemIndex !== null && field === "attachment_name") {
        updatedValues.attachments = [...prev.attachments];
        updatedValues.attachments[itemIndex] = {
          ...updatedValues.attachments[itemIndex],
          name: value,
        };
      } else if (itemIndex !== null) {
        updatedValues.items = [...prev.items];
        updatedValues.items[itemIndex] = {
          ...updatedValues.items[itemIndex],
          [name]: type === "number" ? parseInt(value, 10) || 1 : value,
        };
      } else {
        updatedValues = { ...prev, [name]: type === "checkbox" ? checked : value };
      }
      return updatedValues;
    });
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      if (itemIndex !== null) {
        delete newErrors[`items[${itemIndex}].${name}`];
        if (handleIndex !== null) {
          delete newErrors[`items[${itemIndex}].special_handling[${handleIndex}].handling_description`];
        }
        if (field === "attachment_name") {
          delete newErrors[`attachments[${itemIndex}].name`];
        } else if (field === "attachment") {
          delete newErrors[`attachments[${itemIndex}].file`];
        }
      }
      return newErrors;
    });
  };

  const addItem = () => {
    setFormValues((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: "",
          description: "",
          quantity: 1,
          unit_of_measure: "pc",
          special_handling: [],
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formValues.items.length <= 1) {
      toast.error("At least one item is required.");
      return;
    }
    setFormValues((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`items[${index}]`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const addAttachment = () => {
    setFormValues((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { name: "", file: null }],
    }));
  };

  const removeAttachment = (index) => {
    setFormValues((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`attachments[${index}]`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const addSpecialHandling = useCallback(
    (itemIndex) => {
      setFormValues((prev) => {
        const items = [...prev.items];
        if (!items[itemIndex].special_handling.some((handle) => handle.handling_description === "")) {
          items[itemIndex].special_handling.push({ handling_description: "" });
        }
        return { ...prev, items };
      });
    },
    []
  );

  const removeSpecialHandling = (itemIndex, handleIndex) => {
    setFormValues((prev) => {
      const items = [...prev.items];
      items[itemIndex].special_handling = items[itemIndex].special_handling.filter(
        (_, i) => i !== handleIndex
      );
      return { ...prev, items };
    });
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`items[${itemIndex}].special_handling[${handleIndex}].handling_description`];
      return newErrors;
    });
  };

  const resetForm = () => {
    setFormValues(initialFormValues);
    setFormErrors({});
    if (isLocalStorageAvailable) {
      try {
        console.log("Clearing form data from localStorage");
        localStorage.removeItem("tenderFormValues");
        toast.success("Form reset successfully.");
      } catch (err) {
        console.error("Failed to clear localStorage:", err);
        toast.error("Unable to reset form. Local storage may be disabled.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (jobTitle !== "lead buyer") {
      toast.error("Only lead buyers can create tenders.");
      return;
    }
    if (!validateForm()) {
      toast.error("Please fix the errors in the form.");
      return;
    }
    setLoading(true);
    const csrfToken = getCookie("csrftoken");
    const formData = new FormData();
    formData.append("title", formValues.title);
    formData.append("spend_category", formValues.spend_category);
    formData.append("type", formValues.type);
    formData.append("procedure", formValues.procedure);
    formData.append("method", formValues.method);
    formData.append("priority", formValues.priority);
    formData.append("note", formValues.note);
    formData.append("start_datetime", formValues.start_datetime);
    formData.append("submission_datetime", formValues.submission_datetime);
    formData.append("delivery_datetime", formValues.delivery_datetime);
    formData.append("is_approved", formValues.is_approved);
    formData.append("reach[region]", formValues.region);
    formData.append("reach[district]", formValues.district);
    formData.append("reach[city]", formValues.city);
    formData.append("reach[town]", formValues.town);

    formValues.items.forEach((item, index) => {
      if (item.name && item.quantity && item.unit_of_measure) {
        formData.append(`items[${index}][name]`, item.name);
        if (item.description) formData.append(`items[${index}][description]`, item.description);
        formData.append(`items[${index}][quantity]`, item.quantity);
        formData.append(`items[${index}][unit_of_measure]`, item.unit_of_measure);
        item.special_handling.forEach((handle, hIndex) => {
          formData.append(
            `items[${index}][special_handling][${hIndex}][handling_description]`,
            handle.handling_description
          );
        });
      }
    });

    formValues.attachments.forEach((attachment, index) => {
      if (attachment.name && attachment.file) {
        formData.append(`attachments[${index}][name]`, attachment.name);
        formData.append(`attachments[${index}][orientation]`, "document");
        formData.append(`attachments[${index}][file]`, attachment.file);
      }
    });

    // Log FormData for debugging
    console.log("FormData payload:", Object.fromEntries(formData));

    try {
      const response = await authAxios.post("/tenders/", formData, {
        headers: { "X-CSRFToken": csrfToken },
      });
      toast.success("Tender created successfully!");
      setFormValues(initialFormValues);
      setFormErrors({});
      if (isLocalStorageAvailable) {
        try {
          console.log("Clearing localStorage after successful submission");
          localStorage.removeItem("tenderFormValues");
        } catch (err) {
          console.error("Failed to clear localStorage:", err);
          toast.error("Unable to clear form data. Local storage may be disabled.");
        }
      }
      navigate(`/dashboard/tenders/${response.data.ref_num}`);
    } catch (error) {
      const errorMessage =
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.title?.[0] ||
        error.response?.data?.items?.[0]?.name?.[0] ||
        error.response?.data?.attachments?.[0]?.file?.[0] ||
        error.response?.data?.detail ||
        "Failed to create tender. Please try again.";
      toast.error(errorMessage);
      console.error("Tender creation error:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  if (jobTitle !== "lead buyer") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
          <p className="text-xl text-gray-900">Access denied. Only lead buyers can create tenders.</p>
          <Link
            to="/dashboard/tenders"
            className="mt-6 flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 shadow-md hover:shadow-lg"
          >
            <X className="w-5 h-5 mr-2" />
            Back to Tenders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Create New Tender</h1>
      <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create Tender</h2>

        {/* Tender Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Tender Details</h2>
              <span className="flex items-center text-gray-600 font-medium">
                {detailsOpen ? "Collapse" : "Expand"}
                {detailsOpen ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
              </span>
            </button>
          </div>
          {detailsOpen && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formValues.title}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.title ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter tender title"
                  maxLength={128}
                />
                {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spend Category</label>
                <select
                  name="spend_category"
                  value={formValues.spend_category}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.spend_category ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="" disabled>Select a category</option>
                  <option value="communications">Communications</option>
                  <option value="IT">IT</option>
                  <option value="Construction">Construction</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.spend_category && <p className="text-red-500 text-sm mt-1">{formErrors.spend_category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={formValues.type}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.type ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="nct">NCT</option>
                  <option value="other">Other</option>
                </select>
                {formErrors.type && <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure</label>
                <select
                  name="procedure"
                  value={formValues.procedure}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.procedure ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
                {formErrors.procedure && <p className="text-red-500 text-sm mt-1">{formErrors.procedure}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <select
                  name="method"
                  value={formValues.method}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.method ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="general sourcing">General Sourcing</option>
                  <option value="other">Other</option>
                </select>
                {formErrors.method && <p className="text-red-500 text-sm mt-1">{formErrors.method}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={formValues.priority}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="non urgent">Non Urgent</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  name="start_datetime"
                  value={formValues.start_datetime}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.start_datetime ? "border-red-500" : "border-gray-300"}`}
                  title="Select the start date and time for the tender"
                />
                {formErrors.start_datetime && <p className="text-red-500 text-sm mt-1">{formErrors.start_datetime}</p>}
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Submission Due Date</label>
                <input
                  type="datetime-local"
                  name="submission_datetime"
                  value={formValues.submission_datetime}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.submission_datetime ? "border-red-500" : "border-gray-300"}`}
                  title="Select the submission due date and time"
                />
                {formErrors.submission_datetime && <p className="text-red-500 text-sm mt-1">{formErrors.submission_datetime}</p>}
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                <input
                  type="datetime-local"
                  name="delivery_datetime"
                  value={formValues.delivery_datetime}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.delivery_datetime ? "border-red-500" : "border-gray-300"}`}
                  title="Select the delivery date and time"
                />
                {formErrors.delivery_datetime && <p className="text-red-500 text-sm mt-1">{formErrors.delivery_datetime}</p>}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_approved"
                  checked={formValues.is_approved}
                  onChange={handleChange}
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm font-medium text-gray-700">Is Approved</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  name="note"
                  value={formValues.note}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.note ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter note"
                  maxLength={500}
                />
                {formErrors.note && <p className="text-red-500 text-sm mt-1">{formErrors.note}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Reach Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setReachOpen(!reachOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Reach</h2>
              <span className="flex items-center text-gray-600 font-medium">
                {reachOpen ? "Collapse" : "Expand"}
                {reachOpen ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
              </span>
            </button>
          </div>
          {reachOpen && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input
                  type="text"
                  name="region"
                  value={formValues.region}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.region ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter region"
                  maxLength={100}
                />
                {formErrors.region && <p className="text-red-500 text-sm mt-1">{formErrors.region}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input
                  type="text"
                  name="district"
                  value={formValues.district}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.district ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter district"
                  maxLength={100}
                />
                {formErrors.district && <p className="text-red-500 text-sm mt-1">{formErrors.district}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formValues.city}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.city ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter city"
                  maxLength={100}
                />
                {formErrors.city && <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
                <input
                  type="text"
                  name="town"
                  value={formValues.town}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.town ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter town"
                  maxLength={100}
                />
                {formErrors.town && <p className="text-red-500 text-sm mt-1">{formErrors.town}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
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
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center text-gray-600 hover:text-gray-800"
                >
                  <Plus className="w-5 h-5 mr-1" /> Add Item
                </button>
              </div>
              {formValues.items.map((item, index) => (
                <div key={index} className="mb-4 p-4 bg-white border border-gray-200 rounded-md shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                      <input
                        type="text"
                        name="name"
                        value={item.name}
                        onChange={(e) => handleChange(e, index)}
                        className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors[`items[${index}].name`] ? "border-red-500" : "border-gray-300"}`}
                        placeholder="Enter item name"
                        maxLength={255}
                      />
                      {formErrors[`items[${index}].name`] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors[`items[${index}].name`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={item.description}
                        onChange={(e) => handleChange(e, index)}
                        className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors[`items[${index}].description`] ? "border-red-500" : "border-gray-300"}`}
                        placeholder="Enter item description"
                        maxLength={500}
                      />
                      {formErrors[`items[${index}].description`] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors[`items[${index}].description`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                      <select
                        name="unit_of_measure"
                        value={item.unit_of_measure}
                        onChange={(e) => handleChange(e, index)}
                        className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors[`items[${index}].unit_of_measure`] ? "border-red-500" : "border-gray-300"}`}
                      >
                        <option value="pc">Piece (pc)</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="g">Gram (g)</option>
                        <option value="mg">Milligram (mg)</option>
                        <option value="t">Ton (t)</option>
                        <option value="lb">Pound (lb)</option>
                        <option value="oz">Ounce (oz)</option>
                        <option value="L">Liter (L)</option>
                        <option value="mL">Milliliter (mL)</option>
                        <option value="m³">Cubic meter (m³)</option>
                        <option value="cm³">Cubic centimeter (cm³)</option>
                        <option value="gal">Gallon (gal)</option>
                        <option value="qt">Quart (qt)</option>
                        <option value="pt">Pint (pt)</option>
                        <option value="fl oz">Fluid ounce (fl oz)</option>
                      </select>
                      {formErrors[`items[${index}].unit_of_measure`] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors[`items[${index}].unit_of_measure`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleChange(e, index)}
                        className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors[`items[${index}].quantity`] ? "border-red-500" : "border-gray-300"}`}
                        min="1"
                      />
                      {formErrors[`items[${index}].quantity`] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors[`items[${index}].quantity`]}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Special Handling</h4>
                    {item.special_handling.map((handle, hIndex) => (
                      <div key={hIndex} className="flex items-center mb-2">
                        <input
                          type="text"
                          name="handling_description"
                          value={handle.handling_description}
                          onChange={(e) => handleChange(e, index, "special_handling", hIndex)}
                          className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors[`items[${index}].special_handling[${hIndex}].handling_description`] ? "border-red-500" : "border-gray-300"}`}
                          placeholder="Enter handling description"
                          maxLength={500}
                        />
                        <button
                          type="button"
                          onClick={() => removeSpecialHandling(index, hIndex)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        {formErrors[`items[${index}].special_handling[${hIndex}].handling_description`] && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors[`items[${index}].special_handling[${hIndex}].handling_description`]}
                          </p>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSpecialHandling(index)}
                      className="mt-2 text-gray-600 hover:text-gray-800 flex items-center"
                    >
                      <Plus className="w-5 h-5 mr-1" /> Add Special Handling
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

        {/* Attachments Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setAttachmentsOpen(!attachmentsOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Attachments (Optional)</h2>
              <span className="flex items-center text-gray-600 font-medium">
                {attachmentsOpen ? "Collapse" : "Expand"}
                {attachmentsOpen ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
              </span>
            </button>
          </div>
          {attachmentsOpen && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Attachments</h3>
                <button
                  type="button"
                  onClick={addAttachment}
                  className="flex items-center text-gray-600 hover:text-gray-800"
                >
                  <Plus className="w-5 h-5 mr-1" /> Add Attachment
                </button>
              </div>
              {formValues.attachments.map((attachment, index) => (
                <div key={index} className="mb-4 p-4 bg-white border border-gray-200 rounded-md shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Attachment Name</label>
                      <input
                        type="text"
                        name="name"
                        value={attachment.name}
                        onChange={(e) => handleChange(e, index, "attachment_name")}
                        className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors[`attachments[${index}].name`] ? "border-red-500" : "border-gray-300"}`}
                        placeholder="Enter attachment name"
                        maxLength={255}
                      />
                      {formErrors[`attachments[${index}].name`] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors[`attachments[${index}].name`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Attachment File</label>
                      <input
                        type="file"
                        onChange={(e) => handleChange(e, index, "attachment")}
                        className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors[`attachments[${index}].file`] ? "border-red-500" : "border-gray-300"}`}
                      />
                      {attachment.file && (
                        <p className="mt-2 text-sm text-gray-600">Selected: {attachment.file.name}</p>
                      )}
                      {formErrors[`attachments[${index}].file`] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors[`attachments[${index}].file`]}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="mt-4 text-red-600 hover:text-red-800 flex items-center"
                  >
                    <Trash2 className="w-5 h-5 mr-1" /> Remove Attachment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {loading ? "Creating..." : "Create Tender"}
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
              navigate("/dashboard/tenders");
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

export default TenderCreationPage;