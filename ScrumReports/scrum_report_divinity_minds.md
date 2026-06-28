# 04/28/2026

# Daily Report - Team 1

## Castro Tejada Steven Lisandro

- **Yesterday:** Ajusté el diagrama del esquema de la base de datos del proyecto, alineándolo con los requerimientos definidos para el Sprint 1.
- **Today:** Apoyar en la revisión y validación del Sprint 1, asegurando coherencia entre el modelo de datos y las funcionalidades implementadas.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Administrar las invitaciones de la organizacion, ayudar en la definicion de HU #30 #33 #36 , configurar una vista de sprint 1 para el proyecto de github.
- **Today:** Configurar frontend para trabajar con firebase de forma local para pruebas.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Realicé el refinamiento del product backlog y de las historias de usuario (HUs), asegurando claridad en criterios de aceptación y alcance del Sprint 1.
- **Today:** Apoyar en la asignación de tareas del Sprint y coordinación del equipo para la ejecución del Sprint 1.
- **Blockers:** n/a.

## Merudia Calderon Dayeza

- **Yesterday:** Creación de template de las HUs con criterios de aceptación y tasks para las HUs del primer sprint.
- **Today:** Asignación de tareas del sprint y apoyo en la organización del backlog del equipo.
- **Blockers:** n/a.

## Marcos Velasquez Vela

- **Yesterday:** Aporté el diagrama inicial de la base de datos en Mermaid. Además, quedó funcional la integración de Astro con inicio de sesión mediante Google.
- **Today:** Continuaré con la configuración de la base de datos para dejarla completamente funcional. También empezaré con el desarrollo de las historias de usuario mencionadas por mis compañeros.
- **Blockers:** n/a.

---

# 04/30/2026

# Daily Report - Team 1

## Castro Tejada Steven Lisandro

- **Yesterday:** Alinee la HU de ofertas con criterios de aceptacion y prepare el diseño del indicador de descuento y el filtro en el catalogo; revise la data esperada desde backend.
- **Today:** Definir el flujo de UI para precios con descuento y estado vacio, y dejar listo el esqueleto del filtro para integrar cuando este disponible la carga de productos.
- **Blockers:** Dependencia de la HU de productos disponibles para integrar el filtro y render.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Configuré Firebase local para todos los equipos junto con seeders de productos para nuestro equipo, cerré PRs de referencia del día anterior, y participé en la definición de la HU #32 junto con el refinamiento de otras historias de usuarios.
- **Today:** Desarrollo de la HU #32.
- **Blockers:** Definir correctamente las historias de usuario.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Trabajé en el refinamiento de la historia de usuario, asegurando claridad en su definición.
- **Today:** Actualicé la historia de usuario en la planificación de GitHub para mantener coherencia con el Sprint.
- **Blockers:** n/a.

## Merudia Calderon Dayeza

- **Yesterday:** Trabajé en la definición de la HU de búsqueda y filtros, y comencé su desarrollo.
- **Today:** Continuar con el desarrollo de la HU de búsqueda y filtros.
- **Blockers:** n/a.

## Marcos Velasquez Vela

- **Yesterday:** Preparé la base de datos de productos con descripciones, imágenes y reviews; además implementé la HU de detalle de producto con navegación desde el catálogo, vista por `slug`, carga directa desde Firestore y manejo de error.
- **Today:** Realizar pruebas de la HU de detalle de producto y apoyar en la integración de las siguientes tareas del Sprint 1.
- **Blockers:** n/a.

---

# 05/05/2026

# Daily Report - Team 1

## Castro Tejada Steven Lisandro

- **Yesterday:** Reestructure y actualice la HU #205, implemente el filtro "Solo ofertas" con reglas de oferta valida, unifique logica compartida en catalogo/detalle y ajuste estados de error/vacio; ademas resolvi conflictos de merge en `ProductDetail` y valide la rama para PR.
- **Today:** Preparar y abrir PR de `ver-productos-disponibles` hacia `main`, adjuntando validaciones y cierre de pendientes del merge.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Implementé el filtro de productos por categoría (HU), incluyendo el componente `CategoryFilter` con dropdown de búsqueda, botón para quitar filtro, manejo de errores y mensajes de estado vacío, integrado en `FeaturedProducts` junto al buscador existente.
- **Today:** Integración y corrección de detalles del filtro por categoría, asegurando que cumple todos los criterios de aceptación de la HU.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Reporté bugs en las HUs de mis compañeros y realicé correcciones y mejoras en la búsqueda y en los detalles de producto.
- **Today:** Automatizaré las pruebas con Playwright y realizaré una revisión en busca de bugs.
- **Blockers:** Marcos inició la HU de productos disponibles desde la rama de detalles, lo que provocó conflictos al mergear main con el trabajo de Steven. Falta una definición más clara de HUs independientes, lo que retrasó el avance del equipo.

