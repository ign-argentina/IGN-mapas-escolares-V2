/**
 * Módulo de analítica para Google Analytics 4 (gtag.js).
 * Centraliza y abstrae el envío de eventos de telemetría de forma no invasiva,
 * segura contra bloqueadores de rastreo (adblockers) y compatible con entornos sin DOM/tests.
 */

/**
 * Envía un evento a Google Analytics si gtag está disponible.
 * Falla de forma silenciosa para asegurar que ningún problema de red o adblocker
 * interrumpa la experiencia del usuario.
 *
 * @param {string} eventName - Nombre del evento (ej. 'file_download', 'map_download')
 * @param {Record<string, any>} [eventParams={}] - Parámetros descriptivos asociados al evento
 */
export function sendAnalyticsEvent(eventName, eventParams = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, eventParams)
    }
  } catch (error) {
    // Registro solo en modo desarrollo o depuración
    if (import.meta.env?.DEV) {
      console.warn(`[Analytics] Error al emitir evento "${eventName}":`, error)
    }
  }
}

/**
 * Registra el evento de descarga de un mapa en Google Analytics.
 * Emite tanto el evento estándar de GA4 ('file_download') como un evento personalizado
 * ('map_download') con el nombre y detalles del mapa para identificar con precisión
 * cuál es el mapa más descargado en los informes y exploraciones de Google Analytics.
 *
 * @param {Object} params
 * @param {string} params.mapName - Nombre legible del mapa (ej. "Mapa de Argentina Bicontinental")
 * @param {string} params.mapId - Identificador único del mapa (ej. "argentina")
 * @param {string} [params.format='pdf'] - Formato de archivo (ej. 'pdf', 'png', 'jpg')
 * @param {string} [params.fileName=''] - Nombre completo del archivo generado
 */
export function trackMapDownload({ mapName, mapId, map_id, format = 'pdf', fileName = '' }) {
  const cleanMapName = mapName || 'Desconocido'
  const cleanFormat = (format || 'pdf').toLowerCase()
  const resolvedMapId = mapId || map_id || ''

  // 1. Evento personalizado principal: Permite marcarse como Conversión / Evento Clave en GA4
  // y agrupar fácilmente en paneles de control y exploraciones libres.
  sendAnalyticsEvent('map_download', {
    map_name: cleanMapName,
    map_id: resolvedMapId,
    format: cleanFormat,
    file_name: fileName || '',
    item_name: cleanMapName,
  })

  // 2. Evento nativo de GA4 'file_download': Se integra directamente con la medición mejorada
  // y aparece automáticamente en la tarjeta de Descargas de Archivos en los informes estándar.
  sendAnalyticsEvent('file_download', {
    file_name: fileName || '',
    file_extension: cleanFormat,
    map_name: cleanMapName,
    map_id: resolvedMapId,
    item_name: cleanMapName,
  })
}

/**
 * Registra el evento de impresión física o envío al diálogo de impresión del navegador.
 *
 * @param {Object} params
 * @param {string} params.mapName - Nombre legible del mapa
 * @param {string} [params.mapId] - Identificador único del mapa
 * @param {string} [params.map_id] - Alternativa para el identificador único del mapa
 */
export function trackMapPrint({ mapName, mapId, map_id }) {
  const cleanMapName = mapName || 'Desconocido'
  const resolvedMapId = mapId || map_id || ''
  sendAnalyticsEvent('map_print', {
    map_name: cleanMapName,
    map_id: resolvedMapId,
    item_name: cleanMapName,
  })
}

/**
 * Registra la selección o cambio de mapa activo por parte del usuario.
 * Utiliza el evento recomendado 'select_content' de GA4 para medir el interés relativo de cada mapa.
 *
 * @param {Object} params
 * @param {string} params.mapName - Nombre legible del mapa
 * @param {string} [params.mapId] - Identificador único del mapa
 * @param {string} [params.map_id] - Alternativa para el identificador único del mapa
 */
export function trackMapSelect({ mapName, mapId, map_id }) {
  const cleanMapName = mapName || 'Desconocido'
  const resolvedMapId = mapId || map_id || ''
  sendAnalyticsEvent('select_content', {
    content_type: 'map',
    item_id: resolvedMapId,
    item_name: cleanMapName,
    map_name: cleanMapName,
  })
}
