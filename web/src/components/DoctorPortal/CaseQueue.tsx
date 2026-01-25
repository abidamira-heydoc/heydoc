import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoctor } from '../../contexts/DoctorContext';
import type { ConsultationCase } from '@shared/types';

type TabType = 'standard' | 'priority';

const CaseQueue: React.FC = () => {
  const navigate = useNavigate();
  const {
    pendingCases,
    priorityCases,
    casesLoading,
    acceptCase,
    declineCase,
    refreshCases,
    error,
    clearError,
  } = useDoctor();

  const [activeTab, setActiveTab] = useState<TabType>('standard');
  const [selectedCase, setSelectedCase] = useState<ConsultationCase | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Auto-switch to priority tab if there are priority cases
  useEffect(() => {
    if (priorityCases.length > 0 && pendingCases.length === 0) {
      setActiveTab('priority');
    }
  }, [priorityCases.length, pendingCases.length]);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getTimeRemaining = (expiresAt: Date | undefined) => {
    if (!expiresAt) return null;
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    if (diffMs <= 0) return 'Expired';
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}:${diffSecs.toString().padStart(2, '0')}`;
  };

  const handleAcceptCase = async (caseItem: ConsultationCase) => {
    setActionLoading(caseItem.id);
    try {
      await acceptCase(caseItem.id);
      navigate(`/doctor/chat/${caseItem.id}`);
    } catch (err) {
      console.error('Failed to accept case:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineCase = async (caseItem: ConsultationCase) => {
    if (!confirm('Are you sure you want to decline this request? The patient will be refunded.')) {
      return;
    }
    setActionLoading(caseItem.id);
    try {
      await declineCase(caseItem.id);
      setSelectedCase(null);
    } catch (err) {
      console.error('Failed to decline case:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const currentCases = activeTab === 'standard' ? pendingCases : priorityCases;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case Queue</h1>
          <p className="text-gray-600 mt-1">Accept cases to start helping patients</p>
        </div>
        <button
          onClick={() => refreshCases()}
          disabled={casesLoading}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition flex items-center gap-2"
        >
          <svg className={`w-5 h-5 ${casesLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-700">{error}</p>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('standard')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'standard'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Standard Queue
            {pendingCases.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                {pendingCases.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('priority')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition flex items-center ${
              activeTab === 'priority'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Priority Requests
            {priorityCases.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs animate-pulse">
                {priorityCases.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Case Grid */}
      {casesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : currentCases.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeTab === 'standard' ? 'No cases in queue' : 'No priority requests'}
          </h3>
          <p className="text-gray-500">
            {activeTab === 'standard'
              ? 'New cases will appear here when patients request help.'
              : 'Priority requests from patients who choose you specifically will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentCases.map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              caseItem={caseItem}
              isPriority={activeTab === 'priority'}
              onAccept={() => handleAcceptCase(caseItem)}
              onDecline={() => handleDeclineCase(caseItem)}
              onViewDetails={() => setSelectedCase(caseItem)}
              isLoading={actionLoading === caseItem.id}
              formatCurrency={formatCurrency}
              formatTimeAgo={formatTimeAgo}
              getTimeRemaining={getTimeRemaining}
            />
          ))}
        </div>
      )}

      {/* Case Details Modal */}
      {selectedCase && (
        <CaseDetailsModal
          caseItem={selectedCase}
          isPriority={selectedCase.tier === 'priority'}
          onClose={() => setSelectedCase(null)}
          onAccept={() => handleAcceptCase(selectedCase)}
          onDecline={() => handleDeclineCase(selectedCase)}
          isLoading={actionLoading === selectedCase.id}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

// Case Card Component
interface CaseCardProps {
  caseItem: ConsultationCase;
  isPriority: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onViewDetails: () => void;
  isLoading: boolean;
  formatCurrency: (cents: number) => string;
  formatTimeAgo: (date: Date) => string;
  getTimeRemaining: (date: Date | undefined) => string | null;
}

const CaseCard: React.FC<CaseCardProps> = ({
  caseItem,
  isPriority,
  onAccept,
  onDecline,
  onViewDetails,
  isLoading,
  formatCurrency,
  formatTimeAgo,
  getTimeRemaining,
}) => {
  const timeRemaining = isPriority ? getTimeRemaining(caseItem.priorityExpiresAt) : null;

  return (
    <div
      className={`bg-white rounded-xl border-2 p-5 transition hover:shadow-lg ${
        isPriority ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200'
      }`}
    >
      {/* Priority Badge */}
      {isPriority && (
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            PRIORITY REQUEST
          </span>
          {timeRemaining && (
            <span className={`text-xs font-mono ${timeRemaining === 'Expired' ? 'text-red-600' : 'text-amber-600'}`}>
              {timeRemaining}
            </span>
          )}
        </div>
      )}

      {/* Patient Info */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
          isPriority ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-600'
        }`}>
          {caseItem.patientName?.[0]?.toUpperCase() || 'P'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {caseItem.patientName}, {caseItem.patientAge}
            {caseItem.patientSex === 'male' ? 'M' : caseItem.patientSex === 'female' ? 'F' : ''}
          </h3>
          <p className="text-sm text-gray-500">{formatTimeAgo(caseItem.createdAt)}</p>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${isPriority ? 'text-amber-600' : 'text-green-600'}`}>
            {formatCurrency(caseItem.doctorPayout)}
          </span>
          {isPriority && (
            <p className="text-xs text-amber-600">+$16 bonus</p>
          )}
        </div>
      </div>

      {/* Chief Complaint */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">Chief Complaint</p>
        <p className="text-gray-900 font-medium line-clamp-2">{caseItem.chiefComplaint}</p>
      </div>

      {/* Symptoms Preview */}
      {caseItem.symptoms && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Symptoms</p>
          <p className="text-gray-700 text-sm line-clamp-2">{caseItem.symptoms}</p>
        </div>
      )}

      {/* Image Indicator */}
      {caseItem.imageUrls && caseItem.imageUrls.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm text-blue-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {caseItem.imageUrls.length} image{caseItem.imageUrls.length > 1 ? 's' : ''} attached
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          disabled={isLoading}
          className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
            isPriority
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:opacity-50`}
        >
          {isLoading ? (
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Accept
            </>
          )}
        </button>
        {isPriority ? (
          <button
            onClick={onDecline}
            disabled={isLoading}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Decline
          </button>
        ) : (
          <button
            onClick={onViewDetails}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Details
          </button>
        )}
      </div>
    </div>
  );
};

// Case Details Modal
interface CaseDetailsModalProps {
  caseItem: ConsultationCase;
  isPriority: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  isLoading: boolean;
  formatCurrency: (cents: number) => string;
}

const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({
  caseItem,
  isPriority,
  onClose,
  onAccept,
  onDecline,
  isLoading,
  formatCurrency,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${
          isPriority ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
        }`}>
          <div>
            <h2 className="text-xl font-semibold">Case Details</h2>
            {isPriority && (
              <p className="text-sm opacity-90">Priority Request</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Patient Info */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold ${
              isPriority ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'
            }`}>
              {caseItem.patientName?.[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{caseItem.patientName}</h3>
              <p className="text-gray-600">
                {caseItem.patientAge} years old, {caseItem.patientSex}
              </p>
            </div>
          </div>

          {/* Payout */}
          <div className={`rounded-lg p-4 ${isPriority ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
            <p className="text-sm text-gray-600 mb-1">Your Payout</p>
            <p className={`text-2xl font-bold ${isPriority ? 'text-amber-600' : 'text-green-600'}`}>
              {formatCurrency(caseItem.doctorPayout)}
            </p>
            {isPriority && (
              <p className="text-sm text-amber-600 mt-1">Includes $16 priority bonus</p>
            )}
          </div>

          {/* Chief Complaint */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Chief Complaint</h4>
            <p className="text-gray-900 bg-gray-50 rounded-lg p-3">{caseItem.chiefComplaint}</p>
          </div>

          {/* Symptoms */}
          {caseItem.symptoms && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Symptoms</h4>
              <p className="text-gray-900 bg-gray-50 rounded-lg p-3">{caseItem.symptoms}</p>
            </div>
          )}

          {/* Images */}
          {caseItem.imageUrls && caseItem.imageUrls.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Attached Images</h4>
              <div className="grid grid-cols-2 gap-2">
                {caseItem.imageUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          {isPriority && (
            <button
              onClick={onDecline}
              disabled={isLoading}
              className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition disabled:opacity-50"
            >
              Decline & Refund
            </button>
          )}
          <button
            onClick={onAccept}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              isPriority
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                Accept Case
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseQueue;
