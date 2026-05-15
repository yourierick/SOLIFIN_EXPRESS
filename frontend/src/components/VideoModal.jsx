import React from "react";
import ReactDOM from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";

export default function VideoModal({ isOpen, onClose, videoUrl, zIndex = "z-50" }) {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={`fixed inset-0 ${zIndex} overflow-y-auto`}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className={`fixed inset-0 transition-opacity backdrop-blur-sm ${
            isDarkMode ? "bg-black/80" : "bg-gray-900/75"
          }`}
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        {/* Modal content */}
        <div
          className={`inline-block align-bottom rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-medium ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              Lecture vidéo
            </h3>
            <button
              onClick={onClose}
              className={`text-gray-400 hover:text-gray-500 ${
                isDarkMode ? "hover:text-gray-300" : ""
              }`}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Video content */}
          <div className="px-6 py-4">
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
