import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLLECTIONS } from '@shared/firebase.config';
import type { DoctorProfile, DoctorStatus, DoctorSpecialty } from '@shared/types';
import { SPECIALTY_LABELS } from '@shared/types';

type TabType = 'pending' | 'approved' | 'rejected';

const DoctorApproval: React.FC = () => {
  const { t } = useTranslation('admin');
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const doctorsQuery = query(
        collection(db, COLLECTIONS.DOCTORS),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(doctorsQuery);
      const docs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        approvedAt: doc.data().approvedAt?.toDate?.() || undefined,
        rejectedAt: doc.data().rejectedAt?.toDate?.() || undefined,
      })) as DoctorProfile[];
      setDoctors(docs);
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
      setError(t('doctorApproval.messages.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(d => d.status === activeTab);

  const handleApprove = async (doctor: DoctorProfile) => {
    setActionLoading(true);
    setError('');
    try {
      await updateDoc(doc(db, COLLECTIONS.DOCTORS, doctor.id), {
        status: 'approved' as DoctorStatus,
        approvedAt: new Date(),
        updatedAt: new Date(),
      });
      setSuccess(t('doctorApproval.messages.approved', { name: doctor.name }));
      await fetchDoctors();
      setSelectedDoctor(null);
    } catch (err: any) {
      console.error('Error approving doctor:', err);
      setError(t('doctorApproval.messages.failedToApprove'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (doctor: DoctorProfile) => {
    if (!rejectionReason.trim()) {
      setError(t('doctorApproval.messages.provideReason'));
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await updateDoc(doc(db, COLLECTIONS.DOCTORS, doctor.id), {
        status: 'rejected' as DoctorStatus,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason.trim(),
        updatedAt: new Date(),
      });
      setSuccess(t('doctorApproval.messages.rejected', { name: doctor.name }));
      setRejectionReason('');
      await fetchDoctors();
      setSelectedDoctor(null);
    } catch (err: any) {
      console.error('Error rejecting doctor:', err);
      setError(t('doctorApproval.messages.failedToReject'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (doctor: DoctorProfile) => {
    setActionLoading(true);
    setError('');
    try {
      await updateDoc(doc(db, COLLECTIONS.DOCTORS, doctor.id), {
        status: 'suspended' as DoctorStatus,
        updatedAt: new Date(),
      });
      setSuccess(t('doctorApproval.messages.suspended', { name: doctor.name }));
      await fetchDoctors();
      setSelectedDoctor(null);
    } catch (err: any) {
      console.error('Error suspending doctor:', err);
      setError(t('doctorApproval.messages.failedToSuspend'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('doctorApproval.title')}</h1>
        <p className="text-gray-600 mt-1">{t('doctorApproval.description')}</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-3xl font-bold text-amber-600">
            {doctors.filter(d => d.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-500">{t('doctorApproval.stats.pendingReview')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-3xl font-bold text-green-600">
            {doctors.filter(d => d.status === 'approved').length}
          </p>
          <p className="text-sm text-gray-500">{t('doctorApproval.stats.approvedDoctors')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-3xl font-bold text-red-600">
            {doctors.filter(d => d.status === 'rejected').length}
          </p>
          <p className="text-sm text-gray-500">{t('doctorApproval.stats.rejected')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {(['pending', 'approved', 'rejected'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 px-4 text-center border-b-2 font-medium transition ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t(`doctorApproval.tabs.${tab}`)}
                <span className={`ms-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {doctors.filter(d => d.status === tab).length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-500">{t('doctorApproval.loading')}</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p>{t('doctorApproval.noDoctors', { status: activeTab })}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('doctorApproval.table.doctor')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('doctorApproval.table.specialties')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('doctorApproval.table.license')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('doctorApproval.table.applied')}
                    </th>
                    <th className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('doctorApproval.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {doctor.photoUrl ? (
                            <img
                              src={doctor.photoUrl}
                              alt={doctor.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {doctor.name[0]}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{doctor.name}</p>
                            <p className="text-sm text-gray-500">{doctor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {doctor.specialties.slice(0, 2).map((s: DoctorSpecialty) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {SPECIALTY_LABELS[s] || s}
                            </span>
                          ))}
                          {doctor.specialties.length > 2 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                              +{doctor.specialties.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{doctor.licenseNumber}</p>
                        <p className="text-xs text-gray-500">{doctor.licenseState}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doctor.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-end">
                        <button
                          onClick={() => setSelectedDoctor(doctor)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          {t('doctorApproval.table.viewDetails')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Doctor Detail Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{t('doctorApproval.modal.title')}</h2>
              <button
                onClick={() => {
                  setSelectedDoctor(null);
                  setRejectionReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-start gap-4">
                {selectedDoctor.photoUrl ? (
                  <img
                    src={selectedDoctor.photoUrl}
                    alt={selectedDoctor.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {selectedDoctor.name[0]}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedDoctor.name}</h3>
                  <p className="text-gray-500">{selectedDoctor.email}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {t('doctorApproval.modal.yearsExperience', { years: selectedDoctor.yearsExperience })}
                  </p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('doctorApproval.modal.bio')}</h4>
                <p className="text-gray-600">{selectedDoctor.bio}</p>
              </div>

              {/* Specialties */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('doctorApproval.modal.specialties')}</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDoctor.specialties.map((s: DoctorSpecialty) => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      {SPECIALTY_LABELS[s] || s}
                    </span>
                  ))}
                </div>
              </div>

              {/* License */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('doctorApproval.modal.licenseNumber')}</h4>
                  <p className="text-gray-900">{selectedDoctor.licenseNumber}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('doctorApproval.modal.licenseState')}</h4>
                  <p className="text-gray-900">{selectedDoctor.licenseState}</p>
                </div>
              </div>

              {/* License Image */}
              {selectedDoctor.licenseUrl && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('doctorApproval.modal.licensePhoto')}</h4>
                  <a
                    href={selectedDoctor.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={selectedDoctor.licenseUrl}
                      alt="Medical License"
                      className="max-w-full h-48 object-contain rounded-lg border border-gray-200 hover:border-blue-300 transition"
                    />
                  </a>
                  <p className="text-xs text-gray-400 mt-1">{t('doctorApproval.modal.clickToView')}</p>
                </div>
              )}

              {/* Status-specific content */}
              {selectedDoctor.status === 'rejected' && selectedDoctor.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-800 mb-1">{t('doctorApproval.modal.rejectionReason')}</h4>
                  <p className="text-red-700">{selectedDoctor.rejectionReason}</p>
                </div>
              )}

              {/* Rejection reason input (for pending) */}
              {selectedDoctor.status === 'pending' && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {t('doctorApproval.modal.rejectionReasonInput')}
                  </h4>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={t('doctorApproval.modal.rejectionPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              {selectedDoctor.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedDoctor)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                  >
                    {actionLoading ? t('doctorApproval.actions.processing') : t('doctorApproval.actions.reject')}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedDoctor)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {actionLoading ? t('doctorApproval.actions.processing') : t('doctorApproval.actions.approve')}
                  </button>
                </>
              )}
              {selectedDoctor.status === 'approved' && (
                <button
                  onClick={() => handleSuspend(selectedDoctor)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                >
                  {actionLoading ? t('doctorApproval.actions.processing') : t('doctorApproval.actions.suspend')}
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedDoctor(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
              >
                {t('doctorApproval.actions.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorApproval;