## Merudia Calderon Dayeza

- **Yesterday:** Finalicé la historia de usuario "Búsqueda de productos por nombre". Implementé la barra de búsqueda en el catálogo, asegurando que sea case-insensitive, gestione correctamente la limpieza de filtros (botón X / ESC), los mensajes de estado vacío y el límite de 100 caracteres.
- **Today:** Trabajaré en la resolución de bugs detectados en diferentes HUs.
- **Blockers:** Tuve un bloqueo temporal por dependencias entre HUs, pero fue solucionado.

## Marcos Velasquez Vela

- **Yesterday:** Implementé las HUs de ver productos disponibles y ver detalles de producto, incluyendo el seed del catálogo, la conexión al emulador de Firebase por entorno, el catálogo completo en FeaturedProducts, la navegación por slug, la vista ProductDetail, skeletons, badges de oferta válidos, reseñas mejoradas y una página 404 personalizada.
- **Today:** Realizar integración final y correcciones visuales y funcionales en catálogo y detalle de producto, validando ofertas, navegación, estados de error y reseñas antes del merge.
- **Blockers:** n/a.

# 05/07/2026

# Daily Report - Team 1

## Castro Tejada Steven Lisandro

- **Yesterday:** Trabajé en la corrección de algunas HUs para los siguientes sprints, que por ahora no están asignadas a ningún sprint.
- **Today:** Se realizará la definición correcta de todos los criterios de aceptación y tareas relacionadas, según las HUs, siguiendo tareas, estados y mensajes.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Trabajé en las pruebas automatizadas de detalles de producto y en la automatización del workflow de GitHub para la ejecución y generación de reportes de pruebas.
- **Today:** Planificaré y organizaré las pruebas correspondientes al Sprint 2, definiendo los escenarios y casos prioritarios a cubrir.
- **Blockers:** n/a.

## Merudia Calderon Dayeza

- **Yesterday:** Realicé pruebas para la lista de productos, incluyendo categorías, ofertas y el buscador.
- **Today:** Me preparo para el siguiente sprint: revisión de pruebas, priorización de historias de usuario y planificación de tareas.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Detecté y reporté bugs y errores funcionales en distintas HUs del Sprint 1.Además, creé y actualicé la documentación correspondiente de historias de usuario para mantener trazabilidad y claridad en los requerimientos.
- **Today:** Continuar con la validación de funcionalidades y apoyo en la corrección de errores detectados durante la integración final del Sprint 1.
- **Blockers:** n/a.

## Marcos Velasquez Vela

- **Yesterday:** Corregí los controles de expansión del detalle de producto (título y descripción), estabilicé la detección de overflow, ajusté la visibilidad del botón expandir y el alto de clamp; además actualicé dependencias menores.
- **Today:** Validar los cambios en `ProductDetail` y apoyar la integración/QA antes del merge.
- **Blockers:** n/a.

# 05/12/2026

# Daily Report - Team 1

## Castro Tejada Steven Lisandro

- **Yesterday:** En base a la reunión grupal, fui el encargado de organizar y registrar todas las ideas en tarjetas sobre el Sprint Retrospective en el tablero del equipo en Trello (aspectos positivos, puntos de mejora, felicitaciones y acuerdos a seguir).
- **Today:** Revisar y consolidar las tarjetas del retrospective junto al equipo para dejar acuerdos claros y accionables.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Hice un refinamiento completo del backlog para nuestro equipo y elaboré un plan para mejorar las pruebas y los datos de seed para todos los equipos.
- **Today:** Trabajaré en las pruebas y en los datos de seed, ademas de iniciar las nuevas historias del sprint 2.
- **Blockers:** n/a.

## Merudia Calderon Dayeza

