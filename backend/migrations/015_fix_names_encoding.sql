-- Fix: Corrige encoding dos nomes de parceiros

UPDATE suppliers SET name = 'Assaí Atacadista'       WHERE name LIKE 'Assa%Atacadista';
UPDATE suppliers SET name = 'Atacadão'               WHERE name LIKE 'Atacad%o';
UPDATE suppliers SET name = 'Cia do Descartável'     WHERE name LIKE 'Cia do Descart%vel';
UPDATE suppliers SET name = 'Climatização Total'     WHERE name LIKE 'Climatiza%o Total';
UPDATE suppliers SET name = 'Confecções Vip'         WHERE name LIKE 'Confec%es Vip';
UPDATE suppliers SET name = 'OLX Negócios'           WHERE name LIKE 'OLX Neg%cios';
UPDATE suppliers SET name = 'Pichau Informática'     WHERE name LIKE 'Pichau Inform%tica';
UPDATE suppliers SET name = 'Segurança Net'          WHERE name LIKE 'Seguran%a Net';
UPDATE suppliers SET name = 'Toner Fácil'            WHERE name LIKE 'Toner F%cil';
UPDATE suppliers SET name = 'Vigilância Shop'        WHERE name LIKE 'Vigil%ncia Shop';

-- Verificação
SELECT name FROM suppliers WHERE name SIMILAR TO '%(Assa|Atacad|Descart|Climatiza|Confec|Neg|Inform|Seguran|F.cil|Vigil)%' ORDER BY name;
