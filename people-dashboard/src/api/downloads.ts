// API per gestire i download dei file
export interface DownloadFile {
  name: string;
  url: string;
  size?: string;
  type: 'exe' | 'zip';
  architecture?: 'x64' | 'x32' | 'ia32';
  version?: string;
}

export async function getDownloadFiles(): Promise<DownloadFile[]> {
  try {
    // In una vera implementazione, questo andrebbe fatto server-side
    // Per ora simulo con una lista statica dei file disponibili
    const response = await fetch('/downloads/files.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('File JSON non trovato, carico lista statica');
  }

  // Fallback: lista statica dei file (aggiornare manualmente dopo ogni build)
  return [
    {
      name: 'People Dashboard Setup 1.0.0.exe',
      url: '/downloads/People Dashboard Setup 1.0.0.exe',
      type: 'exe',
      architecture: 'x64',
      version: '1.0.0'
    },
    {
      name: 'People-Dashboard-Setup.exe',
      url: '/downloads/People-Dashboard-Setup.exe',
      type: 'exe',
      architecture: 'x64',
      version: '1.0.0'
    },
    {
      name: 'People Dashboard-1.0.0-win.zip',
      url: '/downloads/People Dashboard-1.0.0-win.zip',
      type: 'zip',
      architecture: 'x64',
      version: '1.0.0'
    },
    {
      name: 'People-Dashboard-Windows-x64.zip',
      url: '/downloads/People-Dashboard-Windows-x64.zip',
      type: 'zip',
      architecture: 'x64',
      version: '1.0.0'
    },
    {
      name: 'People Dashboard-1.0.0-ia32-win.zip',
      url: '/downloads/People Dashboard-1.0.0-ia32-win.zip',
      type: 'zip',
      architecture: 'ia32',
      version: '1.0.0'
    },
    {
      name: 'People-Dashboard-Windows-x32.zip',
      url: '/downloads/People-Dashboard-Windows-x32.zip',
      type: 'zip',
      architecture: 'x32',
      version: '1.0.0'
    }
  ];
}

export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