- **Yesterday:** Cerramos el Sprint 1 con la sesión de retrospectiva. Identificamos puntos de mejora grupal y preparamos las Historias de Usuario (HUs) para el siguiente ciclo.
- **Today:** Revisar a detalle las HUs del Sprint 2 e iniciar con el desglose y asignación de tareas para arrancar formalmente las actividades.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Participé en la reunión de Sprint Retrospective aportando observaciones y mejoras del sprint. Además, trabajé en el ajuste y redacción de historias de usuario correspondientes al Sprint 2.
- **Today:** Continuar con la revisión y organización de historias de usuario pendientes para el Sprint 2.
- **Blockers:** n/a.

## Marcos Velasquez Vela

- **Yesterday:** Participé en la reunión de Sprint Retrospective junto al equipo y apoyé en la revisión y mejora de algunas historias de usuario del Sprint 2 para mantener claridad en tareas y criterios.
- **Today:** Continuar apoyando en la validación de flujos y revisión de historias de usuario pendientes.
- **Blockers:** n/a.

# 05/14/2026

## Castro Tejada Steven Lisandro

- **Yesterday:** Detalle la HU de "ver productos mas vendidos" y la deje lista con criterios de aceptacion, tareas y casos de prueba.
- **Today:** Me asigne la HU de "ver productos mas vendidos" para su desarrollo.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Trabajé en el commit e8cec3d9f9972d46dccdf5cb92b9596191eb927f: reestructuración de los seeders, actualización del setup/teardown del emulador y mejoras en las pruebas automatizadas.
- **Today:** Definiré nuevas pruebas para la nueva HU y las tareas del Sprint 2.
- **Blockers:** n/a.

## Merudia Calderon Dayeza

- **Yesterday:** Definí la HU "Gestión del carrito de compras" y seleccioné mis tareas asignadas.
- **Today:** Iniciaré el desarrollo de las tareas planificadas.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Se avanzó con la definición de la HU “Gestión del carrito de compras” y se organizaron las tareas asignadas para el desarrollo.
- **Today:** Se iniciará la implementación de las tareas planificadas correspondientes a la HU.
- **Blockers:** Ninguno.

## Velasquez Vela Marcos

- **Yesterday:** Participé en la Sprint Retrospective junto a mi grupo, apoyé en el desarrollo de la retrospective general y además revisé historias de usuario del Sprint 2 para identificar tareas y criterios pendientes.
- **Today:** Dar seguimiento a los acuerdos obtenidos en la retrospectiva y continuar con la revisión de tareas e historias de usuario del Sprint 2.
- **Blockers:** n/a.

# 05/19/2026

## Castro Tejada Steven Lisandro

- **Yesterday:** Complete el issue #34 ("Como comprador quiero ver los productos mas vendidos") en el PR #313, termine toda la seccion de preguntas y verifique que los tests pasen correctamente.
- **Today:** Dar cierre a ajustes del PR #313 del issue #34 y dejarlo listo para merge.
- **Blockers:** No avance una HU de la seccion de carrito porque otros integrantes debian hacer la base y hasta la fecha del reporte no terminaron, por lo que no pude continuar.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Implemente un login simple y un /me para automatizar las pruebas que necesitan login de un usuario, agregar pruebas automatizada de login y carrito, agregar mas criterios de aceptacion de la HU #288
- **Today:** Revisar el codigo de los demas miembros, ademas de corregir las pruebas automatizadas.
- **Blockers:** Tenia dudas con areas de otros equipos de la parte del vendedor para automatizar pruebas y reportar bugs a otros equipos pero no me respondieron, y se bloqueo la hu de reseñas por falta de analisis.

## Merudia Calderon Dayeza

- **Yesterday:** Desarrollé la vista básica /cart para iniciar el flujo e implementé la sección del resumen del pedido.
- **Today:** Mejoraré el diseño de la vista del carrito por su simplicidad actual e implementé el cálculo del envío estimado.
- **Blockers:** No estaba bien definido cómo calcular el envío estimado y la tarea de dejar reseñas de productos quedó suspendida.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Se coordinó el diseño del carrito de compras, alineando la estructura visual y los flujos de interacción con el equipo para asegurar coherencia con las demás funcionalidades del sprint.
- **Today:** Se desarrollarán los componentes necesarios para añadir productos al carrito, incluyendo la lógica de interacción entre la card de producto y el estado del carrito.
- **Blockers:** Ninguno.

## Velasquez Vela Marcos

