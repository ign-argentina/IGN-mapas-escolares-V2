import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  sendAnalyticsEvent,
  trackMapDownload,
  trackMapPrint,
  trackMapSelect,
} from '../analytics.js'

describe('Analytics Module (GA4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.gtag = vi.fn()
  })

  afterEach(() => {
    delete window.gtag
  })

  describe('sendAnalyticsEvent', () => {
    it('debería invocar window.gtag con el nombre de evento y los parámetros correspondientes', () => {
      sendAnalyticsEvent('custom_event', { test_key: 'test_val' })

      expect(window.gtag).toHaveBeenCalledTimes(1)
      expect(window.gtag).toHaveBeenCalledWith('event', 'custom_event', {
        test_key: 'test_val',
      })
    })

    it('no debería fallar si window.gtag no está definido', () => {
      delete window.gtag

      expect(() => {
        sendAnalyticsEvent('custom_event', { test: true })
      }).not.toThrow()
    })

    it('no debería propagar errores si window.gtag lanza una excepción', () => {
      window.gtag = vi.fn().mockImplementation(() => {
        throw new Error('Network error or adblocker')
      })

      expect(() => {
        sendAnalyticsEvent('custom_event', {})
      }).not.toThrow()
    })
  })

  describe('trackMapDownload', () => {
    it('debería emitir map_download y file_download con el nombre del mapa y metadatos correctos', () => {
      trackMapDownload({
        mapName: 'Mapa de Argentina Bicontinental',
        mapId: 'argentina',
        format: 'pdf',
        fileName: 'IGN_Escolar_argentina.pdf',
      })

      expect(window.gtag).toHaveBeenCalledTimes(2)

      // Evento 1: map_download (personalizado para embudos / conversiones)
      expect(window.gtag).toHaveBeenNthCalledWith(1, 'event', 'map_download', {
        map_name: 'Mapa de Argentina Bicontinental',
        map_id: 'argentina',
        format: 'pdf',
        file_name: 'IGN_Escolar_argentina.pdf',
        item_name: 'Mapa de Argentina Bicontinental',
      })

      // Evento 2: file_download (estándar de GA4)
      expect(window.gtag).toHaveBeenNthCalledWith(2, 'event', 'file_download', {
        file_name: 'IGN_Escolar_argentina.pdf',
        file_extension: 'pdf',
        map_name: 'Mapa de Argentina Bicontinental',
        map_id: 'argentina',
        item_name: 'Mapa de Argentina Bicontinental',
      })
    })

    it('debería asignar valores por defecto si faltan datos en trackMapDownload', () => {
      trackMapDownload({})

      expect(window.gtag).toHaveBeenCalledTimes(2)
      expect(window.gtag).toHaveBeenNthCalledWith(1, 'event', 'map_download', {
        map_name: 'Desconocido',
        map_id: '',
        format: 'pdf',
        file_name: '',
        item_name: 'Desconocido',
      })
    })
  })

  describe('trackMapPrint', () => {
    it('debería registrar el evento map_print con el nombre del mapa', () => {
      trackMapPrint({
        mapName: 'Provincia de Buenos Aires',
        map_id: 'buenos-aires',
      })

      expect(window.gtag).toHaveBeenCalledTimes(1)
      expect(window.gtag).toHaveBeenCalledWith('event', 'map_print', {
        map_name: 'Provincia de Buenos Aires',
        map_id: 'buenos-aires',
        item_name: 'Provincia de Buenos Aires',
      })
    })
  })

  describe('trackMapSelect', () => {
    it('debería registrar el evento select_content con los datos del mapa seleccionado', () => {
      trackMapSelect({
        mapName: 'Provincia de Córdoba',
        mapId: 'cordoba',
      })

      expect(window.gtag).toHaveBeenCalledTimes(1)
      expect(window.gtag).toHaveBeenCalledWith('event', 'select_content', {
        content_type: 'map',
        item_id: 'cordoba',
        item_name: 'Provincia de Córdoba',
        map_name: 'Provincia de Córdoba',
      })
    })
  })
})
