import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const ReportModal = ({ 
  isOpen, 
  onClose, 
  reportedUserId,
  reportedPubType,
  reportedPubRef,
  isDarkMode = false 
}) => {
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [reportReasons, setReportReasons] = useState({});
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  useEffect(() => {
    if (isOpen && reportedUserId && reportedPubRef && reportedPubType) {
      fetchReportReasons();
      checkIfAlreadyReported();
    }
  }, [isOpen, reportedUserId, reportedPubRef, reportedPubType]);

  const fetchReportReasons = async () => {
    try {
      const response = await axios.get('/api/reports/reasons');
      setReportReasons(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des raisons de signalement:', error);
    }
  };

  const checkIfAlreadyReported = async () => {
    try {
      const response = await axios.get(`/api/reports/${reportedUserId}/${reportedPubRef}/check-reported`);
      setHasReported(response.data.reported);
    } catch (error) {
      console.error('Erreur lors de la vérification du signalement:', error);
    }
  };

  const submitReport = async () => {
    if (!reportReason || !reportedUserId || !reportedPubRef || !reportedPubType) return;

    setIsReportSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('reported_user_id', reportedUserId);
      formData.append('pub_ref', reportedPubRef);
      formData.append('pub_type', reportedPubType);
      formData.append('reason', reportReason);
      if (reportDescription) {
        formData.append('description', reportDescription);
      }
      if (evidenceFile) {
        formData.append('evidence', evidenceFile);
      }

      await axios.post(`/api/reports/${reportedUserId}/report`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setHasReported(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Erreur lors du signalement:', error);
    } finally {
      setIsReportSubmitting(false);
    }
  };

  const resetForm = () => {
    setReportReason('');
    setReportDescription('');
    setEvidenceFile(null);
    setHasReported(false);
  };

  const handleClose = () => {
    if (!isReportSubmitting) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-black bg-opacity-55 backdrop-blur-sm"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <div className="sm:flex sm:items-start">
              <div
                className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                  isDarkMode ? "bg-red-900" : "bg-red-100"
                } sm:mx-0 sm:h-10 sm:w-10`}
              >
                <ExclamationCircleIcon
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-red-200" : "text-red-600"
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3
                  className={`text-lg leading-6 font-medium ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                  id="modal-headline"
                >
                  {hasReported ? "Signalement déjà envoyé" : "Signaler cet utilisateur"}
                </h3>
                <div className="mt-2">
                  {hasReported ? (
                    <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                      Vous avez signalé cet utilisateur. Notre équipe procède à l'examen de votre signalement.
                    </p>
                  ) : (
                    <>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        Pour quelle raison signalez-vous cet utilisateur ?
                      </p>
                      <div className="mt-4">
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        >
                          <option value="">Sélectionnez une raison</option>
                          {Object.entries(reportReasons).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-4">
                        <textarea
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          rows={3}
                          placeholder="Description optionnelle..."
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                          }`}
                        />
                      </div>
                      <div className="mt-4">
                        <label className={`block text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}>
                          Pièce jointe (preuve) - optionnel
                        </label>
                        <input
                          type="file"
                          onChange={(e) => setEvidenceFile(e.target.files[0])}
                          accept="image/*"
                          className={`mt-1 block w-full text-sm ${
                            isDarkMode
                              ? "text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                              : "text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                          }`}
                        />
                        {evidenceFile && (
                          <p className={`mt-2 text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                            Fichier sélectionné: {evidenceFile.name}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div
            className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${
              isDarkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            {!hasReported && (
              <button
                type="button"
                onClick={submitReport}
                disabled={isReportSubmitting || !reportReason}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${
                  isReportSubmitting || !reportReason
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isReportSubmitting ? "Envoi en cours..." : "Signaler"}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className={`mt-3 w-full inline-flex justify-center rounded-md border ${
                isDarkMode
                  ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              } shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm`}
            >
              {hasReported ? "Fermer" : "Annuler"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReportModal;
