# Daily Reports - Team 3 Webspire 28/04/2026

## Dayana Saleth Ortuño Guzman

 * **Yesterday:** Trabaje en la HU *“Como comprador quiero pagar contra entrega”*, coloque sus criterios de aceptación y detalles en GitHub, tambien registre todas la HUs en GitHub con sus correspondientes labels.
* **Today:** Coordinare junto con el equipo, para planificar el sprint 1, deacuerdo a eso empezare hacer mockups en figma.
* **Blockers:** None

## Maria Victoria Grageda Vallejos

- **Yesterday:** Trabajé en la definición de los criterios de aceptación para las historias de usuario del Sprint 1, especificando los resultados esperados, condiciones de validación y aspectos necesarios para comprobar que cada historia cumpla con lo requerido.
- **Today:** Coordinar con el equipo WebSpire la revisión de los criterios de aceptación y apoyar en la planificación del Sprint 1 para asegurar que las historias de usuario estén claras antes de su implementación.
- **Blockers:** None.
  
## Jose Brandon Pinedo Gonzales

- **Yesterday:** Modifiqué el modelo de datos de Firestore para Entrega y Cobro. Se actualizaron las colecciones `orders`, `deliveries`, `payments` y `courierSessions`, además de crear `notifications` para soportar alertas del sistema.
- **Today:** Revisaré que los cambios realizados en la base de datos cubran correctamente las historias de usuario asignadas al Sprint 1 y coordinaré con el equipo los siguientes pasos.
- **Blockers:** None.


## Juan Daniel Vasquez Casana

- **Yesterday:** Analicé la HU *“Como mensajero quiero marcar un pedido como entregado para registrar que la entrega fue completada”*, definiendo sus estados y funcionalidades. También apoyé en la creación y organización de labels en GitHub para una mejor gestión de tareas.
- **Today:** Coordinar con el equipo la planificación del Sprint 1 y continuaré mejorando los mockups según los acuerdos definidos.
- **Blockers:** None.

## Alejandro Torrico Quispe

- **Yesterday:** Participe en la agregación de  labels para las Historias de Usuario en GitHub, clasificándolas según las distintas áreas funcionales y equipos correspondientes para facilitar su organización y seguimiento.
- **Today:** * Participé en la coordinación con mi equipo para definir y priorizar las Historias de Usuario que serán trabajadas durante este sprint.
- **Blockers:** None.

# Daily Reports - Team 3 Webspire 30/04/26

## Dayana Saleth Ortuño Guzman

 * **Yesterday:** Coordiné con el equipo la planificación del Sprint 1. Con base en eso, comenzamos a diseñar los mockups en Figma junto a mi compañera Victoria.
* **Today:** Finalizar los ajustes pendientes en los mockups. Posteriormente, iniciar la implementación de la historia de usuario: *“Como mensajero, quiero marcar un pedido como entregado para registrar que la entrega fue completada”* .
* **Blockers:** None

## Maria Victoria Grageda Vallejos
* **Yesterday:** Apoyé en la planificación del Sprint 1 junto con el equipo WebSpire y colaboré con el diseño y revisión de los mockups en Figma, tomando en cuenta las historias de usuario priorizadas para este sprint.
* **Today:** Continuaré apoyando en los ajustes finales de los mockups y en la revisión de que el diseño esté alineado con las historias de usuario del Sprint 1. También coordinaré con el equipo para iniciar la implementación de las funcionalidades correspondientes.
* **Blockers:** None

## Juan Daniel Vasquez Casana 
* **Yesterday:** Participé en la planificación del Sprint 1 y diseñé el flujo de la HU-02, considerando validaciones como la restricción de pedidos asignados al mensajero y la confirmación previa al cambio de estado.  
* **Today:** Continuaré con los ajustes del flujo de la HU-02 y posteriormente iniciaré la implementación de la funcionalidad para marcar pedidos como “Entregado”.  
* **Blockers:** Ninguno

## Jose Brandon Pinedo Gonzales
* **Yesterday:** Participé en la revisión de la historia de usuario relacionada con la visualización del monto exacto a cobrar por parte del mensajero. Junto con Alejandro, se identificaron los datos necesarios para su implementación, como el monto total del pedido, el estado del pago y la información de entrega.
* **Today:** Continuaré coordinando con Alejandro y el equipo para definir cómo se mostrará el monto exacto a cobrar en la interfaz del mensajero, verificando que esté alineado con el pedido correspondiente y que ayude a evitar errores durante el cobro.
* **Blockers:** None

