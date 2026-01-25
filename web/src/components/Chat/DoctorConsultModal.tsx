import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../config/stripe';
import { paymentService } from '../../services/paymentService';
import { doctorService } from '../../services/doctorService';
import type { AvailableDoctor } from '@shared/types';
import { SPECIALTY_LABELS } from '@shared/types';
import type { DoctorSpecialty } from '@shared/types';

interface DoctorConsultModalProps {
  onClose: () => void;
  conversationId?: string;
  chiefComplaint?: string;
}

type ModalStep = 'select-tier' | 'select-doctor' | 'payment' | 'success';
type ConsultationTier = 'standard' | 'priority';

const DoctorConsultModal: React.FC<DoctorConsultModalProps> = ({ onClose, conversationId, chiefComplaint }) => {
  const [step, setStep] = useState<ModalStep>('select-tier');
  const [tier, setTier] = useState<ConsultationTier>('standard');
  const [selectedDoctor, setSelectedDoctor] = useState<AvailableDoctor | null>(null);
  const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [_sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available doctors when selecting priority
  useEffect(() => {
    if (step === 'select-doctor') {
      fetchAvailableDoctors();
    }
  }, [step]);

  const fetchAvailableDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const doctors = await doctorService.getAvailableDoctors();
      setAvailableDoctors(doctors);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      setError('Failed to load available doctors. Please try again.');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleTierSelect = (selectedTier: ConsultationTier) => {
    setTier(selectedTier);
    setError(null);

    if (selectedTier === 'standard') {
      // Go directly to payment for standard tier
      handleProceedToPayment(selectedTier, null);
    } else {
      // Show doctor selection for priority tier
      setStep('select-doctor');
    }
  };

  const handleDoctorSelect = (doctor: AvailableDoctor) => {
    setSelectedDoctor(doctor);
    handleProceedToPayment('priority', doctor.id);
  };

  const handleProceedToPayment = async (selectedTier: ConsultationTier, doctorId: string | null) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await paymentService.createConsultationPayment(
        doctorId || 'general',
        'text', // Default to text for now
        selectedTier,
        conversationId,
        chiefComplaint
      );
      setClientSecret(result.clientSecret);
      setSessionId(result.sessionId);
      setStep('payment');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setStep('success');
  };

  const getAmount = () => tier === 'standard' ? 25 : 45;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {step === 'success' ? 'Request Submitted!' : 'Speak to a Doctor'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {step === 'select-tier' && (
            <TierSelectionStep
              onSelectTier={handleTierSelect}
              isLoading={isLoading}
              error={error}
            />
          )}

          {step === 'select-doctor' && (
            <DoctorSelectionStep
              doctors={availableDoctors}
              loading={loadingDoctors}
              onSelectDoctor={handleDoctorSelect}
              onBack={() => setStep('select-tier')}
              isLoading={isLoading}
              error={error}
            />
          )}

          {step === 'payment' && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentStep
                onBack={() => setStep(tier === 'priority' ? 'select-doctor' : 'select-tier')}
                onSuccess={handlePaymentSuccess}
                amount={getAmount()}
                tier={tier}
                selectedDoctor={selectedDoctor}
              />
            </Elements>
          )}

          {step === 'success' && (
            <SuccessStep
              onClose={onClose}
              tier={tier}
              selectedDoctor={selectedDoctor}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Step 1: Tier Selection
interface TierSelectionStepProps {
  onSelectTier: (tier: ConsultationTier) => void;
  isLoading: boolean;
  error: string | null;
}

const TierSelectionStep: React.FC<TierSelectionStepProps> = ({ onSelectTier, isLoading, error }) => {
  return (
    <div className="space-y-6">
      {/* Standard Option */}
      <div className="border-2 border-blue-200 rounded-xl p-5 hover:border-blue-400 transition cursor-pointer"
           onClick={() => !isLoading && onSelectTier('standard')}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Next Available Doctor</h3>
              <p className="text-sm text-gray-500">Average wait: 5-10 min</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-blue-600">$25</span>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          Get help from any board-certified physician available now. First doctor to accept your case will connect with you.
        </p>
        <button
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Continue with $25'}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-400 text-sm">OR</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Priority Option */}
      <div className="border-2 border-amber-200 bg-amber-50/50 rounded-xl p-5 hover:border-amber-400 transition cursor-pointer"
           onClick={() => !isLoading && onSelectTier('priority')}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Choose Your Doctor</h3>
              <p className="text-sm text-amber-600 font-medium">Priority Request</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-amber-600">$45</span>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          Select a specific doctor from our roster. They'll receive a priority alert and have 5 minutes to accept. Full refund if unavailable.
        </p>
        <button
          disabled={isLoading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          Choose a Doctor - $45
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Trust Points */}
      <div className="bg-gray-50 rounded-lg p-4">
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Board-certified U.S. physicians
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            HIPAA-compliant & confidential
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            No insurance required
          </li>
        </ul>
      </div>
    </div>
  );
};

// Step 2: Doctor Selection (Priority only)
interface DoctorSelectionStepProps {
  doctors: AvailableDoctor[];
  loading: boolean;
  onSelectDoctor: (doctor: AvailableDoctor) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

const DoctorSelectionStep: React.FC<DoctorSelectionStepProps> = ({
  doctors,
  loading,
  onSelectDoctor,
  onBack,
  isLoading,
  error,
}) => {
  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to options
      </button>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Choose Your Doctor</h3>
        <p className="text-sm text-gray-500">Select a doctor to send a priority request ($45)</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Doctors List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">No doctors available</h4>
          <p className="text-sm text-gray-500 mb-4">All doctors are currently busy. Try the standard queue instead.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Use Standard Queue ($25)
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {doctors.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => onSelectDoctor(doctor)}
              disabled={isLoading || !doctor.isAvailable}
              className={`w-full border-2 rounded-xl p-4 text-left transition ${
                doctor.isAvailable
                  ? 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                  : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                {doctor.photoUrl ? (
                  <img
                    src={doctor.photoUrl}
                    alt={doctor.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-xl font-semibold text-blue-600">
                    {doctor.name?.[0]?.toUpperCase() || 'D'}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">Dr. {doctor.name}</h4>
                    {doctor.isAvailable && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Available
                      </span>
                    )}
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {doctor.specialties.slice(0, 2).map((spec: DoctorSpecialty) => (
                      <span key={spec} className="text-xs text-gray-500">
                        {SPECIALTY_LABELS[spec] || spec}
                      </span>
                    ))}
                  </div>

                  {/* Rating & Experience */}
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    {doctor.rating > 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {doctor.rating.toFixed(1)}
                        {doctor.totalRatings > 0 && (
                          <span className="text-gray-400">({doctor.totalRatings})</span>
                        )}
                      </span>
                    )}
                    <span className="text-gray-500">{doctor.yearsExperience} years exp</span>
                  </div>
                </div>

                {/* Request button indicator */}
                <div className="flex-shrink-0">
                  <span className="px-3 py-1.5 bg-amber-500 text-white text-sm font-semibold rounded-lg">
                    $45
                  </span>
                </div>
              </div>

              {/* Bio */}
              {doctor.bio && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">{doctor.bio}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Step 3: Payment
interface PaymentStepProps {
  onBack: () => void;
  onSuccess: () => void;
  amount: number;
  tier: ConsultationTier;
  selectedDoctor: AvailableDoctor | null;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ onBack, onSuccess, amount, tier, selectedDoctor }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={isProcessing}
        className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 flex items-center text-sm font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Summary */}
      <div className={`rounded-lg p-4 ${tier === 'priority' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">
              {tier === 'priority' ? 'Priority Consultation' : 'Standard Consultation'}
            </p>
            {selectedDoctor && (
              <p className="text-sm text-gray-600">with Dr. {selectedDoctor.name}</p>
            )}
            {tier === 'standard' && (
              <p className="text-sm text-gray-600">Next available doctor</p>
            )}
          </div>
          <span className={`text-2xl font-bold ${tier === 'priority' ? 'text-amber-600' : 'text-blue-600'}`}>
            ${amount}
          </span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <PaymentElement />
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Pay Button */}
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className={`w-full font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center ${
            tier === 'priority'
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:bg-gray-400`}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pay ${amount}
            </>
          )}
        </button>

        <p className="text-xs text-center text-gray-500">
          Payments are securely processed by Stripe
        </p>
      </form>
    </div>
  );
};

// Step 4: Success
interface SuccessStepProps {
  onClose: () => void;
  tier: ConsultationTier;
  selectedDoctor: AvailableDoctor | null;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ onClose, tier, selectedDoctor }) => {
  return (
    <div className="text-center space-y-6 py-4">
      {/* Success Icon */}
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
        tier === 'priority' ? 'bg-amber-100' : 'bg-green-100'
      }`}>
        <svg className={`w-8 h-8 ${tier === 'priority' ? 'text-amber-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {tier === 'priority' ? 'Priority Request Sent!' : 'Request Submitted!'}
        </h3>
        <p className="text-gray-600">
          {tier === 'priority' && selectedDoctor
            ? `Dr. ${selectedDoctor.name} has been notified and has 5 minutes to accept your request.`
            : 'Your case has been added to the queue. A doctor will accept your case shortly.'}
        </p>
      </div>

      {/* What's next */}
      <div className={`rounded-lg p-4 text-left ${tier === 'priority' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
        <h4 className="font-semibold text-gray-900 mb-2">What happens next:</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          {tier === 'priority' ? (
            <>
              <li className="flex items-start">
                <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">1</span>
                <span>Dr. {selectedDoctor?.name} receives a priority alert</span>
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">2</span>
                <span>They have 5 minutes to accept</span>
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">3</span>
                <span>If unavailable, you'll get a full refund</span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">1</span>
                <span>Your case is now in the doctor queue</span>
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">2</span>
                <span>Average wait time: 5-10 minutes</span>
              </li>
              <li className="flex items-start">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">3</span>
                <span>You'll be notified when a doctor accepts</span>
              </li>
            </>
          )}
        </ul>
      </div>

      <button
        onClick={onClose}
        className={`w-full font-semibold py-3 px-6 rounded-lg transition ${
          tier === 'priority'
            ? 'bg-amber-500 hover:bg-amber-600 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        Done
      </button>
    </div>
  );
};

export default DoctorConsultModal;
