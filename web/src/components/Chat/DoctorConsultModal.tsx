import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../config/stripe';
import { paymentService } from '../../services/paymentService';

interface DoctorConsultModalProps {
  onClose: () => void;
}

type ModalStep = 'info' | 'select-type' | 'payment' | 'success';
type ConsultationType = 'text' | 'voice' | 'video';

const DoctorConsultModal: React.FC<DoctorConsultModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<ModalStep>('info');
  const [consultationType, setConsultationType] = useState<ConsultationType>('text');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProceedToPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create payment intent (doctorId is 'general' for now - can be expanded later)
      const result = await paymentService.createConsultationPayment('general', consultationType);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-calm-600 to-primary-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {step === 'success' ? 'Payment Successful' : 'Speak to a Clinician'}
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
          {step === 'info' && (
            <InfoStep onContinue={() => setStep('select-type')} />
          )}

          {step === 'select-type' && (
            <SelectTypeStep
              consultationType={consultationType}
              setConsultationType={setConsultationType}
              onBack={() => setStep('info')}
              onContinue={handleProceedToPayment}
              isLoading={isLoading}
              error={error}
            />
          )}

          {step === 'payment' && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentStep
                onBack={() => setStep('select-type')}
                onSuccess={handlePaymentSuccess}
                consultationType={consultationType}
              />
            </Elements>
          )}

          {step === 'success' && (
            <SuccessStep onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

// Step 1: Information Screen
const InfoStep: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
  return (
    <div className="space-y-6">
      {/* Main pricing */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          15-minute clinician consultation — $25
        </h3>
        <p className="text-gray-600">Insurance not required.</p>
      </div>

      {/* Trust bullets */}
      <div className="bg-calm-50 border border-calm-200 rounded-lg p-5">
        <ul className="space-y-3">
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-3 text-calm-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">Licensed U.S.-based clinicians</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-3 text-calm-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">Focused on guidance, triage, and next steps</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-3 text-calm-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">No surprise fees</span>
          </li>
        </ul>
      </div>

      {/* Safety clause */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          If your clinician believes more time is medically helpful, they may offer an extension before continuing.
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={onContinue}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center"
      >
        Continue
        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

// Step 2: Select Consultation Type
interface SelectTypeStepProps {
  consultationType: ConsultationType;
  setConsultationType: (type: ConsultationType) => void;
  onBack: () => void;
  onContinue: () => void;
  isLoading: boolean;
  error: string | null;
}

const SelectTypeStep: React.FC<SelectTypeStepProps> = ({
  consultationType,
  setConsultationType,
  onBack,
  onContinue,
  isLoading,
  error,
}) => {
  const options: { type: ConsultationType; label: string; icon: JSX.Element; description: string }[] = [
    {
      type: 'text',
      label: 'Text Chat',
      description: 'Message back and forth with your clinician',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      type: 'voice',
      label: 'Voice Call',
      description: 'Speak with your clinician by phone',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      type: 'video',
      label: 'Video Call',
      description: 'Face-to-face video consultation',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How would you like to connect?
        </h3>

        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.type}
              onClick={() => setConsultationType(option.type)}
              className={`w-full p-4 rounded-lg border-2 transition text-left flex items-start ${
                consultationType === option.type
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`p-2 rounded-lg mr-4 ${
                consultationType === option.type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {option.icon}
              </div>
              <div>
                <div className={`font-semibold ${
                  consultationType === option.type ? 'text-primary-700' : 'text-gray-900'
                }`}>
                  {option.label}
                </div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
              {consultationType === option.type && (
                <svg className="w-5 h-5 ml-auto text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
        <span className="text-gray-700">15-min {consultationType} consultation</span>
        <span className="font-bold text-gray-900">$25</span>
      </div>

      {/* CTA Button */}
      <button
        onClick={onContinue}
        disabled={isLoading}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Preparing payment...
          </>
        ) : (
          <>
            Proceed to Payment
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
};

// Step 3: Payment Form
interface PaymentStepProps {
  onBack: () => void;
  onSuccess: () => void;
  consultationType: ConsultationType;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ onBack, onSuccess, consultationType }) => {
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
      // Payment succeeded
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={isProcessing}
        className="text-primary-600 hover:text-primary-700 disabled:text-gray-400 flex items-center text-sm font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Summary */}
      <div className="bg-calm-50 border border-calm-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">15-min {consultationType} consultation</p>
            <p className="text-sm text-gray-600">with licensed clinician</p>
          </div>
          <span className="text-xl font-bold text-gray-900">$25</span>
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
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pay $25
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
const SuccessStep: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="text-center space-y-6 py-4">
      {/* Success Icon */}
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Payment successful!</h3>
        <p className="text-gray-600">
          Your consultation session is ready. A clinician will connect with you shortly.
        </p>
      </div>

      {/* What's next */}
      <div className="bg-calm-50 border border-calm-200 rounded-lg p-4 text-left">
        <h4 className="font-semibold text-gray-900 mb-2">What happens next:</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="w-5 h-5 bg-calm-600 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">1</span>
            <span>You'll receive a notification when your clinician is ready</span>
          </li>
          <li className="flex items-start">
            <span className="w-5 h-5 bg-calm-600 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">2</span>
            <span>Your 15-minute session will begin</span>
          </li>
          <li className="flex items-start">
            <span className="w-5 h-5 bg-calm-600 text-white rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0">3</span>
            <span>Get personalized guidance and next steps</span>
          </li>
        </ul>
      </div>

      <button
        onClick={onClose}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition"
      >
        Done
      </button>
    </div>
  );
};

export default DoctorConsultModal;