## Alejandro Torrico Quispe
* **Yesterday:** Apoyé en el análisis de la historia de usuario “Como mensajero, quiero ver el monto exacto a cobrar para evitar errores”, revisando junto con Brandon los datos necesarios para que el mensajero pueda visualizar correctamente el monto de cobro asociado al pedido.
* **Today:** Continuaré colaborando en la definición de la interfaz y la lógica necesaria para mostrar el monto exacto del pedido, tomando en cuenta el estado de pago, la información de entrega y la validación del pedido asignado al mensajero.
* **Blockers:** None

# Daily Reports - Team 3 Webspire 05/05/26

## Dayana Saleth Ortuño Guzman

 * **Yesterday:** En la carpeta feature cree otro archivo llamado cobro, donde implemente una parte del frontend de la HU *“Como comprador quiero pagar contra entrega”* y tambien ayude en hacer un diagrama de flujo, para que entendamos cual es el flujo de la parte de cobro.
* **Today:** Terminar de hacer la parte del frontend.
* **Blockers:** None

## Maria Victoria Grageda Vallejos
* **Yesterday:** Avancé en la implementación de la HU “Como comprador quiero pagar contra entrega”, dejando conectada la selección de productos, el resumen del pedido, el cálculo del total y el registro del pedido con su pago pendiente.
* **Today:** Revisar el funcionamiento del flujo integrado en la página principal y apoyar en ajustes visuales o validaciones que sean necesarios.
* **Blockers:** None

## Juan Daniel Vasquez Casana
* **Yesterday:** Avancé en el desarrollo del frontend de la HU “Marcar pedido como entregado”, implementando la visualización de pedidos asignados y la opción de “Marcar como entregado”, considerando los criterios de aceptación.
* **Today:** Integrar la lógica para el cambio de estado del pedido y la confirmación previa.
* **Blockers:** None

## Alejandro Torrico Quispe
* **Yesterday:** Implementé la base del panel de pedidos asignados para el rol mensajero, creando la vista donde se muestran los pedidos relacionados al usuario autenticado. También avancé en la visualización del monto exacto a cobrar, el método de pago y el estado de la entrega, considerando los criterios de aceptación de la HU.
* **Today:** Continuar con la integración del panel de mensajero, revisar la conexión con los datos de pedidos y ajustar la funcionalidad para que pueda consumir información real cuando esté disponible el flujo completo de asignación de pediSe depende de la integración con las funcionalidades de creación de pedidos, pago contra entrega y asignación de pedidos al mensajero para trabajar con datos reales del flujo completo.
* **Blockers:** Se depende de la integración con las funcionalidades de creación de pedidos y asignación de pedidos al mensajero para trabajar con datos reales del flujo completo.

## Jose Brandon Pinedo Gonzales
* **Yesterday:** Avancé en la implementación de la HU “Visualizar monto exacto a cobrar”, desarrollando la vista del Panel del Mensajero y el detalle de cobro del pedido. Integré la lectura de pedidos desde Firestore, la visualización del monto total, subtotal y cargos adicionales, además del estado de pago “Pendiente de cobro” y el método de pago “Pago contra entrega”.
* **Today:** Continuar con pruebas del flujo en el emulador, validar casos donde el monto no sea válido y ajustar la asignación de pedidos al mensajero para que el panel muestre únicamente los pedidos correspondientes.
* **Blockers:** None

# Daily Reports - Team 3 Webspire 07/05/26

## Dayana Saleth Ortuño Guzman

 * **Yesterday:** Arreglar algunos detalles de la parte de frontend
* **Today:** Crear productos mockeados, miestras tanto, para que se pueda entender la vista de la HU *“Como comprador quiero pagar contra entrega”*, ya que depende de otra HU que aun no a sido implementada en este Sprint. "Agregar producto a carrito"
* **Blockers:** Entender las dependencias con la HU que estoy trabajando

## Maria Victoria Grageda Vallejos

* **Yesterday:** Realicé correcciones de bugs y ajustes en la parte de frontend relacionados con la HU: *“Como comprador quiero pagar contra entrega”*, trabajando junto con Dayana para mejorar el funcionamiento de la vista.
* **Today:** Apoyaré en la creación de productos mockeados para que se pueda entender correctamente la vista de la HU *“Como comprador quiero pagar contra entrega”*, ya que depende de otra HU que aún no ha sido implementada en este Sprint: *“Agregar producto a carrito”*.
* **Blockers:** Entender las dependencias con la HU que estoy trabajando.

