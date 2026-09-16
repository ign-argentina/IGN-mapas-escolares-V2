import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Toolbar } from '../Toolbar.js'

describe('Toolbar with responsive overflow menu', () => {
  let container
  let mockCanvasManager
  let mockSidebar
  let toolbar

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
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
})
