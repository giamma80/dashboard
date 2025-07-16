import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Controlla se l'app è già installata
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkIfInstalled();

    // Listener per l'evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listener per quando l'app viene installata
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Forza la visualizzazione del pulsante per test (rimuovi in produzione)
    setTimeout(() => {
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstallable(true);
        console.log('PWA: Pulsante installazione forzato per test');
      }
    }, 500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      // Fallback: mostra istruzioni per l'installazione manuale
      alert(`Per installare l'app:
      
Chrome/Edge: Clicca sui tre puntini → "Installa People Dashboard"
Safari: File → "Aggiungi al Dock"
Mobile: Menu → "Aggiungi alla schermata Home"`);
      return;
    }

    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('PWA installata con successo');
      } else {
        console.log('Installazione PWA rifiutata');
      }
    } catch (error) {
      console.error('Errore durante l\'installazione:', error);
    }

    setInstallPrompt(null);
    setIsInstallable(false);
  };

  return {
    isInstallable,
    isInstalled,
    installApp
  };
};
