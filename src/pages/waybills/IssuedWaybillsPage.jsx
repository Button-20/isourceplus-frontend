import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Plus, Save, X, Trash2, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getCookie } from "@/utility/getCookie";
import { format, formatDistanceToNow, isValid, parseISO } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

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
    if (key === "reach") {
      return data[key] && typeof data[key] === "object";
    }
    if (key === "items") {
      return Array.isArray(data[key]) && data[key].every((item) => item && typeof item === "object");
    }
    return key in data;
  });
};

const IssuedWaybillsPage = () => {
  const { authAxios, jobTitle, BASE_URL, companyId, transporterId, userProfileId } = useAuth();
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [waybillToDelete, setWaybillToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();
  const isLocalStorageAvailable = checkLocalStorageAvailability();

  const canCreateWaybill = ["lead buyer", "sales manager"].includes(jobTitle);

  const initialFormValues = {
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
      region: "",
      district: "",
      city: "",
      town: "",
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
  };

  // Initialize formValues from localStorage immediately
  const [formValues, setFormValues] = useState(() => {
    if (!isLocalStorageAvailable) {
      toast.warning("Local storage is unavailable; form data will not persist across refreshes.");
      return initialFormValues;
    }
    try {
      const savedData = localStorage.getItem("issuedWaybillsFormValues");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        const expectedKeys = [
          "title",
          "description",
          "status",
          "procedure",
          "spend_category",
          "priority",
          "start_datetime",
          "submission_datetime",
          "departure_datetime",
          "delivery_datetime",
          "is_approved",
          "reach",
          "items",
        ];
        if (validateStoredData(parsed, expectedKeys)) {
          console.log("Loaded form data from localStorage:", parsed);
          // toast.info(`Form data restored. Loaded keys: ${Object.keys(parsed).join(", ")}`);
          return {
            ...initialFormValues,
            ...parsed,
            reach: { ...initialFormValues.reach, ...parsed.reach },
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
        } else {
          console.warn("Invalid stored values in localStorage, using initial values.");
          localStorage.removeItem("issuedWaybillsFormValues");
        }
      }
    } catch (err) {
      console.error("Failed to load form data from localStorage:", err);
      toast.error("Unable to restore form data. Local storage may be disabled.");
    }
    return initialFormValues;
  });

  // Load showForm from localStorage
  useEffect(() => {
    if (!isLocalStorageAvailable) return;
    try {
      const savedShowForm = localStorage.getItem("issuedWaybillsShowForm");
      if (savedShowForm) {
        const parsedShowForm = JSON.parse(savedShowForm);
        console.log("Loaded showForm from localStorage:", parsedShowForm);
        setShowForm(parsedShowForm);
      }
    } catch (err) {
      console.error("Failed to load showForm from localStorage:", err);
      toast.error("Unable to restore form state. Local storage may be disabled.");
    }
  }, []);

  // Save showForm to localStorage on change
  useEffect(() => {
    if (!isLocalStorageAvailable) return;
    try {
      console.log("Saving showForm to localStorage:", showForm);
      localStorage.setItem("issuedWaybillsShowForm", JSON.stringify(showForm));
    } catch (err) {
      console.error("Failed to save showForm to localStorage:", err);
      toast.error("Unable to save form state. Local storage may be disabled.");
    }
  }, [showForm, isLocalStorageAvailable]);

  // Save form values to localStorage on change
  useEffect(() => {
    if (!isLocalStorageAvailable) return;
    try {
      console.log("Saving form data to localStorage:", formValues);
      localStorage.setItem("issuedWaybillsFormValues", JSON.stringify(formValues));
    } catch (err) {
      console.error("Failed to save form data to localStorage:", err);
      toast.error("Unable to save form data. Local storage may be disabled.");
    }
  }, [formValues, isLocalStorageAvailable]);

  const formatDateTime = (dateString) => {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return { formatted: "Invalid Date", relative: "Unknown" };
    }
    return {
      formatted: format(date, "MMM dd, yyyy"),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

  const fetchWaybills = async () => {
    try {
      console.log(`Fetching issued waybills from: ${BASE_URL}waybills/issued/`);
      const response = await authAxios.get("waybills/issued/");
      console.log("Waybills:", response.data);
      setWaybills(response.data);
    } catch (error) {
      toast.error("Failed to load issued waybills.");
      console.error("Fetch issued waybills error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaybills();
  }, [authAxios, BASE_URL]);

  const validateForm = () => {
    const errors = {};
    if (!formValues.title.trim()) {
      errors.title = "Title is required";
    } else if (formValues.title.length > 128) {
      errors.title = "Title must be 128 characters or less";
    }
    if (!formValues.items.length) {
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
      if (item.quantity <= 0) {
        errors[`items[${index}].quantity`] = "Quantity must be greater than 0";
      }
      item.special_handles.forEach((handle, hIndex) => {
        if (!handle.handling_description.trim()) {
          errors[`items[${index}].special_handles[${hIndex}].handling_description`] =
            "Handling description is required";
        } else if (handle.handling_description.length > 500) {
          errors[`items[${index}].special_handles[${hIndex}].handling_description`] =
            "Handling description must be 500 characters or less";
        }
      });
    });
    if (formValues.description && formValues.description.length > 500) {
      errors.description = "Description must be 500 characters or less";
    }
    const startDate = parseISO(formValues.start_datetime);
    const submissionDate = parseISO(formValues.submission_datetime);
    const departureDate = parseISO(formValues.departure_datetime);
    const deliveryDate = parseISO(formValues.delivery_datetime);
    if (!isValid(startDate)) {
      errors.start_datetime = "Invalid start date";
    }
    if (!isValid(submissionDate)) {
      errors.submission_datetime = "Invalid submission date";
    } else if (submissionDate < startDate) {
      errors.submission_datetime = "Submission date must be after start date";
    }
    if (!isValid(departureDate)) {
      errors.departure_datetime = "Invalid departure date";
    }
    if (!isValid(deliveryDate)) {
      errors.delivery_datetime = "Invalid delivery date";
    } else if (deliveryDate < departureDate) {
      errors.delivery_datetime = "Delivery date must be after departure date";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e, itemIndex = null, field = null, handleIndex = null) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => {
      let updatedValues = { ...prev };
      if (field === "reach") {
        updatedValues.reach = { ...prev.reach, [name]: value };
      } else if (itemIndex !== null && field === "special_handles" && handleIndex !== null) {
        updatedValues.items = [...prev.items];
        updatedValues.items[itemIndex].special_handles = [...updatedValues.items[itemIndex].special_handles];
        updatedValues.items[itemIndex].special_handles[handleIndex].handling_description = value;
      } else if (itemIndex !== null) {
        updatedValues.items = [...prev.items];
        updatedValues.items[itemIndex] = {
          ...updatedValues.items[itemIndex],
          [name]: type === "number" ? parseInt(value, 10) || 1 : value,
        };
      } else {
        updatedValues = { ...prev, [name]: type === "checkbox" ? checked : value };
      }
      if (isLocalStorageAvailable) {
        try {
          console.log("Saving form data on change:", updatedValues);
          localStorage.setItem("issuedWaybillsFormValues", JSON.stringify(updatedValues));
        } catch (err) {
          console.error("Failed to save form data to localStorage:", err);
          toast.error("Unable to save form data. Local storage may be disabled.");
        }
      }
      return updatedValues;
    });
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      if (itemIndex !== null) {
        delete newErrors[`items[${itemIndex}].${name}`];
        if (handleIndex !== null) {
          delete newErrors[`items[${itemIndex}].special_handles[${handleIndex}].handling_description`];
        }
      }
      return newErrors;
    });
  };

  const addItem = () => {
    setFormValues((prev) => {
      const updatedValues = {
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
      };
      if (isLocalStorageAvailable) {
        try {
          console.log("Saving form data after adding item:", updatedValues);
          localStorage.setItem("issuedWaybillsFormValues", JSON.stringify(updatedValues));
        } catch (err) {
          console.error("Failed to save form data to localStorage:", err);
          toast.error("Unable to save form data. Local storage may be disabled.");
        }
      }
      return updatedValues;
    });
  };

  const removeItem = (index) => {
    setFormValues((prev) => {
      const updatedValues = {
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      };
      if (isLocalStorageAvailable) {
        try {
          console.log("Saving form data after removing item:", updatedValues);
          localStorage.setItem("issuedWaybillsFormValues", JSON.stringify(updatedValues));
        } catch (err) {
          console.error("Failed to save form data to localStorage:", err);
          toast.error("Unable to save form data. Local storage may be disabled.");
        }
      }
      return updatedValues;
    });
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

  const addSpecialHandle = useCallback(
    (itemIndex) => {
      setFormValues((prev) => {
        const items = [...prev.items];
        if (!items[itemIndex].special_handles.some((handle) => handle.handling_description === "")) {
          items[itemIndex].special_handles.push({ handling_description: "" });
        }
        const updatedValues = { ...prev, items };
        if (isLocalStorageAvailable) {
          try {
            console.log("Saving form data after adding special handle:", updatedValues);
            localStorage.setItem("issuedWaybillsFormValues", JSON.stringify(updatedValues));
          } catch (err) {
            console.error("Failed to save form data to localStorage:", err);
            toast.error("Unable to save form data. Local storage may be disabled.");
          }
        }
        return updatedValues;
      });
    },
    [isLocalStorageAvailable]
  );

  const removeSpecialHandle = (itemIndex, handleIndex) => {
    setFormValues((prev) => {
      const items = [...prev.items];
      items[itemIndex].special_handles = items[itemIndex].special_handles.filter(
        (_, i) => i !== handleIndex
      );
      const updatedValues = { ...prev, items };
      if (isLocalStorageAvailable) {
        try {
          console.log("Saving form data after removing special handle:", updatedValues);
          localStorage.setItem("issuedWaybillsFormValues", JSON.stringify(updatedValues));
        } catch (err) {
          console.error("Failed to save form data to localStorage:", err);
          toast.error("Unable to save form data. Local storage may be disabled.");
        }
      }
      return updatedValues;
    });
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`items[${itemIndex}].special_handles[${handleIndex}].handling_description`];
      return newErrors;
    });
  };

  const resetForm = () => {
    setFormValues(initialFormValues);
    setFormErrors({});
    if (isLocalStorageAvailable) {
      try {
        console.log("Clearing form data from localStorage");
        localStorage.removeItem("issuedWaybillsFormValues");
        toast.success("Form reset successfully.");
      } catch (err) {
        console.error("Failed to clear localStorage:", err);
        toast.error("Unable to reset form. Local storage may be disabled.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form.");
      return;
    }
    setLoading(true);
    const csrfToken = getCookie("csrftoken");
    const formData = new FormData();
    formData.append("title", formValues.title);
    formData.append("note", formValues.description);
    formData.append("status", formValues.status);
    formData.append("procedure", formValues.procedure);
    formData.append("spend_category", formValues.spend_category);
    formData.append("priority", formValues.priority);
    formData.append("start_datetime", formValues.start_datetime);
    formData.append("submission_datetime", formValues.submission_datetime);
    formData.append("departure_datetime", formValues.departure_datetime);
    formData.append("delivery_datetime", formValues.delivery_datetime);
    formData.append("is_approved", formValues.is_approved);
    Object.entries(formValues.reach).forEach(([key, value]) => {
      if (value) formData.append(`reach[${key}]`, value);
    });
    formValues.items.forEach((item, index) => {
      formData.append(`items[${index}][name]`, item.name);
      if (item.description) formData.append(`items[${index}][description]`, item.description);
      formData.append(`items[${index}][unit_of_measure]`, item.unit_of_measure);
      formData.append(`items[${index}][quantity]`, item.quantity);
      item.special_handles.forEach((handle, hIndex) => {
        formData.append(
          `items[${index}][special_handles][${hIndex}][handling_description]`,
          handle.handling_description
        );
      });
    });
    const issuingType = companyId ? "company.Company" : "company.Transporter";
    const issuingId = companyId || transporterId;
    formData.append("issuing_company_content_type", issuingType);
    formData.append("issuing_company_object_id", issuingId);
    formData.append("employee", userProfileId);

    try {
      await authAxios.post("waybills/", formData, {
        headers: { "X-CSRFToken": csrfToken },
      });
      toast.success("Waybill created successfully!");
      setFormValues(initialFormValues);
      setFormErrors({});
      if (isLocalStorageAvailable) {
        try {
          console.log("Clearing localStorage after successful submission");
          localStorage.removeItem("issuedWaybillsFormValues");
          localStorage.removeItem("issuedWaybillsShowForm");
        } catch (err) {
          console.error("Failed to clear localStorage:", err);
          toast.error("Unable to clear form data. Local storage may be disabled.");
        }
      }
      setShowForm(false);
      fetchWaybills();
    } catch (error) {
      const errorMessage =
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.title?.[0] ||
        error.response?.data?.items?.[0]?.name?.[0] ||
        error.response?.data?.detail ||
        "Failed to create waybill.";
      toast.error(errorMessage);
      console.error("Waybill creation error:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (waybill) => {
    setWaybillToDelete(waybill);
    setShowDeleteModal(true);
  };

  const handleDeleteWaybill = async () => {
    setDeleteLoading(true);
    const csrfToken = getCookie("csrftoken");
    try {
      await authAxios.delete(`waybills/${waybillToDelete.ref_num}/`, {
        headers: { "X-CSRFToken": csrfToken },
      });
      toast.success("Waybill deleted successfully!");
      setShowDeleteModal(false);
      setWaybillToDelete(null);
      fetchWaybills();
    } catch (error) {
      toast.error("Failed to delete waybill.");
      console.error("Delete waybill error:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">Issued Waybills</h1>
      {canCreateWaybill && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? "Hide Form" : "Create New Waybill"}
        </button>
      )}
      {showForm && canCreateWaybill && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Create Waybill</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formValues.title}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.title ? "border-red-500" : "border-gray-300"}`}
                placeholder="Enter waybill title"
                maxLength={128}
              />
              {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formValues.description}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.description ? "border-red-500" : "border-gray-300"}`}
                placeholder="Enter description"
                maxLength={500}
              />
              {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formValues.status}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Procedure</label>
              <select
                name="procedure"
                value={formValues.procedure}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="open">Open</option>
                <option value="sealed">Sealed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spend Category</label>
              <select
                name="spend_category"
                value={formValues.spend_category}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="communications">Communications</option>
                <option value="logistics">Logistics</option>
                <option value="equipment">Equipment</option>
              </select>
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
                title="Select the start date and time for the waybill"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
              <input
                type="datetime-local"
                name="departure_datetime"
                value={formValues.departure_datetime}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors.departure_datetime ? "border-red-500" : "border-gray-300"}`}
                title="Select the departure date and time"
              />
              {formErrors.departure_datetime && <p className="text-red-500 text-sm mt-1">{formErrors.departure_datetime}</p>}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <input
                type="text"
                name="region"
                value={formValues.reach.region}
                onChange={(e) => handleChange(e, null, "reach")}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter region"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input
                type="text"
                name="district"
                value={formValues.reach.district}
                onChange={(e) => handleChange(e, null, "reach")}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter district"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formValues.reach.city}
                onChange={(e) => handleChange(e, null, "reach")}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
              <input
                type="text"
                name="town"
                value={formValues.reach.town}
                onChange={(e) => handleChange(e, null, "reach")}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                placeholder="Enter town"
              />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Items</h3>
            {formValues.items.map((item, index) => (
              <div key={index} className="mb-4 p-4 bg-white border border-gray-200 rounded-md shadow-xs">
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="pc">Piece (pc)</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="liter">Liter (L)</option>
                    </select>
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
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Special Handles</h4>
                  {item.special_handles.map((handle, hIndex) => (
                    <div key={hIndex} className="flex items-center mb-2">
                      <input
                        type="text"
                        name="handling_description"
                        value={handle.handling_description}
                        onChange={(e) => handleChange(e, index, "special_handles", hIndex)}
                        className={`w-full p-2 border rounded-md focus:ring-gray-500 focus:border-gray-500 ${formErrors[`items[${index}].special_handles[${hIndex}].handling_description`] ? "border-red-500" : "border-gray-300"}`}
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
                    className="mt-2 text-blue-600 hover:text-gray-800 flex items-center"
                  >
                    <Plus className="w-5 h-5 mr-1" /> Add Special Handle
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="mt-4 text-red-600 hover:text-red-800 flex items-center"
                >
                  <Trash2 className="w-5 h-5 mr-1" /> Remove Item
                </button>
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
          <div className="mt-6 flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              {loading ? "Creating..." : "Create Waybill"}
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
                setShowForm(false);
                resetForm();
              }}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 flex items-center shadow-md hover:shadow-lg"
            >
              <X className="w-5 h-5 mr-2" /> Cancel
            </button>
          </div>
        </form>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-4">Are you sure you want to delete the waybill "{waybillToDelete?.title}"?</p>
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
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center shadow-md disabled:opacity-50"
              >
                {deleteLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Trash2 className="w-5 h-5 mr-2" />}
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-auto bg-white border border-gray-200 rounded-lg shadow-md">
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
            {waybills.length > 0 ? (
              waybills.map((waybill) => (
                <tr key={waybill.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{waybill.ref_num}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{waybill.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{waybill.issuing_company_info}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {waybill.status === "draft" ? "Draft" : "Published"}
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
                      <Link to={`/dashboard/waybills/${waybill.ref_num}`} className="text-gray-600 hover:text-gray-800">
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
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-sm text-gray-900 text-center">
                  No issued waybills found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IssuedWaybillsPage;