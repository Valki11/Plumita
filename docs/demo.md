# Demo: cómo calcula Plumita

Guía para explicar en clase dónde está cada fórmula. Todas las fórmulas viven en [src/server/dominio/](../src/server/dominio/), son funciones puras (reciben datos y devuelven un resultado, sin base de datos) y tienen pruebas en [tests/](../tests/).

## Preparar el caso

```bash
docker compose up -d            # la imagen ya está construida
npm run seed:caso               # usuaria demo / plumita123
```

Entrar a http://localhost:3000 con `demo` / `plumita123`. Para repetir el caso desde cero, volver a ejecutar `npm run seed:caso`.

El caso: 4 gallinas adultas, 2 gallos adultos, 3 gallinas en etapa pollito, 1 pato adulto, 3 horarios activos (7:00, 12:00 y 17:00) y 1 compra de 20 lb por Q60. No hay alimentaciones registradas.

## Los números del caso

| Paso | Cuenta | Resultado | Dónde se ve |
|---|---|---|---|
| Consumo diario | 4 × 0.24 + 2 × 0.26 + 3 × 0.07 + 1 × 0.37 | **2.06 lb/día** | base de todo lo demás |
| Cantidad por toma | 2.06 ÷ 3 horarios = 0.6866… | **0.69 lb** | Alimentar e Inicio |
| Inventario tras una toma | 20 − 0.69 | **19.31 lb** | Inventario e Inicio |
| Días que alcanza | 19.31 ÷ 2.06 = 9.37, se queda con el entero | **9 días** | Inicio |
| Libras por comprar a 15 días | 2.06 × 15 × 1.10 − 19.31 = 33.99 − 19.31 | **14.68 lb** | Inventario |
| Costo estimado | 14.68 × Q3.00 (Q60 ÷ 20 lb) | **Q44.04** | Inventario |

Antes de registrar la primera toma, Inventario muestra 20 lb y una proyección de 13.99 lb y Q41.97.

## Dónde está cada fórmula

| Qué se calcula | Fórmula (DAD) | Función | Archivo | La prueba que la cubre |
|---|---|---|---|---|
| Semanas desde el ingreso | días ÷ 7, solo semanas completas (3.5.1) | `semanasTranscurridas` | [edad.ts](../src/server/dominio/edad.ts) | [edad.test.ts](../tests/edad.test.ts), `semanasTranscurridas` |
| Edad actual | edad estimada + semanas transcurridas (3.5.1) | `edadActualSemanas` | [edad.ts](../src/server/dominio/edad.ts) | [edad.test.ts](../tests/edad.test.ts), `edadActualSemanas` |
| Etapa | pollito si edad ≤ límite del tipo, si no adulto (3.5.1) | `etapaDe` | [edad.ts](../src/server/dominio/edad.ts) | [edad.test.ts](../tests/edad.test.ts), `etapaDe`; [caso-demo.test.ts](../tests/caso-demo.test.ts), última prueba |
| Banner de Mis aves | polluelos o gallinas, gallos y patos adultos | `grupoDe`, `contarPorGrupo` | [edad.ts](../src/server/dominio/edad.ts), [alimento.ts](../src/server/dominio/alimento.ts) | [edad.test.ts](../tests/edad.test.ts), `grupoDe`; [alimento.test.ts](../tests/alimento.test.ts), `contarPorGrupo` |
| Consumo diario | suma de aves activas × consumo del tipo y etapa (3.5.2) | `consumoDiarioLb` | [alimento.ts](../src/server/dominio/alimento.ts) | [alimento.test.ts](../tests/alimento.test.ts); [caso-demo.test.ts](../tests/caso-demo.test.ts), 2.06 lb |
| Cantidad por toma | consumo diario ÷ horarios activos (3.5.2) | `cantidadPorToma`, `redondearLb` | [alimento.ts](../src/server/dominio/alimento.ts) | [alimento.test.ts](../tests/alimento.test.ts); [caso-demo.test.ts](../tests/caso-demo.test.ts), 0.69 lb |
| Inventario | compras − consumo registrado, nunca negativo (3.5.3) | `inventarioLb` | [inventario.ts](../src/server/dominio/inventario.ts) | [inventario.test.ts](../tests/inventario.test.ts); [caso-demo.test.ts](../tests/caso-demo.test.ts), 19.31 lb |
| Días que alcanza | inventario ÷ consumo diario, parte entera (3.5.3) | `diasAlcance` | [inventario.ts](../src/server/dominio/inventario.ts) | [inventario.test.ts](../tests/inventario.test.ts); [caso-demo.test.ts](../tests/caso-demo.test.ts), 9 días |
| Proyección y costo | máx(0, consumo × 15 × (1 + margen) − inventario), por el precio de la última compra (3.5.3) | `proyeccion` | [inventario.ts](../src/server/dominio/inventario.ts) | [inventario.test.ts](../tests/inventario.test.ts); [caso-demo.test.ts](../tests/caso-demo.test.ts), 14.68 lb y Q44.04 |
| Precio por libra | total ÷ libras, 4 decimales | `precioPorLibra` | [inventario.ts](../src/server/dominio/inventario.ts) | [inventario.test.ts](../tests/inventario.test.ts) |
| Horario mostrado en Alimentar | el activo más reciente que ya pasó hoy, o el próximo | `horarioParaAlimentar` | [horarios.ts](../src/server/dominio/horarios.ts) | [horarios.test.ts](../tests/horarios.test.ts) |
| Próxima alimentación en Inicio | el siguiente horario activo, o el primero de mañana | `proximaAlimentacion` | [horarios.ts](../src/server/dominio/horarios.ts) | [horarios.test.ts](../tests/horarios.test.ts) |
| Fecha y hora de Guatemala | UTC-6 | `fechaISO`, `minutosDelDia`, `diasEntre` | [tiempo.ts](../src/lib/tiempo.ts) | [tiempo.test.ts](../tests/tiempo.test.ts) |

