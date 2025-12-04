# Requirements.md
**Functional & Non-Functional Requirements for VENDRA — Voice-Based P2C Sales Training Simulator**

---

# 1. Overview

VENDRA es un producto diseñado para entrenar a vendedores P2C mediante simulaciones de llamadas con clientes generados por IA.
El objetivo principal es mejorar el cierre de ventas mediante práctica realista, análisis accionables y feedback inmediato.

Este documento define todos los requerimientos funcionales, no funcionales y operativos necesarios para el producto.

---

# 2. Core Requirements Summary

- Simulación realista de llamadas basadas en voz (vendedor habla, cliente responde en texto).
- Generación de persona cliente ficticia, realista y contextualizada al Perú.
- Personalización completa del escenario de venta.
- Llamadas de 5–20 minutos configurables.
- Cliente puede interrumpir, cambiar de tema o incluso colgar.
- Análisis detallado post-conversación con score, checklist, momentos clave.
- No requiere historial persistente completo salvo análisis.
- Interacción vía web/app, cliente IA responde solo por texto.
- El vendedor recibe la transcripción de lo que dice la IA.
- Varia la personalidad psicológica del cliente (semi-aleatoria).
- Ficha detallada del cliente generada por IA (opcional de ocultar).
- Integración con OpenAI exclusivamente.
- No se necesita un backend Python — toda la lógica corre en Next.js + Node + TS.

---

# 3. User Input Requirements (Scenario Config)

El vendedor debe poder configurar:

### 3.1 Datos básicos del escenario
- Nombre del producto/servicio
- Descripción breve
- Precio, planes y condiciones (opcional)
- Objetivo de la llamada (descubrimiento, cierre, seguimiento, llamada fría, etc.)
- Tipo de contacto:
  - Llamada fría
  - Seguimiento
  - WhatsApp/Meta → llamada (simulación igual por voz)

### 3.2 Información del User Persona (genérica)
- Edad promedio del target
- Género opcional
- Localización típica (Perú / ciudad / zona general)
- Nivel socioeconómico esperado
- Nivel educativo
- Dolor(es) más comunes
- Deseos/motivaciones
- Canal preferido (WhatsApp, llamada, etc.)
- Estilo de decisión (rápido, lento, racional, emocional…)

### 3.3 Parámetros de simulación
- Duración máxima estimada (5 / 10 / 15 / 20 min)
- Intensidad del cliente (tranquilo → difícil)
- Nivel de realismo requerido
- Opción: permitir colgadas reales por parte del cliente IA

---

# 4. Simulation Requirements

### 4.1 Cliente simulado
Debe ser:
- Humanamente realista
- Con errores naturales
- Con micro-contradicciones
- Influido por el user persona pero con rasgos propios
- Capaz de interrumpir cuando lo considere
- Capaz de colgar por frustración, desinterés o mala conducción del vendedor

### 4.2 Interacción
- Vendedor habla por voz → STT (OpenAI Whisper)
- Cliente responde por texto (no voz por ahora)
- El vendedor ve:
  - Transcripción del cliente
  - Indicadores si hubo interrupción
  - Si el cliente está perdiendo interés (meta)

### 4.3 Ficha del cliente
Debe incluir:
- Nombre
- Edad
- Ubicación exacta
- NSE
- Nivel educativo
- Ocupación
- Motivaciones
- Dolor principal
- Personalidad psicológica (2–3 rasgos)
- Canal preferido
- Historia breve o detalles de contexto (opcional)
- Opciones:
  - Mostrar completa
  - Minimizada
  - Oculta

---

# 5. Analysis Requirements

### 5.1 Inmediato post-simulación
- Score global 0–100
- Lista de aciertos
- Lista de oportunidades de mejora con accionables
- Momentos clave con:
  - Turno ID
  - Cita textual
  - Explicación
  - Recomendación específica

### 5.2 Dimensiones evaluadas:
- Rapport
- Descubrimiento
- Valor
- Manejo de objeciones
- Avance hacia cierre
- Comunicación
- Control de la llamada
- Uso del tiempo

---

# 6. Backend Requirements

- Next.js (App Router)
- Node.js + TypeScript
- Drizzle ORM + Postgres
- OpenAI:
  - Chat/completions
  - Audio/transcriptions
- No Python en MVP
- Rutas API Server Actions
- Arquitectura modular:
  - PersonaEngine
  - ConversationOrchestrator
  - AnalysisEngine
  - AudioGateway
  - SessionService

---

# 7. Frontend Requirements

### 7.1 UI/UX
- Minimalista, profesional
- Branding azul, verde, amarillo
- Tipografías Inter + Source Sans Pro
- shadcn/ui + Tailwind
- Chat style modern
- Botón grande “Hablar”
- Ficha del cliente a la derecha

### 7.2 Páginas
- `/configuracion`
- `/simulacion/[sessionId]`
- `/resultado/[sessionId]`

---

# 8. Non-Functional Requirements

- Alta disponibilidad (Vercel)
- Latencia baja para STT (<3s)
- Confidencialidad: no compartir datos
- Escalabilidad horizontal simple
- Logging estructurado
- Posibilidad de borrar histórico post-análisis

---

# 9. Future Expansion (Non-MVP)
- TTS para voz del cliente
- Panel de equipo
- Integración con CRM
- Modo entrevistas laborales
- Simulaciones B2B