- **Yesterday:** Trabajé en el carrito de compras. Primero completé las descripciones y criterios de las tasks pendientes. Luego implementé que el comprador pueda ver el total antes de confirmar, validar la disponibilidad de los productos y remover productos del carrito para modificar su selección. También agregué datos de prueba para poder revisar mejor el flujo.
- **Today:** Revisar el funcionamiento del carrito con el equipo y corregir cualquier detalle que salga en QA.
- **Blockers:** n/a.

# 05/21/2026

## Castro Tejada Steven Lisandro

- **Yesterday:** Complete las issues #48 y #345 (favoritos y pruebas Playwright) y deje lista la rama `feature/favorite-products`.
- **Today:** Verifique que pase todo el set de pruebas correctamente y hice el merge a `main` desde `feature/favorite-products`.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Completé los detalles del carrito de compras, corregí errores y reporté bugs detectados.
- **Today:** Realizar revisiones finales en staging antes de la demo, preparar los datos de seed y alistar el script de despliegue a producción.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Desarrollé el panel del carrito de compras, implementando la funcionalidad para añadir productos al carrito, modificar sus cantidades y persistir el estado mediante localStorage.
- **Today:** Realizar pruebas y revisiones finales del carrito antes de la demo, validando el flujo completo de interacción.
- **Blockers:** Ninguno.

## Merudia Calderon Dayeza

- **Yesterday:** Finalicé las tareas para mostrar el total del carrito y para eliminar un producto del mismo.
- **Today:** Realizar pruebas y revisiones en busca de errores previos a la demo.
- **Blockers:** n/a.

## Velasquez Vela Marcos

- **Yesterday:** Continué trabajando en la HU del carrito de compras, mejorando validaciones, flujo de actualización y corrigiendo detalles encontrados en pruebas. También apoyé en la estabilización de pruebas automatizadas, revisé y definí algunas historias de usuario y tasks pendientes del sprint, y ayudé en el despliegue de Cloud Functions de otros grupos en Firebase.
- **Today:** Revisar los últimos ajustes integrados, dar seguimiento a los despliegues y continuar apoyando en la organización de tareas y validación de funcionalidades del equipo.
- **Blockers:** n/a.

# 05/26/2026

## Castro Tejada Steven Lisandro

- **Yesterday:** Agregue observaciones, acuerdos y puntos de mejora al Sprint Retrospective.
- **Today:** Revise y valide los comentarios del Sprint Retrospective junto con la documentación relacionada.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Participé en el sprint retrospective y completé la HU de agregar código para el delivery.
- **Today:** Realizar pruebas automáticas para la HU de reseñas.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Participé en la reunión de Sprint Retrospective, aportando observaciones y puntos de mejora para el equipo.
- **Today:** Revisé las tareas a realizar para el sprint actual, organizando y priorizando las actividades del equipo.
- **Blockers:** n/a.

## Velasquez Vela Marcos

- **Yesterday:** Participé en la reunión de Sprint Retrospective junto al equipo, aportando en la identificación de mejoras y acuerdos del sprint.
- **Today:** Apoyé a otro grupo con el despliegue y configuración de sus Cloud Functions en Firebase.
- **Blockers:** n/a.

## Merudia Calderon Dayeza

- **Yesterday:** Finalicé el desarrollo de la Tarea #35, implementando la funcionalidad para que el comprador pueda dejar reseñas de un producto. Incluye la opción de escribir comentarios y un sistema de calificación que permite seleccionar de 1 a 5 estrellas.
- **Today:** Me enfocaré en realizar las pruebas correspondientes a esta tarea para validar su correcto funcionamiento.
- **Blockers:** n/a.

# 05/28/2026

## Castro Tejada Steven Lisandro

- **Yesterday:** Revisé la issue #179 (HU: Identificar pedidos con fallos) que estaba en Ready for QA para validar su contexto y poder aprobarlo para el Done.
- **Today:** Iniciaré el proceso de mover todas las HU's Done restantes a Aceptado por el PO. Validaré cada una y, en caso de identificar bugs, crearé nuevas issues y las moveré al estado correspondiente en el tablero.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Optimicé el workflow de Playwright en GitHub, mejoré la integración de los Pull Requests y completé la historia de usuario para la creación de IDs de órdenes junto con su código secreto
- **Today:** Me enfocaré en implementar los tests correspondientes y continuar con la optimización de los flujos.
- **Blockers:** n/a.

## Merudia Calderon Dayeza