## Juan Daniel Vasquez Casana

* **Yesterday:** Arreglé algunos detalles de la parte de frontend e implementé parte de la funcionalidad de la HU: “Como mensajero quiero marcar un pedido como entregado 
* **Today:** Crear pedidos mockeados, mientras tanto, para que se pueda entender correctamente la vista y el flujo de la HU, ya que algunas funcionalidades relacionadas con la gestión completa de pedidos aún no han sido implementadas.*.
* **Blockers:** Comprender las dependencias y funcionalidades relacionadas.

## Jose Brandon Pinedo Gonzales

* **Yesterday:** Realicé ajustes en la interfaz y avancé con la implementación de la HU-03: “Como mensajero quiero ver el monto exacto a cobrar”, trabajando en la visualización correcta del total del pedido dentro del flujo de entrega. 
* **Today:** Continuaré con las validaciones de la HU-03 y realizaré pruebas para verificar que el monto mostrado coincida correctamente con la información registrada del pedido.*.
* **Blockers:** Comprender las dependencias y funcionalidades relacionadas con la HU en la que estoy trabajando.

## Alejandro Torrico Quispe

* **Yesterday:** Trabajé en algunos ajustes de frontend y en la integración de la funcionalidad de la HU-03: “Como mensajero quiero ver el monto exacto a cobrar”, enfocándome en la presentación del monto total antes de confirmar la entrega. 
* **Today:** Crear pedidos mockeados para visualizar correctamente el flujo de la HU-03 mientras se completan otras funcionalidades relacionadas con la gestión de pedidos en este Sprint.*.
* **Blockers:** Dependencia de funcionalidades relacionadas con el cálculo y registro de pedidos para completar las validaciones de la HU.

# Daily Reports - Team 3 Webspire 12/05/26

## Dayana Saleth Ortuño Guzman

 * **Yesterday:** Realice el retrospective del sprint 1 con mi equipo.
* **Today:** Analizar que HUs podriamos hacer para el segundo Sprint, considerando despendencias y demas.
* **Blockers:** Dificultades a la hora de integrar, no nos dimos cuenta que esa parte tenia dependencia, lo cual nosotros creamos otro panel aparte, el problema fue que el grupo de Programing apis editaron nuestro codigo, para poner el sullo y no podiamos integrar.
## Maria Victoria Grageda Vallejos

* **Yesterday:** Apoyé en la integración del módulo de courier junto con el grupo de Programming API's, revisando que el flujo relacionado con la HU *“Como mensajero, quiero ver el monto exacto a cobrar para evitar errores”* y *“Como mensajero, quiero marcar un pedido como entregado para registrar que la entrega fue completada”*, pueda conectarse correctamente con las funcionalidades necesarias del proceso de entrega y cobro.Realice el retrospective del sprint 1 con mi equipo.
* **Today:** Se estuvieron revisando las historias de usuario correspondientes para el segundo parcial, verificando su estado, dependencias y posibles ajustes necesarios para continuar con el desarrollo del proyecto.
* **Blockers:** Se presentaron dificultades en la integración con el grupo de Programming API's debido a dependencias entre módulos y cambios realizados en archivos relacionados al flujo de entrega y cobro, lo cual generó retrasos.

## Juan Daniel Vasquez Casana

* **Yesterday:** Participé en la retrospectiva del Sprint 1 y apoyé en la revisión del flujo y los criterios de aceptación de las historias de usuario.
* **Today:** Analizar las historias de usuario planificadas para el segundo Sprint, considerando dependencias y posibles mejoras en el flujo de entrega.
* **Blockers:** None

## Jose Brandon Pinedo Gonzales

- **Yesterday:** Apoyé en la revisión del avance realizado durante el Sprint 1, verificando las funcionalidades desarrolladas y analizando qué historias de usuario quedaron pendientes o requieren ajustes para continuar con el segundo Sprint.

- **Today:** Revisar las historias de usuario disponibles para el Sprint 2, considerando dependencias entre módulos, prioridades del proyecto y funcionalidades que pueden ser asignadas al equipo para avanzar de manera ordenada.

- ## Alejandro Torrico Quispe

