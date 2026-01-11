import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLLECTIONS } from '../../../../shared/firebase.config';
import type { HealthProfile } from '../../../../shared/types';

const ProfileView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states (same as IntakeForm)
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [allergies, setAllergies] = useState('');
  const [currentConditions, setCurrentConditions] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const docRef = doc(db, COLLECTIONS.HEALTH_PROFILES, user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profile = docSnap.data() as HealthProfile;
          setHealthProfile(profile);

          // Populate form
          setAge(profile.age.toString());
          setSex(profile.sex);
          setHeight(profile.height.toString());
          setWeight(profile.weight.toString());
          setAllergies(profile.allergies.join(', '));
          setCurrentConditions(profile.currentConditions.join(', '));
          setCurrentMedications(profile.currentMedications.map(m => m.name).join('\n'));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const updates: Partial<HealthProfile> = {
        age: parseInt(age),
        sex,
        height: parseFloat(height),
        weight: parseFloat(weight),
        allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
        currentConditions: currentConditions.split(',').map(s => s.trim()).filter(Boolean),
        currentMedications: currentMedications.split('\n').filter(m => m.trim()).map(m => ({
          name: m.trim(),
          dosage: '',
          frequency: '',
        })),
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, COLLECTIONS.HEALTH_PROFILES, user.uid), updates);

      setHealthProfile({ ...healthProfile!, ...updates });
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen calm-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen calm-gradient py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Health Profile</h1>
              <p className="text-gray-600 mt-1">Manage your health information</p>
            </div>
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Back to Chat
            </button>
          </div>

          {/* Profile Information */}
          {!editing ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="text-lg font-semibold text-gray-900">{healthProfile?.age} years</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Sex</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{healthProfile?.sex}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Height</p>
                    <p className="text-lg font-semibold text-gray-900">{healthProfile?.height} cm</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="text-lg font-semibold text-gray-900">{healthProfile?.weight} kg</p>
                  </div>
                </div>
              </div>

              {/* Medical Info */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Information</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Allergies</p>
                    <p className="text-gray-900">
                      {healthProfile?.allergies.length
                        ? healthProfile.allergies.join(', ')
                        : 'None reported'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Current Conditions</p>
                    <p className="text-gray-900">
                      {healthProfile?.currentConditions.length
                        ? healthProfile.currentConditions.join(', ')
                        : 'None reported'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Current Medications</p>
                    <p className="text-gray-900">
                      {healthProfile?.currentMedications.length
                        ? healthProfile.currentMedications.map(m => m.name).join(', ')
                        : 'None reported'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lifestyle */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Lifestyle</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Smoking</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {healthProfile?.lifestyle.smoking}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Alcohol</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {healthProfile?.lifestyle.alcohol}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Exercise</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {healthProfile?.lifestyle.exercise}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            /* Edit Form */
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Basic Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Comma-separated"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Conditions</label>
                <input
                  type="text"
                  value={currentConditions}
                  onChange={(e) => setCurrentConditions(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Comma-separated"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
                <textarea
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="One per line"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
