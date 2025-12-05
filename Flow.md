# User Flows

This document outlines three end-to-end flows that represent how a salesperson uses Vendra. Each flow lists the intent, the main path, and the expected outcomes that should be verified in tests.

## 1) Configurar un escenario de práctica
- **Objetivo:** Crear una sesión de simulación con un cliente generado a partir de los datos del producto y del perfil objetivo.
- **Inicio:** Usuario autenticado ingresa a `/configuracion`.
- **Pasos principales:**
  1. Completar los datos del producto (nombre, objetivo de la llamada, descripción, precio opcional) y seleccionar el tipo de contacto.
  2. Describir el perfil objetivo (rango de edad, ubicación, nivel socioeconómico, nivel educativo, estilo de decisión, canal preferido, motivaciones y pains).
  3. Ajustar las preferencias de simulación (duración máxima, permitir colgar, intensidad del cliente y realismo).
  4. Enviar el formulario para generar la persona y la sesión.
- **Resultado esperado:** Se muestra el panel "Cliente generado" con los datos de la persona sintética y un enlace directo para continuar a `/simulacion/{sessionId}`.

## 2) Practicar la simulación y cerrar la llamada
- **Objetivo:** Conversar con el cliente simulado, recibir respuestas de la IA y finalizar la sesión cuando el vendedor lo decida.
- **Inicio:** Usuario ingresa a `/simulacion/{sessionId}` con una sesión activa.
- **Pasos principales:**
  1. Revisar los datos del cliente en la barra lateral.
  2. Grabar un mensaje (o reintentar) para enviarlo al orquestador.
  3. Ver la respuesta del cliente en el chat, incluyendo interés y avisos de finalización.
  4. Si el vendedor quiere terminar, abrir el diálogo "Terminar llamada" y confirmar.
- **Resultado esperado:** El chat incluye los turnos del vendedor y del cliente. Al confirmar el final de la llamada se marca la sesión como finalizada y se redirige automáticamente a `/resultado/{sessionId}`.

## 3) Generar y revisar el análisis de la simulación
- **Objetivo:** Obtener la puntuación, aciertos, oportunidades de mejora y momentos clave de la llamada.
- **Inicio:** Usuario llega a `/resultado/{sessionId}` tras completar la simulación.
- **Pasos principales:**
  1. Si no existe un análisis previo, pulsar "Generar análisis".
  2. Esperar a que el cálculo termine y se muestren los resultados.
  3. Revisar la puntuación, lista de aciertos, oportunidades de mejora y momentos clave, incluyendo las citas asociadas a cada turno.
  4. Utilizar el enlace "Nueva simulación" para volver a configurar otro escenario.
- **Resultado esperado:** Se presenta un análisis completo (score 0-100, éxitos, mejoras y momentos clave) asociado a la conversación previa y siempre accesible para revisión posterior.
