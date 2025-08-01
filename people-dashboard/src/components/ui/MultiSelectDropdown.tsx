/**
 * MultiSelectDropdown - Componente dropdown multi-selezione riutilizzabile
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface MultiSelectDropdownProps {
  title: string;
  selectedItems: string[];
  allItems: string[];
  onToggleItem: (item: string) => void;
  onToggleAll: () => void;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MultiSelectDropdown = ({ 
  title, 
  selectedItems, 
  allItems, 
  onToggleItem, 
  onToggleAll, 
  isOpen, 
  setIsOpen 
}: MultiSelectDropdownProps) => {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">
            {selectedItems.length === 0 
              ? `Tutti i ${title.toLowerCase()}` 
              : selectedItems.length === allItems.length
              ? `Tutti i ${title.toLowerCase()} (${selectedItems.length})`
              : `${selectedItems.length} ${title.toLowerCase()} selezionati`
            }
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <>
          {/* Backdrop per chiudere il dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown content */}
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {/* Seleziona tutti */}
            <div className="px-3 py-2 border-b border-gray-200">
              <label className="flex items-center cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                <input
                  type="checkbox"
                  checked={selectedItems.length === allItems.length}
                  onChange={onToggleAll}
                  className="mr-2 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-900">
                  Seleziona tutti ({allItems.length})
                </span>
              </label>
            </div>

            {/* Lista items */}
            <div className="py-1">
              {allItems.map((item) => (
                <label
                  key={item}
                  className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item)}
                    onChange={() => onToggleItem(item)}
                    className="mr-2 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 truncate" title={item}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