- **Yesterday:** Participé en la retrospectiva del Sprint 1 y apoyé en la revisión de los problemas encontrados, especialmente las dependencias entre módulos que afectaron el avance del área de pagos.

- **Today:** Analizar las historias de usuario disponibles para el Sprint 2, revisando su prioridad, dependencias y viabilidad para elegir correctamente cuáles se trabajarán durante el sprint.

- **Blockers:** None

# Daily Reports - Team 3 Webspire 14/05/26

## Dayana Saleth Ortuño Guzman

 * **Yesterday:** Nos juntamos con el equipo para definir qué HUs entran en el Sprint 2.
* **Today:** Escribir los criterios de aceptación de la Hu que me toco y revisar si tiene alguna dependencia con las tareas de los demás.
* **Blockers:** none

## Maria Victoria Grageda Vallejos

* **Yesterday:** Reunion con equipo para definir qué HUs entran en el Sprint 2 y revisar las historias relacionadas al módulo de entrega y cobro.
* **Today:** Escribir los criterios de aceptación de las HUs que me tocaron, relacionadas con entrega y cobro, y revisar si tienen dependencias con las tareas de los demás grupos.
* **Blockers:** none

## Juan Daniel Vasquez Casana

* **Yesterday:** Revisé junto al equipo las HUs propuestas para el Sprint 2 y las historias relacionadas con las funcionalidades que se trabajarán durante el sprint.
* **Today:** Escribir los criterios de aceptación de las HUs que me tocaron y analizar posibles dependencias con las tareas de los demás integrantes del equipo.
* **Blockers:** none

## Alejandro Torrico Quispe

* **Yesterday:** Trabaje en el avance del mockup de la Hu que me toco para este sprint 
* **Today:** Defini los criterios de aceptacion y analice el funcionamiento que debera tener para comunicarme con otras areas para la implementacion completa.
* **Blockers:** none

## Jose Brandon Pinedo Gonzales

* **Yesterday:** Me reuní con el equipo para revisar las HUs propuestas para el Sprint 2 y definir cuáles serán trabajadas durante este sprint.
* **Today:** Elaborar los criterios de aceptación de la HU que me tocó y revisar si tiene alguna dependencia con las tareas de los demás integrantes del equipo.
* **Blockers:** none

# Daily Reports - Team 3 Webspire 19/05/26

## Dayana Saleth Ortuño Guzman

 * **Yesterday:** Implementar la Hu de "Como Mensajero, quiero marcar un pedido como “NO ENTREGADO” si no logro entrega"
* **Today:** Conectar con la BD la parte del boton y comenzar a realizar mi otra HU.
* **Blockers:** Modificaciones que se hicieron en cuanto al diseño del panel de mensajero.
  
## Maria Victoria Grageda Vallejos

* **Yesterday:** Avancé con la HU *“Como Mensajero, quiero registrar el pago en efectivo del cliente para cerrar la venta”*, revisando el flujo para que el mensajero pueda registrar correctamente el pago en efectivo al finalizar la entrega. También verifiqué que la HU *“Como vendedor quiero ver el total de dinero cobrado en el día para rendir cuentas”* ya se encontraba avanzada.
* **Today:** Continuar con los ajustes y pruebas de la HU de registrar el pago en efectivo, validando que el flujo funcione correctamente y que la información se registre de manera adecuada para cerrar la venta.
* **Blockers:** none
## Juan Daniel Vasquez Casana

* **Yesterday:** Revisé junto al equipo las HUs propuestas para el Sprint 2, analizando las funcionalidades que serán trabajadas durante el sprint y sus posibles dependencias.

* **Today:** Continuar trabajando en la HU asignada, avanzando en sus criterios de aceptación y revisando si tiene relación o dependencia con las tareas de los demás integrantes del equipo.

* **Blockers:** none
## Alejandro Torrico Quispe

* **Yesterday:** Trabajé en el avance del mockup correspondiente a la HU asignada para este sprint, revisando el diseño y el flujo que deberá seguir la funcionalidad.

* **Today:** Continuar trabajando en la HU asignada, definiendo sus criterios de aceptación y analizando su funcionamiento para coordinar con otras áreas si es necesario.

* **Blockers:** none
## Jose Brandon Pinedo Gonzales

* **Yesterday:** Me reuní con el equipo para revisar las HUs propuestas para el Sprint 2 y definir cuáles serán trabajadas durante este sprint.

* **Today:** Continuar trabajando en la HU asignada, elaborando sus criterios de aceptación y revisando posibles dependencias con las tareas de los demás integrantes del equipo.

