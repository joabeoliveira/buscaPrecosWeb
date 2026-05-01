-- Fix: Corrige encoding das categorias e nomes de parceiros para UTF-8 correto

-- 1. CATEGORIAS
UPDATE suppliers SET category = 'Eletrônicos'                           WHERE category LIKE 'Eletr%nicos';
UPDATE suppliers SET category = 'Eletrodomésticos'                      WHERE category LIKE 'Eletrodom%sticos';
UPDATE suppliers SET category = 'EPI - Equipamentos de Proteção Individual' WHERE category LIKE 'EPI%Prote%o Individual';
UPDATE suppliers SET category = 'Informática'                           WHERE category LIKE 'Inform%tica';
UPDATE suppliers SET category = 'Limpeza e Descartáveis'                WHERE category LIKE 'Limpeza e Descart%veis';
UPDATE suppliers SET category = 'Material de Construção'                WHERE category LIKE 'Material de Constru%o';
UPDATE suppliers SET category = 'Mobiliário e Decoração'                WHERE category LIKE 'Mobili%rio e Decora%o';
UPDATE suppliers SET category = 'Papelaria e Escritório'                WHERE category LIKE 'Papelaria e Escrit%rio';
UPDATE suppliers SET category = 'Refrigeração e Climatização'           WHERE category LIKE 'Refrigera%o e Climatiza%o';
UPDATE suppliers SET category = 'Segurança Eletrônica'                  WHERE category LIKE 'Seguran%a Eletr%nica';
UPDATE suppliers SET category = 'Uniformes e Vestuário'                 WHERE category LIKE 'Uniformes e Vestu%rio';

-- 2. NOMES DE PARCEIROS com acentos
UPDATE suppliers SET name = 'Confiança Distribuidora' WHERE name LIKE 'Confian%a Distribuidora';

-- 3. NOTAS — limpar textos corrompidos deixando em branco para re-edição manual (opcional)
-- UPDATE suppliers SET notes = NULL WHERE notes LIKE '%??%';

-- Verificação final
SELECT DISTINCT category FROM suppliers ORDER BY category;
