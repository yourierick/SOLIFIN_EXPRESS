import React from 'react';

const FilterControls = ({ type, typeLabel, filters, updateFilter, getItemsForType }) => {
  const currentType = type === "publications" ? "publication" :
                       type === "jobOffers" ? "jobOffer" :
                       type === "businessOpportunities" ? "businessOpportunity" :
                       type === "digitalProducts" ? "digitalProduct" : "socialEvent";
  const itemsCount = getItemsForType(currentType).length;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Champ de recherche */}
      <div className="w-200">
        <label htmlFor={`search-filter-${type}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Recherche
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            id={`search-filter-${type}`}
            name={`search-filter-${type}`}
            defaultValue={filters[type].search}
            placeholder="Rechercher..."
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                updateFilter(type, "search", e.target.value);
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById(`search-filter-${type}`);
              updateFilter(type, "search", input.value);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 px-3 py-2 transition-colors duration-200"
            title="Lancer la recherche"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filtre par statut */}
      <div className="min-w-[140px]">
        <label htmlFor={`statut-filter-${type}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Statut
        </label>
        <select
          id={`statut-filter-${type}`}
          name={`statut-filter-${type}`}
          value={filters[type].statut}
          onChange={(e) => updateFilter(type, "statut", e.target.value)}
          size="small"
          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 w-full"
        >
          <option value="all">Tous</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvé</option>
          <option value="rejected">Rejeté</option>
        </select>
      </div>

      {/* Filtre par état (si applicable) */}
      <div className="min-w-[140px]">
        <label htmlFor={`etat-filter-${type}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          État
        </label>
        <select
          id={`etat-filter-${type}`}
          name={`etat-filter-${type}`}
          value={filters[type].etat}
          onChange={(e) => updateFilter(type, "etat", e.target.value)}
          size="small"
          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 w-full"
        >
          <option value="all">Tous</option>
          <option value="available">Disponible</option>
          <option value="unavailable">Terminé</option>
        </select>
      </div>

      <div className="ml-auto text-sm text-gray-500 dark:text-gray-400 flex items-center whitespace-nowrap">
        {itemsCount} {typeLabel}{itemsCount > 1 ? "s" : ""} affiché{itemsCount > 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default FilterControls;
