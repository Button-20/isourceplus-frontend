// File: ./pages/BranchDetails.jsx
import { useAuth } from "@/contexts/app.context";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  Navigation, 
  Edit,
  ArrowLeft,
  Globe,
  Map,
  Home,
  Layers,
  Trash2
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCookie } from "@/utility/getCookie";

const BranchDetails = () => {
  const { authAxios } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchBranchDetails = async () => {
      try {
        setLoading(true);
        const response = await authAxios.get(`branches/${id}/`);
        setBranch(response.data);
        console.log(`Details`, response.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch branch details');
        toast.error('Failed to load branch details');
        console.error('Error fetching branch:', err);
        navigate('/dashboard/branches', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchBranchDetails();
  }, [id, authAxios, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const csrfToken = getCookie("csrftoken");
      await authAxios.delete(`branches/${id}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });
      toast.success("Branch deleted successfully!");
      navigate('/dashboard/branches');
    } catch (err) {
      console.error("Error deleting branch:", err);
      toast.error(err.response?.data?.detail || "Failed to delete branch");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="flex justify-between items-center mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            
            <div className="space-y-6">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-red-500 mb-4">Error loading branch details</div>
          <button 
            onClick={() => navigate('/dashboard/branches')}
            className="text-gray-600 hover:text-gray-800 font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Branches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button, edit, and delete options */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/dashboard/branches')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">All Branches</span>
          </button>
          
          <div className="flex gap-3">
            <Link
              to={`/dashboard/branches/${id}/edit`}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Edit size={16} />
              {/* Edit Branch */}
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={16} />
              {/* Delete Branch */}
            </button>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Branch header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Building className="text-gray-600" size={24} />
              <h1 className="text-2xl font-bold text-gray-800">{branch.name}</h1>
            </div>
          </div>

          {/* Branch details */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left column - Contact Info */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-1 h-6 bg-black rounded-full"></span>
                  Contact Information
                </h2>

                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <Mail className="flex-shrink-0 text-gray-500 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="text-gray-800 font-medium">
                        {branch.email || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* Primary Phone */}
                  <div className="flex items-start gap-3">
                    <Phone className="flex-shrink-0 text-gray-500 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Primary Phone</p>
                      <p className="text-gray-800 font-medium">
                        {branch.office_line || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* Secondary Phone */}
                  {branch.office_line_2 && (
                    <div className="flex items-start gap-3">
                      <Phone className="flex-shrink-0 text-gray-500 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Secondary Phone</p>
                        <p className="text-gray-800 font-medium">
                          {branch.office_line_2}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right column - Location Info */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-1 h-6 bg-black rounded-full"></span>
                  Location Details
                </h2>

                <div className="space-y-4">
                  {/* Street Address */}
                  {branch.location.street_address && (
                    <div className="flex items-start gap-3">
                      <Home className="flex-shrink-0 text-gray-500 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Street Address</p>
                        <p className="text-gray-800 font-medium">
                          {branch.location.street_address}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Popular Area */}
                  {branch.location.popular_area_name && (
                    <div className="flex items-start gap-3">
                      <Map className="flex-shrink-0 text-gray-500 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Landmark/Nearby</p>
                        <p className="text-gray-800 font-medium">
                          {branch.location.popular_area_name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Region/District */}
                  <div className="flex items-start gap-3">
                    <Layers className="flex-shrink-0 text-gray-500 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Region/District</p>
                      <p className="text-gray-800 font-medium">
                        {[branch.location.region, branch.location.district].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* City/Town */}
                  <div className="flex items-start gap-3">
                    <Globe className="flex-shrink-0 text-gray-500 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">City/Town</p>
                      <p className="text-gray-800 font-medium">
                        {[branch.location.city, branch.location.town].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* GPS Coordinates */}
                  {branch.location.gps && (
                    <div className="flex items-start gap-3">
                      <Navigation className="flex-shrink-0 text-gray-500 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">GPS Coordinates</p>
                        <p className="text-gray-800 font-medium">
                          {branch.location.gps}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <span className="w-1 h-6 bg-black rounded-full"></span>
                Additional Information
              </h2>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Company */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Company</p>
                  <p className="font-medium text-gray-800">
                    {branch.company ? 'Linked Company' : 'Not assigned'}
                  </p>
                </div>

                {/* Subscription */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Subscription Plan</p>
                  <p className="font-medium text-gray-800">
                    {branch.sub_plan ? branch.sub_plan : 'No active subscription'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the branch "{branch.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ${
                    deleting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  disabled={deleting}
                >
                  {deleting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchDetails;