import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export type SupportedFileType = 'csv' | 'xlsx' | 'xls';

export interface FileUploadResult {
  content: string;
  fileName: string;
  fileSize: number;
  fileType: SupportedFileType;
}

export interface FileUploadError {
  type: 'size' | 'format' | 'empty' | 'read';
  message: string;
}

interface FileUploaderProps {
  /**
   * Tipi di file supportati
   */
  supportedTypes?: SupportedFileType[];
  
  /**
   * Dimensione massima del file in MB
   */
  maxSizeMB?: number;
  
  /**
   * Callback chiamato quando il file è caricato con successo
   */
  onFileLoad: (result: FileUploadResult) => void;
  
  /**
   * Callback chiamato in caso di errore
   */
  onError: (error: FileUploadError) => void;
  
  /**
   * Callback chiamato all'inizio del caricamento
   */
  onLoadStart?: () => void;
  
  /**
   * Indica se il caricamento è in corso
   */
  isLoading?: boolean;
  
  /**
   * Abilitare drag & drop
   */
  enableDragDrop?: boolean;
  
  /**
   * Testo personalizzato per il pulsante
   */
  buttonText?: string;
  
  /**
   * Testo di descrizione
   */
  description?: string;
  
  /**
   * Titolo del componente
   */
  title?: string;
  
