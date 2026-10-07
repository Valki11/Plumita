# Cambios del DAD v1.1 a v1.2

Se aplican a [DAD.md](DAD.md) cuando se apruebe. Las líneas con `-` se quitan y las `+` se añaden. Las secciones no listadas no cambian.

## Control de versiones

```diff
 | 08/10/2026 | 1.1 | Keila Valesca Ramírez | Horarios, vinculación de Telegram, edad en semanas, cronograma y tabla alimenticia |
+| __/10/2026 | 1.2 | Keila Valesca Ramírez | Regla de omisión de recordatorios, notificacion_enviada, rate limit, registro cerrable, pantallas de horarios y Telegram, ejecución en localhost |
```

## 2.2 Flujo funcional

```diff
-4. La usuaria define a qué horas del día alimenta a sus aves. A cada una de esas horas, el sistema le manda un recordatorio por Telegram con la cantidad que le toca dar.
+4. La usuaria define a qué horas del día alimenta a sus aves (hasta 3). A cada una de esas horas, el sistema le manda un recordatorio por Telegram con la cantidad que le toca dar, salvo que ya haya registrado una alimentación en la hora previa.
```

## 2.4 Limitaciones

```diff
+- No se despliega en un servidor público durante el proyecto: la aplicación corre en Docker Compose en un equipo local y se usa desde la red local. Los recordatorios solo se envían mientras ese equipo y la aplicación estén encendidos.
```

## 2.5.1 Tabla de actividades

```diff
-| Desarrollo | Configuración del proyecto, base de datos y primer despliegue | 10/10 | 12/10 |
+| Desarrollo | Configuración del proyecto, base de datos, Docker Compose local, CI y backup con restauración probada | 10/10 | 12/10 |
-| Implementación | Corrección de observaciones y despliegue final | 30/10 | 31/10 |
+| Implementación | Corrección de observaciones y puesta en marcha final en Docker Compose | 30/10 | 31/10 |
```

## 3.1 Requisitos funcionales

```diff
 **RF-06. Inactivar ave**
-El sistema debe permitir inactivar un ave en vez de eliminarla, para conservar su historial de alimentación.
+El sistema debe permitir inactivar un ave en vez de eliminarla, para conservar su historial de alimentación, y reactivarla después.

 **RF-07. Configurar horarios de alimentación**
-El sistema debe permitir que la usuaria defina a qué horas del día alimenta a sus aves (por ejemplo 7:00 a. m. y 4:00 p. m.). La cantidad de horarios activos es la cantidad de veces al día que se alimenta.
+El sistema debe permitir que la usuaria defina a qué horas del día alimenta a sus aves (por ejemplo 7:00 a. m. y 4:00 p. m.), hasta un máximo de 3 horarios por usuaria, sin mínimo. No se permiten dos horarios con la misma hora. Los horarios se pueden agregar, editar, activar, desactivar y eliminar. La cantidad de horarios activos es la cantidad de veces al día que se alimenta.

 **RF-15. Recordatorio de alimentación**
-A cada hora configurada, el sistema debe enviar un recordatorio por Telegram con la cantidad de alimento que corresponde dar en esa toma.
+A cada hora configurada, el sistema debe enviar un recordatorio por Telegram con la cantidad de alimento que corresponde dar en esa toma. Si la usuaria registró una alimentación dentro de los 60 minutos previos a la hora del horario, ese recordatorio no se envía y queda en estado "omitido". El sistema envía el recordatorio solo si la hora del horario no tiene más de 10 minutos de antigüedad, y nunca envía dos veces el mismo horario en el mismo día. Si el envío falla, se reintenta hasta 3 veces dentro de esos 10 minutos.

 **RF-17. Vincular Telegram**
-Desde la pantalla de configuración, la usuaria debe poder vincular su cuenta de Telegram con el bot de Plumita. El sistema le muestra un enlace al bot; ella toca "Iniciar" y la cuenta queda vinculada para recibir mensajes.
+Desde la pantalla de configuración, la usuaria debe poder vincular su cuenta de Telegram con el bot de Plumita. El sistema genera un código aleatorio de un solo uso que expira a los 10 minutos y le muestra un enlace al bot que lo incluye; ella toca "Iniciar" y la cuenta queda vinculada para recibir mensajes. Un código usado o expirado no sirve y se debe generar uno nuevo.
+
+**RF-18. Registro de cuentas cerrable**
+El sistema debe poder cerrar el registro de cuentas nuevas mediante la variable de entorno REGISTRO_ABIERTO. Abierto en desarrollo y cerrado en producción, después de crear la cuenta de la usuaria.
+
+**RF-19. Cerrar sesión**
+Desde la pantalla de configuración, la usuaria debe poder cerrar su sesión.
+
+**RF-20. Desvincular Telegram** (prioridad baja)
+Desde la pantalla de configuración, la usuaria debe poder desvincular su cuenta de Telegram.
```

