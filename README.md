# Mapas Escolares IGN — Versión 2

Aplicación web interactiva y **Progressive Web App (PWA)** desarrollada para el **Instituto Geográfico Nacional (IGN)** de la República Argentina. Permite a docentes, estudiantes y a la comunidad educativa explorar, intervenir con herramientas vectoriales de dibujo y anotación, y descargar o imprimir los mapas escolares oficiales de la República Argentina y del mundo.

---

## 🚀 Características Principales

- **Catálogo Oficial de Mapas**: Mapas bicontinentales, continentales, de provincias y planisferios provistos por el IGN, categorizados y con buscador en tiempo real insensible a tildes o mayúsculas.
- **Lienzo Interactivo (Canvas)**:
  - Dibujo libre con lápiz regulable en grosor y color.
  - Figuras geométricas: rectángulos, círculos, flechas vectoriales, polilíneas y polígonos libres con edición de vértices paso a paso.
  - Anotaciones de texto enriquecido y marcadores cartográficos (*pins*).
  - Panel de *stickers* y decoraciones educativas.
  - Menú contextual flotante: duplicar, eliminar, bloquear posición, voltear horizontal/verticalmente y ordenar capas (*traer al frente / enviar al fondo*).
- **Módulo de Exportación e Impresión Profesional**:
  - Salida a formatos **PDF**, **PNG** y **JPG**.
  - Ajuste automático al **formato escolar real (19 × 24 cm)** sobre hojas A4 u Oficio / Legal.
  - Selector de resolución (Borrador 72 DPI, Estándar 150 DPI, Alta resolución 300 DPI).
  - Previsualización en tiempo real a escala con hoja y márgenes.
  - Envío a impresión física limpia mediante iframe aislado offscreen sin afectar la interfaz.
- **Persistencia Local Automática**: Guarda automáticamente las intervenciones y dibujos de cada mapa de forma independiente en `localStorage` (con soporte para gestión de cuotas de almacenamiento).
- **Accesibilidad Universal (A11y)**:
  - Filtros SVG nativos para daltonismo (protanopia, deuteranopia y tritanopia).
  - Modos de alto contraste.
  - Región de anuncios accesible (`aria-live`) para lectores de pantalla.
  - Navegación completa asistida por teclado (atajos de teclado estándar como `Ctrl+Z`, `Ctrl+Y`, `Supr`, `Escape`).
- **Recorrido Guiado Interactivo (Tour)**: Modal de bienvenida accesible con aviso de privacidad y tour guiado paso a paso por todas las herramientas.
- **Telemetría y Analítica (Google Analytics 4)**: Módulo desacoplado para auditoría del uso y medición del mapa más descargado mediante eventos nativos (`file_download`) y personalizados (`map_download`, `select_content`).
- **Soporte Offline (PWA)**: Precarga inteligente de recursos y mapas base vía Service Worker para su uso sin conexión a internet en aulas y escuelas.

---

## 🛠️ Stack Tecnológico

