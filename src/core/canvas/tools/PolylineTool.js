import { BaseTool } from './BaseTool.js'
import { ShapeFactory } from '../ShapeFactory.js'

/**
 * Herramienta para el trazado interactivo de polilíneas (geometría abierta LineString).
 */
export class PolylineTool extends BaseTool {
  constructor(canvasManager) {
    super(canvasManager)
    this.points = []
    this.previewShape = null
  }

  onActivate() {
    this.points = []
    this.previewShape = null
    this._activatedAt = Date.now()
    this._lastTapTime = 0
    this._lastTapPoint = null
    this.notifyProgress()
  }

  onDeactivate() {
    if (this.points.length >= 2) {
      this.finishDrawing()
    } else {
      this.cleanup()
    }
    this.notifyProgress()
  }

  cleanup() {
    if (this.previewShape) {
      this.canvasManager.adapter.removeObject(this.previewShape)
      this.previewShape = null
    }
    this.points = []
    this._lastTapTime = 0
    this._lastTapPoint = null
    this.canvasManager.adapter.requestRenderAll()
    this.notifyProgress()
  }

  cancelDrawing() {
    this.cleanup()
    this.canvasManager.setTool('pan')
    if (typeof this.canvasManager.onToolChange === 'function') {
      this.canvasManager.onToolChange('pan')
    }
  }

  undoLastPoint() {
    if (this.points.length === 0) return
    this.points.pop()
    this._lastTapTime = 0
    this._lastTapPoint = null
    this.updatePreview(null)
    this.notifyProgress()
  }

  notifyProgress() {
    if (this.canvasManager?.adapter?.fire) {
      this.canvasManager.adapter.fire('geometry:progress', {
        tool: 'polyline',
        pointsCount: this.points.length,
        minPoints: 2,
        canFinish: this.points.length >= 2,
      })
    }
  }

  onMouseDown(opt) {
    const pointer = this.canvasManager.adapter.getScenePoint(opt.e)
    const now = Date.now()

    // 1. Detección de doble toque táctil (< 380ms y distancia < 30px)
    if (this._lastTapTime && now - this._lastTapTime < 380 && this._lastTapPoint) {
      const tapDist = Math.hypot(pointer.x - this._lastTapPoint.x, pointer.y - this._lastTapPoint.y)
      if (tapDist < 30 && this.points.length >= 2) {
        this._lastTapTime = 0
        this._lastTapPoint = null
        this.finishDrawing()
        return
      }
    }

    // 2. Tocar el último vértice colocado para finalizar (si ya hay al menos 2 puntos)
    if (this.points.length >= 2) {
      const lastPoint = this.points[this.points.length - 1]
      const distToLast = Math.hypot(pointer.x - lastPoint.x, pointer.y - lastPoint.y)
      if (distToLast < 25) {
        this._lastTapTime = 0
        this._lastTapPoint = null
        this.finishDrawing()
        return
      }
    }

    this._lastTapTime = now
    this._lastTapPoint = pointer
    this.points.push(pointer)
    this.updatePreview(null)
    this.notifyProgress()
  }

  onMouseMove(opt) {
    if (this.points.length === 0) return
    const pointer = this.canvasManager.adapter.getScenePoint(opt.e)
    this.updatePreview(pointer)
  }

  updatePreview(currentMousePos) {
    const pointsToRender = [...this.points]
    if (currentMousePos) {
      pointsToRender.push(currentMousePos)
    }

    if (pointsToRender.length >= 2) {
      if (this.previewShape) {
        this.previewShape.points = pointsToRender
        this.previewShape.dirty = true
        if (typeof this.previewShape.setBoundingBox === 'function') {
          this.previewShape.setBoundingBox(true)
        }
        if (typeof this.previewShape.setCoords === 'function') {
          this.previewShape.setCoords()
        }
      } else {
        this.previewShape = ShapeFactory.createPolyline(pointsToRender, {
          color: this.canvasManager.activeColor,
          strokeWidth: this.canvasManager.activeStrokeWidth,
          selectable: false,
          evented: false,
        })
        this.canvasManager.adapter.addObject(this.previewShape)
      }
      this.canvasManager.adapter.requestRenderAll()
    } else {
      if (this.previewShape) {
        this.canvasManager.adapter.removeObject(this.previewShape)
        this.previewShape = null
        this.canvasManager.adapter.requestRenderAll()
      }
    }
  }

  onMouseDblClick(_opt) {
    // Ignorar doble clics residuales que el navegador dispara inmediatamente
    // después de activar la herramienta (< 400ms) o sin puntos suficientes
    if (Date.now() - this._activatedAt < 400) return
    if (this.points.length < 2) return

    // Al hacer doble clic, se suele añadir un punto extra duplicado.
    // Quitamos el último punto antes de finalizar.
    if (this.points.length > 0) {
      this.points.pop()
    }
    this.finishDrawing()
  }

  onKeyDown(e) {
    if (e.key === 'Enter') {
      if (this.points.length >= 2) {
        this.finishDrawing()
      } else {
        this.cancelDrawing()
      }
      return true
    }
    if (e.key === 'Escape') {
      this.cancelDrawing()
      return true
    }
    return false
  }

  finishDrawing() {
    // Filtrar puntos duplicados consecutivos
    const uniquePoints = []
    for (const pt of this.points) {
      if (uniquePoints.length === 0) {
        uniquePoints.push(pt)
      } else {
        const lastPt = uniquePoints[uniquePoints.length - 1]
        const dist = Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y)
        if (dist > 1) { // Tolerancia de 1 píxel para evitar duplicaciones por dblclick
          uniquePoints.push(pt)
        }
      }
    }
    this.points = uniquePoints

    if (this.previewShape) {
      this.canvasManager.adapter.removeObject(this.previewShape)
      this.previewShape = null
    }

    if (this.points.length >= 2) {
      const finalShape = ShapeFactory.createPolyline(this.points, {
        color: this.canvasManager.activeColor,
        strokeWidth: this.canvasManager.activeStrokeWidth,
      })

      this.canvasManager.adapter.addObject(finalShape)
      this.canvasManager.finishCreatedObject(finalShape, 'polyline')
    } else {
      this.cleanup()
    }
    this.points = []
    this._lastTapTime = 0
    this._lastTapPoint = null
    this.notifyProgress()
  }
}