## 3.2 Requisitos no funcionales

```diff
 **RNF-09. Umbral de inventario bajo**
-El sistema considera que el alimento está por agotarse cuando alcanza para 3 días o menos, según el consumo diario calculado. La alerta se envía una sola vez y se vuelve a habilitar cuando se registra una compra.
+El sistema considera que el alimento está por agotarse cuando alcanza para 3 días o menos, según el consumo diario calculado. La alerta se evalúa al registrar una alimentación, se envía una sola vez (campo alerta_inventario_enviada) y se vuelve a habilitar cuando se registra una compra.
+
+**RNF-11. Sesión y credenciales**
+La contraseña se guarda con argon2id. La sesión usa una cookie firmada, httpOnly, sameSite=lax y de 30 días. El atributo secure se controla con la variable COOKIE_SECURE.
+
+**RNF-12. Protección del inicio de sesión**
+Tras 5 intentos fallidos en 15 minutos, por usuario o por dirección IP, el sistema bloquea nuevos intentos durante 15 minutos.
+
+**RNF-13. Validación en servidor**
+Todo dato recibido del cliente se valida en el servidor con zod antes de usarse.
+
+**RNF-14. Respaldo**
+La base de datos tiene un respaldo diario con una restauración probada.
+
+**RNF-15. Accesibilidad**
+La interfaz cumple WCAG AA básico: contraste de texto de 4.5:1, foco visible, etiquetas en los campos y objetivos táctiles de 44 px.
```

## 3.3 Dependencias

```diff
 **Telegram (Bot API)**
-Telegram no permite que un bot le escriba a alguien solo con su número de celular. Por eso la usuaria debe abrir el bot de Plumita desde el enlace que le da la app y tocar "Iniciar". En ese momento el sistema guarda su identificador de chat y a partir de ahí ya puede mandarle recordatorios y alertas.
+Telegram no permite que un bot le escriba a alguien solo con su número de celular. Por eso la usuaria debe abrir el bot de Plumita desde el enlace que le da la app y tocar "Iniciar". El sistema recibe ese aviso consultando periódicamente la Bot API (long polling con getUpdates), por lo que no necesita una dirección pública. En ese momento guarda su identificador de chat y a partir de ahí ya puede mandarle recordatorios y alertas. El uso de webhook queda previsto para cuando exista un servidor público.

-**Servicio de hosting web**
-El sistema depende de un servicio de hosting para que la aplicación web esté disponible durante el periodo de pruebas con la usuaria.
+**Equipo anfitrión y red local**
+Durante el proyecto el sistema corre en Docker Compose en un equipo local, accesible desde el celular de la usuaria por la IP de la red local. Depende de que el equipo esté encendido, sin suspensión y en la misma red. Se documenta, sin ejecutarlo, el despliegue en un VPS con proxy inverso y TLS.
```

## 3.4 Pantallas

