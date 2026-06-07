# Block — Brand Brief & Design System UI

---

## 1. BRAND BRIEF

### Nombre
**Block** *(working title)*

### Tagline
> *"Tu día, en bloques."*

---

### Propósito
Block es una app para personas que manejan múltiples roles en su día — trabajos, proyectos, hábitos — y necesitan organizar su tiempo de forma simple, visual y sin fricción.

No es un gestor de tareas. No es un calendario. Es un organizador de bloques de tiempo donde cada bloque tiene sus propias tareas.

---

### Personalidad de marca

| Atributo | Descripción |
|---|---|
| **Cercana** | Te habla de tú. Como un amigo organizado que te ayuda a armar el día. |
| **Simple** | Una cosa a la vez. Sin formularios. Sin configuraciones infinitas. |
| **Directa** | Sin rodeos. Pregunta lo justo, hace lo necesario. |
| **Humana** | Tiene humor sutil. Celebra cuando completás cosas. No te juzga si no lo hacés. |
| **Enfocada** | No hace todo. Hace una cosa muy bien. |

---

### Voz y tono

**Principios:**
- Tuteo siempre
- Preguntas cortas, no instrucciones
- Sin tecnicismos ni palabras de app corporativa
- Humor sutil y natural, nunca forzado
- Celebra los logros pequeños

**Ejemplos de voz:**

| ❌ No | ✅ Sí |
|---|---|
| "Configura tu marco horario" | "¿A qué hora arrancas tu día?" |
| "Agregar evento fijo" | "¿Desayunás? ¿A qué hora más o menos?" |
| "Selecciona días de repetición" | "¿Esto es tu lunes a viernes o cambia?" |
| "No hay bloques configurados" | "Aún no tenés bloques para hoy. ¿Arrancamos?" |
| "Tarea completada exitosamente" | "Todo listo por aquí 👌" |
| "Error al guardar" | "Algo falló, probá de nuevo" |

---

### Propuesta de valor
> Definís tu día en minutos. Bloques claros, tareas dentro de cada uno, y la app hace el resto.

---

### Usuarios

Cualquier persona que maneje múltiples responsabilidades en su día. No requiere conocimiento técnico ni experiencia con apps de productividad.

**Perfil típico:**
- Trabaja en más de un proyecto o trabajo
- Quiere incluir hábitos (deporte, alimentación) en su rutina
- Se frustra con apps complejas o que no se adaptan a su ritmo
- Necesita visualizar su día, no solo listar tareas

---

### Competidores
Apps genéricas de to-do, calendarios, time blockers — ninguno combina los tres con onboarding conversacional y voz humana.

**Diferenciador clave:** Block no te pide que aprendas cómo funciona. Vos le contás cómo es tu día y él se adapta.

---

---

## 2. DESIGN SYSTEM UI

---

### Plataforma
Mobile first — iOS / Android (PWA o React Native)
Light mode por defecto. Dark mode disponible desde ajustes.

---

### Paleta de colores

#### Base
```
--color-bg:         #F8F8F8   /* Fondo principal */
--color-surface:    #FFFFFF   /* Cards, bloques */
--color-surface-2:  #F0F0F0   /* Inputs, elementos secundarios */
--color-border:     #E0E0E0   /* Bordes sutiles */
```

#### Primarios
```
--color-primary:      #C8F135   /* Verde lima — acción principal */
--color-primary-dark: #A8CC1A   /* Hover / pressed */
```

#### Texto
```
--color-text-primary:   #0F0F0F
--color-text-secondary: #666666
--color-text-disabled:  #BBBBBB
```

#### Tipos de bloque
```
--block-trabajo:        #4B7BF5   /* Azul */
--block-deporte:        #F5A623   /* Naranja */
--block-comida:         #5EC26A   /* Verde */
--block-emprendimiento: #C8F135   /* Lima */
--block-fijo:           #555555   /* Gris — sin tareas */
--block-otro:           #A78BFA   /* Violeta */
```