  /**
   * Classe CSS personalizzata
   */
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  supportedTypes = ['csv'],
  maxSizeMB = 10,
  onFileLoad,
  onError,
  onLoadStart,
  isLoading = false,
  enableDragDrop = true,
  buttonText = 'Seleziona file',
  description,
  title = 'Carica file',
  className = ''
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Converte file Excel in CSV con pulizia intelligente
  const convertExcelToCSV = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          
          // Usa il primo foglio di lavoro
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            reject(new Error('Il file Excel non contiene fogli di lavoro'));
            return;
          }
          
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Converte in JSON prima per una migliore pulizia
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, // Usa array di array invece di oggetti
            defval: '', // Valore default per celle vuote
            blankrows: false // Salta righe completamente vuote
          });
          
          if (!jsonData || jsonData.length === 0) {
            reject(new Error('Il foglio di lavoro Excel è vuoto'));
            return;
          }
          
          // Filtra righe che hanno almeno una cella non vuota
          const filteredData = jsonData.filter((row: any) => {
            if (!Array.isArray(row)) return false;
            return row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '');
          });
          
          if (filteredData.length === 0) {
            reject(new Error('Il foglio di lavoro Excel non contiene dati validi'));
            return;
          }
          
          // Converte in CSV manualmente per controllo migliore
          const csvLines = filteredData.map((row: any) => {
            return row.map((cell: any) => {
              if (cell === null || cell === undefined) return '';
              
              // Gestisce date Excel
              if (cell instanceof Date) {
                const day = String(cell.getDate()).padStart(2, '0');
                const month = String(cell.getMonth() + 1).padStart(2, '0');
                const year = String(cell.getFullYear()).slice(-2);
                return `${day}/${month}/${year}`;
              }
              
              // Gestisce numeri e stringhe
              const cellValue = cell.toString().trim();
              
              // Escape punto e virgola se presente nel valore
              if (cellValue.includes(';')) {
                return `"${cellValue.replace(/"/g, '""')}"`;
              }
              
              return cellValue;
            }).join(';');
          });
          
          const csv = csvLines.join('\n');
          
          console.log(`Excel convertito: ${filteredData.length} righe → CSV`);
          console.log('Prime 3 righe CSV:', csvLines.slice(0, 3));
          
          resolve(csv);
        } catch (error) {
          reject(new Error(`Errore nella conversione Excel: ${error instanceof Error ? error.message : 'errore sconosciuto'}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Errore nella lettura del file Excel'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  // Mappa estensioni a tipi
  const getFileTypeFromName = (fileName: string): SupportedFileType | null => {
    const extension = fileName.toLowerCase().split('.').pop();
    if (supportedTypes.includes(extension as SupportedFileType)) {
      return extension as SupportedFileType;
    }
    return null;
  };

  // Formatta tipi supportati per l'attributo accept
  const getAcceptAttribute = (): string => {
    const mimeTypes: Record<SupportedFileType, string> = {
      csv: '.csv,text/csv',
      xlsx: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: '.xls,application/vnd.ms-excel'
    };
    
    return supportedTypes.map(type => mimeTypes[type]).join(',');
  };

  // Valida file
  const validateFile = (file: File): FileUploadError | null => {
    // Verifica tipo
    const fileType = getFileTypeFromName(file.name);
    if (!fileType) {
      const typesString = supportedTypes.map(type => `.${type}`).join(', ');
      return {
        type: 'format',
        message: `Il file deve essere in uno dei formati supportati: ${typesString}`
      };
    }

    // Verifica dimensione
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return {
        type: 'size',
        message: `Il file è troppo grande. Dimensione massima: ${maxSizeMB}MB (attuale: ${fileSizeMB.toFixed(1)}MB)`
      };
    }

    return null;
  };

  // Processa file
  const processFile = async (file: File) => {
    onLoadStart?.();

    // Validazione
    const validationError = validateFile(file);
    if (validationError) {
      onError(validationError);
      return;
    }

    try {
      const fileType = getFileTypeFromName(file.name)!;
      
      if (fileType === 'csv') {
        // Gestione CSV esistente
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            
            if (!content || content.trim() === '') {
              onError({
                type: 'empty',
                message: 'Il file è vuoto'
              });
              return;
            }

            onFileLoad({
              content,
              fileName: file.name,
              fileSize: file.size,
              fileType
            });
          } catch (error) {
            onError({
              type: 'read',
              message: `Errore nella lettura del file: ${error instanceof Error ? error.message : 'errore sconosciuto'}`
            });
          }
        };

        reader.onerror = () => {
          onError({
            type: 'read',
            message: 'Errore nella lettura del file'
          });
        };

        reader.readAsText(file, 'UTF-8');
        
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        // Gestione Excel - converte in CSV
        try {
          const csvContent = await convertExcelToCSV(file);
          
          onFileLoad({
            content: csvContent,
            fileName: file.name,
            fileSize: file.size,
            fileType
          });
        } catch (error) {
          onError({
            type: 'read',
            message: error instanceof Error ? error.message : 'Errore nella conversione Excel'
          });
        }
      } else {
        // Formato non supportato
        onError({
          type: 'format',
          message: `Il formato ${fileType} non è supportato`
        });
      }
    } catch (error) {
      onError({
        type: 'read',
        message: `Errore nel processamento del file: ${error instanceof Error ? error.message : 'errore sconosciuto'}`
      });
    }
  };

  // Gestisce selezione file
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file);
    
    // Reset input per permettere di ricaricare lo stesso file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Gestisce drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (enableDragDrop && !isLoading) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (!enableDragDrop || isLoading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  // Click programmatico sull'input
  const handleClick = () => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const supportedTypesString = supportedTypes.map(type => `.${type.toUpperCase()}`).join(', ');
  const defaultDescription = `Carica un file ${supportedTypesString} per iniziare l'analisi`;

  return (
    <div className={`text-center py-12 ${className}`}>
      <div 
        className={`
          bg-white rounded-lg shadow-md p-8 max-w-md mx-auto transition-all duration-200
          ${enableDragDrop && !isLoading ? 'cursor-pointer hover:shadow-lg' : ''}
          ${isDragActive ? 'border-2 border-dashed border-blue-500 bg-blue-50' : 'border border-gray-200'}
          ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={enableDragDrop ? handleClick : undefined}
      >
        {/* Icona */}
        <div className="mb-4">
          {isLoading ? (
            <div className="w-16 h-16 mx-auto flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <FileText className={`w-16 h-16 mx-auto ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          )}
        </div>

        {/* Contenuto */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isLoading ? 'Caricamento in corso...' : title}
        </h3>
        
        <p className="text-gray-600 mb-6 text-sm">
          {description || defaultDescription}
        </p>

        {/* Pulsante upload */}
        {!enableDragDrop && (
          <label className={`
            inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors cursor-pointer
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
          `}>
            <Upload className="w-4 h-4 mr-2" />
            {isLoading ? 'Caricamento...' : buttonText}
            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptAttribute()}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        )}

        {/* Input nascosto per drag & drop */}
        {enableDragDrop && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptAttribute()}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
            
            {isDragActive ? (
              <p className="text-blue-600 font-medium">
                Rilascia il file qui
              </p>
            ) : (
              <p className="text-gray-500 text-sm">
                Trascina un file qui o <span className="text-blue-600 font-medium">clicca per selezionare</span>
              </p>
            )}
          </>
        )}

        {/* Info sui formati */}
        <div className="mt-4 text-xs text-gray-500">
          <p>Formati supportati: {supportedTypesString}</p>
          <p>Dimensione massima: {maxSizeMB}MB</p>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
