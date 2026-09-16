import { Component } from '../Component.js'
import { ClearConfirmModal } from '../clear-confirm-modal/ClearConfirmModal.js'

/**
 * Componente que gestiona la barra de herramientas de dibujo y acciones globales del lienzo.
 */
export class Toolbar extends Component {
  constructor(container, props = {}) {
    super(container, props)
    this.canvasManager = props.canvasManager
    this.sidebar = props.sidebar || null
    this.onCanvasToolActivated = props.onCanvasToolActivated || null
    this.toolButtons = {}
  }

  render() {
    this.toolButtons = {
      pan: document.getElementById('tool-pan'),
      select: document.getElementById('tool-select'),
      brush: document.getElementById('tool-brush'),
      rect: document.getElementById('tool-rect'),
      circle: document.getElementById('tool-circle'),
      arrow: document.getElementById('tool-arrow'),
      polyline: document.getElementById('tool-polyline'),
      polygon: document.getElementById('tool-polygon'),
      text: document.getElementById('tool-text'),
      pin: document.getElementById('tool-pin'),
    }

    this.deleteBtn = document.getElementById('tool-delete')
    this.clearBtn = document.getElementById('tool-clear')
    this.undoBtn = document.getElementById('action-undo')
    this.redoBtn = document.getElementById('action-redo')
    this.zoomInBtn = document.getElementById('action-zoom-in')
    this.zoomOutBtn = document.getElementById('action-zoom-out')
    this.zoomHomeBtn = document.getElementById('action-zoom-home')
    this.moreBtn = document.getElementById('tool-more')
    this.overflowMenu = document.getElementById('toolbar-overflow-menu')
    this.overflowTools = ['rect', 'circle', 'arrow', 'polyline', 'polygon', 'pin']

    const modalEl = document.getElementById('clear-confirm-modal')
    if (modalEl) {
      this.clearConfirmModal = new ClearConfirmModal(modalEl, () => {
        this.canvasManager.clearCanvas()
      })
    }

    if (window.lucide) {
      window.lucide.createIcons()
    }

    this.updateActiveToolUI(this.canvasManager.activeTool)
  }

  bindEvents() {
    // Registrar manejadores para selección de cada herramienta
    Object.entries(this.toolButtons).forEach(([toolName, btn]) => {
      if (btn) {
        this.addEvent(btn, 'click', () => {
          if (this.sidebar && this.sidebar.isOpen && typeof this.sidebar.close === 'function') {
            this.sidebar.close()
          }
          this.closeOverflowMenu()
          if (typeof this.onCanvasToolActivated === 'function') {
            this.onCanvasToolActivated(toolName)
          }
          this.canvasManager.setTool(toolName)
          this.updateActiveToolUI(toolName)
        })
      }
    })

    // Manejar menú de 3 puntos (overflow)
    if (this.moreBtn && this.overflowMenu) {
      this.addEvent(this.moreBtn, 'click', (e) => {
        e.stopPropagation()
        this.toggleOverflowMenu()
      })

      this.addEvent(document, 'click', (e) => {
        if (
          this.isOverflowOpen() &&
          !this.overflowMenu.contains(e.target) &&
          !this.moreBtn.contains(e.target)
        ) {
          this.closeOverflowMenu()
        }
      })

      this.addEvent(window, 'keydown', (e) => {
        if (e.key === 'Escape' && this.isOverflowOpen()) {
          this.closeOverflowMenu()
          this.moreBtn.focus()
        }
      })
    }

    const stickersBtn = document.getElementById('tool-stickers')
    if (stickersBtn) {
      this.addEvent(stickersBtn, 'click', () => {
        this.closeOverflowMenu()
      })
    }

    if (this.deleteBtn) {
      this.addEvent(this.deleteBtn, 'click', () => {
        this.canvasManager.deleteSelected()
      })
    }

    if (this.clearBtn) {
      this.addEvent(this.clearBtn, 'click', () => {
        if (this.clearConfirmModal) {
          this.clearConfirmModal.open()
        } else {
          this.canvasManager.clearCanvas()
        }
      })
    }

    if (this.undoBtn) {
      this.addEvent(this.undoBtn, 'click', () => {
        this.canvasManager.undo()
      })
    }

    if (this.redoBtn) {
      this.addEvent(this.redoBtn, 'click', () => {
        this.canvasManager.redo()
      })
    }

    if (this.zoomInBtn) {
      this.addEvent(this.zoomInBtn, 'click', () => {
        this.canvasManager.zoomIn()
      })
    }

    if (this.zoomOutBtn) {
      this.addEvent(this.zoomOutBtn, 'click', () => {
        this.canvasManager.zoomOut()
      })
    }

    if (this.zoomHomeBtn) {
      this.addEvent(this.zoomHomeBtn, 'click', () => {
        this.canvasManager.zoomHome()
      })
    }

    // Escuchar eventos de cambio de herramientas disparados internamente en CanvasManager
    this.canvasManager.onToolChange = (activeTool) => {
      this.updateActiveToolUI(activeTool)
    }
  }

  isOverflowOpen() {
    return !!this.overflowMenu?.classList.contains('is-open')
  }

  openOverflowMenu() {
    if (this.overflowMenu) {
      this.overflowMenu.classList.remove('hidden')
      this.overflowMenu.classList.add('is-open')
    }
    if (this.moreBtn) {
      this.moreBtn.setAttribute('aria-expanded', 'true')
      this.moreBtn.classList.add('is-active')
    }
  }

  closeOverflowMenu() {
    if (this.overflowMenu) {
      this.overflowMenu.classList.remove('is-open')
    }
    if (this.moreBtn) {
      this.moreBtn.setAttribute('aria-expanded', 'false')
      if (!this.overflowTools?.includes(this.canvasManager?.activeTool)) {
        this.moreBtn.classList.remove('is-active')
      }
    }
  }

  toggleOverflowMenu() {
    if (this.isOverflowOpen()) {
      this.closeOverflowMenu()
    } else {
      this.openOverflowMenu()
    }
  }

  updateActiveToolUI(activeTool) {
    Object.values(this.toolButtons).forEach((btn) => {
      if (btn) btn.classList.remove('is-active')
    })
    if (this.toolButtons[activeTool]) {
      this.toolButtons[activeTool].classList.add('is-active')
    }
    if (this.moreBtn) {
      const isOverflowActive = this.overflowTools?.includes(activeTool)
      if (isOverflowActive) {
        this.moreBtn.classList.add('is-tool-active')
      } else {
        this.moreBtn.classList.remove('is-tool-active')
        if (!this.isOverflowOpen()) {
          this.moreBtn.classList.remove('is-active')
        }
      }
    }
  }
}
