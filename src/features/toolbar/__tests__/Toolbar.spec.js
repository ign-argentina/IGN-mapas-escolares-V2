import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Toolbar } from '../Toolbar.js'

describe('Toolbar with responsive overflow menu', () => {
  let container
  let mockCanvasManager
  let mockSidebar
  let toolbar
  let mockListeners = {}

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <div class="nbi-geometry-actions hidden" id="geometry-actions">
        <span class="nbi-geometry-actions__badge" id="geometry-points-count">0 puntos</span>
        <button id="geometry-btn-undo" class="nbi-btn" disabled>Paso atrás</button>
        <button id="geometry-btn-finish" class="nbi-btn" disabled>Finalizar</button>
        <button id="geometry-btn-cancel" class="nbi-btn">Cancelar</button>
      </div>
      <div class="nbi-toolbar" id="toolbar-drawing">
        <div class="nbi-toolbar__group" data-tour="tools-navigation">
          <button class="nbi-btn" id="tool-pan"></button>
          <button class="nbi-btn" id="tool-select"></button>
        </div>
        <button class="nbi-btn" id="tool-brush"></button>
        <div class="nbi-toolbar__overflow-menu" id="toolbar-overflow-menu">
          <div class="nbi-toolbar__group" data-tour="tools-shapes">
            <button class="nbi-btn" id="tool-rect"></button>
            <button class="nbi-btn" id="tool-circle"></button>
            <button class="nbi-btn" id="tool-arrow"></button>
            <button class="nbi-btn" id="tool-polyline"></button>
            <button class="nbi-btn" id="tool-polygon"></button>
            <button class="nbi-btn" id="tool-pin"></button>
          </div>
        </div>
        <div class="nbi-toolbar__group" data-tour="tools-annotations">
          <button class="nbi-btn" id="tool-text"></button>
        </div>
        <button class="nbi-btn" id="tool-stickers"></button>
        <button class="nbi-btn" id="tool-more" aria-expanded="false"></button>
        <button class="nbi-btn" id="tool-delete"></button>
        <button id="tool-clear"></button>
        <button id="action-undo"></button>
        <button id="action-redo"></button>
        <button id="action-zoom-in"></button>
        <button id="action-zoom-out"></button>
        <button id="action-zoom-home"></button>
      </div>
    `
    document.body.appendChild(container)

    mockListeners = {}
    mockCanvasManager = {
      activeTool: 'pan',
      setTool: vi.fn((tool) => {
        mockCanvasManager.activeTool = tool
        if (mockCanvasManager.onToolChange) {
          mockCanvasManager.onToolChange(tool)
        }
      }),
      deleteSelected: vi.fn(),
      clearCanvas: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      zoomHome: vi.fn(),
      adapter: {
        on: vi.fn((eventName, cb) => {
          mockListeners[eventName] = cb
          return () => {
            delete mockListeners[eventName]
          }
        }),
      },
      toolService: {
        activeTool: {
          undoLastPoint: vi.fn(),
          finishDrawing: vi.fn(),
          cancelDrawing: vi.fn(),
        },
      },
    }

    mockSidebar = {
      isOpen: false,
      close: vi.fn(),
    }

    toolbar = new Toolbar(container, {
      canvasManager: mockCanvasManager,
      sidebar: mockSidebar,
    })
    toolbar.mount()
  })

  afterEach(() => {
    toolbar.destroy()
    container.remove()
  })

  it('debería inicializar correctamente los botones y el estado del overflow menu', () => {
    const moreBtn = document.getElementById('tool-more')
    const overflowMenu = document.getElementById('toolbar-overflow-menu')

    expect(moreBtn).not.toBeNull()
    expect(overflowMenu).not.toBeNull()
    expect(overflowMenu.classList.contains('is-open')).toBe(false)
    expect(moreBtn.getAttribute('aria-expanded')).toBe('false')
  })

  it('debería abrir y cerrar el menú overflow al pulsar el botón tool-more', () => {
    const moreBtn = document.getElementById('tool-more')
    const overflowMenu = document.getElementById('toolbar-overflow-menu')

    moreBtn.click()
    expect(overflowMenu.classList.contains('is-open')).toBe(true)
    expect(moreBtn.getAttribute('aria-expanded')).toBe('true')

    moreBtn.click()
    expect(overflowMenu.classList.contains('is-open')).toBe(false)
    expect(moreBtn.getAttribute('aria-expanded')).toBe('false')
  })

  it('debería seleccionar una herramienta del overflow, cerrar el menú y marcar tool-more como activo', () => {
    const moreBtn = document.getElementById('tool-more')
    const overflowMenu = document.getElementById('toolbar-overflow-menu')
    const rectBtn = document.getElementById('tool-rect')

    moreBtn.click()
    expect(overflowMenu.classList.contains('is-open')).toBe(true)

    rectBtn.click()
    expect(mockCanvasManager.setTool).toHaveBeenCalledWith('rect')
    expect(rectBtn.classList.contains('is-active')).toBe(true)
    expect(overflowMenu.classList.contains('is-open')).toBe(false)
    expect(moreBtn.classList.contains('is-tool-active')).toBe(true)
  })

  it('debería quitar is-tool-active de tool-more al seleccionar una herramienta principal', () => {
    const moreBtn = document.getElementById('tool-more')
    const rectBtn = document.getElementById('tool-rect')
    const brushBtn = document.getElementById('tool-brush')

    rectBtn.click()
    expect(moreBtn.classList.contains('is-tool-active')).toBe(true)

    brushBtn.click()
    expect(mockCanvasManager.setTool).toHaveBeenCalledWith('brush')
    expect(brushBtn.classList.contains('is-active')).toBe(true)
    expect(moreBtn.classList.contains('is-tool-active')).toBe(false)
  })

  it('debería cerrar el menú overflow al hacer clic fuera de él', () => {
    const moreBtn = document.getElementById('tool-more')
    const overflowMenu = document.getElementById('toolbar-overflow-menu')

    moreBtn.click()
    expect(overflowMenu.classList.contains('is-open')).toBe(true)

    document.body.click()
    expect(overflowMenu.classList.contains('is-open')).toBe(false)
    expect(moreBtn.getAttribute('aria-expanded')).toBe('false')
  })

  it('debería cerrar el menú overflow al presionar Escape', () => {
    const moreBtn = document.getElementById('tool-more')
    const overflowMenu = document.getElementById('toolbar-overflow-menu')

    moreBtn.click()
    expect(overflowMenu.classList.contains('is-open')).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(overflowMenu.classList.contains('is-open')).toBe(false)
  })

  it('debería activar el modo de selección (tool-select) si no está activo al hacer clic en tool-delete', () => {
    const deleteBtn = document.getElementById('tool-delete')
    const selectBtn = document.getElementById('tool-select')

    // Inicialmente la herramienta activa es 'pan'
    expect(mockCanvasManager.activeTool).toBe('pan')
    expect(selectBtn.classList.contains('is-active')).toBe(false)

    deleteBtn.click()

    expect(mockCanvasManager.deleteSelected).toHaveBeenCalled()
    expect(mockCanvasManager.setTool).toHaveBeenCalledWith('select')
    expect(mockCanvasManager.activeTool).toBe('select')
    expect(selectBtn.classList.contains('is-active')).toBe(true)
  })

  it('no debería volver a activar select si ya está activo al hacer clic en tool-delete', () => {
    const deleteBtn = document.getElementById('tool-delete')
    const selectBtn = document.getElementById('tool-select')

    // Activamos 'select' primero
    selectBtn.click()
    expect(mockCanvasManager.activeTool).toBe('select')
    expect(mockCanvasManager.setTool).toHaveBeenCalledWith('select')

    mockCanvasManager.setTool.mockClear()
    mockCanvasManager.deleteSelected.mockClear()

    deleteBtn.click()

    expect(mockCanvasManager.deleteSelected).toHaveBeenCalled()
    expect(mockCanvasManager.setTool).not.toHaveBeenCalled()
  })

  it('debería mostrar y actualizar la barra de acciones geométricas al recibir evento geometry:progress', () => {
    const geometryActions = document.getElementById('geometry-actions')
    const pointsCountEl = document.getElementById('geometry-points-count')
    const finishBtn = document.getElementById('geometry-btn-finish')
    const undoBtn = document.getElementById('geometry-btn-undo')

    expect(geometryActions.classList.contains('hidden')).toBe(true)

    // Emitir progreso con 1 punto (canFinish = false)
    mockListeners['geometry:progress']({
      tool: 'polygon',
      pointsCount: 1,
      minPoints: 3,
      canFinish: false,
    })

    expect(geometryActions.classList.contains('hidden')).toBe(false)
    expect(pointsCountEl.textContent).toBe('1 punto')
    expect(finishBtn.disabled).toBe(true)
    expect(undoBtn.disabled).toBe(false)

    // Emitir progreso con 3 puntos (canFinish = true)
    mockListeners['geometry:progress']({
      tool: 'polygon',
      pointsCount: 3,
      minPoints: 3,
      canFinish: true,
    })

    expect(pointsCountEl.textContent).toBe('3 puntos')
    expect(finishBtn.disabled).toBe(false)
  })

  it('debería ocultar la barra de acciones geométricas cuando pointsCount es 0 o la herramienta no es geométrica', () => {
    const geometryActions = document.getElementById('geometry-actions')

    mockListeners['geometry:progress']({
      tool: 'polygon',
      pointsCount: 2,
      minPoints: 3,
      canFinish: false,
    })
    expect(geometryActions.classList.contains('hidden')).toBe(false)

    // Notificar progreso 0 puntos
    mockListeners['geometry:progress']({
      tool: 'polygon',
      pointsCount: 0,
      minPoints: 3,
      canFinish: false,
    })
    expect(geometryActions.classList.contains('hidden')).toBe(true)
  })

  it('debería delegar las acciones de deshacer, finalizar y cancelar a la herramienta activa', () => {
    const undoBtn = document.getElementById('geometry-btn-undo')
    const finishBtn = document.getElementById('geometry-btn-finish')
    const cancelBtn = document.getElementById('geometry-btn-cancel')

    undoBtn.disabled = false
    undoBtn.click()
    expect(mockCanvasManager.toolService.activeTool.undoLastPoint).toHaveBeenCalled()

    finishBtn.disabled = false
    finishBtn.click()
    expect(mockCanvasManager.toolService.activeTool.finishDrawing).toHaveBeenCalled()

    cancelBtn.click()
    expect(mockCanvasManager.toolService.activeTool.cancelDrawing).toHaveBeenCalled()
  })

  it('debería ocultar la barra de acciones al cambiar a una herramienta diferente a polyline o polygon', () => {
    const geometryActions = document.getElementById('geometry-actions')

    mockListeners['geometry:progress']({
      tool: 'polyline',
      pointsCount: 2,
      minPoints: 2,
      canFinish: true,
    })
    expect(geometryActions.classList.contains('hidden')).toBe(false)

    // Cambiar a pincel
    mockCanvasManager.setTool('brush')
    expect(geometryActions.classList.contains('hidden')).toBe(true)
  })
})
