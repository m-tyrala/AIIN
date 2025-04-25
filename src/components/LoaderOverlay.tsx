import React from "react";

type LoaderOverlayProps = {
  isVisible: boolean;
  message?: string;
};

const LoaderOverlay: React.FC<LoaderOverlayProps> = ({
  isVisible,
  message = "Proszę czekać...",
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-center text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default LoaderOverlay; 