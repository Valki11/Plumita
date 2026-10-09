-- CreateEnum
CREATE TYPE "Etapa" AS ENUM ('pollito', 'adulto');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('pendiente', 'enviado', 'error', 'omitido');

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_usuario" VARCHAR(40) NOT NULL,
    "contrasena_hash" TEXT NOT NULL,
    "celular" VARCHAR(20) NOT NULL,
    "telegram_chat_id" TEXT,
    "codigo_vinculacion" TEXT,
    "codigo_vinculacion_expira" TIMESTAMPTZ,
    "margen_proyeccion_pct" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "alerta_inventario_enviada" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "tipo_ave" (
    "id_tipo_ave" SERIAL NOT NULL,
    "nombre" VARCHAR(20) NOT NULL,
    "semanas_limite_pollito" INTEGER NOT NULL,

    CONSTRAINT "tipo_ave_pkey" PRIMARY KEY ("id_tipo_ave")
);

-- CreateTable
CREATE TABLE "ave" (
    "id_ave" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_tipo_ave" INTEGER NOT NULL,
    "fecha_ingreso" DATE NOT NULL,
    "edad_estimada_ingreso_semanas" INTEGER NOT NULL,
    "descripcion" VARCHAR(120) NOT NULL DEFAULT '',
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ave_pkey" PRIMARY KEY ("id_ave")
);

-- CreateTable
CREATE TABLE "tabla_alimenticia" (
    "id_tabla_alimenticia" SERIAL NOT NULL,
    "id_tipo_ave" INTEGER NOT NULL,
    "etapa" "Etapa" NOT NULL,
    "consumo_diario_lb" DECIMAL(6,3) NOT NULL,

    CONSTRAINT "tabla_alimenticia_pkey" PRIMARY KEY ("id_tabla_alimenticia")
);

-- CreateTable
CREATE TABLE "horario_alimentacion" (
    "id_horario" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "hora" VARCHAR(5) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "horario_alimentacion_pkey" PRIMARY KEY ("id_horario")
);

-- CreateTable
CREATE TABLE "registro_alimentacion" (
    "id_registro" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "fecha_hora" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cantidad_total_lb" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "registro_alimentacion_pkey" PRIMARY KEY ("id_registro")
);

-- CreateTable
CREATE TABLE "compra_alimento" (
    "id_compra" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "cantidad_lb" DECIMAL(8,2) NOT NULL,
    "precio_total_qtz" DECIMAL(10,2) NOT NULL,
    "precio_por_libra_qtz" DECIMAL(10,4) NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compra_alimento_pkey" PRIMARY KEY ("id_compra")
);

-- CreateTable
CREATE TABLE "notificacion_enviada" (
    "id_notificacion" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_horario" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'pendiente',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "detalle" TEXT,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviado_en" TIMESTAMPTZ,

    CONSTRAINT "notificacion_enviada_pkey" PRIMARY KEY ("id_notificacion")
);

-- CreateTable
CREATE TABLE "intento_login" (
    "clave" TEXT NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "ventana_inicio" TIMESTAMPTZ NOT NULL,
    "bloqueado_hasta" TIMESTAMPTZ,

    CONSTRAINT "intento_login_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_nombre_usuario_key" ON "usuario"("nombre_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_telegram_chat_id_key" ON "usuario"("telegram_chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_codigo_vinculacion_key" ON "usuario"("codigo_vinculacion");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_ave_nombre_key" ON "tipo_ave"("nombre");

-- CreateIndex
CREATE INDEX "ave_id_usuario_activo_idx" ON "ave"("id_usuario", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "tabla_alimenticia_id_tipo_ave_etapa_key" ON "tabla_alimenticia"("id_tipo_ave", "etapa");

-- CreateIndex
CREATE UNIQUE INDEX "horario_alimentacion_id_usuario_hora_key" ON "horario_alimentacion"("id_usuario", "hora");

-- CreateIndex
CREATE INDEX "registro_alimentacion_id_usuario_fecha_hora_idx" ON "registro_alimentacion"("id_usuario", "fecha_hora" DESC);

-- CreateIndex
CREATE INDEX "compra_alimento_id_usuario_fecha_id_compra_idx" ON "compra_alimento"("id_usuario", "fecha" DESC, "id_compra" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "notificacion_enviada_id_usuario_id_horario_fecha_key" ON "notificacion_enviada"("id_usuario", "id_horario", "fecha");

-- AddForeignKey
ALTER TABLE "ave" ADD CONSTRAINT "ave_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ave" ADD CONSTRAINT "ave_id_tipo_ave_fkey" FOREIGN KEY ("id_tipo_ave") REFERENCES "tipo_ave"("id_tipo_ave") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tabla_alimenticia" ADD CONSTRAINT "tabla_alimenticia_id_tipo_ave_fkey" FOREIGN KEY ("id_tipo_ave") REFERENCES "tipo_ave"("id_tipo_ave") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_alimentacion" ADD CONSTRAINT "horario_alimentacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_alimentacion" ADD CONSTRAINT "registro_alimentacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_alimento" ADD CONSTRAINT "compra_alimento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion_enviada" ADD CONSTRAINT "notificacion_enviada_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion_enviada" ADD CONSTRAINT "notificacion_enviada_id_horario_fkey" FOREIGN KEY ("id_horario") REFERENCES "horario_alimentacion"("id_horario") ON DELETE CASCADE ON UPDATE CASCADE;
