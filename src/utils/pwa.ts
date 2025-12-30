/**
 * PWA Utilities
 * Progressive Web App tools
 */

export class PWA {
  private serviceWorker: ServiceWorkerRegistration | null = null;
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private isStandalone: boolean = false;
  private isOnline: boolean = navigator.onLine;
  private deferredPrompts: Map<string, () => void> = new Map();

  /**
   * Initialize PWA
   */
  async init(options: PWAOptions = {}): Promise<void> {
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Service Worker
    if ('serviceWorker' in navigator && options.registerServiceWorker !== false) {
      await this.registerServiceWorker(options.serviceWorkerPath);
    }
    
    // Install prompt
    window.addEventListener('beforeinstallprompt', this.handleInstallPrompt.bind(this));
    
    // Network status
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // App installed
    window.addEventListener('appinstalled', this.handleAppInstalled.bind(this));
    
    console.log('PWA initialized');
  }

  /**
   * Register Service Worker
   */
  async registerServiceWorker(swPath: string = '/sw.js'): Promise<ServiceWorkerRegistration> {
    try {
      this.serviceWorker = await navigator.serviceWorker.register(swPath);
      console.log('Service Worker registered:', this.serviceWorker);
      return this.serviceWorker;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Show install prompt
   */
  async promptInstall(): Promise<void> {
    if (!this.installPrompt) {
      throw new Error('No install prompt available');
    }

    this.installPrompt.prompt();
    
    const choice = await this.installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      console.log('User accepted PWA installation');
    } else {
      console.log('User declined PWA installation');
    }
    
    this.installPrompt = null;
  }

  /**
   * Check if app can be installed
   */
  canInstall(): boolean {
    return this.installPrompt !== null;
  }

  /**
   * Check if app is installed
   */
  isInstalled(): boolean {
    return this.isStandalone || localStorage.getItem('pwa_installed') === 'true';
  }

  /**
   * Check if online
   */
  checkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Show offline indicator
   */
  showOfflineIndicator(): void {
    const indicator = document.createElement('div');
    indicator.id = 'pwa-offline-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f44336;
      color: white;
      text-align: center;
      padding: 10px;
      z-index: 9999;
    `;
    indicator.textContent = 'You are offline';
    document.body.appendChild(indicator);
  }

  /**
   * Hide offline indicator
   */
  hideOfflineIndicator(): void {
    const indicator = document.getElementById('pwa-offline-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Cache data for offline use
   */
  async cacheData(key: string, data: any): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open('pwa-data');
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(key, response);
    } catch (error) {
      console.error('Cache failed:', error);
    }
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any> {
    if (!('caches' in window)) return null;

    try {
      const cache = await caches.open('pwa-data');
      const response = await cache.match(key);
      if (response) {
        return await response.json();
      }
    } catch (error) {
      console.error('Get cache failed:', error);
    }
    
    return null;
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
    } catch (error) {
      console.error('Clear cache failed:', error);
    }
  }

  /**
   * Add to homescreen
   */
  addToHomescreen(): void {
    if ('share' in navigator) {
      navigator.share({
        title: document.title,
        text: 'Check out this app!',
        url: window.location.href
      });
    } else {
      this.showAddToHomescreenInstructions();
    }
  }

  /**
   * Send notification
   */
  async sendNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, options);
      }
    }
  }

  /**
   * Defer action until online
   */
  deferUntilOnline(actionId: string, action: () => void): void {
    this.deferredPrompts.set(actionId, action);
    
    if (this.isOnline) {
      action();
    } else {
      console.log(`Action "${actionId}" deferred until online`);
    }
  }

  /**
   * Execute deferred actions
   */
  executeDeferredActions(): void {
    this.deferredPrompts.forEach(action => action());
    this.deferredPrompts.clear();
  }

  /**
   * Get PWA manifest
   */
  getManifest(): any {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      return JSON.parse(manifestLink.getAttribute('href') || '{}');
    }
    return {};
  }

  private handleInstallPrompt(event: BeforeInstallPromptEvent): void {
    event.preventDefault();
    this.installPrompt = event;
    console.log('PWA install prompt available');
  }

  private handleAppInstalled(): void {
    localStorage.setItem('pwa_installed', 'true');
    this.isStandalone = true;
    console.log('PWA installed');
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.hideOfflineIndicator();
    this.executeDeferredActions();
    console.log('Online');
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.showOfflineIndicator();
    console.log('Offline');
  }

  private showAddToHomescreenInstructions(): void {
    const instructions = document.createElement('div');
    instructions.id = 'pwa-instructions';
    instructions.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 300px;
    `;
    
    instructions.innerHTML = `
      <h3>Add to Homescreen</h3>
      <p>1. Tap the share button</p>
      <p>2. Scroll down and tap "Add to Home Screen"</p>
      <button id="pwa-instructions-close" style="margin-top: 10px; padding: 5px 10px;">Close</button>
    `;
    
    document.body.appendChild(instructions);
    
    document.getElementById('pwa-instructions-close')?.addEventListener('click', () => {
      instructions.remove();
    });
  }
}

export interface PWAOptions {
  registerServiceWorker?: boolean;
  serviceWorkerPath?: string;
  offlineSupport?: boolean;
}

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const pwa = new PWA();