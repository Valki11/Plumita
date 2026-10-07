# ADR 0002: Edad y etapa calculadas al vuelo

- Estado: aceptada
- Fecha: 2026-10-06

## Contexto

La cantidad de alimento depende del tipo y de la etapa del ave (pollito o adulto). La usuaria no conoce la fecha de nacimiento, solo una edad aproximada al momento en que el ave entró a la granja. La edad cambia cada semana.

## Decisión

- Se guardan `fecha_ingreso` y `edad_estimada_ingreso_semanas`. No se guardan la edad actual ni la etapa.
- `edad actual (semanas) = edad_estimada_ingreso_semanas + semanas transcurridas desde fecha_ingreso`, donde `semanas transcurridas = floor(días / 7)` con fechas calendario en America/Guatemala.
- `etapa = pollito` si `edad <= tipo_ave.semanas_limite_pollito`, si no `adulto`. "Polluelo" en los mockups es la etapa pollito, no un tipo.
- El cálculo vive en `server/dominio/edad.ts` como funciones puras que reciben `hoy` por parámetro, y es el único lugar donde se calcula.
- La UI muestra la edad en semanas, sin meses.
- Mis aves agrupa en 4 banners: Polluelos, Gallinas adultas, Gallos adultos y Patos adultos.

## Alternativas descartadas

| Alternativa | Motivo |
|---|---|
| Columna `edad` actualizada por un proceso diario | Depende de que el proceso corra. Con el equipo apagado quedaría desactualizada. |
| Columna `etapa` guardada | Derivable y propensa a quedar inconsistente. |
| Fecha de nacimiento estimada | Aparenta una precisión que la usuaria no tiene. |
| Edad en meses | El DAD y la tabla alimenticia usan semanas. |

## Consecuencias

- Edad y etapa siempre están al día sin tareas programadas.
- Un ave puede cambiar de etapa sin que nadie lo vea. Eso cambia el consumo diario, la cantidad por toma y la proyección, y es el comportamiento esperado.
- Filtrar o agrupar por etapa en SQL no es directo, así que se agrupa en memoria. Con decenas de aves no es problema.
- Los tests de `edad.ts` cubren los límites: edad igual al límite (pollito), una semana después (adulto), ingreso hoy e ingreso con 6 y 7 días.
- Editar la fecha de ingreso o la edad estimada cambia retroactivamente la etapa mostrada. El historial de alimentación no se ve afectado porque guarda cantidades, no etapas.
