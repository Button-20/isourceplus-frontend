import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { getCookie } from "@/utility/getCookie";

const AddBranch = () => {
  const { authAxios, BASE_URL, primaryBtn } = useAuth();
  const navigate = useNavigate();

  // form state
  const [name, setName] = useState("");
  const [officeLine, setOfficeLine] = useState("");
  const [officeLine2, setOfficeLine2] = useState("");
  const [email, setEmail] = useState("");

  // nested location state
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [town, setTown] = useState("");
  const [popularArea, setPopularArea] = useState("");
  const [gps, setGps] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // top‐level fields
  const handleNameChange = (e) => setName(e.target.value);
  const handleOfficeLineChange = (e) => setOfficeLine(e.target.value);
  const handleOfficeLine2Change = (e) => setOfficeLine2(e.target.value);
  const handleEmailChange = (e) => setEmail(e.target.value);

  // nested location
  const handleRegionChange = (e) => setRegion(e.target.value);
  const handleDistrictChange = (e) => setDistrict(e.target.value);
  const handleCityChange = (e) => setCity(e.target.value);
  const handleTownChange = (e) => setTown(e.target.value);
  const handlePopularAreaChange = (e) => setPopularArea(e.target.value);
  const handleGpsChange = (e) => setGps(e.target.value);
  const handleStreetAddressChange = (e) => setStreetAddress(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name,
      office_line: officeLine,
      office_line_2: officeLine2,
      email,
      location: {
        region,
        district,
        city,
        town,
        popular_area_name: popularArea,
        gps,
        street_address: streetAddress,
      },
    };

    try {
      const csrfToken = getCookie("csrftoken");

      await authAxios.post("branches/", payload, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });
      toast.success("Branch added successfully!");
      navigate('/dashboard/branches')

      setName("");
      setOfficeLine("");
      setOfficeLine2("");
      setEmail("");
      setRegion("");
      setDistrict("");
      setCity("");
      setTown("");
      setPopularArea("");
      setGps("");
      setStreetAddress("");
    } catch (err) {
        console.error(err)
      toast.error(err.response?.data?.detail || err.response?.data?.location?.non_field_errors[0] || "Error adding branch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-semibold mb-6">Add New Branch</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Branch name */}
        <div>
          <label className="block mb-1 font-medium">Branch Name</label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="e.g. Accra Central"
          />
        </div>

        {/* Contacts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Primary Contact</label>
            <input
              type="tel"
              value={officeLine}
              onChange={handleOfficeLineChange}
              className="w-full border px-3 py-2 rounded"
              placeholder="+233..."
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Secondary Contact</label>
            <input
              type="tel"
              value={officeLine2}
              onChange={handleOfficeLine2Change}
              className="w-full border px-3 py-2 rounded"
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1 font-medium">Corporate Email</label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="branch@example.com"
          />
        </div>

        {/* Location */}
        <fieldset className="border p-4 rounded">
          <legend className="font-medium px-2">Location Details</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Region</label>
              <select
                value={region}
                onChange={handleRegionChange}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select region</option>
                <option value="region">Test Region</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">District</label>
              <select
                value={district}
                onChange={handleDistrictChange}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select district</option>
                <option value="district">Test District</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">City</label>
              <select
                value={city}
                onChange={handleCityChange}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select city</option>
                <option value="city">Test City</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Town</label>
              <select
                value={town}
                onChange={handleTownChange}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select town</option>
                <option value="town">Test Town</option>
              </select>
            </div>
          </div>

          {/* Optional extras */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Popular Area</label>
              <input
                type="text"
                value={popularArea}
                onChange={handlePopularAreaChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Digital Address (GPS)</label>
              <input
                type="text"
                value={gps}
                onChange={handleGpsChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block mb-1">Street Address</label>
              <input
                type="text"
                value={streetAddress}
                onChange={handleStreetAddressChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>
        </fieldset>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className={`${primaryBtn} ${submitting ? "opacity-50" : ""}`}
        >
          {submitting ? "Adding…" : "Add Branch"}
        </button>
      </form>
    </div>
  );
};

export default AddBranch;
