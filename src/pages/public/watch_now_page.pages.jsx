import React from "react";
import { useNavigate } from "react-router";
import { FaArrowLeft } from "react-icons/fa6";

const WatchNow = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 py-8">
      {/* Header Section */}
      <header className="w-full max-w-6xl mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition text-lg"
        >
          <FaArrowLeft /> Back
        </button>
      </header>

      {/* Video Section */}
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg overflow-hidden">
        <div className="relative w-full pb-[56.25%] bg-black">
          <iframe
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Watch Now"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          ></iframe>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Watch Our Demo
          </h2>
          <p className="text-gray-600 mt-4">
            Explore how <span className="font-medium">I-Source Plus</span> can
            revolutionize your procurement workflow. This demo video showcases
            the platform's features and benefits.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WatchNow;