```diff
 **Registro**
-Permite crear una cuenta nueva. Solicita usuario, contraseña y número de celular. El número de celular queda guardado como dato de contacto.
+Permite crear una cuenta nueva. Solicita usuario, contraseña y número de celular. El número de celular queda guardado como dato de contacto, y el texto de ayuda de la pantalla no lo presenta como medio de aviso. Si el registro está cerrado, la pantalla lo indica y remite al inicio de sesión.

 **Inicio**
-... para cuántos días alcanza ese alimento y a qué hora es la próxima alimentación con su cantidad recomendada.
+... para cuántos días alcanza ese alimento y a qué hora es la próxima alimentación con su cantidad recomendada. La tarjeta de alcance cambia a estilo de alerta cuando alcanza para 3 días o menos. Si no hay horarios activos, en lugar de la próxima alimentación se invita a configurar uno.

 **Mis aves**
-Muestra las aves activas en cuatro banners: Polluelos (...) ... llenando un formulario con tipo, fecha aproximada de ingreso, edad estimada en ese momento y descripción. También se puede editar o inactivar una ave ya existente.
+Muestra las aves en cuatro banners: Polluelos (todas las aves en etapa pollito) y Gallinas, Gallos y Patos adultos. La edad se muestra siempre en semanas. Desde aquí se puede agregar una nueva ave llenando un formulario con tipo (gallina, gallo o pato), fecha aproximada de ingreso, edad estimada en semanas en ese momento y descripción. También se puede editar, inactivar o reactivar una ave existente. El tipo no se edita.

 **Alimentar**
-Muestra la cantidad de alimento que corresponde dar en ese momento, ya calculada por el sistema. Tiene un botón...
+Muestra la cantidad de alimento que corresponde dar en una toma, ya calculada por el sistema, con la etiqueta del horario: el activo más reciente que ya pasó hoy o, si ninguno ha pasado, el próximo. El horario solo cambia la etiqueta, no la cantidad. Al confirmar, la cantidad aparece prellenada y puede ajustarse. Tiene un botón...
```

Añadir a Configuración:

```diff
 **Configuración**
-Permite editar el número de celular y la contraseña de la cuenta, administrar los horarios de alimentación y vincular Telegram. También muestra, solo para consulta, la tabla alimenticia parametrizada por tipo de ave y etapa.
+Permite editar el número de celular y la contraseña de la cuenta, administrar los horarios de alimentación, vincular Telegram y cerrar sesión. También muestra, solo para consulta, la tabla alimenticia parametrizada por tipo de ave y etapa.
+
+**Configuración: gestión de horarios** (sección nueva)
+Lista hasta 3 horarios, cada uno con su hora, un interruptor de activo y las acciones Editar y Eliminar. El botón "Agregar horario" abre un diálogo con un selector de hora y se deshabilita al llegar al máximo. Si la hora ya existe, muestra un error. Sin horarios activos se muestra el aviso de que hay que configurar uno.
+
+**Configuración: vinculación de Telegram** (sección nueva)
+Muestra el estado: "Sin vincular" o "Vinculado". Con "Vincular Telegram" genera el código y muestra un botón "Abrir Telegram" con el enlace al bot y el tiempo restante de validez. Al recibir el /start, el estado cambia a "Vinculado" y llega un mensaje de bienvenida. Si el código expira, ofrece generar uno nuevo.
```

## 3.5.2 Cálculo de la cantidad de alimento

```diff
+Los recordatorios se programan con una verificación cada minuto. Cada horario activo genera, como máximo, un recordatorio por día, y solo se procesa dentro de los 10 minutos posteriores a su hora. Si hubo una alimentación registrada en los 60 minutos previos a la hora del horario, el recordatorio se omite.
```

## 4.1 Estructura de tablas

```diff
 **usuario**
 | margen_proyeccion_pct | DECIMAL | Margen de la proyección, 10 % por defecto |
+| alerta_inventario_enviada | BOOLEAN | Indica si ya se envió la alerta de inventario bajo. Se limpia al registrar una compra |

 **horario_alimentacion**
 | hora | TIME | Hora en la que se alimenta |
+| hora | VARCHAR(5) | Hora en formato HH:MM |
+Restricción: la combinación (id_usuario, hora) es única.

+**notificacion_enviada**
+Controla los recordatorios de alimentación para que no se envíen dos veces.
+
+| Campo | Tipo | Descripción |
+|---|---|---|
+| id_notificacion | INT (PK) | Identificador único |
+| id_usuario | INT (FK) | Usuaria destinataria |
+| id_horario | INT (FK) | Horario al que corresponde |
+| fecha | DATE | Día del recordatorio (America/Guatemala) |
+| estado | ENUM | pendiente, enviado, error u omitido |
+| intentos | INT | Intentos de envío realizados |
+| detalle | TEXT | Motivo del error, si lo hubo |
+| creado_en | TIMESTAMPTZ | Cuándo se creó el registro |
+| enviado_en | TIMESTAMPTZ | Cuándo se envió |
+
+Restricción: la combinación (id_usuario, id_horario, fecha) es única.
+
+**intento_login**
+Control del límite de intentos de inicio de sesión.
+
+| Campo | Tipo | Descripción |
+|---|---|---|
+| clave | VARCHAR (PK) | "u:<usuario>" o "ip:<dirección>" |
+| intentos | INT | Fallos dentro de la ventana |
+| ventana_inicio | TIMESTAMPTZ | Inicio de la ventana de 15 minutos |
+| bloqueado_hasta | TIMESTAMPTZ | Fin del bloqueo, si lo hay |

 **tabla_alimenticia**
+Restricción: la combinación (id_tipo_ave, etapa) es única.
```

