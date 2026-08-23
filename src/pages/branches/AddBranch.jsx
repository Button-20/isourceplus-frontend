import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { getCookie } from "@/utility/getCookie";
import { MapPin, Phone, Mail, Building, Navigation, Home, Layers, Globe, ChevronDown } from "lucide-react";

// Added: Validation function for localStorage data
const validateStoredData = (data, expectedKeys, expectedLocationKeys) => {
  if (!data || typeof data !== "object") return false;
  if (!expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(data, key))) return false;
  if (!data.location || typeof data.location !== "object") return false;
  return expectedLocationKeys.every((key) => Object.prototype.hasOwnProperty.call(data.location, key));
};

const AddBranch = () => {
  const { authAxios } = useAuth();
  const navigate = useNavigate();

  // Form state aligned with API spec
  const [formData, setFormData] = useState({
    name: "",
    office_line: "",
    office_line_2: "",
    email: "",
    location: {
      region: "",
      district: "",
      city: "",
      town: "",
      popular_area_name: "",
      gps: "",
      street_address: ""
    }
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // API-defined choices
  const regionChoices = [{ value: "region", display_name: "Test Region" }];
  const districtChoices = [{ value: "district", display_name: "Test District" }];
  const cityChoices = [{ value: "city", display_name: "Test City" }];
  const townChoices = [{ value: "town", display_name: "Test Town" }];

    // Added: Load form data from localStorage on component mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem("addBranchFormData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const expectedKeys = ["name", "office_line", "office_line_2", "email", "location"];
        const expectedLocationKeys = [
          "region",
          "district",
          "city",
          "town",
          "popular_area_name",
          "gps",
          "street_address"
        ];
        if (validateStoredData(parsedData, expectedKeys, expectedLocationKeys)) {
          setFormData(parsedData);
          toast.info("Form data restored from previous session.");
        } else {
          console.warn("Invalid stored values in localStorage, skipping load.");
        }
      }
    } catch (err) {
      console.error("Failed to load form data from localStorage:", err);
      toast.error("Unable to restore form data. Local storage may be disabled.");
    }
  }, []);
  

  // Modified: Save formData to localStorage on change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when field is edited
    setErrors(prev => {
      const newErrors = {...prev};
      if (name.includes('location.')) {
        const locationField = name.split('.')[1];
        if (newErrors.location?.[locationField]) {
          delete newErrors.location[locationField];
          if (Object.keys(newErrors.location).length === 0) {
            delete newErrors.location;
          }
        }
      } else if (newErrors[name]) {
        delete newErrors[name];
      }
      return newErrors;
    });

    setFormData(prev => {
      const updatedFormData = name.includes('location.')
        ? {
            ...prev,
            location: {
              ...prev.location,
              [name.split('.')[1]]: value
            }
          }
        : {
            ...prev,
            [name]: value
          };
      
      // Added: Save updated formData to localStorage
      try {
        localStorage.setItem("addBranchFormData", JSON.stringify(updatedFormData));
      } catch (err) {
        console.error("Failed to save form data to localStorage:", err);
        toast.error("Unable to save form data. Local storage may be disabled.");
      }
      
      return updatedFormData;
    });
  };


  const validateForm = () => {
    const newErrors = {};
    
    // Validate required location fields
    const locationErrors = {};
    if (!formData.location.region) locationErrors.region = "Region is required";
    if (!formData.location.district) locationErrors.district = "District is required";
    if (!formData.location.city) locationErrors.city = "City is required";
    if (!formData.location.town) locationErrors.town = "Town is required";
    
    if (Object.keys(locationErrors).length > 0) {
      newErrors.location = locationErrors;
    }
    
    // Validate max lengths
    if (formData.name.length > 128) {
      newErrors.name = "Branch name cannot exceed 128 characters";
    }
    if (formData.office_line.length > 15) {
      newErrors.office_line = "Phone number cannot exceed 15 characters";
    }
    if (formData.office_line_2.length > 15) {
      newErrors.office_line_2 = "Secondary phone cannot exceed 15 characters";
    }
    if (formData.email.length > 128) {
      newErrors.email = "Email cannot exceed 128 characters";
    }
    if (formData.location.gps.length > 10) {
      newErrors.gps = "GPS coordinates cannot exceed 10 characters";
    }
    if (formData.location.street_address.length > 128) {
      newErrors.street_address = "Street address cannot exceed 128 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

    // Added: Reset form and clear localStorage
  const handleReset = () => {
    const initialFormData = {
      name: "",
      office_line: "",
      office_line_2: "",
      email: "",
      location: {
        region: "",
        district: "",
        city: "",
        town: "",
        popular_area_name: "",
        gps: "",
        street_address: ""
      }
    };

     setFormData(initialFormData);
    setErrors({});
    try {
      localStorage.setItem("addBranchFormData", JSON.stringify(initialFormData));
      toast.success("Form reset successfully.");
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      })
    } catch (err) {
      console.error("Failed to clear localStorage:", err);
      toast.error("Unable to reset form. Local storage may be disabled.");
    }
  };

  // Modified: Clear localStorage on successful submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const csrfToken = getCookie("csrftoken");
      await authAxios.post("branches/", formData, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });
      
      toast.success("Branch created successfully!");
      
      // Added: Clear localStorage on successful submission
      try {
        localStorage.removeItem("addBranchFormData");
      } catch (err) {
        console.error("Failed to clear localStorage:", err);
        toast.error("Unable to clear form data. Local storage may be disabled.");
      }
      
      navigate('/dashboard/branches');
      
      // No changes to form reset
      setFormData({
        name: "",
        office_line: "",
        office_line_2: "",
        email: "",
        location: {
          region: "",
          district: "",
          city: "",
          town: "",
          popular_area_name: "",
          gps: "",
          street_address: ""
        }
      });

    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.detail || 
                         err.response?.data?.location?.non_field_errors?.[0] || 
                         "Error creating branch";
      toast.error(errorMessage);
      
      // No changes to error handling
      if (err.response?.data) {
        const apiErrors = {};
        Object.keys(err.response.data).forEach(key => {
          if (key === 'location') {
            apiErrors.location = err.response.data.location;
          } else {
            apiErrors[key] = err.response.data[key][0];
          }
        });
        setErrors(apiErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/dashboard/branches')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Add New Branch</h1>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Branch Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Building className="text-gray-600" size={20} />
              Branch Information
            </h2>

            <div className="space-y-4">
              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g. Accra Central Branch"
                    maxLength={128}
                  />
                  <Building className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact</label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="office_line"
                      value={formData.office_line}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                        errors.office_line ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="e.g. 0244123456"
                      maxLength={15}
                    />
                    <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                  {errors.office_line && <p className="mt-1 text-sm text-red-600">{errors.office_line}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Contact</label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="office_line_2"
                      value={formData.office_line_2}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                        errors.office_line_2 ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Optional"
                      maxLength={15}
                    />
                    <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  </div>
                  {errors.office_line_2 && <p className="mt-1 text-sm text-red-600">{errors.office_line_2}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Corporate Email</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="branch@company.com"
                    maxLength={128}
                  />
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <MapPin className="text-gray-600" size={20} />
              Location Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                <div className="relative">
                  <select
                    name="location.region"
                    value={formData.location.region}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 appearance-none ${
                      errors.location?.region ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select region</option>
                    {regionChoices.map(choice => (
                      <option key={choice.value} value={choice.value}>{choice.display_name}</option>
                    ))}
                  </select>
                  <Globe className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <ChevronDown className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
                {errors.location?.region && <p className="mt-1 text-sm text-red-600">{errors.location.region}</p>}
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                <div className="relative">
                  <select
                    name="location.district"
                    value={formData.location.district}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 appearance-none ${
                      errors.location?.district ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select district</option>
                    {districtChoices.map(choice => (
                      <option key={choice.value} value={choice.value}>{choice.display_name}</option>
                    ))}
                  </select>
                  <Layers className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <ChevronDown className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
                {errors.location?.district && <p className="mt-1 text-sm text-red-600">{errors.location.district}</p>}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <div className="relative">
                  <select
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 appearance-none ${
                      errors.location?.city ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select city</option>
                    {cityChoices.map(choice => (
                      <option key={choice.value} value={choice.value}>{choice.display_name}</option>
                    ))}
                  </select>
                  <Globe className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <ChevronDown className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
                {errors.location?.city && <p className="mt-1 text-sm text-red-600">{errors.location.city}</p>}
              </div>

              {/* Town */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Town *</label>
                <div className="relative">
                  <select
                    name="location.town"
                    value={formData.location.town}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 appearance-none ${
                      errors.location?.town ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select town</option>
                    {townChoices.map(choice => (
                      <option key={choice.value} value={choice.value}>{choice.display_name}</option>
                    ))}
                  </select>
                  <Home className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <ChevronDown className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
                {errors.location?.town && <p className="mt-1 text-sm text-red-600">{errors.location.town}</p>}
              </div>
            </div>

            {/* Additional Location Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Popular Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark/Nearby</label>
                <div className="relative">
                  <input
                    type="text"
                    name="location.popular_area_name"
                    value={formData.location.popular_area_name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                      errors.location?.popular_area_name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g. Near Ghana Commercial Bank"
                  />
                  <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
                {errors.location?.popular_area_name && <p className="mt-1 text-sm text-red-600">{errors.location.popular_area_name}</p>}
              </div>

              {/* GPS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Digital Address (GPS)</label>
                <div className="relative">
                  <input
                    type="text"
                    name="location.gps"
                    value={formData.location.gps}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                      errors.location?.gps ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g. GA-123-4567"
                    maxLength={10}
                  />
                  <Navigation className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
                {errors.location?.gps && <p className="mt-1 text-sm text-red-600">{errors.location.gps}</p>}
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <div className="relative">
                <input
                  type="text"
                  name="location.street_address"
                  value={formData.location.street_address}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                    errors.location?.street_address ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g. 123 Main Street, Block A"
                  maxLength={128}
                />
                <Home className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
              {errors.location?.street_address && <p className="mt-1 text-sm text-red-600">{errors.location.street_address}</p>}
            </div>
          </div>

          {/* Form Actions - Modified: Added Reset button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/branches')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                submitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : "Create Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBranch;