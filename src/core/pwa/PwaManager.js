/**
 * Gestor de ciclo de vida de la Progressive Web App (PWA).
 * Administra el evento beforeinstallprompt, la detección de estado de instalación
 * y la interacción con los navegadores móviles.
 */
export class PwaManager {
  constructor() {
    this.deferredPrompt = null
    this.isInstallable = false
    this.isInstalled = this.checkIfInstalled()
    this.callbacks = new Set()

    this._onBeforeInstallPrompt = this._onBeforeInstallPrompt.bind(this)
    this._onAppInstalled = this._onAppInstalled.bind(this)
  }

  /**
   * Verifica si la aplicación ya se encuentra ejecutándose en modo independiente (PWA instalada).
   * @returns {boolean}
   */
  checkIfInstalled() {
    if (typeof window === 'undefined') return false
    const isStandaloneMedia =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches
    const isIosStandalone = window.navigator?.standalone === true
    const isAndroidApp =
      typeof document !== 'undefined' &&
      typeof document.referrer === 'string' &&
      document.referrer.includes('android-app://')

    return Boolean(isStandaloneMedia || isIosStandalone || isAndroidApp)
  }

  /**
   * Inicializa la escucha de eventos de instalación del navegador.
   */
  init() {
    if (typeof window === 'undefined') return

    window.addEventListener('beforeinstallprompt', this._onBeforeInstallPrompt)
    window.addEventListener('appinstalled', this._onAppInstalled)
  }

  /**
   * @private
   * @param {Event} e
   */
  _onBeforeInstallPrompt(e) {
    // Prevenir el banner automático intrusivo para controlarlo desde la aplicación
    e.preventDefault()
    this.deferredPrompt = e
    this.isInstallable = true
    this._notify({ type: 'installable', installable: true })
  }

  /**
   * @private
   */
  _onAppInstalled() {
    this.deferredPrompt = null
    this.isInstallable = false
    this.isInstalled = true
    this._notify({ type: 'installed', installed: true })
  }

  /**
   * Dispara el diálogo nativo de instalación en el celular.
   * @returns {Promise<{ outcome: 'accepted'|'dismissed'|'unavailable' }>}
   */
  async promptInstall() {
    if (!this.deferredPrompt) {
      return { outcome: 'unavailable' }
    }

    try {
      this.deferredPrompt.prompt()
      const choiceResult = await this.deferredPrompt.userChoice
      this.deferredPrompt = null
      this.isInstallable = false
      this._notify({ type: 'choice', outcome: choiceResult.outcome })
      return choiceResult
    } catch (err) {
      console.error('PwaManager: Error solicitando instalación:', err)
      return { outcome: 'unavailable' }
    }
  }

  /**
   * Suscribe un callback para cambios de estado de instalabilidad.
   * @param {Function} cb
   * @returns {Function} desuscriptor
   */
  subscribe(cb) {
    if (typeof cb === 'function') {
      this.callbacks.add(cb)
      // Notificar estado actual al suscribirse
      cb({
        isInstallable: this.isInstallable,
        isInstalled: this.isInstalled,
      })
    }
    return () => {
      this.callbacks.delete(cb)
    }
  }

  /**
   * @private
   * @param {Object} data
   */
  _notify(data) {
    this.callbacks.forEach((cb) => {
      try {
        cb({
          isInstallable: this.isInstallable,
          isInstalled: this.isInstalled,
          ...data,
        })
      } catch (err) {
        console.error('PwaManager: Error en listener de suscriptor:', err)
      }
    })
  }

  /**
   * Libera listeners
   */
  dispose() {
    if (typeof window === 'undefined') return
    window.removeEventListener('beforeinstallprompt', this._onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', this._onAppInstalled)
    this.callbacks.clear()
    this.deferredPrompt = null
  }
}

// Instancia singleton para la aplicación
export const pwaManager = new PwaManager()