- **Yesterday:** Desarrollé y ejecuté las pruebas para la sección de comentarios de los productos, verificando su correcto funcionamiento
- **Today:** Continuaré con la implementación de pruebas en otras funcionalidades que lo requieran.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Revisé el sistema en su estado actual para identificar posibles mejoras funcionales y de experiencia, documentando observaciones para su posterior análisis.
- **Today:** Realicé una revisión general del sistema enfocada en la identificación de bugs, cubriendo las distintas funcionalidades para asegurar su correcto funcionamiento.
- **Blockers:** Ninguno.

## Velasquez Vela Marcos

- **Yesterday:** Implementé la historia "Identificar pedidos con fallos": una pantalla donde el Operador ve los pedidos no entregados o cancelados, abre cada uno para ver el motivo y reponer su stock al inventario con un clic (sin duplicar). Incluí datos de ejemplo y pruebas automáticas.
- **Today:** Subir los cambios, abrir el PR y coordinar la validación con el PO.
- **Blockers:** Necesito que el PO confirme quién es el "Operador" y hasta dónde llega el alcance.

# 06/02/2026

## Castro Tejada Steven Lisandro

- **Yesterday:** Aporté en la issue #179 para refinar detalles y hacer el PR. Realicé una auditoría del módulo de Flow usando GitHub CLI e identifiqué, registré y vinculé como sub-issues en el Backlog/Sprint 3 cuatro reportes oficiales de bugs (#452, #454, #455, #456) referentes a validación, responsividad y desbordamiento de texto.
- **Today:** Crear y presentar la propuesta técnica en Discussions para el rediseño del perfil `/me` basado en roles y coordinar los requerimientos de la US #24 con el equipo de Flow.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Reporte bugs en general, del happy path del sistema.
- **Today:** Algunas pruebas mas del flujo en general, priorizando los criticos.
- **Blockers:** n/a.

## Merudia Calderon Dayeza

