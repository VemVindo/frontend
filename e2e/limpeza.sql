-- Apaga tudo o que a suíte Selenium criou: empresas com e-mail
-- e2e-selenium-...@example.com, os pedidos delas e os entregadores que só
-- trabalham para elas. Nada de outra empresa entra.
--
-- Por padrão termina em ROLLBACK: roda, mostra quantos registros sairiam e
-- desfaz. Para apagar de verdade, troque o ROLLBACK do fim por COMMIT.

BEGIN;

CREATE TEMP TABLE empresas_da_suite ON COMMIT DROP AS
SELECT id_empresa
FROM "Empresa"
WHERE email LIKE 'e2e-selenium-%@example.com';

CREATE TEMP TABLE entregadores_da_suite ON COMMIT DROP AS
SELECT en.cpf
FROM "Entregador" en
WHERE en.nome LIKE '%Selenium%'
  AND EXISTS (
    SELECT 1 FROM "Contrato" c
    WHERE c.cpf_entregador = en.cpf AND c."idEmpresa" IN (SELECT id_empresa FROM empresas_da_suite)
  )
  AND NOT EXISTS (
    SELECT 1 FROM "Contrato" c
    WHERE c.cpf_entregador = en.cpf AND c."idEmpresa" NOT IN (SELECT id_empresa FROM empresas_da_suite)
  )
  AND NOT EXISTS (
    SELECT 1 FROM "Pedido" p
    WHERE p.cpf_entregador = en.cpf AND p."idEmpresa" NOT IN (SELECT id_empresa FROM empresas_da_suite)
  );

CREATE TEMP TABLE pedidos_da_suite ON COMMIT DROP AS
SELECT id_pedido
FROM "Pedido"
WHERE "idEmpresa" IN (SELECT id_empresa FROM empresas_da_suite);

SELECT
  (SELECT count(*) FROM empresas_da_suite) AS empresas,
  (SELECT count(*) FROM entregadores_da_suite) AS entregadores,
  (SELECT count(*) FROM pedidos_da_suite) AS pedidos;

DELETE FROM "Avaliacao" WHERE idpedidos IN (SELECT id_pedido FROM pedidos_da_suite);
DELETE FROM "AcessoRecebedor" WHERE "idPedido" IN (SELECT id_pedido FROM pedidos_da_suite);
DELETE FROM "LocalizacaoEntrega" WHERE "idPedido" IN (SELECT id_pedido FROM pedidos_da_suite);
DELETE FROM "HistoricoPedidoEntregadores" WHERE id_pedido IN (SELECT id_pedido FROM pedidos_da_suite);
DELETE FROM "PedidoImportado" WHERE "idEmpresa" IN (SELECT id_empresa FROM empresas_da_suite);
DELETE FROM "Pedido" WHERE id_pedido IN (SELECT id_pedido FROM pedidos_da_suite);
DELETE FROM "Contrato"
WHERE "idEmpresa" IN (SELECT id_empresa FROM empresas_da_suite)
   OR cpf_entregador IN (SELECT cpf FROM entregadores_da_suite);
DELETE FROM "CredencialIntegracao" WHERE "idEmpresa" IN (SELECT id_empresa FROM empresas_da_suite);
DELETE FROM "MetricasPagamento" WHERE "idEmpresa" IN (SELECT id_empresa FROM empresas_da_suite);
DELETE FROM "Entregador" WHERE cpf IN (SELECT cpf FROM entregadores_da_suite);
DELETE FROM "Empresa" WHERE id_empresa IN (SELECT id_empresa FROM empresas_da_suite);

SELECT
  (SELECT count(*) FROM "Empresa" WHERE email LIKE 'e2e-selenium-%@example.com') AS empresas_restantes,
  (SELECT count(*) FROM "Pedido" WHERE id_pedido IN (SELECT id_pedido FROM pedidos_da_suite)) AS pedidos_restantes;

ROLLBACK;
