# Resumen de pruebas de la beta

Versión **0.9.0-beta**, commit `bec56d8`, generado el 2026-10-24T06:03:13.265Z.

Todo corre contra la imagen de producción en http://localhost:3000 y los resultados están en JSON en esta carpeta. Las simulaciones usan la cuenta `simulacion`; los datos de `demo` solo se leen. Al terminar se reaplica `npm run seed:caso`.

**Cómo volver a correr todo** (con el stack levantado y Docker Desktop abierto):

```bash
cd pruebas-beta
npm install
npm run pruebas:beta
```

## 1. Pruebas automáticas y cobertura

- Pruebas: **70 de 70 aprobadas** en 8 archivos (0 fallidas, 0 omitidas).
- Cobertura total (v8, todo `src/`): líneas 21.24 %, ramas 18.58 %, funciones 24.69 %.

| Módulo | Archivos | Líneas | Ramas | Funciones |
|---|---|---|---|---|
| ui | 26 | 0 % | 0 % | 0 % |
| lib | 7 | 59.65 % | 55.56 % | 52.38 % |
| servidor_otros | 9 | 24.76 % | 44.16 % | 15 % |
| acciones | 6 | 0 % | 0 % | 0 % |
| dominio | 5 | 100 % | 96.97 % | 100 % |

Las acciones y la interfaz tienen 0 % porque sus pruebas hasta ahora son de simulación en el navegador, no unitarias.

## 2. Casos del DAD (CP-01 a CP-17)

**14 aprobados**, 0 fallidos, 3 no incluidos en beta (los de Telegram).

| Caso | Nombre | Estado |
|---|---|---|
| CP-01 | Registro de usuario | aprobado |
| CP-02 | Inicio de sesión correcto | aprobado |
| CP-03 | Inicio de sesión incorrecto | aprobado |
| CP-04 | Ingresar ave | aprobado |
| CP-05 | Actualización automática de edad | aprobado |
| CP-06 | Cambio de etapa por edad | aprobado |
| CP-07 | Inactivar ave | aprobado |
| CP-08 | Cálculo de alimento | aprobado |
| CP-09 | Registrar alimentación | aprobado |
| CP-10 | Registrar compra de alimento | aprobado |
| CP-11 | Proyección de compra | aprobado |
| CP-12 | Notificación de inventario bajo | no incluido en beta |
| CP-13 | Edición de configuración | aprobado |
| CP-14 | Vincular Telegram | no incluido en beta |
| CP-15 | Recordatorio por horario | no incluido en beta |
| CP-16 | Configurar horarios | aprobado |
| CP-17 | Sin horarios activos | aprobado |

## 3. Usabilidad simulada (Playwright, 390 × 844, 5 corridas)

_Es una simulación automática con Playwright. Mide que los flujos funcionen y cuántos pasos requieren; los tiempos son de un script, no de una persona. No reemplaza una prueba de usabilidad con la usuaria real._

| Tarea | Éxito | Tiempo promedio | Tiempo máximo | Clics | Mensaje de error |
|---|---|---|---|---|---|
| T1 Iniciar sesión | 5/5 | 454 ms | 507 ms | 1 | — |
| T2 Registrar un ave | 5/5 | 488 ms | 581 ms | 3 | — |
| T3 Configurar un horario | 5/5 | 344 ms | 407 ms | 3 | — |
| T4 Ver la cantidad por toma y registrar una alimentación | 5/5 | 373 ms | 517 ms | 2 | — |
| T5 Registrar una compra | 5/5 | 399 ms | 483 ms | 3 | — |
| T6 Consultar la proyección de 15 días | 5/5 | 178 ms | 216 ms | 2 | — |
| E1 Error a propósito: contraseña incorrecta | 5/5 | 509 ms | 602 ms | 1 | 5 de 5 |
| E2 Error a propósito: compra con cantidad 0 | 5/5 | 306 ms | 366 ms | 3 | 5 de 5 |
| E3 Error a propósito: cuarto horario | 5/5 | 453 ms | 545 ms | 1 | 5 de 5 |

## 4. Simulación de 30 días: a ojo contra Plumita

Semilla fija 20261030, inicio 2026-10-20. Los supuestos están escritos en el JSON.

| Medida | A ojo | Plumita |
|---|---|---|
| Días sin alimento | 2 | 0 |
| Días con ración incompleta | 4 | 0 |
| Libras de más vs. recomendado | 1.29 | 0.41 |
| Libras de menos vs. recomendado | 9.73 | 0.58 |
| Libras compradas | 50 | 100 |
| Gasto total (Q) | 150 | 300 |
| Número de compras | 2 | 2 |
| Inventario al día 30 (lb) | 11.2 | 52.93 |

El gasto de Plumita es mayor porque compra con anticipación (con margen del 10 %) y termina con inventario de reserva; el gasto a ojo es menor en parte porque se quedó sin alimento.

## 5. Lighthouse móvil (mediana de 3 corridas)

| Página | Rendimiento | Accesibilidad | Buenas prácticas | LCP | CLS | TBT |
|---|---|---|---|---|---|---|
| /inicio | 99 | 95 | 100 | 2180 ms | 0 | 58 ms |
| /alimentar | 98 | 96 | 100 | 2327 ms | 0 | 55 ms |
| /inventario | 99 | 96 | 100 | 2075 ms | 0 | 50 ms |

## 6. Carga con k6 (10 usuarios, 1 minuto)

- Solicitudes: **318** (4.73 por segundo).
- Duración: p50 29.78 ms, p95 67.09 ms, p99 156.54 ms, máximo 14710.54 ms.
- Errores: 0 %.
- RNF-02 (p95 menor a 2 s y menos de 1 % de errores): **cumple**.
- Mide esta laptop (CPU, memoria, Docker Desktop y lo demás que esté abierto). Sirve como línea base, no como garantía de un servidor.

## 7. Bitácora de defectos

8 defectos encontrados y corregidos durante el desarrollo (1 alta, 1 media, 6 baja).

| ID | Severidad | Descripción | Commit |
|---|---|---|---|
| D-01 | alta | Redondeo a 1 decimal daba 0.7 lb y Q44.10 | 5f2bb31 |
| D-02 | media | Los formularios se vaciaban tras un error de validación | e85202c |
| D-03 | baja | Contraste bajo en el tipo de ave seleccionado | e85202c |
| D-04 | baja | Filas apretadas a 390 px | e85202c |
| D-05 | baja | Texto "1 activas" | e85202c |
| D-06 | baja | Bucle de recargas con next dev | sin commit |
| D-07 | baja | Interruptor de horarios menor a 44 px | e85202c |
| D-08 | baja | .gitignore con líneas pegadas | 65fd252 |

## Pasos saltados o con falla

Ninguno.

