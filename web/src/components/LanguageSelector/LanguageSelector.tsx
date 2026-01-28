import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import type { LanguageCode, LanguageConfig } from '../../config/i18n';

const LanguageSelector: React.FC = () => {
  const navigate = useNavigate();
  const { setLanguage, supportedLanguages } = useLanguage();

  const handleSelectLanguage = async (lang: LanguageConfig) => {
    await setLanguage(lang.code as LanguageCode);
    navigate('/consent');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-500 to-white flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6">
              <img
                src="/heydoclogo.png"
                alt="HeyDoc Logo"
                className="w-20 h-20 sm:w-28 sm:h-28 object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Select Your Language
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Choose your preferred language to continue
            </p>
          </div>

          {/* Language Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang)}
                className="group relative bg-white hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 border-2 border-gray-200 hover:border-green-400 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                dir={lang.dir}
              >
                <div className="text-center">
                  <span className="block text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-green-700 mb-1">
                    {lang.nativeName}
                  </span>
                  <span className="block text-xs sm:text-sm text-gray-500 group-hover:text-green-600">
                    {lang.name}
                  </span>
                </div>
                {/* RTL indicator for Arabic/Urdu */}
                {lang.dir === 'rtl' && (
                  <span className="absolute top-2 end-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                    RTL
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-gray-500 mt-6 sm:mt-8">
            You can change your language anytime in settings
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;
