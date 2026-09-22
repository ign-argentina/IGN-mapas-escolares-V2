import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PolylineTool } from '../PolylineTool.js'

// Simular el módulo fabric y ShapeFactory
vi.mock('fabric', () => {
  return {
    Polyline: class {
      constructor(points, opts) {
        this.points = points
        Object.assign(this, opts)
        this.type = 'polyline'
      }
    }
  }
})

describe('PolylineTool', () => {
  let mockCanvasManager
  let tool

  beforeEach(() => {
    mockCanvasManager = {
      activeColor: '#FFF4B0',
      activeStrokeWidth: 8,
      activeTool: 'polyline',
      onToolChange: vi.fn(),
      setTool: vi.fn(),
      finishCreatedObject: vi.fn(),
      adapter: {
        setDrawingMode: vi.fn(),
        setSelectionEnabled: vi.fn(),
        setDefaultCursor: vi.fn(),
        getScenePoint: vi.fn((e) => ({ x: e.clientX, y: e.clientY })),
        addObject: vi.fn(),
        removeObject: vi.fn(),
        requestRenderAll: vi.fn(),
        fire: vi.fn(),
      },
    }

    tool = new PolylineTool(mockCanvasManager)
  })

  it('debería inicializar correctamente al activarse', () => {
    tool.onActivate()
    expect(tool.points).toEqual([])
    expect(tool.previewShape).toBeNull()
  })

  it('debería agregar puntos y actualizar vista previa en mouseDown y mouseMove', () => {
    tool.onActivate()
    
    // Simular primer click
    tool.onMouseDown({ e: { clientX: 10, clientY: 20 } })
    expect(tool.points).toEqual([{ x: 10, y: 20 }])
    expect(tool.previewShape).toBeNull() // Necesita al menos 2 puntos para la preview

    // Simular movimiento antes de hacer click
    tool.onMouseMove({ e: { clientX: 30, clientY: 40 } })
    expect(tool.previewShape).not.toBeNull()
    expect(mockCanvasManager.adapter.addObject).toHaveBeenCalled()

    // Simular segundo click
    tool.onMouseDown({ e: { clientX: 50, clientY: 60 } })
    expect(tool.points).toEqual([{ x: 10, y: 20 }, { x: 50, y: 60 }])
  })

  it('debería finalizar dibujo con doble click y limpiar duplicados', () => {
    vi.useFakeTimers()
    tool.onActivate()
    vi.advanceTimersByTime(500)
    tool.onMouseDown({ e: { clientX: 10, clientY: 20 } })
    tool.onMouseDown({ e: { clientX: 30, clientY: 40 } })
    // Double click añade un punto y luego dispara onMouseDblClick
    tool.onMouseDown({ e: { clientX: 30, clientY: 40 } })
    
    tool.onMouseDblClick({})
    
    expect(mockCanvasManager.finishCreatedObject).toHaveBeenCalled()
    expect(mockCanvasManager.finishCreatedObject.mock.calls[0][0].type).toBe('polyline')
    expect(mockCanvasManager.finishCreatedObject.mock.calls[0][0].points).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ])
    vi.useRealTimers()
  })

  it('debería finalizar dibujo al presionar Enter', () => {
    tool.onActivate()
    tool.onMouseDown({ e: { clientX: 10, clientY: 20 } })
    tool.onMouseDown({ e: { clientX: 30, clientY: 40 } })

    const handled = tool.onKeyDown({ key: 'Enter' })
    expect(handled).toBe(true)
    expect(mockCanvasManager.finishCreatedObject).toHaveBeenCalled()
  })

  it('debería cancelar dibujo y resetear a pan al presionar Escape', () => {
    tool.onActivate()
    tool.onMouseDown({ e: { clientX: 10, clientY: 20 } })
    tool.onMouseMove({ e: { clientX: 30, clientY: 40 } })

    const handled = tool.onKeyDown({ key: 'Escape' })
    expect(handled).toBe(true)
    expect(mockCanvasManager.setTool).toHaveBeenCalledWith('pan')
    expect(mockCanvasManager.onToolChange).toHaveBeenCalledWith('pan')
    expect(tool.points).toEqual([])
    expect(tool.previewShape).toBeNull()
  })

  it('debería permitir desarmar el último punto con undoLastPoint()', () => {
    tool.onActivate()
    tool.onMouseDown({ e: { clientX: 10, clientY: 20 } })
    tool.onMouseDown({ e: { clientX: 30, clientY: 40 } })
    expect(tool.points.length).toBe(2)

    tool.undoLastPoint()
    expect(tool.points.length).toBe(1)
    expect(mockCanvasManager.adapter.fire).toHaveBeenCalledWith(
      'geometry:progress',
      expect.objectContaining({ pointsCount: 1, canFinish: false })
    )

    tool.undoLastPoint()
    expect(tool.points.length).toBe(0)
    expect(tool.previewShape).toBeNull()
  })

  it('debería finalizar dibujo mediante doble toque rápido de software (< 380ms)', () => {
    vi.useFakeTimers()
    tool.onActivate()
    tool.onMouseDown({ e: { clientX: 10, clientY: 10 } })
    tool.onMouseDown({ e: { clientX: 50, clientY: 50 } })
    expect(tool.points.length).toBe(2)

    // Toque rápido en el mismo lugar (< 380ms y distancia < 30px)
    vi.advanceTimersByTime(150)
    tool.onMouseDown({ e: { clientX: 52, clientY: 52 } })

    expect(mockCanvasManager.finishCreatedObject).toHaveBeenCalled()
    expect(mockCanvasManager.finishCreatedObject.mock.calls[0][0].type).toBe('polyline')
    vi.useRealTimers()
  })

  it('debería finalizar dibujo al tocar el último vértice colocado', () => {
    vi.useFakeTimers()
    tool.onActivate()
    tool.onMouseDown({ e: { clientX: 10, clientY: 10 } })
    tool.onMouseDown({ e: { clientX: 50, clientY: 50 } })
    expect(tool.points.length).toBe(2)

    // Simular que pasaron más de 400ms para no ser detectado como doble toque
    vi.advanceTimersByTime(500)

    // Tocar el último punto
    tool.onMouseDown({ e: { clientX: 55, clientY: 55 } })

    expect(mockCanvasManager.finishCreatedObject).toHaveBeenCalled()
    expect(mockCanvasManager.finishCreatedObject.mock.calls[0][0].type).toBe('polyline')
    vi.useRealTimers()
  })
})
