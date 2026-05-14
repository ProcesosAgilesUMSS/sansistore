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
* **Blockers:** none
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
