// components/ProfileForm.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  User,
  CheckCircle,
  XCircle,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router";
import { getCookie } from "@/utility/getCookie";
import ScrollToTop from "./ScrollToTop";

const ProfileForm = ({ profileId }) => {
  const { authAxios, BASE_URL, refreshToken, userProfileId } = useAuth();
  const [formValues, setFormValues] = useState({
    job_title: "",
    job_position: "",
    cell_1: "",
    cell_2: "",
    social_links: "",
    cell_1_is_verified: false,
    cell_2_is_verified: false,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const navigate = useNavigate();

  // refreshToken()

  // const refresh = getCookie('isource-plus-refresh-token')
  // console.log('isource-plus-refresh-token',refresh)

  const canCreateCompany = ["lead buyer", "sales manager"].includes(
    formValues.job_title?.toLowerCase()
  );

  const isAdmin = formValues.job_title?.toLowerCase() === "logistics manager";

  const handleVerifyNumber = async (numberType) => {
    const number = formValues[numberType];

    if (!number) {
      toast.error("Please enter a phone number fist");
      return;
    }

    try {
      await authAxios.get(
        `send-verification-code/?phone=${encodeURIComponent(number)}`
      );
      navigate(
        `/onboarding/mobile-verification/?phone=${encodeURIComponent(
          number
        )}&number_type=${numberType}`
      );
    } catch (error) {
      console.log(error);
      toast.error(error);
    }
  };

  useEffect(() => {
    if (!profileId) return;

    const fetchProfile = async () => {
      try {
        const res = await authAxios.get(`user-profiles/${profileId}/`);
        const data = res.data;
        console.log("job_title raw:", data.job_title);
        setFormValues({
          job_title: data.job_title || "",
          job_position: data.job_position || "",
          cell_1: data.cell_1 || "",
          cell_2: data.cell_2 || "",
          social_links: data.social_links || "",
          cell_1_is_verified: data.cell_1_is_verified || false,
          cell_2_is_verified: data.cell_2_is_verified || false,
        });
        if (data.profile_photo) {
          setPhotoPreview(data.profile_photo);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load profile. Log in again.");
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [authAxios, profileId]);

  useEffect(() => {
    console.log("job_title changed:", formValues.job_title);
  }, [formValues.job_title]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get CSRF token from cookies (may exist from page load)
      let csrfToken = getCookie("csrftoken");

      // If no token, proceed anyway - the signup request will set it
      if (!csrfToken) {
        console.warn("CSRF token not found in cookies - proceeding anyway");
      }

      const data = new FormData();
      Object.entries(formValues).forEach(([key, val]) => {
        if (val !== "" && !key.endsWith("_is_verified")) {
          data.append(key, val);
        }
      });
      if (photoFile) data.append("profile_photo", photoFile);

      const response = await authAxios.patch(
        `user-profiles/${profileId}/`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRFToken": csrfToken,
          },
        }
      );

      // Check if we have unverified numbers that were just added/updated
      const updatedCell1 = data.get("cell_1");
      const updatedCell2 = data.get("cell_2");
      const needsVerification =
        (updatedCell1 && !response.data.cell_1_is_verified) ||
        (updatedCell2 && !response.data.cell_2_is_verified);

      if (needsVerification) {
        // Redirect to verification for the first unverified number
        const numberToVerify =
          updatedCell1 && !response.data.cell_1_is_verified
            ? updatedCell1
            : updatedCell2;
        const numberType =
          updatedCell1 && !response.data.cell_1_is_verified
            ? "cell_1"
            : "cell_2";

        navigate(
          `/onboarding/mobile-verification/?phone=${encodeURIComponent(
            numberToVerify
          )}&number_type=${numberType}`
        );
      } else {
        toast.success("Profile updated successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(error.response?.data?.detail || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin w-6 h-6 text-black" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ScrollToTop/>
      {/* Profile Picture Section */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Profile Image
        </h2>
        <div className="flex items-center space-x-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <label
              htmlFor="profile-photo"
              className="absolute bottom-0 right-0 bg-black text-white p-1.5 rounded-full cursor-pointer hover:bg-gray-800 transition-colors"
            >
              <Upload className="w-3 h-3" />
              <input
                id="profile-photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              JPG, GIF or PNG. Max size 2MB
            </p>
            <button
              type="button"
              className="text-sm text-red-600 hover:text-red-800 mt-2"
              onClick={() => setPhotoPreview(null)}
            >
              Remove photo
            </button>
          </div>
        </div>
      </div>

      {/* exceptions */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Professional Information
          </h2>
          <div className="flex flex-col items-end space-y-2">
            <div
              className={`flex items-center text-sm ${
                canCreateCompany ? "text-green-600" : "text-red-600"
              }`}
            >
              {canCreateCompany ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>Can create company</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-1" />
                  <span>Cannot create company</span>
                </>
              )}
            </div>
            <div
              className={`flex items-center text-sm ${
                isAdmin ? "text-green-600" : "text-red-600"
              }`}
            >
              {isAdmin ? (
                <>
                  <Shield className="w-4 h-4 mr-1" />
                  <span>Can create transporter</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-1" />
                  <span>Cannot create transporter</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Note:</span> Only{" "}
              <span className="font-semibold">"Lead Buyer"</span> or{" "}
              <span className="font-semibold">"Sales Manager"</span> roles can
              create company profiles.
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-md">
            <p className="text-sm text-purple-800">
              <span className="font-semibold">Important:</span> Only users with{" "}
              <span className="font-semibold">"logistics manager"</span> role can create
              transporter profiles.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <select
              name="job_title"
              value={formValues.job_title}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
            >
              <option value="">Select your job title</option>
              {/* <option value="admin">Admin</option> */}
              <option value="logistics manager">Logistics manager</option>
              <option value="lead buyer">Lead buyer</option>
              <option value="sales manager">Sales manager</option>
              <option value="sourcing_officer">Sourcing officer</option>
              <option value="sales officer">Sales officer</option>
              <option value="chief buyer">Chief buyer</option>
              <option value="stores officer">Stores officer</option>
              <option value="finance officer">Finance officer</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <textarea
              name="job_position"
              value={formValues.job_position}
              onChange={handleChange}
              rows={3}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              placeholder="Describe your role and responsibilities"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Primary Phone
                {/* <span className="text-red-500">*</span> */}
              </label>
              {formValues.cell_1 && !formValues.cell_1_is_verified && (
                <button
                  type="button"
                  onClick={() => handleVerifyNumber("cell_1")}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  Verify
                </button>
              )}
              {formValues.cell_1_is_verified && (
                <span className="inline-flex items-center text-xs text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </span>
              )}
            </div>

            <input
              type="tel"
              name="cell_1"
              maxLength={15}
              value={formValues.cell_1}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              placeholder="+1234567890"
              // required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Secondary Phone
              </label>
              {formValues.cell_2 && !formValues.cell_2_is_verified && (
                <button
                  type="button"
                  onClick={() => handleVerifyNumber("cell_2")}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  Verify
                </button>
              )}
              {formValues.cell_2_is_verified && (
                <span className="inline-flex items-center text-xs text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </span>
              )}
            </div>
            <input
              type="tel"
              name="cell_2"
              maxLength={15}
              value={formValues.cell_2}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              placeholder="+1234567890"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="pb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Social Profiles
        </h2>
        <div className="space-y-4">
          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn
            </label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                linkedin.com/in/
              </span>
              <input
                type="text"
                name="linkedin"
                value={
                  formValues.social_links.includes("linkedin.com")
                    ? formValues.social_links.split("linkedin.com/in/")[1] || ""
                    : ""
                }
                onChange={(e) => {
                  const linkedinValue = e.target.value
                    ? `linkedin.com/in/${e.target.value}`
                    : "";
                  setFormValues((prev) => ({
                    ...prev,
                    social_links: linkedinValue,
                  }));
                }}
                className="flex-1 block w-full rounded-none rounded-r-md border border-gray-300 p-2 focus:ring-black focus:border-black"
                placeholder="username"
              />
            </div>
          </div>

          {/* Twitter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Twitter
            </label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                twitter.com/
              </span>
              <input
                type="text"
                name="twitter"
                value={
                  formValues.social_links.includes("twitter.com")
                    ? formValues.social_links.split("twitter.com/")[1] || ""
                    : ""
                }
                onChange={(e) => {
                  const twitterValue = e.target.value
                    ? `twitter.com/${e.target.value}`
                    : "";
                  setFormValues((prev) => ({
                    ...prev,
                    social_links: twitterValue,
                  }));
                }}
                className="flex-1 block w-full rounded-none rounded-r-md border border-gray-300 p-2 focus:ring-black focus:border-black"
                placeholder="username"
              />
            </div>
          </div>

          {/* Other Social Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Social Links
            </label>
            <input
              type="text"
              name="other_social"
              value={formValues.social_links}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              placeholder="https://example.com/profile"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter full URL for any other social profiles
            </p>
          </div>
        </div>
      </div>

      {/* Submit Section */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white py-2.5 px-6 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </button>
       {userProfileId && <button
          type="button"
          className="text-sm text-gray-500 hover:underline"
          onClick={() => navigate("/dashboard")}
        >
          Go to Dashboard
        </button>}
      </div>
    </form>
  );
};

export default ProfileForm;
