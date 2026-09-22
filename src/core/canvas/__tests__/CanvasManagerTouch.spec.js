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

  return {
    Canvas: MockCanvas,
    FabricImage: MockFabricImage,
    PencilBrush: MockPencilBrush,
    FabricObject: MockFabricObject,
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
})

