import React, { useState } from 'react';
import type { DoctorProfile } from '../../../../shared/types';

interface DoctorConsultModalProps {
  onClose: () => void;
}

// Mock doctor profiles
const mockDoctors: DoctorProfile[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialties: ['Family Medicine', 'Internal Medicine'],
    credentials: ['MD', 'Board Certified'],
    rating: 4.9,
    yearsExperience: 15,
    avatarUrl: '',
    availability: 'available',
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialties: ['Pediatrics', 'Family Medicine'],
    credentials: ['MD', 'FAAP'],
    rating: 4.8,
    yearsExperience: 12,
    avatarUrl: '',
    availability: 'available',
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    specialties: ['Emergency Medicine', 'Urgent Care'],
    credentials: ['DO', 'Board Certified'],
    rating: 5.0,
    yearsExperience: 10,
    avatarUrl: '',
    availability: 'busy',
  },
];

const DoctorConsultModal: React.FC<DoctorConsultModalProps> = ({ onClose }) => {
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [consultType, setConsultType] = useState<'text' | 'voice'>('text');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-calm-600 to-primary-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Speak to a Doctor</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!selectedDoctor ? (
            <>
              {/* Pricing Info */}
              <div className="bg-calm-50 border border-calm-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">$25 Consultation</h3>
                    <p className="text-gray-600 mt-1">Get professional medical advice from licensed doctors</p>
                  </div>
                  <div className="text-4xl">👨‍⚕️</div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-calm-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Text or voice consultation
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-calm-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Average response time: 5 minutes
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-calm-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Prescriptions available (if medically necessary)
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-calm-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Follow-up included (48 hours)
                  </li>
                </ul>
              </div>

              {/* Doctor List */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Doctors</h3>
              <div className="space-y-4">
                {mockDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition cursor-pointer"
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <div className="flex items-start">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-calm-400 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {doctor.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-gray-900">{doctor.name}</h4>
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-semibold text-gray-700">{doctor.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {doctor.specialties.join(', ')}
                        </p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <span className="mr-4">{doctor.credentials.join(', ')}</span>
                          <span>{doctor.yearsExperience} years experience</span>
                        </div>
                        <div className="mt-2">
                          {doctor.availability === 'available' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                              Available Now
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                              Busy
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Selected Doctor View */}
              <button
                onClick={() => setSelectedDoctor(null)}
                className="text-primary-600 hover:text-primary-700 mb-4 flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to doctors
              </button>

              <div className="border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-start mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-calm-400 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                    {selectedDoctor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedDoctor.name}</h3>
                    <p className="text-gray-600 mt-1">{selectedDoctor.specialties.join(', ')}</p>
                    <div className="flex items-center mt-2">
                      <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold text-gray-700 mr-3">{selectedDoctor.rating}</span>
                      <span className="text-gray-600">{selectedDoctor.yearsExperience} years experience</span>
                    </div>
                  </div>
                </div>

                {/* Consultation Type Toggle */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consultation Type
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setConsultType('text')}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                        consultType === 'text'
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <span className="font-semibold">Text Chat</span>
                    </button>
                    <button
                      onClick={() => setConsultType('voice')}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                        consultType === 'voice'
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-semibold">Voice Call</span>
                    </button>
                  </div>
                </div>

                {/* Placeholder UI */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">🚧</div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    {consultType === 'text' ? 'Text Chat Interface' : 'Voice Call Interface'}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    This is a placeholder for the {consultType} consultation feature.
                  </p>
                  <p className="text-sm text-gray-500">
                    Payment processing and live consultation features will be implemented in the next phase.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This is a UI placeholder. Payment processing ($25) and actual
                  doctor consultation features are not yet implemented. This demonstrates the intended
                  user experience.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorConsultModal;
