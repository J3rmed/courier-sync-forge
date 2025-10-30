# Sistema de Accesibilidad - CourierSync

## Descripción General

El sistema de accesibilidad de CourierSync permite a usuarios con discapacidad visual parcial ajustar la visualización de la aplicación según sus necesidades específicas.

## Características Implementadas

### 1. Ajuste de Tamaño de Fuente

**Niveles disponibles:**
- **Normal** (16px base): Tamaño estándar
- **Grande** (18px base): Aumento del 12.5%
- **Extra Grande** (20px base): Aumento del 25%

**Cómo funciona:**
- El tamaño se aplica al elemento raíz (`html`) usando `font-size`
- Todos los componentes usan unidades relativas (rem, em) que escalan proporcionalmente
- El diseño se mantiene intacto sin desbordamientos ni superposiciones

**Controles:**
- Botón "Disminuir" - Reduce un nivel (mínimo: Normal)
- Botón "Aumentar" - Incrementa un nivel (máximo: Extra Grande)

### 2. Modo Alto Contraste

**Características:**
- Fondo negro (0% luminosidad)
- Texto blanco (100% luminosidad)
- Colores primarios en amarillo brillante
- Elementos de éxito en verde neón
- Bordes más gruesos y definidos (2px)
- Sin sombras ni efectos visuales

**Beneficios:**
- Mayor legibilidad para usuarios con baja visión
- Reducción de fatiga visual
- Mejor distinción entre elementos interactivos

### 3. Persistencia de Configuración

**Almacenamiento:**
Las preferencias se guardan en `localStorage` con la clave `couriersync:accessibility`:

```json
{
  "fontSize": "large",
  "contrastMode": "high"
}
```

**Comportamiento:**
- Las preferencias se cargan automáticamente al iniciar la aplicación
- Los cambios se guardan instantáneamente
- La configuración persiste entre sesiones y recargas de página
- Funciona sin necesidad de autenticación

### 4. Menú de Accesibilidad

**Ubicación:**
Botón flotante circular en la esquina inferior derecha con icono de ojo

**Contenido del menú:**
1. Controles de tamaño de texto con indicador del nivel actual
2. Toggle de modo alto contraste con indicador de estado
3. Botón para restablecer valores por defecto
4. Mensaje confirmando que las preferencias se guardan automáticamente

## Arquitectura Técnica

### Contexto de Accesibilidad

**Archivo:** `src/contexts/AccessibilityContext.tsx`

```typescript
interface AccessibilityContextType {
  fontSize: 'normal' | 'large' | 'extra-large';
  contrastMode: 'normal' | 'high';
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleContrastMode: () => void;
  resetSettings: () => void;
}
```

**Funcionalidades:**
- Gestión de estado global de accesibilidad
- Sincronización con localStorage
- Aplicación de atributos data-* al documento

### Componente de Menú

**Archivo:** `src/components/AccessibilityMenu.tsx`

**Características:**
- Botón flotante con posición fija
- Dropdown responsivo con Card
- Feedback visual con badges
- Notificaciones toast para confirmar acciones
- Botones deshabilitados en límites (min/max)

### Estilos CSS

**Archivo:** `src/index.css`

**Selectores clave:**
```css
/* Tamaño de fuente */
:root { font-size: 16px; }
[data-font-size="large"] { font-size: 18px; }
[data-font-size="extra-large"] { font-size: 20px; }

/* Modo alto contraste */
[data-contrast="high"] {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  /* ... más variables de color */
}
```

## Cumplimiento de Criterios de Aceptación

### ✅ Escenario 1: Ajuste del tamaño de fuente
- **Cumplido:** Botón "Aumentar" incrementa el texto proporcionalmente
- **Validación:** No se altera el diseño, todo mantiene su posición
- **Feedback:** Toast notifica el cambio

### ✅ Escenario 2: Reducción del tamaño de fuente
- **Cumplido:** Botón "Disminuir" reduce el texto
- **Validación:** Proporción y alineación se mantienen correctas
- **Límite:** No permite reducir por debajo del tamaño normal

### ✅ Escenario 3: Activación de modo alto contraste
- **Cumplido:** Toggle cambia colores a alto contraste
- **Validación:** Texto claro (blanco) sobre fondo oscuro (negro)
- **Extras:** Bordes más gruesos, sin sombras

