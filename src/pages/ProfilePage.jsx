// pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import ProfileForm from "@/components/ProfileForm";
import { Loader2, AlertCircle, Info, Bookmark, ShieldAlert } from "lucide-react";

const ProfilePage = () => {
  const { authAxios,baseData,userProfileId,loading,logout } = useAuth();
  // const [profileId, setProfileId] = useState(null);

  const logoutHandler = () => {
    logout();
  }

  console.log("baseData",baseData)

  // useEffect(() => {
  //   async function fetchProfileId() {
  //     try {
  //       const res = await authAxios.get("user-profiles/");
  //       console.log(res.data.results);
  //       const profile = res.data.results[0];
  //       setProfileId(profile.id);
  //     } catch (error) {
  //       console.error("Could not fetch user profile", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   fetchProfileId();
  // }, [authAxios]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="animate-spin w-8 h-8 text-black mx-auto mb-4" />
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    </div>
  );

  if (!userProfileId) return (
    <div className="max-w-lg mx-auto p-6 text-center bg-white rounded-lg shadow-sm mt-10">
      <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
      <h2 className="text-xl font-medium">Profile Not Found</h2>
      <p className="text-gray-600 mt-2 mb-4">You need to create your professional profile</p>
      <button className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors">
        Create Profile
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bookmark className="w-5 h-5" />
              <h1 className="text-xl font-bold">Professional Profile</h1>
            </div>
            <div className="bg-white text-black px-3 py-1 rounded-full text-sm font-medium">
              Edit Mode
            </div>
          </div>

          {/* Notice Banner */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 flex items-start">
            <Info className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">Important Notice</p>
              <p className="text-yellow-700 text-sm mt-1">
                Your job title must be <span className="font-semibold">"Lead Buyer"</span> or <span className="font-semibold">"Sales Manager"</span> to be able to create a company profile.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 sm:p-8 grid md:grid-cols-3 gap-8">
            {/* Left Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-gray-500" />
                  Lorem ipsum dolor sit amet.
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                  <div className="bg-black h-2.5 rounded-full" style={{width: '100%'}}></div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci, error.</p>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-black rounded-full mr-2"></div>
                    <span className="text-sm">Lorem, ipsum.</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-500">Lorem, ipsum dolor.</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-500">Lorem.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
                <button className="w-full text-left text-sm py-2 px-3 hover:bg-gray-100 rounded-md transition-colors">
                  View Public Profile
                </button>
                <button className="w-full text-left text-sm py-2 px-3 hover:bg-gray-100 rounded-md transition-colors">
                  Download Profile PDF
                </button>
                <button className="w-full text-left text-sm py-2 px-3 hover:bg-gray-100 rounded-md transition-colors">
                  Share Profile
                </button>
              </div>
              <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                {/* <h3 className="font-medium text-gray-900 mb-3">Log Out</h3> */}
                <button onClick={logoutHandler} className="w-full text-left text-sm py-2 px-3 hover:bg-gray-100 rounded-md transition-colors">
                  Log Out
                </button>
              </div>
            </div>
            {/* Main Form */}
            <div className="md:col-span-2">
              <ProfileForm profileId={userProfileId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;