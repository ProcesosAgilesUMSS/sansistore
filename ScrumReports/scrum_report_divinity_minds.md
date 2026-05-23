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

## Merudia Calderon Dayeza

- **Yesterday:** Finalicé las tareas para mostrar el total del carrito y para eliminar un producto del mismo.
- **Today:** Realizar pruebas y revisiones en busca de errores previos a la demo.
- **Blockers:** n/a.