- **Yesterday:** Reporté los bugs detectados en los roles de operador y mensajero, y revisé el flujo principal del sistema
- **Today:** Continuaré con el diseño y la ejecución de más flujos para asegurar que los resultados obtenidos sean los correctos.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Implementé las HUs de alertas de stock (#417, #418): badge "Agotado"/"No disponible" en catálogo y detalle de producto, botón "Avisarme cuando esté disponible" para productos sin stock, y Cloud Function `notificarStockDisponible` que envía correo automático al usuario cuando el stock cambia de 0 a mayor que 0.
- **Today:** Corrección del bug #463 de categorías inactivas accesibles por URL, validando la categoría contra Firestore al cargar la página y limpiando el parámetro si está inactiva.
- **Blockers:** Ninguno.

## Velasquez Vela Marcos

- **Yesterday:** Revisé el flujo de ver/editar perfil. Reporté el bug #469 (la vista `/me` existe pero no hay ningún botón que lleve a ella estando logueado) y reabrí el bug #441 (el arreglo del menú móvil se perdió en un merge del PR #468, la falla volvió a reproducir). También definí las HUs #24, #27 y #17 que estaban con la plantilla vacía, agregándoles criterios de aceptación.
- **Today:** Verifiqué las HUs en Done y dejé observaciones; la HU #20 (ver ubicación) cumple lo funcional pero su restricción de "solo pedidos asignados" está solo en la UI, parte de la deuda de reglas de Firestore abiertas.
- **Blockers:** n/a.

# 06/04/2026

## Castro Tejada Steven Lisandro

- **Yesterday:** Coordiné de manera presencial con el equipo de Flow la unificación del perfil `/me` y registré en el backlog la US contenedora (#490) con sus 5 sub-tasks (#491-#495) para el Sprint 4.
- **Today:** Analicé y deprecé las issues redundantes del backlog (#23, #26 y #190) marcándolas con la etiqueta `duplicate` y editando sus títulos en GitHub.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Revise pull request nuevos y reporte bugs de los mismos.
- **Today:** Revisar si ya se completaron correctamente los bugs reportados previamente.
- **Blockers:** n/a.

## Merudia Calderon Dayeza

- **Yesterday:**  Ejecuté pruebas de regresión en los roles de operador y mensajero para validar su funcionalidad y flujos de trabajo
- **Today:** Continuaré con las pruebas en otros roles del sistema para verificar su correcta integración con operador y mensajero.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Corregí bugs relacionados con la etiqueta de "Agotado", ajustando el cálculo de stock para reflejar correctamente la disponibilidad de los productos.
- **Today:** Solucioné problemas de responsividad en las secciones de "Mis pedidos", mejorando la experiencia de usuario en distintos dispositivos. Además, corregí un bug en la funcionalidad de notificaciones al usuario, ajustando el cálculo de stock para que los avisos se envíen correctamente cuando un producto vuelve a estar disponible.
- **Blockers:** Ninguno.

## Velasquez Vela Marcos

- **Yesterday:** Revisé las HUs de dmind del Sprint 3 (reseña de delivery, identificar pedidos con fallos, categorías inactivas) contrastando código contra criterios de aceptación; confirmé que cumplen, incluida la reposición de stock atómica que evita duplicados.
- **Today:** Revisé las HUs de mis compañeros validando que cumplieran sus criterios y las moví a "Aceptado por el PO". Además corrí las pruebas Playwright de las HUs en Docker (pedidos fallidos, flujo de delivery y reseñas) y dejé observaciones de readiness para el review.
- **Blockers:** n/a.

# 06/09/2026

## Castro Tejada Steven Lisandro

- **Yesterday:** Revisó historias de usuario pendientes y ayudó a ordenar los puntos principales para llevarlos al tablero de Trello de la Sprint Retrospective.
- **Today:** Participar en la retrospectiva y proponer acciones concretas para mejorar la coordinación del equipo.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Configuraciones del github workflow para validacion de codigo limpio con biome.
- **Today:** Corregir secciones de codigo con buenas practicas.
- **Blockers:** n/a.

## Merudia Calderon Dayeza

- **Yesterday:**  Validé y reporté los bugs encontrados, actualizando sus estados de "Ready for QA" a "Done", y revisé los flujos completos que deberian pasar para asegurar el comportamiento correcto del sistema
- **Today:** Me enfocaré en revisar las HUs del siguiente sprint para analizar los nuevos requerimientos.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Revisó historias de usuario y creó el tablero de Trello usado por el equipo para registrar ideas, acuerdos y puntos de mejora de la Sprint Retrospective.
- **Today:** Facilitar el uso del tablero durante la retrospectiva y dejar organizados los acuerdos finales.
- **Blockers:** n/a.

## Velasquez Vela Marcos

- **Yesterday:** Preparó el reporte del equipo, creó la rama de trabajo y ordenó algunas HUs para que quedaran más claras dentro del sprint.
- **Today:** Participar en la retrospectiva y registrar los compromisos que salgan para darles seguimiento.
- **Blockers:** n/a.

# 06/11/2026

## Castro Tejada Steven Lisandro

- **Yesterday:** Realicé la revisión de las HUs del Sprint 4 y documenté los criterios de aceptación pendientes en el tablero.
- **Today:** Dar soporte en la validación de los PRs abiertos y coordinar la asignación de tareas del sprint.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Refactoricé los tests automatizados para mejorar la escalabilidad, separando responsabilidades y reduciendo duplicación en los casos de prueba.
- **Today:** Continuar con la migración de los tests restantes al nuevo esquema y actualizar el workflow de CI.
- **Blockers:** n/a.

## Merudia Calderon Dayeza

- **Yesterday:** Refactoricé la estructura de los tests de integración para que sean más modulares y reutilizables entre HUs.
- **Today:** Escribir nuevos casos de prueba para las funcionalidades del Sprint 4 usando la nueva estructura.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Revisé el flujo de autenticación y reporté inconsistencias en los mensajes de error.
- **Today:** Corregir los mensajes de error en el login y validar el flujo completo con roles.
- **Blockers:** n/a.

## Velasquez Vela Marcos

- **Yesterday:** Creé el archivo de estándar de diseño para definir lineamientos visuales y buenas prácticas del proyecto.
- **Today:** Validar los seeders en conjunto con las pruebas y apoyar en la revisión de PRs.
- **Blockers:** n/a.

# 06/16/2026

## Castro Tejada Steven Lisandro
- **Yesterday:** Completé y mergeé dos Pull Requests críticas para la aplicación: la PR #562 (*Add clear cart feature and tests*) que cierra las HUs #554 y #555 (vaciado de carrito y sus pruebas e2e con Playwright); y la PR #561 (*Mejoras de estilos, favoritos y dropdown*) que resuelve las issues de diseño/funcionalidad #557, #558, #559 y #560 (favoritos en detalle de producto, etiquetas de stock agotado/no disponible y contrastes de botones).
- **Today:** Diseñé, creé y configuré en GitHub la nueva issue de Flow #564 (*Calificación promedio de entregas para Mensajero en /me*). La asigné en el tablero de proyectos (Sprint 4, Team: `flow`, Area: `usuarios`, Status: `ToDO`, Priority: `P2`, Severity: `Minor`) y la vinculé como sub-issue/tarea hija de la HU contenedora Padre #490 actualizando su descripción y checklist en GitHub.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar

- **Yesterday:** Organice los pr con su issue para tener un mejor tracking de los trabajos de los demas equipos.
- **Today:** Revisare los bugs corregidos y pr nuevos.
- **Blockers:** Los demas equipos no detallan su pr para revisar y tampoco linkean el issue que resolvieron.

## Merudia Calderon Dayeza

- **Yesterday:** Revisé las HUs de operador y comprador, detectando un bug de visualización en la interfaz del comprador que ya fue reportado
- **Today:** Continuaré con la revisión de más HUs para analizar la lógica completa de los bugs.
- **Blockers:** La falta de detalle en algunas HUs complica su revisión.

## Merino Vidal Mateo Alejandro

- **Yesterday:** Validé el flujo completo de autenticación con roles, asegurando coherencia en los mensajes para cada tipo de usuario.
- **Today:** Revisé el flujo general de la aplicación y ayudé a detectar inconsistencias visuales (contrastes, alineaciones, espaciados).
- **Blockers:** n/a.

## Velasquez Vela Marcos

- **Yesterday:** Unifiqué el sistema de UI para corregir la inconsistencia visual del sitio: documenté el estándar en un único archivo `UI.md`, agregué los tokens de color faltantes (warning, info, danger) en `global.css`, dejé una sola fuente (Inter) cargada de forma centralizada y rediseñé el logo de marca y el footer (con íconos reales de redes) usando los tokens del tema para que respeten el dark mode.
- **Today:** Apoyar a los equipos en la migración de los colores hardcodeados a los tokens y validar que las pantallas cumplan el estándar de header/footer y ancho.
- **Blockers:** n/a.


# 06/18/2026

## Castro Tejada Steven Lisandro
- **Yesterday:** Realicé el seguimiento y validación de las Pull Requests fusionadas (#670, #674) en la rama main.
- **Today:** Audité el código de la vista unificada `/me` en producción (v1.3.0), identifiqué discrepancias en el Navbar y en la visibilidad de roles para "Mis direcciones", abrí la issue de bug #686 para el Sprint 5 y creé la rama local `fix/locations-navbar-role-visibility`.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar
- **Yesterday:** Se integro la refactorizacion de los tests y reporte algunos bugs.
- **Today:** Revisar nuestro flujo de la tienda para asegurar que todo funcione.
- **Blockers:** Algunos bugs salieron y no dejaron probar el flujo general.

## Merudia Calderon Dayeza
- **Yesterday:** Ayude a crear los pom de los test para su refactorizacion.
- **Today:** Revisare escenarios para ver el estado de los diferentes roles.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro
* **Yesterday:** Realicé una revisión general de la aplicación, validando los diferentes flujos del sistema e identificando y reportando bugs encontrados durante las pruebas.
* **Today:** Continuaré con la revisión funcional de la aplicación y el seguimiento de los bugs reportados para verificar su estado y posibles correcciones.
* **Blockers:** n/a.

## Velasquez Vela Marcos
- **Yesterday:** Unifiqué y rediseñé el sistema de UI del proyecto (centralización de la fuente Inter y agregado de tokens de color claro/oscuro en `global.css`), mejoré el header (`Navbar.tsx`) y footer (`Footer.tsx`) con diseño responsivo, y abrí y planifiqué las issues de tareas de alinear todas las pantallas del sistema (#616 a #623) con el nuevo estándar de `UI.md`.
- **Today:** Apoyé a los demás equipos de desarrollo en la migración de colores hardcodeados a los tokens y verifiqué la consistencia visual y responsiva de las nuevas secciones en `/me`.
- **Blockers:** n/a.


# 06/23/2026

## Castro Tejada Steven Lisandro
- **Yesterday:** Aporté ideas y tarjetas al tablero de retrospectiva de Sprint 4 del equipo Divinity Minds (en la herramienta Trello), documentando lecciones aprendidas sobre pruebas de integración con Playwright e hidratación de componentes.
- **Today:** Realicé la limpieza y depuración de 19 ramas remotas de seguimiento en GitHub ya fusionadas en main (pertenecientes a otros equipos y al nuestro), asociadas a los Pull Requests #561, #562, #639, #668, #670, #672, #674, #676, #679, #680, #681 y #688.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar
- **Yesterday:** Llene con ideas al tablero de trello para el retrospective del sprint4 y actualice el status de las historias del sprint 3.
- **Today:** Revisar historias del sprint 4 para confirmar que no tienen bugs.
- **Blockers:** Algunas historias no tienen un pr linkeado.

## Merudia Calderon Dayeza
- **Yesterday:*Participé en la reunión de Retrospectiva del equipo para el Sprint 4 en Trello*
- **Today:*Revisaré las HUs que quedaron pendientes en el entorno de QA para este mismo sprint.*
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro
- **Yesterday:** Aporté ideas y acuerdos al tablero de retrospective del Sprint 4 en Trello y realicé una revisión funcional de la aplicación, validando los flujos principales e identificando posibles mejoras.
- **Today:** Revisaré las historias de usuario del Sprint 4 y daré seguimiento a los bugs reportados para validar su estado y las correcciones aplicadas.
- **Blockers:** n/a.

## Velasquez Vela Marcos
- **Yesterday:** Avancé en el rediseño de la interfaz de inicio de sesión sin tarjetas, el diseño con barra lateral de la sección de perfil y la consolidación de la pantalla de ubicaciones para unificarla en un solo componente master-detail.
- **Today:** Completé el rediseño de inicio de sesión (`LoginPage.tsx`, `/iniciar-sesion`) con restricción estricta de Google Auth a cuentas `@umss.edu`; implementé el nuevo layout responsivo de perfil con barra lateral y cargadores skeleton (`ProfileView.tsx`, `/mi-perfil`); unifiqué la vista de ubicaciones (`LocationSection.tsx`, `/ubicaciones`) eliminando los modales encadenados; añadí animaciones al carrito y un banner interactivo y cerrable para el emulador de Firebase.
- **Blockers:** n/a.

# 06/25/2026

## Castro Tejada Steven Lisandro
- **Yesterday:** Implementé la nueva home pública de SansiStore en `/`, conecté la transición hacia `/productos`, ajusté la lógica de carruseles destacados y refiné la selección de productos para ofertas, populares, novedades y categorías. El trabajo quedó reflejado principalmente en las HUs #707, #708 y #709 junto con las tasks #711, #712 y #713.
- **Today:** Además dejé preparada la entrega técnica de esta rama para revisión, documentando el alcance en las issues del Sprint 5 y consolidando todo en el PR #715 hacia `main`.
- **Today:** Revisar visualmente la home y consolidar cualquier ajuste final de UX o criterios de selección.
- **Blockers:** n/a.

## Gutierrez Hinojosa Jhon Deymar
- **Yesterday:** Corregí y estabilicé los tests automatizados afectados por los cambios en home, catálogo, perfil, favoritos, courier y pedidos, hasta dejar verde la ejecución principal de Playwright. Este trabajo quedó asociado sobre todo a la task #714.
- **Today:** Dar seguimiento a la estabilidad de las pruebas y apoyar en cualquier ajuste adicional de CI/CD.
- **Blockers:** n/a.

## Merino Vidal Mateo Alejandro
- **Yesterday:** Participé como representante del equipo en la reunión del día, comuniqué los puntos tratados al grupo y ayudé a coordinar el seguimiento interno de las tareas relacionadas con la entrega.
- **Today:** Continuar apoyando en la coordinación del equipo y en el seguimiento de acuerdos posteriores a la reunión.
- **Blockers:** n/a.

## Merudia Calderon Dayeza
- **Yesterday:** Revisé las historias de usuario implementadas por el equipo, validando su planteamiento, separación funcional y coherencia con los criterios definidos para el sprint; la revisión se centró especialmente en las HUs #707, #708, #709 y #710.
- **Today:** Continuar con la revisión de HUs pendientes y apoyar en la validación funcional de lo entregado.
- **Blockers:** n/a.

## Velasquez Vela Marcos
- **Yesterday:** Implementé nuevos tests automatizados para los flujos impactados por la nueva home, los carruseles destacados y la transición hacia el catálogo, fortaleciendo la cobertura e2e del módulo de tienda. Este trabajo se relaciona principalmente con la task #714.
- **Today:** Revisar la cobertura restante y apoyar en la validación final de los flujos automatizados.
- **Blockers:** n/a.
