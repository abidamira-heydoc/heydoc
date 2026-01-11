import React from 'react';

const EmergencyBanner: React.FC = () => {
  return (
    <div className="bg-emergency-600 text-white px-6 py-4 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-xl font-bold mb-2">⚠️ EMERGENCY SYMPTOMS DETECTED</h3>
            <p className="text-lg mb-3">
              Based on your symptoms, this may require immediate medical attention.
            </p>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-3">
              <p className="font-semibold mb-2">PLEASE TAKE ACTION NOW:</p>
              <ul className="space-y-1 text-sm">
                <li>🚨 Call 911 (US) or your local emergency number immediately</li>
                <li>📍 If safe, go to the nearest emergency room</li>
                <li>👥 If possible, have someone stay with you</li>
                <li>💊 Do NOT attempt self-treatment for emergency conditions</li>
              </ul>
            </div>
            <p className="text-sm opacity-90">
              HeyDoc is not a substitute for emergency medical care. Your safety is our priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyBanner;