* **Blockers:** none


# Daily Reports - Team 3 Webspire 21/05/26

## Dayana Saleth Ortuño Guzman

 * **Yesterday:** Terminar de arrglar mis HUs
* **Today:** Arreglar el flujo de comprador, integrando la parte de "Pagar contra entrega", comunicarme con los grupos
por las dudas que se tienen.
* **Blockers:** none
## Maria Victoria Grageda Vallejos

* **Yesterday:** Terminé de arreglar mis HUs, revisando detalles pendientes y realizando los ajustes necesarios para culminar con el avance del sprint.
* **Today:** Apoyé en arreglar el flujo de comprador, integrando la parte de **“Pagar contra entrega”**, además de coordinar con los demás grupos para resolver las dudas que se presenten.
* **Blockers:** None

## Alejandro Torrico Quispe

* **Yesterday:** Terminé la funcionalidad de alertas de nuevos pedidos para el mensajero, asegurando que pueda identificar rápidamente cuando tiene una nueva entrega asignada.
* **Today:** Termine la funcionalidad de cancelación de pedidos por falta de pago, agregando el flujo para que el mensajero pueda registrar la cancelación y guardar el motivo correspondiente.
* **Blockers:** None

## Juan Daniel Vasquez Casana

* **Yesterday:** Terminé de implementar y ajustar mis HUs relacionadas con la confirmación de pedidos y validación de entrega por parte del comprador, revisando detalles pendientes.
* **Today:** Continuaré apoyando en la revisión y validación del flujo del comprador, verificando posibles mejoras en las funcionalidades implementadas.
* **Blockers:** None

## Jose Brandon Pinedo Gonzales

* **Yesterday:** Terminé mis HUs del vendedor, implementando y ajustando el flujo de **cambio de estado a `RESERVADO`** al confirmar la reserva de producto, además de la vista para **consultar el historial de cobros por pedido** para auditoría.
* **Today:** Realicé pruebas y correcciones sobre el flujo del vendedor, validando la visualización de pedidos reservados, el historial de pedidos pagados y ajustando conflictos y datos de seed para dejar el entorno listo para pruebas.
* **Blockers:** None

# Daily Reports - Team 3 Webspire 26/05/26

## Dayana Saleth Ortuño Guzman

 * **Yesterday:** Reunion con mi grupo para coordinar que HUs se desarrollaran para el Sprint 3.
* **Today:** Vi algunas dependencias que podria tener nuestras HUs elegidas, tambien estaba viendo algunos criterios de aceptacion para mi HU.
* **Blockers:** none

## Maria Victoria Grageda Vallejos

* **Yesterday:** Me reuní con mi grupo para coordinar y definir las HUs que se trabajarán durante el Sprint 3.
* **Today:** Revisé las posibles dependencias de las HUs seleccionadas y avancé en la definición de algunos criterios de aceptación de algunas HUs.
* **Blockers:** none


## Alejandro Torrico Quispe

* **Yesterday:** Apoyar en la revisión y corrección de funcionalidades pendientes dentro del flujo de comprador.
* **Today:** Implementar mejoras relacionadas al proceso de pago contra entrega y validar el correcto funcionamiento del flujo completo.
* **Blockers:** none


## Juan Daniel Vasquez Casana

* **Yesterday:** Revisar integraciones y coordinar detalles técnicos con el equipo para las HUs pendientes.
* **Today:** Continuar con ajustes en el flujo de comprador y apoyar en la resolución de dudas entre equipos.
* **Blockers:** none


## Jose Brandon Pinedo Gonzales

* **Yesterday:** Realizar pruebas y validaciones de las funcionalidades implementadas en las últimas HUs.
* **Today:** Colaborar en la integración de la opción “Pagar contra entrega” y verificar posibles errores en el flujo.
* **Blockers:** none

# Daily Reports - Team 3 Webspire 28/05/26

## Dayana Saleth Ortuño Guzman

 * **Yesterday:** Hice el mockup de la HU que me tocó en Figma.
* **Today:** Revisé algunas dependencias relacionadas con mi HU y empecé a desarrollarla.
* **Blockers:** none
## Maria Victoria Grageda Vallejos

* **Yesterday:** Avancé en el diseño del mockup correspondiente a mi HU, definiendo la estructura visual y el flujo principal.
* **Today:** Revisé las posibles dependencias de mi HU y comencé con su desarrollo, tomando en cuenta los ajustes necesarios para su implementación.
* **Blockers:** none