| Tecnología | Rol en el Proyecto |
| :--- | :--- |
| **JavaScript (ES Modules)** | Código fuente modular en Vanilla JS sin frameworks pesados, basado en POO y patrones de diseño desacoplados. |
| **[Vite 8](https://vitejs.dev/)** | Entorno de desarrollo ultrarrápido y empaquetador de producción. |
| **[Fabric.js v7](http://fabricjs.com/)** | Motor de renderizado en Canvas HTML5 y manipulación de objetos vectoriales interactivos. |
| **[jsPDF](https://github.com/parallax/jsPDF)** | Generación cliente de documentos PDF en medidas físicas reales milimétricas. |
| **[Vite Plugin PWA](https://vite-pwa-org.netlify.app/)** | Configuración de Service Worker, manifiesto web y estrategias de caché con Workbox. |
| **[Lucide](https://lucide.dev/)** | Biblioteca de iconografía vectorial ligera y accesible. |
| **[Vitest](https://vitest.dev/)** | Suite de pruebas unitarias y de integración rápida con emulación DOM (`jsdom`). |
| **ESLint & Prettier** | Calidad de código, análisis estático y formateo consistente. |

---

## 📂 Estructura del Proyecto

```text
IGN-mapas-escolares-V2/
├── public/                     # Recursos estáticos servidos directamente
│   ├── config/                 # Archivo config.json remoto y estilos custom
│   ├── fonts/                  # Tipografías locales (Fredoka WOFF2)
│   ├── maps/                   # Archivos de mapas base en formato WebP / PNG
│   └── stickers/               # Recursos vectoriales de stickers y pines
├── src/                        # Código fuente de la aplicación
│   ├── app/
│   │   └── bootstrap.js        # Inicialización, DI, carga de config y reactividad
│   ├── components/             # Paneles laterales y componentes UI reutilizables
│   │   ├── AccessibilityPanel.js
│   │   ├── ExternalLinksPanel.js
│   │   ├── HelpPanel.js
│   │   ├── MapSelector.js      # Buscador y catálogo de mapas
│   │   └── Sidebar.js          # Barra lateral con navegación por solapas
│   ├── core/                   # Lógica de negocio y servicios centrales
│   │   ├── accessibility/      # Gestor de preferencias de accesibilidad
│   │   ├── analytics/          # Integración segura con Google Analytics 4
│   │   ├── canvas/             # Adaptadores de Fabric, herramientas y fábrica de figuras
│   │   │   ├── history/        # Historial Deshacer/Rehacer (Patrón Memento)
│   │   │   └── tools/          # Estrategias de dibujo (Pincel, Figuras, Texto, etc.)
│   │   ├── export/             # Servicio de exportación a imagen, PDF e impresión
│   │   ├── persistence/        # Persistencia en localStorage con debouncing
│   │   ├── pwa/                # Gestor de instalación PWA y ciclo de vida de SW
│   │   ├── repositories/       # Repositorios de datos (Mapas, Configuración, Stickers)
│   │   └── utils/              # Helpers: compresión, throttling, resize manager
│   ├── features/               # Módulos y controles contextuales
│   │   ├── clear-confirm-modal/# Confirmación para limpiar el lienzo
│   │   ├── color-palette/      # Paleta de colores, selector personalizado y grosor
│   │   ├── context-menu/       # Menú contextual sobre objetos seleccionados
│   │   ├── export-modal/       # Diálogo modal de exportación y previsualización
│   │   ├── help-tour/          # Recorrido guiado, modal de bienvenida y almacenamiento
│   │   ├── stickers-panel/     # Selector de decoraciones y marcadores
│   │   ├── toolbar/            # Barra de herramientas flotante con submenús
│   │   └── Component.js        # Clase base con ciclo de vida y gestión de listeners
│   ├── state/
│   │   └── AppStore.js         # Estado global predecible (patrón Store / Dispatcher)
│   ├── styles/                 # Arquitectura CSS estructurada (Tokens, Layouts, Temas)
│   └── main.js                 # Punto de entrada de la aplicación y registro de iconos
├── index.html                  # Plantilla HTML base e inyección de etiquetas globales
├── vite.config.js              # Configuración de empaquetado, PWA y runtime caching
└── package.json                # Dependencias y scripts de desarrollo
```

---

## 🧩 Patrones de Arquitectura

1. **Store Reactivo Unidireccional (`AppStore`)**:
   Implementación ligera de arquitectura basada en flujo unidireccional. Los componentes se suscriben a cambios de estado (`activeMapId`, `activeTool`, `zoomLevel`, `accessibilitySettings`) sin acoplarse directamente entre sí.
2. **Ciclo de Vida de Componentes (`Component`)**:
   Clase base que encapsula el montaje (`mount`), desmontaje (`unmount`) y el registro de eventos DOM (`addEvent`) garantizando la eliminación limpia de listeners y previniendo fugas de memoria.
3. **Patrón Estrategia para Herramientas de Dibujo (`BaseTool`)**:
   Cada herramienta del lienzo (`BrushTool`, `PolygonTool`, `TextTool`, etc.) hereda de `BaseTool` e implementa sus propios manejadores para eventos de mouse/touch, desacoplando la interacción de la lógica interna de `FabricAdapter`.
4. **Patrón Memento para Deshacer/Rehacer (`HistoryManager`)**:
   Captura instantáneas serializadas del lienzo para posibilitar navegación por el historial (`undo`/`redo`) respetando el mapa base y los objetos modificados.
5. **Render Offscreen para Exportación**:
   La generación de imágenes de alta resolución y vistas previas clona el lienzo en memoria de forma aislada, evitando parpadeos visuales en la interfaz del usuario.

---

## ⚙️ Instalación y Puesta en Marcha

### Requisitos previos

- **[Node.js](https://nodejs.org/)**: Versión 18.0 o superior recomendada.
- **npm**: Versión 9.0 o superior.

### 1. Clonar el repositorio

```bash
git clone https://github.com/IGN-Argentina/IGN-mapas-escolares-V2.git
cd IGN-mapas-escolares-V2
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```
La aplicación quedará disponible en el navegador (habitualmente en `http://localhost:5173/`).

---

## 📜 Scripts Disponibles

En el directorio del proyecto se pueden ejecutar los siguientes comandos:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con recarga en caliente (HMR). |
| `npm run build` | Compila el código, procesa assets, genera el Service Worker de la PWA y genera el bundle optimizado en `/dist`. |
| `npm run preview` | Sirve localmente el contenido de `/dist` para inspeccionar el comportamiento de producción. |
| `npm test` | Ejecuta la suite de pruebas unitarias y de regresión con Vitest en modo ejecución única (`vitest run`). |
| `npm run lint` | Ejecuta ESLint sobre todos los archivos JavaScript del directorio `src/`. |
| `npm run format` | Aplica el formateador Prettier sobre los archivos fuente. |

---

## 🔧 Personalización y Configuración (`config.json`)

La aplicación carga su configuración en tiempo de ejecución desde `public/config/config.json`. Esto permite adaptar contenidos sin necesidad de recompilar la aplicación:

```json
{
  "defaultMapId": "argentina",
  "mapImageSource": "imagePath",
  "maps": [
    {
      "id": "argentina",
      "name": "Mapa de Argentina Bicontinental",
      "thumbnailUrl": "/maps/thumbnails/argentina.png",
      "imagePath": "/maps/ARG-BICO-Nº3-mudo-2021.webp",
      "category": "otros",
      "isPortrait": true
    }
  ],
  "theme": {
    "primary": "#41C0F0",
    "secondary": "#9678ce",
    "accent": "#EEC461",
    "background": "#FAFAFA"
  },
  "export": {
    "filenamePrefix": "IGN_Escolar_"
  }
}
```

- **`maps`**: Define la lista de mapas disponibles, sus rutas, orientación (`isPortrait`) y categoría (`"provincia"` u `"otros"`).
- **`theme`**: Inyecta variables CSS en tiempo de ejecución (`:root`) para personalizar la paleta institucional.
- **`export.filenamePrefix`**: Prefijo por defecto que tendrán los archivos descargados.

---

## 📊 Telemetría y Analítica (Google Analytics 4)

La aplicación integra la etiqueta **Google Tag (`gtag.js`)** con medición orientada a conocer el uso pedagógico de la herramienta:

- **Descarga de Mapas**: Al exportar a PDF, PNG o JPG se emiten dos eventos sincronizados:
  - `map_download`: Evento personalizado con los parámetros `map_name`, `map_id`, `format` y `file_name` (configurable como Evento Clave / Conversión en GA4).
  - `file_download`: Evento nativo de GA4 que se integra automáticamente con los informes de medición mejorada.
- **Visualización / Selección**: Emite `select_content` con el `item_name` del mapa al cargarlo en el lienzo.
- **Impresión**: Registra el evento `map_print` cuando el usuario utiliza la función de imprimir.
- **Consentimiento de Usuario**: Informado de manera transparente en la ventana de bienvenida inicial (`TourWelcomeModal`).

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con una cobertura integral de pruebas unitarias y de regresión escritas para **Vitest** en `src/**/__tests__/`:

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo observador (watch)
npx vitest

# Ejecutar pruebas de un módulo específico (ej. analítica y exportación)
npx vitest src/core/analytics/ src/core/export/
```

Las suites cubren:
- Operaciones del lienzo, manejo de eventos touch y redimensionado responsivo.
- Herramientas de dibujo y cálculo de polígonos.
- Pila de historial Memento y persistencia con cuota controlada.
- Generación de salidas PDF/imagen y verificación de llamadas a analítica.
- Navegación y componentes accesibles del tour guiado.

---

## 🏛️ Créditos y Licencia

Desarrollado para el **Instituto Geográfico Nacional (IGN)** de la República Argentina.  
Todos los mapas oficiales, logotipos e insignias cartográficas son propiedad del Instituto Geográfico Nacional.