#### Estados
```
--color-success:  #5EC26A
--color-warning:  #F5A623
--color-error:    #F55252
```

---

### Tipografía

#### Familias
```
Display / Títulos:    "Syne"            — Bold 700
Body / UI:            "DM Sans"         — Regular 400 / Medium 500
Horas / datos:        "JetBrains Mono"  — Regular 400
```

#### Escala
```
--text-xs:    11px   /* Labels, badges */
--text-sm:    13px   /* Texto secundario */
--text-base:  15px   /* Body estándar */
--text-md:    17px   /* UI principal */
--text-lg:    22px   /* Subtítulos */
--text-xl:    28px   /* Preguntas onboarding */
--text-2xl:   36px   /* Títulos de pantalla */
```

#### Reglas
- Line-height base: 1.5
- Letter-spacing display: -0.02em
- Sin texto menor a 12px en body
- Horas siempre en JetBrains Mono

---

### Espaciado (base 4px)

```
--space-1:   4px    /* Micro gaps */
--space-2:   8px    /* Spacing interno de componentes */
--space-3:   12px   /* Padding cards pequeñas */
--space-4:   16px   /* Padding estándar */
--space-6:   24px   /* Separación de secciones */
--space-8:   32px   /* Separación mayor */
--space-12:  48px   /* Sección completa */
```

---

### Bordes y radios

```
--radius-sm:    6px      /* Tags, badges */
--radius-md:    12px     /* Cards, inputs */
--radius-lg:    16px     /* Bloques en timeline */
--radius-xl:    24px     /* Modales, sheets */
--radius-full:  9999px   /* Pills, toggles */
```

---

### Sombras

```
--shadow-card:   0 1px 3px rgba(0,0,0,0.4)
--shadow-block:  0 4px 12px rgba(0,0,0,0.5)
--shadow-modal:  0 8px 32px rgba(0,0,0,0.7)
```

---

### Iconografía

```
Librería:        Lucide Icons
Tamaño estándar: 20px
Stroke:          1.5px
```

**Reglas:**
- Sin emojis como iconos estructurales
- Un solo estilo (outline) en toda la app
- Íconos de navegación: 22px
- Tamaño mínimo de área táctil: 44×44px

---

### Componentes

#### Bloque en timeline
```
Fondo:          color del tipo al 12% de opacidad
Borde izquierdo: 3px sólido color del tipo
Texto nombre:   DM Sans Medium 15px, color texto primario
Texto horario:  JetBrains Mono 12px, color texto secundario
Radio:          --radius-lg

Estado activo:
  → Borde color al 100% + glow sutil (box-shadow 0 0 12px color/30%)
  → Badge "Ahora" en Primary

Estado pasado:
  → Opacidad global 40%

Estado futuro:
  → Normal
```

#### Tarea
```
Alto mínimo:    48px (touch target)
Check:          Círculo outline 20px → completado: relleno Primary + checkmark negro
Prioridad dot:  6px círculo — rojo/amarillo/verde
Texto:          DM Sans Regular 15px
Completada:     tachado + opacidad 50%
Swipe izquierda: fondo error, ícono trash
Hold:           handle visible + haptic
```

#### Bottom Sheet — Panel de tareas
```
Handle bar:     40×4px, gris, centrado, radio full
Fondo:          Surface con blur 20px
Radio superior: --radius-xl
Scrim:          rgba(0,0,0,0.5)
Animación:      spring — stiffness 300, damping 30
```

#### Botón primario
```
Fondo:    --color-primary (#C8F135)
Texto:    #0F0F0F — DM Sans Medium 16px
Alto:     52px
Radio:    --radius-md
Pressed:  --color-primary-dark + scale 0.97
Disabled: opacidad 30%
```

#### Botón secundario
```
Fondo:    transparente
Borde:    1px --color-border
Texto:    --color-text-primary
Alto:     52px
Radio:    --radius-md
```