Otros ajustes menores de tipo: `registro_alimentacion.fecha_hora`, `compra_alimento.precio_por_libra_qtz` (4 decimales) y las marcas de tiempo son TIMESTAMPTZ en UTC.

## 4.2 Diagrama entidad-relación

```diff
     usuario ||--o{ compra_alimento : registra
+    usuario ||--o{ notificacion_enviada : recibe
+    horario_alimentacion ||--o{ notificacion_enviada : genera
 ...
         decimal margen_proyeccion_pct
+        boolean alerta_inventario_enviada
 ...
+    notificacion_enviada {
+        int id_notificacion PK
+        int id_usuario FK
+        int id_horario FK
+        date fecha
+        string estado
+        int intentos
+        string detalle
+        datetime creado_en
+        datetime enviado_en
+    }
+
+    intento_login {
+        string clave PK
+        int intentos
+        datetime ventana_inicio
+        datetime bloqueado_hasta
+    }
```

`intento_login` no se relaciona con otras tablas.

## 5.1 Casos de prueba

```diff
 | CP-15 | Recordatorio por horario | Horario configurado a una hora próxima | Llega el recordatorio con la cantidad a dar en esa toma |
+| CP-15 | Recordatorio por horario | Horario configurado a una hora próxima, sin alimentación reciente | Llega un único recordatorio con la cantidad a dar, aunque la app se reinicie en los 10 minutos siguientes |
 ...
+| CP-18 | Omitir recordatorio | Alimentación registrada 30 minutos antes de la hora del horario | No llega el recordatorio y la notificación queda en estado "omitido" |
+| CP-19 | Límite y duplicado de horarios | Intentar crear un cuarto horario y otro con una hora ya existente | El sistema rechaza ambos con un mensaje claro |
+| CP-20 | Alerta de inventario, una sola vez | Inventario que baja a 3 días o menos tras dos alimentaciones seguidas, y luego una compra | Llega una sola alerta. Tras la compra, la alerta se habilita de nuevo |
+| CP-21 | Código de vinculación inválido | Código expirado (más de 10 minutos) o ya usado | El bot indica que debe generar uno nuevo y la cuenta no se vincula |
+| CP-22 | Bloqueo por intentos fallidos | 5 contraseñas incorrectas seguidas | El sistema bloquea nuevos intentos durante 15 minutos con un mensaje |
+| CP-23 | Registro cerrado | REGISTRO_ABIERTO=false y envío del formulario de registro | El sistema rechaza la creación de la cuenta |
```

## 6. Glosario

```diff
+| Omitido | Estado de un recordatorio que no se envió porque la usuaria ya había registrado la alimentación en la hora previa. |
+| Long polling | Forma de recibir mensajes de Telegram consultando su servidor en lugar de esperar una llamada desde internet. |
```

## 7.1 Mockups

```diff
+Nota: las capturas se hicieron antes de v1.2 y difieren del DAD en moneda (US$ en lugar de Q), edad (meses en lugar de semanas), código de país del celular (+51 en lugar de +502), selector de "veces al día" (reemplazado por la gestión de horarios) y tabla de referencia (3 filas en lugar de 6). Prevalece el texto del DAD. Las pantallas de gestión de horarios y de vinculación de Telegram no tienen captura.
```

## Resumen de campos y tablas nuevos

| Elemento | Tipo de cambio |
|---|---|
| `usuario.alerta_inventario_enviada` | campo nuevo |
| `notificacion_enviada` | tabla nueva |
| `intento_login` | tabla nueva |
| `horario_alimentacion.hora` | de TIME a VARCHAR(5), con unicidad (usuario, hora) |
| `tabla_alimenticia` | unicidad (tipo, etapa) |
| RF-18, RF-19, RF-20 | requisitos nuevos |
| RF-06, RF-07, RF-15, RF-17 | requisitos modificados |
| RNF-11 a RNF-15 | requisitos nuevos |
| CP-15 (modificado), CP-18 a CP-23 | casos de prueba |
| Ajustes: horarios y Telegram | pantallas nuevas |
