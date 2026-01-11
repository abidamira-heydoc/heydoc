import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLLECTIONS } from '../../../../shared/firebase.config';
import type { HealthProfile, Medication, FamilyHistory } from '../../../../shared/types';

const IntakeForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // Basic Info
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('male');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weightLbs, setWeightLbs] = useState('');

  // Medical History
  const [medicalHistory, setMedicalHistory] = useState('');
  const [currentConditions, setCurrentConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [familyHistoryInput, setFamilyHistoryInput] = useState('');

  // Lifestyle
  const [smoking, setSmoking] = useState<'never' | 'former' | 'current'>('never');
  const [smokingDetails, setSmokingDetails] = useState('');
  const [alcohol, setAlcohol] = useState<'never' | 'occasionally' | 'regularly' | 'heavily'>('never');
  const [alcoholDetails, setAlcoholDetails] = useState('');
  const [exercise, setExercise] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate');
  const [exerciseDetails, setExerciseDetails] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Parse medications
      const parsedMedications: Medication[] = medications
        .split('\n')
        .filter((m) => m.trim())
        .map((m) => ({
          name: m.trim(),
          dosage: '',
          frequency: '',
        }));

      // Parse family history
      const parsedFamilyHistory: FamilyHistory[] = familyHistoryInput
        .split('\n')
        .filter((f) => f.trim())
        .map((f) => {
          const [condition, relation] = f.split(':').map((s) => s.trim());
          return { condition: condition || f, relation: relation || 'unknown' };
        });

      // Convert height from feet/inches to cm
      const totalInches = (parseInt(heightFeet) * 12) + parseInt(heightInches);
      const heightCm = totalInches * 2.54;

      // Convert weight from lbs to kg
      const weightKg = parseFloat(weightLbs) * 0.453592;

      const healthProfile: Omit<HealthProfile, 'userId'> = {
        age: parseInt(age),
        sex,
        height: heightCm,
        weight: weightKg,
        medicalHistory: medicalHistory.split(',').map((s) => s.trim()).filter(Boolean),
        currentConditions: currentConditions.split(',').map((s) => s.trim()).filter(Boolean),
        allergies: allergies.split(',').map((s) => s.trim()).filter(Boolean),
        currentMedications: parsedMedications,
        familyHistory: parsedFamilyHistory,
        lifestyle: {
          smoking,
          ...(smokingDetails && { smokingDetails }),
          alcohol,
          ...(alcoholDetails && { alcoholDetails }),
          exercise,
          ...(exerciseDetails && { exerciseDetails }),
        },
        updatedAt: new Date(),
        consentGiven: true,
        consentDate: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.HEALTH_PROFILES, user.uid), {
        userId: user.uid,
        age: healthProfile.age,
        sex: healthProfile.sex,
        height: healthProfile.height,
        weight: healthProfile.weight,
        medicalHistory: healthProfile.medicalHistory,
        currentConditions: healthProfile.currentConditions,
        allergies: healthProfile.allergies,
        currentMedications: healthProfile.currentMedications,
        familyHistory: healthProfile.familyHistory,
        lifestyle: healthProfile.lifestyle,
        updatedAt: new Date().toISOString(),
        consentGiven: healthProfile.consentGiven,
        consentDate: new Date().toISOString(),
      });

      navigate('/chat');
    } catch (err: any) {
      console.error('Error saving health profile:', err);
      setError(`Failed to save health profile: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen calm-gradient py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Profile</h1>
        <p className="text-gray-600 mb-8">
          Help us understand you better so we can provide personalized guidance.
        </p>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                } font-semibold`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 ${
                    currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="e.g., 30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sex <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      required
                      min="3"
                      max="8"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="Feet"
                    />
                    <p className="text-xs text-gray-500 mt-1">Feet (e.g., 5)</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      min="0"
                      max="11"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="Inches"
                    />
                    <p className="text-xs text-gray-500 mt-1">Inches (e.g., 10)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (lbs) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weightLbs}
                  onChange={(e) => setWeightLbs(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="e.g., 150"
                />
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Medical History */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical History</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Past Medical Conditions
                </label>
                <input
                  type="text"
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="e.g., Asthma, Diabetes (comma-separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Conditions
                </label>
                <input
                  type="text"
                  value={currentConditions}
                  onChange={(e) => setCurrentConditions(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="e.g., High blood pressure (comma-separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="e.g., Penicillin, Peanuts (comma-separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Medications
                </label>
                <textarea
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Enter each medication on a new line"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Family History
                </label>
                <textarea
                  value={familyHistoryInput}
                  onChange={(e) => setFamilyHistoryInput(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="e.g., Heart disease: father&#10;Diabetes: mother"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Lifestyle */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Lifestyle Factors</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Smoking Status <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={smoking}
                  onChange={(e) => setSmoking(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="never">Never smoked</option>
                  <option value="former">Former smoker</option>
                  <option value="current">Current smoker</option>
                </select>
              </div>

              {smoking !== 'never' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Smoking Details
                  </label>
                  <input
                    type="text"
                    value={smokingDetails}
                    onChange={(e) => setSmokingDetails(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="e.g., 5 cigarettes/day, quit 2 years ago"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alcohol Consumption <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={alcohol}
                  onChange={(e) => setAlcohol(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="never">Never</option>
                  <option value="occasionally">Occasionally</option>
                  <option value="regularly">Regularly</option>
                  <option value="heavily">Heavily</option>
                </select>
              </div>

              {alcohol !== 'never' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alcohol Details
                  </label>
                  <input
                    type="text"
                    value={alcoholDetails}
                    onChange={(e) => setAlcoholDetails(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="e.g., 1-2 drinks on weekends"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exercise Level <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={exercise}
                  onChange={(e) => setExercise(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="sedentary">Sedentary (little to no exercise)</option>
                  <option value="light">Light (1-2 days/week)</option>
                  <option value="moderate">Moderate (3-5 days/week)</option>
                  <option value="active">Active (6-7 days/week)</option>
                  <option value="very_active">Very Active (intense daily exercise)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exercise Details
                </label>
                <input
                  type="text"
                  value={exerciseDetails}
                  onChange={(e) => setExerciseDetails(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="e.g., Running 3x/week, yoga daily"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default IntakeForm;
