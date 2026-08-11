// pages/MobileVerificationPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/app.context';

const MobileVerificationPage = () => {
  const { authAxios } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const phoneNumber = searchParams.get('phone');
  const numberType = searchParams.get('number_type');

  useEffect(() => {
    // if (!phoneNumber) {
    //   navigate('/onboarding/user');
    //   return;
    // }

    // Start countdown for resend
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phoneNumber, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code) {
      toast.error('Please enter verification code');
      return;
    }

    setLoading(true);
    try {
      await authAxios.post('mobile-verification/', {
        phone: phoneNumber,
        code: code
      });
      toast.success('Phone number verified successfully!');
      navigate('/onboarding/user');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendDisabled(true);
    setCountdown(60);
    try {
      await authAxios.get(`send-verification-code/?phone=${encodeURIComponent(phoneNumber)}`);
      toast.success('Verification code resent!');
      
      // Restart countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message||'Failed to resend code');
      setResendDisabled(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-xs w-full max-w-md">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-black mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Phone Number</h1>
        <p className="text-gray-600 mb-6">
          Enter the verification code sent to <span className="font-medium">{phoneNumber}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2.5 px-4 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Verifying...
              </>
            ) : (
              'Verify Phone Number'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendDisabled}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {resendDisabled ? `Resend code in ${countdown}s` : 'Resend verification code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileVerificationPage;