import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CanvasManager } from '../../canvasManager.js'

// Mock de Fabric
vi.mock('fabric', () => {
  class MockCanvas {
    constructor() {
      this.add = vi.fn()
      this.insertAt = vi.fn()
      this.remove = vi.fn()
      this.getActiveObject = vi.fn()
      this.setActiveObject = vi.fn()
      this.discardActiveObject = vi.fn()
      this.getObjects = vi.fn().mockReturnValue([])
      this.bringObjectToFront = vi.fn()
      this.sendObjectToBack = vi.fn()
      this.getZoom = vi.fn().mockReturnValue(1)
      this.zoomToPoint = vi.fn()
      this.viewportTransform = [1, 0, 0, 1, 100, 100]
      this.setViewportTransform = vi.fn((vpt) => {
        this.viewportTransform = [...vpt]
      })
      this.requestRenderAll = vi.fn()
      this.setDimensions = vi.fn()
      this.calcOffset = vi.fn()
      this.getScenePoint = vi.fn().mockReturnValue({ x: 100, y: 150 })
      this.setCursor = vi.fn()
      this.listeners = {}
      this.on = vi.fn((event, cb) => {
        this.listeners[event] = cb
      })
      this.off = vi.fn((event) => {
        delete this.listeners[event]
      })
      this.fire = vi.fn()
      this.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock')
      this.dispose = vi.fn()
    }
  }

  class MockFabricImage {
    constructor() {
      this.width = 2000
      this.height = 2500
      this.left = 0
      this.top = 0
      this.scaleX = 1
      this.scaleY = 1
      this.set = vi.fn((props) => {
        Object.assign(this, props)
      })
    }
  }

  MockFabricImage.fromURL = vi.fn().mockResolvedValue(new MockFabricImage())

  class MockFabricObject {}
  MockFabricObject.ownDefaults = {}

  class MockPencilBrush {}

  class MockRect {
    constructor(opts = {}) {
      Object.assign(this, opts)
      this.set = vi.fn((props) => Object.assign(this, props))
      this.setCoords = vi.fn()
    }
  }

  return {
    Canvas: MockCanvas,
    FabricImage: MockFabricImage,
    PencilBrush: MockPencilBrush,
    FabricObject: MockFabricObject,
    Rect: MockRect,
    util: {
      groupSVGElements: vi.fn(),
      enlivenObjects: vi.fn().mockResolvedValue([]),
    },
    loadSVGFromURL: vi.fn(),
    filters: {},
  }
})

describe('CanvasManager - Touch & Mobile Pan Handling', () => {
  let container
  let manager

  beforeEach(() => {
    container = document.createElement('div')
    container.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 400,
      height: 600,
      left: 0,
      top: 0,
      right: 400,
      bottom: 600,
    })
    document.body.appendChild(container)
    manager = new CanvasManager(container)
    manager.init()
  })

  it('debería desplazar el viewport correctamente con eventos táctiles (TouchEvent) sin generar NaN', () => {
    const canvas = manager.canvas
    expect(canvas.on).toHaveBeenCalled()

    // Configurar herramienta pan
    manager.setTool('pan')
    canvas.viewportTransform = [1, 0, 0, 1, 50, 50]

    const mouseDownHandler = canvas.listeners['mouse:down']
    const mouseMoveHandler = canvas.listeners['mouse:move']
    const mouseUpHandler = canvas.listeners['mouse:up']

    expect(typeof mouseDownHandler).toBe('function')
    expect(typeof mouseMoveHandler).toBe('function')

    // 1. Simular touchstart (evento touch sin clientX directo en evento base)
    const touchStartEvent = {
      touches: [{ clientX: 150, clientY: 200 }],
      changedTouches: [{ clientX: 150, clientY: 200 }],
      // clientX y clientY son undefined en TouchEvent
      clientX: undefined,
      clientY: undefined,
      button: undefined,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    }

    mouseDownHandler({ e: touchStartEvent })

    // 2. Simular touchmove desplazando 30px en X y 40px en Y
    const touchMoveEvent = {
      touches: [{ clientX: 180, clientY: 240 }],
      changedTouches: [{ clientX: 180, clientY: 240 }],
      clientX: undefined,
      clientY: undefined,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    }

    mouseMoveHandler({ e: touchMoveEvent })

    // Comprobar que no hay NaN en el viewportTransform
    expect(Number.isFinite(canvas.viewportTransform[4])).toBe(true)
    expect(Number.isFinite(canvas.viewportTransform[5])).toBe(true)
    expect(canvas.viewportTransform[4]).toBe(50 + 30) // 80
    expect(canvas.viewportTransform[5]).toBe(50 + 40) // 90
    expect(canvas.requestRenderAll).toHaveBeenCalled()

    // 3. Simular touchend
    mouseUpHandler({ e: { touches: [] } })
  })

  it('debería soportar gesto de dos dedos (pinch-to-zoom) con eventos táctiles', () => {
    const canvas = manager.canvas
    canvas.getZoom = vi.fn().mockReturnValue(1)

    const mouseDownHandler = canvas.listeners['mouse:down']
    const mouseMoveHandler = canvas.listeners['mouse:move']

    // 1. Dos dedos tocan la pantalla con distancia inicial de 100px
    const pinchStartEvent = {
      touches: [
        { clientX: 100, clientY: 200 },
        { clientX: 200, clientY: 200 },
      ],
      changedTouches: [],
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    }

    mouseDownHandler({ e: pinchStartEvent })

    // 2. Los dos dedos se separan a 200px (zoom x2)
    const pinchMoveEvent = {
      touches: [
        { clientX: 50, clientY: 200 },
        { clientX: 250, clientY: 200 },
      ],
      changedTouches: [],
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    }

    mouseMoveHandler({ e: pinchMoveEvent })

    // zoomToPoint debe haberse llamado con un factor de zoom mayor a 1
    expect(canvas.zoomToPoint).toHaveBeenCalled()
    const lastZoomCall = canvas.zoomToPoint.mock.calls[canvas.zoomToPoint.mock.calls.length - 1]
    expect(lastZoomCall[1]).toBeCloseTo(2, 1)
  })

  it('debería capturar el gesto nativo de pellizco en el DOM (touchstart con 2 dedos -> touchmove -> touchend)', () => {
    const canvas = manager.canvas
    canvas.getZoom = vi.fn().mockReturnValue(1)

    // 1. Iniciar con dos dedos en la pantalla a 100px de distancia
    const startEvent = new CustomEvent('touchstart', { bubbles: true, cancelable: true })
    startEvent.touches = [
      { clientX: 100, clientY: 200 },
      { clientX: 200, clientY: 200 },
    ]
    container.dispatchEvent(startEvent)

    // 2. Mover los dedos separándolos a 200px (zoom x2) y desplazando el centro
    const moveEvent = new CustomEvent('touchmove', { bubbles: true, cancelable: true })
    moveEvent.touches = [
      { clientX: 50, clientY: 210 },
      { clientX: 250, clientY: 210 },
    ]
    container.dispatchEvent(moveEvent)

    expect(canvas.zoomToPoint).toHaveBeenCalled()
    const lastZoomCall = canvas.zoomToPoint.mock.calls[canvas.zoomToPoint.mock.calls.length - 1]
    expect(lastZoomCall[1]).toBeCloseTo(2, 1)
    expect(canvas.requestRenderAll).toHaveBeenCalled()

    // 3. Levantar los dedos
    const endEvent = new CustomEvent('touchend', { bubbles: true, cancelable: true })
    endEvent.touches = []
    container.dispatchEvent(endEvent)
  })

  it('debería cancelar el trazado preliminar de una figura cuando apoya un segundo dedo para hacer zoom', () => {
    manager.setTool('rect')
    const rectTool = manager.toolService.activeTool

    // 1. El primer dedo apoya y empieza a trazar un rectángulo
    const pointerDownOpt = {
      e: {
        touches: [{ clientX: 100, clientY: 100 }],
        clientX: 100,
        clientY: 100,
        button: 0,
      },
    }
    rectTool.onMouseDown(pointerDownOpt)
    expect(rectTool.isDrawing).toBe(true)
    expect(rectTool.previewShape).not.toBeNull()

    // 2. Apoya el segundo dedo (gesto de pellizco)
    const pinchStartEvent = new CustomEvent('touchstart', { bubbles: true, cancelable: true })
    pinchStartEvent.touches = [
      { clientX: 100, clientY: 100 },
      { clientX: 200, clientY: 100 },
    ]
    container.dispatchEvent(pinchStartEvent)

    // El trazado preliminar debe haberse cancelado para no manchar el mapa
    expect(rectTool.isDrawing).toBe(false)
    expect(rectTool.previewShape).toBeNull()
  })

  it('debería soportar eventos PointerEvent de tipo touch en pantallas táctiles', () => {
    const canvas = manager.canvas
    canvas.getZoom = vi.fn().mockReturnValue(1)

    // 1. Primer puntero táctil
    const p1Down = new CustomEvent('pointerdown', { bubbles: true, cancelable: true })
    p1Down.pointerId = 1
    p1Down.pointerType = 'touch'
    p1Down.clientX = 100
    p1Down.clientY = 200
    container.dispatchEvent(p1Down)

    // 2. Segundo puntero táctil a 100px de distancia
    const p2Down = new CustomEvent('pointerdown', { bubbles: true, cancelable: true })
    p2Down.pointerId = 2
    p2Down.pointerType = 'touch'
    p2Down.clientX = 200
    p2Down.clientY = 200
    container.dispatchEvent(p2Down)

    // 3. Mover el segundo puntero a 300px (distancia de 200px -> zoom x2)
    const p2Move = new CustomEvent('pointermove', { bubbles: true, cancelable: true })
    p2Move.pointerId = 2
    p2Move.pointerType = 'touch'
    p2Move.clientX = 300
    p2Move.clientY = 200
    container.dispatchEvent(p2Move)

    expect(canvas.zoomToPoint).toHaveBeenCalled()
    const lastZoomCall = canvas.zoomToPoint.mock.calls[canvas.zoomToPoint.mock.calls.length - 1]
    expect(lastZoomCall[1]).toBeCloseTo(2, 1)

    // 4. Levantar puntero
    const p2Up = new CustomEvent('pointerup', { bubbles: true, cancelable: true })
    p2Up.pointerId = 2
    p2Up.pointerType = 'touch'
    container.dispatchEvent(p2Up)
  })

  it('debería desvincular los listeners táctiles al invocar dispose()', () => {
    expect(typeof manager._touchCleanup).toBe('function')
    const cleanupSpy = vi.spyOn(manager, '_touchCleanup')

    manager.dispose()
    expect(cleanupSpy).toHaveBeenCalled()
    expect(manager._touchCleanup).toBeNull()
  })
})

