import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type PWAInstallPlatform = 'chromium' | 'ios' | 'desktop_chromium' | 'unsupported';

interface PWAContextType {
  isStandalone: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isDesktop: boolean;
  platform: PWAInstallPlatform;
  isOnline: boolean;
  hasUpdate: boolean;
  showInstallGuide: boolean;
  setShowInstallGuide: (show: boolean) => void;
  triggerInstall: () => Promise<'accepted' | 'dismissed' | 'unsupported' | 'ios'>;
  updateApp: () => void;
  offlineMessage: string;
}

const PWAContext = createContext<PWAContextType | null>(null);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);

  // Initialize PWA detection
  useEffect(() => {
    // 1. Detect standalone display mode
    const checkStandalone = () => {
      const matchMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const navStandalone = (window.navigator as any).standalone === true;
      const standalone = matchMediaStandalone || navStandalone;
      setIsStandalone(standalone);
      if (standalone) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    // 2. Detect iOS / iPadOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // 3. Detect desktop screen / pointer
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024 && (!('ontouchstart' in window) || navigator.maxTouchPoints === 0));
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    // 4. Online / Offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 5. Chromium BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 6. Service Worker update check
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setHasUpdate(true);
        }
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setHasUpdate(true);
            }
          });
        });
      });

      let refreshing = false;
      const onControllerChange = () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      };
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        window.removeEventListener('resize', checkDesktop);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('resize', checkDesktop);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Determine platform
  const platform: PWAInstallPlatform = deferredPrompt
    ? isDesktop
      ? 'desktop_chromium'
      : 'chromium'
    : isIOS && !isStandalone
    ? 'ios'
    : 'unsupported';

  // Trigger Install
  const triggerInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported' | 'ios'> => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return 'accepted';
      }
      return 'dismissed';
    }

    if (isIOS && !isStandalone) {
      setShowInstallGuide(true);
      return 'ios';
    }

    // Unsupported browser fallback modal
    setShowInstallGuide(true);
    return 'unsupported';
  }, [deferredPrompt, isIOS, isStandalone]);

  // Update App safely - explicit user action only
  const updateApp = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  const offlineMessage = 'حالت آفلاین — فقط مشاهده اطلاعات نمایشی ذخیره‌شده امکان‌پذیر است.';

  return (
    <PWAContext.Provider
      value={{
        isStandalone,
        isInstallable: !!deferredPrompt || (isIOS && !isStandalone),
        isInstalled,
        isIOS,
        isDesktop,
        platform,
        isOnline,
        hasUpdate,
        showInstallGuide,
        setShowInstallGuide,
        triggerInstall,
        updateApp,
        offlineMessage,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = (): PWAContextType => {
  const ctx = useContext(PWAContext);
  if (!ctx) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return ctx;
};
