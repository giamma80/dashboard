import React, { useState, useEffect } from 'react';
import { DownloadFile, getDownloadFiles, downloadFile } from '../api/downloads';

interface DownloadSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

const DownloadSection: React.FC<DownloadSectionProps> = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'exe' | 'zip'>('all');

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const downloadFiles = await getDownloadFiles();
      setFiles(downloadFiles);
    } catch (error) {
      console.error('Errore nel caricamento dei file:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(file => 
    filter === 'all' || file.type === filter
  );

  const handleDownload = (file: DownloadFile) => {
    downloadFile(file.url, file.name);
  };

  const getFileIcon = (type: string) => {
    if (type === 'exe') {
      return '🖥️';
    }
    return '📦';
  };

  const getArchLabel = (arch: string | undefined) => {
    switch (arch) {
      case 'x64': return '64-bit';
      case 'x32':
      case 'ia32': return '32-bit';
      default: return 'Universal';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            📥 Download App Desktop
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            💡 Informazioni
          </h3>
          <p className="text-blue-700 text-sm">
            Scarica l'app desktop di People Dashboard per utilizzarla offline su Windows.
            Scegli tra l'installer (.exe) per un'installazione completa o l'archivio (.zip) per un uso portatile.
          </p>
        </div>

        {/* Filtri */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tutti i file
          </button>
          <button
            onClick={() => setFilter('exe')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'exe'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🖥️ Installer (.exe)
          </button>
          <button
            onClick={() => setFilter('zip')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'zip'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📦 Archivi (.zip)
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento file...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nessun file trovato per il filtro selezionato.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredFiles.map((file, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {file.name}
                      </h4>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        {file.version && (
                          <span>📋 v{file.version}</span>
                        )}
                        {file.architecture && (
                          <span>⚙️ {getArchLabel(file.architecture)}</span>
                        )}
                        <span className="capitalize">
                          📁 {file.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(file)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    ⬇️ Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">
            📋 Requisiti di sistema
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Windows 10/11 (64-bit o 32-bit)</li>
            <li>• Almeno 100 MB di spazio libero</li>
            <li>• File .exe: Installer completo con aggiornamenti automatici</li>
            <li>• File .zip: Versione portatile, non richiede installazione</li>
          </ul>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadSection;
