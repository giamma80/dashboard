import { useState, useCallback } from 'react';
import type { FileUploadResult, FileUploadError, SupportedFileType } from '../components/FileUploader';

export interface ParsedFileData {
  content: string;
  fileName: string;
  fileSize: number;
  fileType: SupportedFileType;
  lastUpdate: string;
}

export interface FileParserError {
  type: 'parse' | 'validation' | 'format';
  message: string;
  details?: string[];
}

interface UseFileParserOptions {
  /**
   * Abilita salvataggio automatico nel localStorage
   */
  enableLocalStorage?: boolean;
  
  /**
   * Prefisso per le chiavi del localStorage
   */
  localStoragePrefix?: string;
  
  /**
   * Callback per validazione personalizzata del contenuto
   */
  customValidator?: (content: string) => { isValid: boolean; errors: string[] };
}

interface UseFileParserReturn {
  /**
   * Dati del file parsato
   */
  parsedData: ParsedFileData | null;
  
  /**
   * Stato di caricamento
   */
  isLoading: boolean;
  
  /**
   * Errore se presente
   */
  error: FileParserError | null;
  
  /**
   * Funzione per processare un file
   */
  parseFile: (fileResult: FileUploadResult) => Promise<void>;
  
  /**
   * Funzione per pulire i dati
   */
  clearData: () => void;
  
  /**
   * Funzione per caricare dati dal localStorage
   */
  loadFromStorage: () => boolean;
  
  /**
   * Indica se ci sono dati salvati nel localStorage
   */
  hasStoredData: boolean;
}

export const useFileParser = (options: UseFileParserOptions = {}): UseFileParserReturn => {
  const {
    enableLocalStorage = true,
    localStoragePrefix = 'file-parser',
    customValidator
  } = options;

  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FileParserError | null>(null);

  // Chiavi localStorage
  const getStorageKeys = () => ({
    content: `${localStoragePrefix}-content`,
    fileName: `${localStoragePrefix}-filename`,
    fileSize: `${localStoragePrefix}-filesize`,
    fileType: `${localStoragePrefix}-filetype`,
    lastUpdate: `${localStoragePrefix}-lastupdate`
  });

  // Verifica se ci sono dati nel localStorage
  const hasStoredData = useCallback((): boolean => {
    if (!enableLocalStorage) return false;
    
    const keys = getStorageKeys();
    return Boolean(localStorage.getItem(keys.content));
  }, [enableLocalStorage, localStoragePrefix]);

  // Carica dati dal localStorage
  const loadFromStorage = useCallback((): boolean => {
    if (!enableLocalStorage) return false;

    try {
      const keys = getStorageKeys();
      const content = localStorage.getItem(keys.content);
      const fileName = localStorage.getItem(keys.fileName);
      const fileSize = localStorage.getItem(keys.fileSize);
      const fileType = localStorage.getItem(keys.fileType);
      const lastUpdate = localStorage.getItem(keys.lastUpdate);

      if (content && fileName && fileSize && fileType && lastUpdate) {
        setParsedData({
          content,
          fileName,
          fileSize: parseInt(fileSize, 10),
          fileType: fileType as SupportedFileType,
          lastUpdate
        });
        setError(null);
        return true;
      }
    } catch (error) {
      console.warn('Errore nel caricamento dati dal localStorage:', error);
    }

    return false;
  }, [enableLocalStorage, localStoragePrefix]);

  // Salva dati nel localStorage
  const saveToStorage = useCallback((data: ParsedFileData) => {
    if (!enableLocalStorage) return;

    try {
      const keys = getStorageKeys();
      localStorage.setItem(keys.content, data.content);
      localStorage.setItem(keys.fileName, data.fileName);
      localStorage.setItem(keys.fileSize, data.fileSize.toString());
      localStorage.setItem(keys.fileType, data.fileType);
      localStorage.setItem(keys.lastUpdate, data.lastUpdate);
    } catch (error) {
      console.warn('Errore nel salvataggio dati nel localStorage:', error);
    }
  }, [enableLocalStorage, localStoragePrefix]);

  // Pulisce dati e localStorage
  const clearData = useCallback(() => {
    setParsedData(null);
    setError(null);

    if (enableLocalStorage) {
      try {
        const keys = getStorageKeys();
        Object.values(keys).forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.warn('Errore nella pulizia localStorage:', error);
      }
    }
  }, [enableLocalStorage, localStoragePrefix]);

  // Valida contenuto CSV
  const validateCSVContent = (content: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Verifica contenuto non vuoto
    if (!content || content.trim() === '') {
      errors.push('Il contenuto del file è vuoto');
      return { isValid: false, errors };
    }

    // Verifica righe
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      errors.push('Il file deve contenere almeno una riga di intestazione e una di dati');
      return { isValid: false, errors };
    }

    // Verifica header non vuoto
    const header = lines[0].trim();
    if (!header) {
      errors.push('La prima riga (intestazione) è vuota');
      return { isValid: false, errors };
    }

    // Verifica che ci sia almeno una riga dati non vuota
    const dataLines = lines.slice(1).filter(line => line.trim());
    if (dataLines.length === 0) {
      errors.push('Non ci sono righe di dati valide nel file');
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  };

  // Processa il file
  const parseFile = useCallback(async (fileResult: FileUploadResult): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validazione di base per tipo file
      if (fileResult.fileType === 'csv') {
        const validation = validateCSVContent(fileResult.content);
        
        if (!validation.isValid) {
          setError({
            type: 'validation',
            message: 'Il file non è valido',
            details: validation.errors
          });
          return;
        }
      }

      // Validazione personalizzata se fornita
      if (customValidator) {
        const customValidation = customValidator(fileResult.content);
        
        if (!customValidation.isValid) {
          setError({
            type: 'validation',
            message: 'Validazione personalizzata fallita',
            details: customValidation.errors
          });
          return;
        }
      }

      // Crea oggetto dati parsati
      const parsedFileData: ParsedFileData = {
        ...fileResult,
        lastUpdate: new Date().toLocaleString('it-IT')
      };

      // Salva dati
      setParsedData(parsedFileData);
      
      // Salva nel localStorage se abilitato
      if (enableLocalStorage) {
        saveToStorage(parsedFileData);
      }

    } catch (error) {
      setError({
        type: 'parse',
        message: `Errore nel parsing del file: ${error instanceof Error ? error.message : 'errore sconosciuto'}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [customValidator, enableLocalStorage, saveToStorage]);

  return {
    parsedData,
    isLoading,
    error,
    parseFile,
    clearData,
    loadFromStorage,
    hasStoredData: hasStoredData()
  };
};
