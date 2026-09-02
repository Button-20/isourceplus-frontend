import { useAuth } from "@/contexts/app.context";
import React, { useEffect, useState } from "react";
import { FaBuilding, FaTruck, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router";

const CompanyChoices = () => {
  const { authAxios,userProfileId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState(null);

  const [selectedChoice, setSelectedChoice] = useState(null);

  const navigate = useNavigate();

  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
    window.scrollTo({
      top: "300",
      behavior: "smooth"
    })
  };

  // useEffect(() => {
  //   async function fetchProfileId() {
  //     try {
  //       const res = await authAxios.get("user-profiles/");
  //       const profile = res.data.results[0];
  //       // console.log("profiles", res.data.results)
  //       // console.log("profiles0", profile)
  //       setProfileId(profile.id);
  //       console.log("profileid", profileId);
  //     } catch (error) {
  //       console.error("Could not fetch user profile", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   fetchProfileId();
  // }, [authAxios]);

  useEffect(() => {
    if (!userProfileId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await authAxios.get(`user-profiles/${userProfileId}/`);
        const data = res.data;
        console.log("profileData", res.data);
        setJobTitle(res.data.job_title);
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authAxios, userProfileId]);

  const handleNext = () => {
    if (
      !companyAllowed.includes(jobTitle) &&
      !transportAllowed.includes(jobTitle)
    ) {
      navigate("/dashboard");
      return;
    }

    if (selectedChoice) {
      console.log(`Selected: ${selectedChoice}`);

      if (!selectedChoice) return;

      if (selectedChoice === "company") {
        navigate("/dashboard/company");
      } else if (selectedChoice === "transport") {
        navigate("/dashboard/transporter");
      }
    }
  };

  // const isCompanyDisabled = jobTitle === "admin";
  // const isTransportDisabled =
  //   jobTitle === "sales manager" || jobTitle === "lead buyer";

  const transportAllowed = ["logistics manager"];
  const companyAllowed = ["sales manager", "lead buyer"];

  const isCompanyDisabled = !companyAllowed.includes(jobTitle);
  const isTransportDisabled = !transportAllowed.includes(jobTitle);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 grow">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Account Type</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select between a standard company account or a transport company
            account to get started with iSourcePlus.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Company Card */}
          <div
            className={`
      border-2 rounded-xl p-8 transition-all duration-300
      ${
        isCompanyDisabled
          ? "opacity-50 cursor-not-allowed pointer-events-none"
          : "cursor-pointer"
      }
      ${
        selectedChoice === "company"
          ? "border-brand bg-brand/10 shadow-lg"
          : "border-border hover:border-brand/50"
      }
    `}
            onClick={() => {
              if (!isCompanyDisabled) handleChoiceSelect("company");
            }}
          >
            <div className="flex justify-center mb-6">
              <div
                className={`p-4 rounded-full ${
                  selectedChoice === "company"
                    ? "bg-brand-gradient text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                <FaBuilding className="text-3xl" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">Company</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Ideal for businesses looking to manage their supply chain,
              inventory, and procurement processes.
            </p>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center">
                <span
                  className={`rounded-full p-1 mr-2 ${
                    selectedChoice === "company"
                      ? "bg-brand text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  ✓
                </span>
                <span>Inventory management</span>
              </li>
              <li className="flex items-center">
                <span
                  className={`rounded-full p-1 mr-2 ${
                    selectedChoice === "company"
                      ? "bg-brand text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  ✓
                </span>
                <span>Supplier network</span>
              </li>
              <li className="flex items-center">
                <span
                  className={`rounded-full p-1 mr-2 ${
                    selectedChoice === "company"
                      ? "bg-brand text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  ✓
                </span>
                <span>Analytics dashboard</span>
              </li>
            </ul>
          </div>

          {/* Transport Company Card */}
          <div
            className={`
      border-2 rounded-xl p-8 transition-all duration-300
      ${
        isTransportDisabled
          ? "opacity-50 cursor-not-allowed pointer-events-none"
          : "cursor-pointer"
      }
      ${
        selectedChoice === "transport"
          ? "border-brand bg-brand/10 shadow-lg"
          : "border-border hover:border-brand/50"
      }
    `}
            onClick={() => {
              if (!isTransportDisabled) handleChoiceSelect("transport");
            }}
          >
            <div className="flex justify-center mb-6">
              <div
                className={`p-4 rounded-full ${
                  selectedChoice === "transport"
                    ? "bg-brand-gradient text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                <FaTruck className="text-3xl" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">Transporter</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Designed for logistics providers offering transportation services
              within the supply chain network.
            </p>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center">
                <span
                  className={`rounded-full p-1 mr-2 ${
                    selectedChoice === "transport"
                      ? "bg-brand text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  ✓
                </span>
                <span>Fleet management</span>
              </li>
              <li className="flex items-center">
                <span
                  className={`rounded-full p-1 mr-2 ${
                    selectedChoice === "transport"
                      ? "bg-brand text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  ✓
                </span>
                <span>Route optimization</span>
              </li>
              <li className="flex items-center">
                <span
                  className={`rounded-full p-1 mr-2 ${
                    selectedChoice === "transport"
                      ? "bg-brand text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  ✓
                </span>
                <span>Load matching</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Next Button */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleNext}
            disabled={loading}
            className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors ${
              // selectedChoice
                "bg-brand-gradient text-white hover:opacity-90"
                // : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Continue <FaChevronRight className="ml-2" />
          </button>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-card text-muted-foreground border-t border-border p-6 text-center">
        <p>© 2025 iSourcePlus. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CompanyChoices;