## Juan Daniel Vasquez Casana

* **Yesterday:** Avancé con el mockup de mi HU y revisé algunos detalles relacionados con el flujo.
* **Today:** Continuaré revisando dependencias relacionadas con la HU y comenzaré con su desarrollo.
* **Blockers:** none

## Alejandro Torrico Quispe

* **Yesterday:** Avancé con el mockup de mi HU, definiendo la estructura visual y algunos detalles del flujo principal.
* **Today:** Continuaré con el desarrollo de la HU y verificaré posibles ajustes necesarios para su implementación.
* **Blockers:** none

## Jose Brandon Pinedo Gonzales

* **Yesterday:** Revisé los requerimientos y el flujo de la HU asignada para identificar las funcionalidades necesarias.
* **Today:** Comenzaré con el diseño y desarrollo inicial de la HU, tomando en cuenta las dependencias relacionadas.
* **Blockers:** none

# Daily Reports - Team 3 Webspire 02/06/26

## Dayana Saleth Ortuño Guzman

* **Yesterday:** Terminé de implementar mi HU asignada. Además, estuve analizando y planificando cómo desarrollar la otra HU que me fue asignada.
* **Today:** Corregí los bugs identificados en funcionalidades desarrolladas anteriormente y realicé las validaciones correspondientes para asegurar su correcto funcionamiento.
* **Blockers:** None.
## Maria Victoria Grageda Vallejos

* **Yesterday:** Terminé de implementar mi HU asignada, relacionada con la verificación de pagos registrados por mensajeros para el control financiero.
* **Today:** Realizaré pruebas para identificar posibles bugs y validar que la funcionalidad trabaje correctamente según los criterios definidos.
* **Blockers:** None.
  
## Jose Brandon Pinedo Gonzales

* **Yesterday:** Avancé con el diseño y la implementación del código de la HU asignada, tomando en cuenta los requerimientos y el flujo definido para la funcionalidad.
* **Today:** Continuaré ajustando la implementación, realizando pruebas básicas y corrigiendo posibles detalles para asegurar su correcto funcionamiento.
* **Blockers:** None

## Juan Daniel Vasquez Casana

* **Yesterday:** Avancé con la revisión y validación de la HU asignada, verificando su funcionamiento y realizando ajustes en la implementación.
* **Today:** Continuaré apoyando en la revisión de funcionalidades y en la corrección de observaciones identificadas durante las pruebas.
* **Blockers:** None

## Alejandro Torrico Quispe

* **Yesterday:** Avancé con la implementación de la HU asignada, desarrollando las funcionalidades principales y verificando su integración con los componentes relacionados.
* **Today:** Continuaré realizando ajustes en la implementación, ejecutando pruebas y validando que la funcionalidad cumpla con los criterios de aceptación establecidos.
* **Blockers:** none

# Daily Reports - Team 3 Webspire 04/06/26

## Dayana Saleth Ortuño Guzman

* **Yesterday:** Terminar mis Hus desigandas y revisar los avances de los otros grupo para ver como esta yendo el flujo.
* **Today:** Ordene la tabla de github, asigne size y prioridad, tambien andaba revisando un poco los avances de los integrantes de mi grupo y realice una tarea que es de localizar bien el boton de "Cancelar pedido"
* **Blockers:** None.
## Maria Victoria Grageda Vallejos

* **Yesterday:** Terminé mis HUs asignadas y realicé una revisión general de las funcionalidades implementadas para verificar que todo estuviera funcionando correctamente.
* **Today:** Apoyé en las corrección de bugs, además de realizar la revisión y validación de las funcionalidades desarrolladas.
* **Blockers:** None

## Juan Daniel Vasquez Casana

* **Yesterday:** TTerminé mis HUs asignadas y realicé una revisión general de las funcionalidades implementadas para verificar su correcto funcionamiento.
* **Today:** Realizaré la revisión y validación de las funcionalidades desarrolladas, verificando que los flujos implementados operen correctamente y cumplan con los requerimientos definidos.
* **Blockers:** None

* ## Maria Victoria Grageda Vallejos

* **Yesterday:** Avance en el desarrollo de mis hus asignadas revisando que la neuva funcionalidad no rompa nada
* **Today:** Realice la correccion de bugs sobre mi hu asignada
* **Blockers:** None