#### Input
```
Fondo:    --color-surface-2
Borde:    1px --color-border
Focus:    1px --color-primary
Alto:     52px
Radio:    --radius-md
Font:     DM Sans Regular 16px
```

#### Toggle
```
Off: fondo --color-surface-2, thumb blanco
On:  fondo --color-primary, thumb negro
Tamaño: 50×28px
Animación: 200ms ease
```

#### Badge de prioridad
```
High:   fondo #F55252/15%, texto #F55252, label "Alta"
Medium: fondo #F5A623/15%, texto #F5A623, label "Media"
Low:    fondo #5EC26A/15%, texto #5EC26A, label "Baja"
Radio:  --radius-full, padding 4px 8px
Font:   DM Sans Medium 11px
```

---

### Onboarding — Componentes específicos

#### Pantalla de pregunta
```
Una pregunta por pantalla
Pregunta: Syne Bold 28px, centrada
Subtexto: DM Sans Regular 15px, --color-text-secondary
Input o selector: grande, fácil de tocar
CTA: botón primario full width abajo
Barra de progreso: 4px alto, Primary, arriba de la pantalla
```

#### Selector de hora
```
Wheel picker nativo o custom grande
Sin teclado numérico — reduce fricción
```

#### Toggle Sí/No
```
Dos opciones grandes, lado a lado
Seleccionada: fondo Primary, texto negro
No seleccionada: fondo Surface-2
Radio: --radius-lg
Alto: 56px
```

---

### Animaciones

```
Transiciones estándar:    200–300ms ease-out
Spring (sheets/modales):  stiffness 300, damping 30
Completar tarea:          check scale 0 → 1.2 → 1, 250ms
Bloque activo:            pulso sutil opacity 100%→80%→100%, 4s loop
Cambio de vista:          fade + slide Y 12px, 250ms
Eliminar tarea:           slide X + fade, 200ms
Onboarding avance:        slide X + fade, 300ms
```

**Reglas:**
- Sin animaciones decorativas puras — todas comunican algo
- Respetar `prefers-reduced-motion`
- Máximo 300ms para micro-interacciones

---

### Navegación

```
Bottom Tab Bar — 4 ítems:
  Hoy       → ícono: Sun
  Semana    → ícono: Calendar
  Tareas    → ícono: CheckSquare
  Ajustes   → ícono: Settings

Alto tab bar:  56px + safe area bottom
Ícono activo:  Primary (#C8F135)
Ícono inactivo: --color-text-secondary
Label: DM Sans Medium 10px
```

---

### Estados vacíos

```
Ícono ilustrativo (Lucide, 48px, color-text-disabled)
Título: DM Sans Medium 17px
Mensaje: DM Sans Regular 15px, color-text-secondary
CTA opcional: botón secundario
```

**Mensajes por pantalla:**
```
Sin bloques hoy:    "Aún no tenés bloques para hoy. ¿Arrancamos?"
Sin tareas:         "Este bloque está libre. Agregá lo que necesitás."
Todo completado:    "Todo listo por aquí 👌"
Sin semana config:  "Tu semana está en blanco. Buen momento para armarla."
```

---

### Dark Mode (tokens alternativos)

```
--color-bg:         #0F0F0F
--color-surface:    #1A1A1A
--color-surface-2:  #242424
--color-border:     #2E2E2E
--color-text-primary:   #F5F5F5
--color-text-secondary: #888888
--color-text-disabled:  #444444
```
Primary y colores de bloque se mantienen igual.

---

### Accesibilidad

- Contraste texto primario: mínimo 4.5:1 ✓
- Contraste texto secundario: mínimo 3:1 ✓
- Touch targets: mínimo 44×44px en todos los elementos interactivos
- Focus rings visibles en navegación por teclado
- Aria-labels en íconos sin texto
- Color nunca es el único indicador — siempre acompañado de texto o ícono
- Soporte Dynamic Type (escalado de texto del sistema)

---

*Block — Brand Brief & Design System v1.0*