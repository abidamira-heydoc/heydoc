import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../config/firebase';
import { COLLECTIONS } from '@shared/firebase.config';
import type { DoctorSpecialty, DoctorProfile } from '@shared/types';
import { SPECIALTY_LABELS } from '@shared/types';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const DoctorSignup: React.FC = () => {
  const { t } = useTranslation('doctor');
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [specialties, setSpecialties] = useState<DoctorSpecialty[]>([]);
  const [yearsExperience, setYearsExperience] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [bio, setBio] = useState('');

  // File uploads
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState(1);

  const licenseInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleSpecialtyToggle = (specialty: DoctorSpecialty) => {
    setSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'license' | 'photo'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('auth.signup.validation.imageFile'));
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError(t('auth.signup.validation.fileSizeLimit'));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'license') {
        setLicenseFile(file);
        setLicensePreview(e.target?.result as string);
      } else {
        setPhotoFile(file);
        setPhotoPreview(e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (
    file: File,
    path: string
  ): Promise<string> => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        reject,
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  };

  const validateStep1 = () => {
    if (!name.trim()) return t('auth.signup.validation.enterName');
    if (!email.trim()) return t('auth.signup.validation.enterEmail');
    if (!password) return t('auth.signup.validation.enterPassword');
    if (password.length < 8) return t('auth.signup.validation.passwordMinLength');
    if (password !== confirmPassword) return t('auth.signup.validation.passwordsNotMatch');
    return null;
  };

  const validateStep2 = () => {
    if (specialties.length === 0) return t('auth.signup.validation.selectSpecialty');
    if (!yearsExperience) return t('auth.signup.validation.enterYearsExperience');
    if (!licenseNumber.trim()) return t('auth.signup.validation.enterLicenseNumber');
    if (!licenseState) return t('auth.signup.validation.selectLicenseState');
    return null;
  };

  const validateStep3 = () => {
    if (!licenseFile) return t('auth.signup.validation.uploadLicense');
    if (!photoFile) return t('auth.signup.validation.uploadPhoto');
    if (!bio.trim()) return t('auth.signup.validation.enterBio');
    if (bio.length > 250) return t('auth.signup.validation.bioMaxLength');
    return null;
  };

  const handleNext = () => {
    setError('');

    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const err = validateStep3();
    if (err) { setError(err); return; }

    setLoading(true);

    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const doctorId = userCredential.user.uid;

      // Upload license image
      setUploadProgress(0);
      const licenseUrl = await uploadFile(
        licenseFile!,
        `doctors/${doctorId}/license.jpg`
      );

      // Upload profile photo
      setUploadProgress(0);
      const photoUrl = await uploadFile(
        photoFile!,
        `doctors/${doctorId}/photo.jpg`
      );

      // Create doctor profile in Firestore
      const doctorProfile: Omit<DoctorProfile, 'id'> & { id: string } = {
        id: doctorId,
        email,
        name,
        specialties,
        credentials: [],
        licenseNumber,
        licenseState,
        licenseUrl,
        photoUrl,
        bio,
        yearsExperience: parseInt(yearsExperience),
        rating: 0,
        totalRatings: 0,
        totalCases: 0,
        isAvailable: false,
        status: 'pending',
        stripeOnboardingComplete: false,
        pendingBalance: 0,
        totalEarnings: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, COLLECTIONS.DOCTORS, doctorId), doctorProfile);

      // Navigate to pending approval page
      navigate('/doctor/pending');
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError(t('auth.signup.validation.emailInUse'));
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white font-medium">{t('layout.doctorPortal')}</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{t('auth.signup.title')}</h1>
          <p className="text-blue-100">{t('auth.signup.subtitle')}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white'
                }`}>
                  {step > s ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 rounded ${step > s ? 'bg-white' : 'bg-white/20'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/50">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Info */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.signup.accountInfo')}</h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.signup.fullName')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder={t('auth.signup.fullNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.signup.email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder={t('auth.signup.emailPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('auth.signup.password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pe-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder={t('auth.signup.passwordPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('auth.signup.confirmPassword')}
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Info */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.signup.professionalInfo')}</h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('auth.signup.specialties')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.entries(SPECIALTY_LABELS) as [DoctorSpecialty, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSpecialtyToggle(key)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          specialties.includes(key)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.signup.yearsExperience')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder={t('auth.signup.yearsExperiencePlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('auth.signup.licenseNumber')}
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder={t('auth.signup.licenseNumberPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('auth.signup.licenseState')}
                    </label>
                    <select
                      value={licenseState}
                      onChange={(e) => setLicenseState(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    >
                      <option value="">{t('auth.signup.selectState')}</option>
                      {US_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Documents & Bio */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.signup.documentsProfile')}</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* License Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('auth.signup.licensePhoto')}
                    </label>
                    <input
                      ref={licenseInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'license')}
                      className="hidden"
                    />
                    {licensePreview ? (
                      <div className="relative">
                        <img
                          src={licensePreview}
                          alt="License preview"
                          className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLicenseFile(null);
                            setLicensePreview(null);
                          }}
                          className="absolute top-2 end-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => licenseInputRef.current?.click()}
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
                      >
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">{t('auth.signup.uploadLicense')}</span>
                        <span className="text-sm text-gray-400">{t('auth.signup.licenseHint')}</span>
                      </button>
                    )}
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('auth.signup.profilePhoto')}
                    </label>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'photo')}
                      className="hidden"
                    />
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Profile preview"
                          className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                          }}
                          className="absolute top-2 end-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
                      >
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">{t('auth.signup.uploadPhoto')}</span>
                        <span className="text-sm text-gray-400">{t('auth.signup.photoHint')}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.signup.shortBio', { count: bio.length })}
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={250}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                    placeholder={t('auth.signup.bioPlaceholder')}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 text-gray-600 font-semibold hover:text-gray-800 transition"
                >
                  {t('common.back')}
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                  {t('common.continue')}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      {uploadProgress > 0 && uploadProgress < 100
                        ? t('auth.signup.uploadingProgress', { progress: uploadProgress })
                        : t('auth.signup.creatingAccount')}
                    </>
                  ) : (
                    t('auth.signup.button')
                  )}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('auth.signup.alreadyHaveAccount')}{' '}
              <Link to="/doctor/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                {t('auth.signup.signIn')}
              </Link>
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-3xl font-bold text-white mb-1">$20-$36</div>
            <div className="text-blue-100">{t('auth.signup.perConsultation')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-3xl font-bold text-white mb-1">{t('auth.signup.flexible')}</div>
            <div className="text-blue-100">{t('auth.signup.setYourHours')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-3xl font-bold text-white mb-1">{t('auth.signup.weekly')}</div>
            <div className="text-blue-100">{t('auth.signup.automaticPayouts')}</div>
          </div>
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

export default DoctorSignup;