### ✅ Escenario 4: Persistencia de configuración
- **Cumplido:** localStorage guarda las preferencias
- **Validación:** Al recargar la página, las preferencias se restauran
- **Alcance:** Funciona para todos los usuarios (con o sin login)

## Guía de Uso para Usuarios

### Acceder al Menú de Accesibilidad

1. Busca el botón circular con icono de ojo en la esquina inferior derecha
2. Haz clic para abrir el menú de opciones

### Aumentar el Tamaño del Texto

1. Abre el menú de accesibilidad
2. En la sección "Tamaño de Texto", haz clic en "Aumentar"
3. El texto crecerá inmediatamente
4. Puedes aumentar hasta el nivel "Extra Grande"

### Reducir el Tamaño del Texto

1. Abre el menú de accesibilidad
2. En la sección "Tamaño de Texto", haz clic en "Disminuir"
3. El texto se reducirá hasta el tamaño "Normal"

### Activar Alto Contraste

1. Abre el menú de accesibilidad
2. En la sección "Contraste", haz clic en "Activar Alto Contraste"
3. La interfaz cambiará a colores de alto contraste
4. Para desactivar, haz clic en "Desactivar Alto Contraste"

### Restablecer Configuración

1. Abre el menú de accesibilidad
2. Haz clic en "Restablecer Valores"
3. Todas las opciones volverán a sus valores predeterminados

## Pruebas de Accesibilidad

### Casos de Prueba Manual

**CP-1: Aumento progresivo de fuente**
1. Abrir menú de accesibilidad
2. Hacer clic 2 veces en "Aumentar"
3. Verificar que el texto está en nivel "Extra Grande"
4. Verificar que el botón "Aumentar" está deshabilitado

**CP-2: Alto contraste con texto grande**
1. Aumentar fuente a nivel "Grande"
2. Activar modo alto contraste
3. Verificar que ambas configuraciones se aplican simultáneamente
4. Recargar página
5. Verificar que ambas configuraciones persisten

**CP-3: Navegación entre páginas**
1. Configurar tamaño grande + alto contraste
2. Navegar por todas las páginas de la app
3. Verificar que la configuración se mantiene en todas las rutas

**CP-4: Restablecer valores**
1. Aplicar cualquier configuración personalizada
2. Hacer clic en "Restablecer Valores"
3. Verificar que todo vuelve al estado normal

### Verificación de Responsive Design

- **Desktop (>1024px):** Menú se abre a la derecha del botón
- **Tablet (768-1023px):** Menú mantiene ancho completo (320px)
- **Mobile (<768px):** Menú se adapta al ancho de pantalla

## Extensibilidad Futura

### Funcionalidades Adicionales Sugeridas

1. **Espaciado de texto:** Aumentar line-height y letter-spacing
2. **Modo monocromático:** Escala de grises completa
3. **Navegación por teclado mejorada:** Focus visible más claro
4. **Lector de pantalla:** Atributos ARIA completos
5. **Tema dyslexia-friendly:** Fuente OpenDyslexic

### Cómo Agregar Nuevos Niveles de Fuente

1. Actualizar type `FontSize` en `AccessibilityContext.tsx`:
```typescript
type FontSize = 'normal' | 'large' | 'extra-large' | 'huge';
```

2. Agregar CSS en `index.css`:
```css
[data-font-size="huge"] {
  font-size: 22px;
}
```

3. Actualizar lógica en `increaseFontSize()` y `getFontSizeLabel()`

### Cómo Agregar Nuevos Modos de Contraste

1. Crear nuevo tipo en contexto:
```typescript
type ContrastMode = 'normal' | 'high' | 'inverted';
```

2. Definir variables CSS para el nuevo modo:
```css
[data-contrast="inverted"] {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  /* ... */
}
```

## Soporte y Mantenimiento

### Problemas Conocidos
- Ninguno reportado actualmente

### Compatibilidad de Navegadores
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Reportar Problemas
Si encuentras algún problema con las funciones de accesibilidad, por favor incluye:
- Navegador y versión
- Sistema operativo
- Configuración aplicada (tamaño + contraste)
- Página donde ocurre el problema
- Captura de pantalla si es posible
