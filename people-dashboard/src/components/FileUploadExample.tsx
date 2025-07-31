/**
 * ESEMPIO D'USO - Componenti Atomici per File Upload
 * 
 * Questo file mostra come utilizzare i nuovi componenti atomici
 * FileUploader e useFileParser per gestire l'upload di file.
 */

import React from 'react';
import FileUploader from './FileUploader';
import { useFileParser } from '../hooks/useFileParser';
import type { FileUploadResult, FileUploadError } from './FileUploader';

const ExampleUsage: React.FC = () => {
  // Hook per parsing file con localStorage automatico
  const {
    parsedData,
    isLoading,
    error,
    parseFile,
    clearData,
    loadFromStorage,
    hasStoredData
  } = useFileParser({
    enableLocalStorage: true,
    localStoragePrefix: 'my-app',
    customValidator: (content: string) => {
      // Validazione personalizzata
      const lines = content.split('\n');
      const errors: string[] = [];
      
      if (lines.length < 2) {
        errors.push('Il file deve avere almeno 2 righe');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  });

  // Handlers per FileUploader
  const handleFileLoad = async (result: FileUploadResult) => {
    console.log('File caricato:', result.fileName);
    await parseFile(result);
  };

  const handleFileError = (error: FileUploadError) => {
    console.error('Errore file upload:', error);
  };

  const handleLoadStart = () => {
    console.log('Inizio caricamento file');
  };

  // Carica dati salvati all'avvio
  React.useEffect(() => {
    if (hasStoredData && !parsedData) {
      loadFromStorage();
    }
  }, [hasStoredData, parsedData, loadFromStorage]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Esempio FileUploader Atomico</h1>
      
      {!parsedData ? (
        <>
          <h2 className="text-lg font-semibold mb-4">1. FileUploader Base (Solo CSV)</h2>
          <FileUploader
            supportedTypes={['csv']}
            maxSizeMB={5}
            onFileLoad={handleFileLoad}
            onError={handleFileError}
            onLoadStart={handleLoadStart}
            isLoading={isLoading}
            enableDragDrop={true}
            title="Carica il tuo file CSV"
            description="Trascina un file CSV qui o clicca per selezionare"
          />

          <h2 className="text-lg font-semibold mb-4 mt-8">2. FileUploader Multi-Formato</h2>
          <FileUploader
            supportedTypes={['csv', 'xlsx', 'xls']}
            maxSizeMB={10}
            onFileLoad={handleFileLoad}
            onError={handleFileError}
            onLoadStart={handleLoadStart}
            isLoading={isLoading}
            enableDragDrop={false}
            title="Carica Spreadsheet"
            description="Supporta CSV, Excel (.xlsx) e Excel Legacy (.xls)"
            buttonText="Seleziona Spreadsheet"
          />

          {hasStoredData && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                Ci sono dati salvati. 
                <button 
                  onClick={loadFromStorage}
                  className="ml-2 text-blue-600 underline"
                >
                  Carica dati salvati
                </button>
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800 mb-4">File Caricato con Successo!</h2>
          <div className="space-y-2 text-sm text-green-700">
            <p><strong>Nome:</strong> {parsedData.fileName}</p>
            <p><strong>Dimensione:</strong> {(parsedData.fileSize / 1024).toFixed(1)} KB</p>
            <p><strong>Tipo:</strong> {parsedData.fileType.toUpperCase()}</p>
            <p><strong>Ultimo aggiornamento:</strong> {parsedData.lastUpdate}</p>
            <p><strong>Righe:</strong> {parsedData.content.split('\n').length}</p>
          </div>
          
          <button
            onClick={clearData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Pulisci Dati
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold">Errore:</h3>
          <p className="text-red-700">{error.message}</p>
          {error.details && (
            <ul className="mt-2 text-sm text-red-600">
              {error.details.map((detail: string, index: number) => (
                <li key={index}>• {detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ExampleUsage;

/**
 * VANTAGGI DELL'APPROCCIO ATOMICO:
 * 
 * 1. ✅ Riusabilità: Componenti possono essere usati in più parti dell'app
 * 2. ✅ Manutenibilità: Logica centralizzata e più facile da modificare
 * 3. ✅ Testabilità: Ogni componente può essere testato indipendentemente
 * 4. ✅ Estensibilità: Facile aggiungere supporto per Excel, JSON, etc.
 * 5. ✅ Configurabilità: Molte opzioni per personalizzare comportamento
 * 6. ✅ Type Safety: TypeScript garantisce type safety completo
 * 7. ✅ Separation of Concerns: Upload, parsing e storage sono separati
 * 
 * PROSSIMI STEP PER EXCEL SUPPORT:
 * 
 * 1. Aggiungere libreria xlsx: npm install xlsx @types/xlsx
 * 2. Implementare parsing Excel in FileUploader
 * 3. Gestire multi-sheet Excel files
 * 4. Convertire Excel → CSV internamente
 * 5. Mantenere retrocompatibilità con CSV
 */
