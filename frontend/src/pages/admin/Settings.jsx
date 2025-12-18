import React, { useState, useEffect, useRef } from "react";
import { Tab } from "@headlessui/react";
import TransactionFeeSettings from "./components/TransactionFeeSettings";
import CountryAccessSettings from "./components/CountryAccessSettings";
import GeneralSettings from "./components/GeneralSettings";
import RoleManagement from "./components/RoleManagement";
import TransactionSerdipay from "./components/TransactionSerdipay";
import { useTheme } from "../../contexts/ThemeContext";
import {
  CurrencyDollarIcon,
  Cog6ToothIcon,
  CurrencyEuroIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Style pour masquer la barre de défilement
const style = document.createElement("style");
style.textContent = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(style);

const Settings = () => {
  const { isDarkMode } = useTheme();
  const [isEmailNotificationEnabled, setIsEmailNotificationEnabled] =
    useState(true);
  const [password, setPassword] = useState("");
  const tabListRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fonction pour vérifier si les flèches doivent être affichées (desktop uniquement)
  const checkForArrows = () => {
    if (tabListRef.current && !isMobile) {
      const { scrollWidth, clientWidth, scrollLeft } = tabListRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth);
    }
  };

  // Vérifier au chargement et au redimensionnement
  useEffect(() => {
    if (!isMobile) {
      checkForArrows();
      window.addEventListener("resize", checkForArrows);
      return () => window.removeEventListener("resize", checkForArrows);
    }
  }, [isMobile]);

  // Fonctions pour faire défiler (desktop uniquement)
  const scrollLeft = () => {
    if (tabListRef.current && !isMobile) {
      tabListRef.current.scrollBy({ left: -200, behavior: "smooth" });
      setTimeout(checkForArrows, 300);
    }
  };

  const scrollRight = () => {
    if (tabListRef.current && !isMobile) {
      tabListRef.current.scrollBy({ left: 200, behavior: "smooth" });
      setTimeout(checkForArrows, 300);
    }
  };

  // Fonctions de navigation pour mobile (pagination)
  const goToPreviousTab = () => {
    if (currentTabIndex > 0) {
      setCurrentTabIndex(currentTabIndex - 1);
    }
  };

  const goToNextTab = () => {
    if (currentTabIndex < tabs.length - 1) {
      setCurrentTabIndex(currentTabIndex + 1);
    }
  };

  const goToTab = (index) => {
    setCurrentTabIndex(index);
  };

  // Configuration des onglets avec leurs icônes, titres et descriptions
  const tabs = [
    { 
      name: "Frais De Transaction", 
      icon: CurrencyDollarIcon,
      description: "Gérez les frais de transaction",
      color: "blue"
    },
    { 
      name: "Paramètres Généraux", 
      icon: Cog6ToothIcon,
      description: "Configurez les paramètres système",
      color: "purple"
    },
    { 
      name: "Pays Autorisés", 
      icon: GlobeAltIcon,
      description: "Définissez les accès géographiques",
      color: "green"
    },
    { 
      name: "Rôles & Permissions", 
      icon: UserGroupIcon,
      description: "Gérez les droits d'accès",
      color: "orange"
    },
    { 
      name: "Transactions Serdipay", 
      icon: CreditCardIcon,
      description: "Configurez les transactions",
      color: "indigo"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header avec dégradé */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-900 shadow-xl border-b border-gray-200 dark:border-gray-700">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-5"></div>
        <div className="relative px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
              <div className="relative w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Cog6ToothIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                Paramètres du système
                <SparklesIcon className="h-6 w-6 text-yellow-500 animate-pulse" />
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Configurez et personnalisez votre plateforme selon vos besoins
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <Tab.Group>
          {/* Navigation par onglets */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-10 blur-xl"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2">
              {/* Version Desktop - Défilement horizontal */}
              {!isMobile && (
                <div className="relative flex items-center">
                  {showLeftArrow && (
                    <button
                      onClick={scrollLeft}
                      className="absolute left-2 z-10 flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 shadow-lg text-gray-600 dark:text-gray-300 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900 dark:hover:to-blue-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 transform hover:scale-105"
                      aria-label="Défiler vers la gauche"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                  )}

                  <div className="relative flex-1 overflow-hidden mx-12">
                    <Tab.List
                      ref={tabListRef}
                      className="flex space-x-2 overflow-x-auto scrollbar-hide py-2"
                      onScroll={checkForArrows}
                    >
                      {tabs.map((tab, index) => (
                        <Tab
                          key={index}
                          className={({ selected }) =>
                            classNames(
                              "flex-shrink-0 group relative py-3 px-6 text-sm font-semibold rounded-xl transition-all duration-300 ease-out flex items-center justify-center min-w-[180px]",
                              "focus:outline-none focus:ring-2 focus:ring-offset-2",
                              selected
                                ? `text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-md border-b-4 border-${tab.color}-500`
                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:shadow-md focus:ring-gray-500"
                            )
                          }
                        >
                          {({ selected }) => (
                            <div className="flex items-center gap-3">
                              <div className={`relative ${classNames(
                                selected ? `text-${tab.color}-500` : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                              )}`}>
                                <tab.icon className="h-5 w-5" />
                              </div>
                              <div className="text-left">
                                <div className="font-medium">{tab.name}</div>
                                <div className={`text-xs ${classNames(
                                  selected ? `text-${tab.color}-600 dark:text-${tab.color}-400` : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                                )}`}>
                                  {tab.description}
                                </div>
                              </div>
                            </div>
                          )}
                        </Tab>
                      ))}
                    </Tab.List>
                  </div>

                  {showRightArrow && (
                    <button
                      onClick={scrollRight}
                      className="absolute right-2 z-10 flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 shadow-lg text-gray-600 dark:text-gray-300 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900 dark:hover:to-blue-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 transform hover:scale-105"
                      aria-label="Défiler vers la droite"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Version Mobile - Pagination */}
              {isMobile && (
                <div className="space-y-3">
                  {/* Indicateurs de page */}
                  <div className="flex justify-center items-center gap-2 py-2">
                    {tabs.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToTab(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentTabIndex
                            ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-500'
                            : 'w-2 bg-gray-300 dark:bg-gray-600'
                        }`}
                        aria-label={`Aller à l'onglet ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Onglet actuel */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <button
                      onClick={goToPreviousTab}
                      disabled={currentTabIndex === 0}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        currentTabIndex === 0
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      aria-label="Onglet précédent"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>

                    <div className="flex-1 mx-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className={`relative text-${tabs[currentTabIndex].color}-500`}>
                          {React.createElement(tabs[currentTabIndex].icon, { className: "h-5 w-5" })}
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {tabs[currentTabIndex].name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {tabs[currentTabIndex].description}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={goToNextTab}
                      disabled={currentTabIndex === tabs.length - 1}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        currentTabIndex === tabs.length - 1
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      aria-label="Onglet suivant"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contenu des onglets */}
          <Tab.Panels className="space-y-6">
            {isMobile ? (
              // Version Mobile - Afficher uniquement l'onglet actuel
              <Tab.Panel className="animate-fade-in">
                {currentTabIndex === 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 border-t-4 border-blue-500 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                          <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Frais de Transaction</h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Configurez les frais pour chaque moyen de paiement</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <TransactionFeeSettings />
                    </div>
                  </div>
                )}
                {currentTabIndex === 1 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 border-t-4 border-purple-500 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                          <Cog6ToothIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paramètres Généraux</h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Configurez les paramètres généraux du système</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <GeneralSettings />
                    </div>
                  </div>
                )}
                {currentTabIndex === 2 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 border-t-4 border-green-500 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                          <GlobeAltIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pays Autorisés</h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Gérez les accès géographiques à votre plateforme</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <CountryAccessSettings />
                    </div>
                  </div>
                )}
                {currentTabIndex === 3 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 border-t-4 border-orange-500 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                          <UserGroupIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rôles & Permissions</h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Définissez les droits d'accès pour chaque rôle</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <RoleManagement />
                    </div>
                  </div>
                )}
                {currentTabIndex === 4 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 border-t-4 border-indigo-500 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center">
                          <CreditCardIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transactions Serdipay</h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Configurez les transactions Serdipay</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <TransactionSerdipay />
                    </div>
                  </div>
                )}
              </Tab.Panel>
            ) : (
              // Version Desktop - Afficher tous les onglets normalement
              <>
                <Tab.Panel className="animate-fade-in">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 border-t-4 border-blue-500 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                          <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Frais de Transaction</h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Configurez les frais pour chaque moyen de paiement</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <TransactionFeeSettings />
                    </div>
                  </div>
                </Tab.Panel>

                <Tab.Panel className="animate-fade-in">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 border-t-4 border-purple-500 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                          <Cog6ToothIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paramètres Généraux</h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Configurez les paramètres généraux du système</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <GeneralSettings />
                    </div>
                  </div>
                </Tab.Panel>

                <Tab.Panel className="animate-fade-in">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 border-t-4 border-green-500 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                          <GlobeAltIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pays Autorisés</h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Gérez les accès géographiques à votre plateforme</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <CountryAccessSettings />
                    </div>
                  </div>
                </Tab.Panel>

                <Tab.Panel className="animate-fade-in">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 border-t-4 border-orange-500 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                          <UserGroupIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rôles & Permissions</h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Définissez les droits d'accès pour chaque rôle</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <RoleManagement />
                    </div>
                  </div>
                </Tab.Panel>

                <Tab.Panel className="animate-fade-in">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6">
                      <TransactionSerdipay />
                    </div>
                  </div>
                </Tab.Panel>
              </>
            )}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default Settings;