## Quién llama a las fórmulas

```
Pantalla (page.tsx)
   └─ estadoGranja()                       src/server/consultas/granja.ts
        ├─ lee de PostgreSQL: aves, tabla alimenticia, horarios, compras y alimentaciones
        ├─ consumoDiarioLb()  → consumo diario
        ├─ inventarioLb()     → inventario
        └─ diasAlcance()      → días que alcanza
   └─ cantidadPorToma() + redondearLb()    → cantidad por toma
   └─ proyeccion()                         → libras y costo
```

- **Inicio** ([inicio/page.tsx](../src/app/(app)/inicio/page.tsx)) usa `estadoGranja`, `proximaAlimentacion` y `cantidadPorToma`. La tarjeta pasa a estilo de alerta cuando `diasAlcance` es 3 o menos.
- **Alimentar** ([alimentar/page.tsx](../src/app/(app)/alimentar/page.tsx)) usa `estadoGranja`, `horarioParaAlimentar`, `cantidadPorToma` y `redondearLb`. Al confirmar, la acción [alimentacion.ts](../src/server/acciones/alimentacion.ts) guarda lo que la usuaria escribió, que viene prellenado con la cantidad recomendada.
- **Inventario** ([inventario/page.tsx](../src/app/(app)/inventario/page.tsx)) usa `estadoGranja` y `proyeccion`. Al registrar una compra, [compras.ts](../src/server/acciones/compras.ts) calcula el precio por libra con `precioPorLibra`.
- **Mis aves** ([aves.ts](../src/server/consultas/aves.ts)) usa `edadActualSemanas`, `etapaDe` y `grupoDe` para ubicar cada ave en su banner.

## Dos ideas para explicar

1. **Nada derivado se guarda.** La edad, la etapa y el inventario se calculan cada vez que se abre una pantalla. Por eso, si se edita la fecha de ingreso de un ave, o si pasa una semana, todo se recalcula solo.
2. **Se redondea al final.** Las cuentas se hacen con decimales exactos (librería `decimal.js`) y solo se redondea a 2 decimales al mostrar o guardar. Si el redondeo fuera a 1 decimal, la cantidad por toma sería 0.7 lb, el inventario 19.3 lb y la proyección 14.7 lb y Q44.10, números que no salen de aplicar las fórmulas del DAD al pie de la letra.

## Mostrar el cambio de etapa

La tercera pollita (en Mis aves, "En el límite") tiene 8 semanas, que es el límite de pollito de la gallina, y entra a la granja hoy. Hoy sigue siendo pollito y pasará a adulta en 7 días.

Para verlo ahora: Mis aves → Editar esa ave → poner la fecha de ingreso 7 días atrás → Guardar. El ave pasa al banner "Gallinas adultas" (5 activas), los polluelos bajan a 2, y el consumo diario sube de 2.06 a 2.23 lb.

Para volver al estado de arriba, ejecutar de nuevo `npm run seed:caso`.

## Por qué los números no cambian entre hoy y la demo

La pollita del límite se crea con fecha de ingreso de hoy. Si el caso se carga el mismo día de la demo o hasta 6 días antes, los números de la tabla se mantienen. Después de 7 días esa ave pasa a adulta y el consumo diario cambia. Conviene ejecutar `npm run seed:caso` justo antes de presentar.
