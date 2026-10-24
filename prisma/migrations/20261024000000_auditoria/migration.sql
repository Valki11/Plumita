-- CreateTable
CREATE TABLE "auditoria" (
    "id" BIGSERIAL NOT NULL,
    "fecha_hora" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario" INTEGER,
    "evento" VARCHAR(40) NOT NULL,
    "resultado" VARCHAR(10) NOT NULL,
    "ip" VARCHAR(45),
    "user_agent" VARCHAR(200),
    "detalle" JSONB,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditoria_fecha_hora_idx" ON "auditoria"("fecha_hora");

-- CreateIndex
CREATE INDEX "auditoria_id_usuario_fecha_hora_idx" ON "auditoria"("id_usuario", "fecha_hora");

-- Append-only
CREATE FUNCTION auditoria_inmutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'auditoria es append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auditoria_no_modificar
  BEFORE UPDATE OR DELETE ON "auditoria"
  FOR EACH ROW EXECUTE FUNCTION auditoria_inmutable();

CREATE TRIGGER auditoria_no_truncar
  BEFORE TRUNCATE ON "auditoria"
  FOR EACH STATEMENT EXECUTE FUNCTION auditoria_inmutable();
