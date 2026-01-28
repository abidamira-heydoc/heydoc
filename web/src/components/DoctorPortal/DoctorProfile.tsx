import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLLECTIONS } from '@shared/firebase.config';
import type { DoctorProfile as DoctorProfileType, DoctorSpecialty } from '@shared/types';
import { SPECIALTY_LABELS } from '@shared/types';

const SPECIALTIES: DoctorSpecialty[] = [
  'family_medicine',
  'internal_medicine',
  'pediatrics',
  'emergency_medicine',
  'psychiatry',
  'dermatology',
  'cardiology',
  'orthopedics',
  'neurology',
  'obgyn',
  'other',
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const DoctorProfile: React.FC = () => {
  const { t } = useTranslation('doctor');
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<DoctorProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [specialties, setSpecialties] = useState<DoctorSpecialty[]>([]);
  const [licenseState, setLicenseState] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!user) return;

      try {
        const doctorDoc = await getDoc(doc(db, COLLECTIONS.DOCTORS, user.uid));
        if (doctorDoc.exists()) {
          const data = doctorDoc.data() as DoctorProfileType;
          setDoctor({ ...data, id: doctorDoc.id });

          // Populate form
          setName(data.name || '');
          setSpecialties(data.specialties || []);
          setLicenseState(data.licenseState || '');
          setBio(data.bio || '');
          setYearsExperience(data.yearsExperience || 0);
          setIsAvailable(data.isAvailable !== false);
        }
      } catch (err) {
        console.error('Error fetching doctor:', err);
        setError(t('profile.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [user, t]);

  const handleSpecialtyToggle = (specialty: DoctorSpecialty) => {
    setSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateDoc(doc(db, COLLECTIONS.DOCTORS, user.uid), {
        name,
        specialties,
        licenseState,
        bio,
        yearsExperience,
        isAvailable,
        updatedAt: new Date(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(t('profile.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">{t('profile.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
        <p className="text-gray-600">{t('profile.subtitle')}</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-700">{t('profile.profileUpdated')}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.basicInfo')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.fullName')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.email')}
              </label>
              <input
                type="email"
                value={doctor?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('profile.emailCannotChange')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.yearsExperience')}
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Professional Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.professionalInfo')}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.specialties')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPECIALTIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSpecialtyToggle(s)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition text-start ${
                      specialties.includes(s)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {SPECIALTY_LABELS[s]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t('profile.selected')}: {specialties.length > 0 ? specialties.map(s => SPECIALTY_LABELS[s]).join(', ') : t('profile.none')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.licenseState')}
              </label>
              <select
                value={licenseState}
                onChange={(e) => setLicenseState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('profile.selectState')}</option>
                {US_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.licenseNumber')}
              </label>
              <input
                type="text"
                value={doctor?.licenseNumber || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('profile.contactSupportToUpdate')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.bio')}
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder={t('profile.bioPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Availability Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.availability')}</h2>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">{t('profile.availableForCases')}</p>
              <p className="text-sm text-gray-500">
                {t('profile.availableDesc')}
              </p>
            </div>
          </label>
        </div>

        {/* Stats Card (Read-only) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.statistics')}</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{doctor?.totalCases || 0}</p>
              <p className="text-sm text-gray-500">{t('common.totalCases')}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                ${((doctor?.totalEarnings || 0) / 100).toFixed(0)}
              </p>
              <p className="text-sm text-gray-500">{t('common.lifetimeEarnings')}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl font-bold text-amber-600">
                  {doctor?.rating?.toFixed(1) || '—'}
                </p>
                {doctor?.rating && (
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-500">{t('common.rating')}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{doctor?.totalRatings || 0}</p>
              <p className="text-sm text-gray-500">{t('common.reviews')}</p>
            </div>
          </div>
        </div>

        {/* Account Status Card (Read-only) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.accountStatus')}</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('profile.accountStatus')}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                doctor?.status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : doctor?.status === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {doctor?.status?.charAt(0).toUpperCase()}{doctor?.status?.slice(1)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('profile.stripeConnected')}</span>
              <span className="flex items-center gap-2">
                {doctor?.stripeOnboardingComplete ? (
                  <>
                    <span className="text-green-600 font-medium">{t('profile.connected')}</span>
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </>
                ) : (
                  <span className="text-amber-600 font-medium">{t('profile.notConnected')}</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">{t('profile.memberSince')}</span>
              <span className="text-gray-900">
                {doctor?.createdAt ? new Date(doctor.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('profile.saving')}
              </>
            ) : (
              t('profile.saveChanges')
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorProfile;
