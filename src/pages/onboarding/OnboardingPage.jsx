// src/pages/OnboardingPage.jsx
import React, { useState, useEffect } from 'react';
import UserProfileForm from '@/components/ProfileForm';
import CompanyForm from '@/components/CompanyForm';
import TransporterForm from '@/components/TransporterForm';
import { useAuth } from '@/contexts/app.context';
// import { useAuth } from '@/context/AuthContext'; // Assuming you have an auth context

function OnboardingPage() {
  const { user } = useAuth(); // Get authenticated user
  const [currentStep, setCurrentStep] = useState(1);
  const [userProfile, setUserProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [transporter, setTransporter] = useState(null);

  useEffect(() => {
    if (!user) {
      // Redirect to login if not authenticated
      // navigate('/login');
      console.warn('User not authenticated');
    }
  }, [user]);

  const handleUserProfileSuccess = (data) => {
    setUserProfile(data);
    setCurrentStep(2);
  };

  const handleCompanySuccess = (data) => {
    setCompany(data);
    setCurrentStep(3);
  };

  const handleTransporterSuccess = (data) => {
    setTransporter(data);
    setCurrentStep(4);
  };

  return (
    <div className="OnboardingPage">
      {currentStep === 1 && (
        <UserProfileForm 
          userId={user?.id} // Use actual user ID from auth
          onSuccess={handleUserProfileSuccess} 
        />
      )}
      
      {currentStep === 2 && (
        <CompanyForm onSuccess={handleCompanySuccess} />
      )}
      
      {currentStep === 3 && (
        <TransporterForm onSuccess={handleTransporterSuccess} />
      )}
      
      {currentStep === 4 && (
        <div className="completion-message">
          <h2>Registration Complete!</h2>
          <p>User Profile: {userProfile?.job_title}</p>
          <p>Company: {company?.name}</p>
          <p>Transporter: {transporter?.name}</p>
        </div>
      )}
    </div>
  );
}

export default OnboardingPage;