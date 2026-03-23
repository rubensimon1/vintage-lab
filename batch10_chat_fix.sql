-- BATCH 10: FIX CHAT REALTIME & NOTIFICATIONS
-- Ejecuta esto en el SQL Editor de Supabase para arreglar la sincronización del chat multidispositivo.

BEGIN;

-- 1. Habilitamos Realtime para los mensajes del chat
ALTER PUBLICATION supabase_realtime ADD TABLE mensajes;

-- 2. Habilitamos Realtime para las notificaciones (Opcional, pero recomendado si queremos que el feed de notificaciones se actualice solo sin recargar)
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;

COMMIT;
