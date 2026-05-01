-- Seed: Parceiros iniciais por categoria (baseado em fornecedores reais do mercado brasileiro)
-- Executar apenas uma vez para popular o banco de dados

INSERT INTO suppliers (name, url, category, is_active, free_shipping, min_free_shipping, score, avg_delivery_days, notes) VALUES

-- ============================================================
-- INFORMÁTICA
-- ============================================================
('KaBuM!', 'https://www.kabum.com.br', 'Informática', TRUE, TRUE, 299.00, 9, 3, 'Maior e-commerce de informática do Brasil. Excelente variedade, preços competitivos e entregas rápidas.'),
('Pichau Informática', 'https://www.pichau.com.br', 'Informática', TRUE, TRUE, 300.00, 8, 4, 'Forte em hardware, periféricos e componentes gamer. Bons preços e atendimento.'),
('Terabyte Shop', 'https://www.terabyteshop.com.br', 'Informática', TRUE, TRUE, 350.00, 8, 5, 'Especialista em componentes e periféricos. Boa reputação no mercado gamer.'),
('Submarino', 'https://www.submarino.com.br', 'Informática', TRUE, TRUE, 200.00, 7, 5, 'Marketplace com amplo portfólio de informática, eletrônicos e acessórios.'),
('Amazon Brasil', 'https://www.amazon.com.br', 'Informática', TRUE, TRUE, 199.00, 9, 3, 'Ampla seleção, preços competitivos e entrega Prime rápida para todo o Brasil.'),

-- ============================================================
-- PAPELARIA E ESCRITÓRIO
-- ============================================================
('Kalunga', 'https://www.kalunga.com.br', 'Papelaria e Escritório', TRUE, TRUE, 200.00, 9, 3, 'Maior rede de papelaria do Brasil. Excelente catálogo de material de escritório, informática e móveis. Referência no segmento.'),
('Staples Brasil', 'https://www.staples.com.br', 'Papelaria e Escritório', TRUE, TRUE, 250.00, 7, 4, 'Especialista em suprimentos de escritório. Bom para compras corporativas.'),
('Tilibra', 'https://www.tilibra.com.br', 'Papelaria e Escritório', TRUE, FALSE, NULL, 7, 6, 'Fabricante nacional de produtos de papelaria como cadernos, agendas e encadernação.'),
('Office Total', 'https://www.officetotal.com.br', 'Papelaria e Escritório', TRUE, TRUE, 300.00, 7, 5, 'Foco em suprimentos de escritório e informática para empresas.'),
('Broffice', 'https://www.broffice.com.br', 'Papelaria e Escritório', TRUE, FALSE, NULL, 6, 5, 'Distribuidora de material de escritório e papelaria para o mercado corporativo.'),

-- ============================================================
-- TONERS, CARTUCHOS E TINTAS
-- ============================================================
('Toner Fácil', 'https://www.tonerfacil.com.br', 'Toners, Cartuchos e Tintas', TRUE, TRUE, 150.00, 8, 4, 'Especialista em toners e cartuchos originais e compatíveis. Ampla cobertura de modelos.'),
('Cartucho.com.br', 'https://www.cartucho.com.br', 'Toners, Cartuchos e Tintas', TRUE, TRUE, 200.00, 7, 5, 'E-commerce especializado em cartuchos, toners e tintas para impressoras.'),
('Suprimentos Shop', 'https://www.suprimentosshop.com.br', 'Toners, Cartuchos e Tintas', TRUE, FALSE, NULL, 7, 5, 'Distribuidor de suprimentos de impressão originais e compatíveis.'),
('Multilaser', 'https://www.multilaser.com.br', 'Toners, Cartuchos e Tintas', TRUE, TRUE, 200.00, 7, 5, 'Fabricante nacional com linha de cartuchos e toners compatíveis a bom custo-benefício.'),
('HP Store', 'https://www.hp.com/br-pt/shop', 'Toners, Cartuchos e Tintas', TRUE, TRUE, 300.00, 9, 5, 'Loja oficial HP. Cartuchos e toners originais com garantia do fabricante.'),

-- ============================================================
-- LIMPEZA E DESCARTÁVEIS
-- ============================================================
('Gimba', 'https://www.gimba.com.br', 'Limpeza e Descartáveis', TRUE, TRUE, 300.00, 8, 3, 'Atacadão online com excelente catálogo de produtos de limpeza, higiene e descartáveis. Ótimo para compras em quantidade.'),
('Makro', 'https://www.makro.com.br', 'Limpeza e Descartáveis', TRUE, FALSE, NULL, 8, 4, 'Atacadista com amplo portfólio de limpeza, higiene e descartáveis. Ideal para compras corporativas em volume.'),
('Limpeza Total', 'https://www.limpezatotal.com.br', 'Limpeza e Descartáveis', TRUE, TRUE, 400.00, 7, 5, 'Distribuidor especializado em produtos de limpeza e higiene profissional.'),
('Supermix', 'https://www.supermix.com.br', 'Limpeza e Descartáveis', TRUE, FALSE, NULL, 6, 5, 'Distribuidora de produtos de limpeza e descartáveis para o mercado B2B.'),
('Cia do Descartável', 'https://www.ciadodescartavel.com.br', 'Limpeza e Descartáveis', TRUE, TRUE, 250.00, 7, 4, 'Especialista em materiais descartáveis para empresas e food service.'),

-- ============================================================
-- EPI - EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL
-- ============================================================
('EPI Total', 'https://www.epitotal.com.br', 'EPI - Equipamentos de Proteção Individual', TRUE, TRUE, 300.00, 8, 5, 'Amplo catálogo de EPI de diversas marcas. Atende construção civil, indústria e serviços.'),
('Comprasnet EPI', 'https://www.epicomprasnet.com.br', 'EPI - Equipamentos de Proteção Individual', TRUE, FALSE, NULL, 7, 6, 'Distribuidor de EPI com foco em empresas e conformidade com NRs.'),
('3M Brasil', 'https://www.3m.com.br', 'EPI - Equipamentos de Proteção Individual', TRUE, FALSE, NULL, 9, 7, 'Fabricante referência em EPI respiratório, auditivo e proteção facial. Alta qualidade.'),
('Hialplast', 'https://www.hialplast.com.br', 'EPI - Equipamentos de Proteção Individual', TRUE, FALSE, NULL, 7, 6, 'Distribuidor de EPI e segurança do trabalho com CA vigente.'),
('Ferramentas Gerais', 'https://www.ferramentasgerais.com.br', 'EPI - Equipamentos de Proteção Individual', TRUE, TRUE, 350.00, 7, 5, 'Além de ferramentas, possui boa linha de EPI industrial e construção.'),

-- ============================================================
-- SEGURANÇA ELETRÔNICA
-- ============================================================
('Hikvision Brasil', 'https://www.hikvision.com/pt', 'Segurança Eletrônica', TRUE, FALSE, NULL, 9, 7, 'Líder mundial em câmeras de segurança e sistemas CFTV. Alta qualidade e tecnologia.'),
('Intelbras', 'https://www.intelbras.com/pt-br', 'Segurança Eletrônica', TRUE, FALSE, NULL, 9, 5, 'Fabricante nacional líder em segurança eletrônica, câmeras IP, DVRs e alarmes.'),
('Dahua Brasil', 'https://www.dahuasecurity.com/br', 'Segurança Eletrônica', TRUE, FALSE, NULL, 8, 7, 'Fabricante global de câmeras IP, NVRs e sistemas de vigilância inteligente.'),
('Vigilância Shop', 'https://www.vigilanciashop.com.br', 'Segurança Eletrônica', TRUE, TRUE, 400.00, 7, 5, 'E-commerce especialista em câmeras, DVRs, alarmes e controle de acesso.'),
('Segurança Net', 'https://www.segurancaonline.com.br', 'Segurança Eletrônica', TRUE, FALSE, NULL, 7, 6, 'Distribuidor online de equipamentos de segurança eletrônica para instaladores e empresas.'),

-- ============================================================
-- REFRIGERAÇÃO E CLIMATIZAÇÃO
-- ============================================================
('Climatização Total', 'https://www.climatizacaototal.com.br', 'Refrigeração e Climatização', TRUE, FALSE, NULL, 7, 7, 'Distribuidor de ar-condicionado e climatizadores de diversas marcas.'),
('LG Eletronicos', 'https://www.lg.com/br/ar-condicionado', 'Refrigeração e Climatização', TRUE, FALSE, NULL, 9, 10, 'Fabricante com linha completa de ar-condicionado split e multisplit. Alta confiabilidade.'),
('Daikin Brasil', 'https://www.daikin.com.br', 'Refrigeração e Climatização', TRUE, FALSE, NULL, 9, 10, 'Líder mundial em ar-condicionado. Alta eficiência energética e durabilidade.'),
('Shoptime', 'https://www.shoptime.com.br', 'Refrigeração e Climatização', TRUE, TRUE, 500.00, 7, 7, 'Marketplace com ampla linha de climatização residencial e comercial.'),
('Magazine Luiza', 'https://www.magazineluiza.com.br', 'Refrigeração e Climatização', TRUE, TRUE, 500.00, 8, 5, 'Grande variedade de ar-condicionado e climatizadores com bons preços e entrega nacional.'),

-- ============================================================
-- ELETRODOMÉSTICOS
-- ============================================================
('Magazine Luiza', 'https://www.magazineluiza.com.br', 'Eletrodomésticos', TRUE, TRUE, 500.00, 8, 5, 'Um dos maiores varejistas de eletrodomésticos do Brasil. Bons preços e entrega ampla.'),
('Americanas', 'https://www.americanas.com.br', 'Eletrodomésticos', TRUE, TRUE, 400.00, 7, 5, 'Marketplace com grande portfólio de eletrodomésticos de todas as marcas.'),
('Fast Shop', 'https://www.fastshop.com.br', 'Eletrodomésticos', TRUE, FALSE, NULL, 8, 5, 'Especialista em eletrodomésticos premium, eletrônicos e móveis. Atendimento diferenciado.'),
('Casas Bahia', 'https://www.casasbahia.com.br', 'Eletrodomésticos', TRUE, TRUE, 300.00, 7, 6, 'Grande rede varejista com preços competitivos e facilidade de parcelamento.'),
('Consul', 'https://www.consul.com.br', 'Eletrodomésticos', TRUE, FALSE, NULL, 8, 10, 'Fabricante nacional de eletrodomésticos como refrigeradores, lavadoras e fogões.'),

-- ============================================================
-- ELETRÔNICOS
-- ============================================================
('Amazon Brasil', 'https://www.amazon.com.br', 'Eletrônicos', TRUE, TRUE, 199.00, 9, 3, 'Ampla seleção de eletrônicos com preços competitivos e entrega Prime.'),
('Samsung Store', 'https://www.samsung.com/br/smartphones', 'Eletrônicos', TRUE, FALSE, NULL, 9, 7, 'Loja oficial Samsung. Smartphones, tablets e wearables com garantia do fabricante.'),
('Apple Brasil', 'https://www.apple.com/br', 'Eletrônicos', TRUE, FALSE, NULL, 9, 5, 'Loja oficial Apple. iPhones, iPads, MacBooks e acessórios originais.'),
('KaBuM!', 'https://www.kabum.com.br', 'Eletrônicos', TRUE, TRUE, 299.00, 9, 3, 'Excelente para headsets, webcams, fones e acessórios eletrônicos.'),
('Extra', 'https://www.extra.com.br', 'Eletrônicos', TRUE, TRUE, 300.00, 7, 5, 'Marketplace com boa variedade de eletrônicos e preços promocionais frequentes.'),

-- ============================================================
-- MOBILIÁRIO E DECORAÇÃO
-- ============================================================
('Tok&Stok', 'https://www.tokstok.com.br', 'Mobiliário e Decoração', TRUE, FALSE, NULL, 8, 10, 'Referência em móveis e decoração com design moderno. Foco em ambientes residenciais e corporativos.'),
('Mobly', 'https://www.mobly.com.br', 'Mobiliário e Decoração', TRUE, TRUE, 500.00, 7, 10, 'E-commerce de móveis e decoração com grande variedade e bom custo-benefício.'),
('Etna', 'https://www.etna.com.br', 'Mobiliário e Decoração', TRUE, FALSE, NULL, 7, 10, 'Loja de móveis e decoração com foco em estilo contemporâneo.'),
('Madeira Madeira', 'https://www.madeiramadeira.com.br', 'Mobiliário e Decoração', TRUE, TRUE, 399.00, 8, 10, 'Grande marketplace de móveis e decoração com preços competitivos e ampla seleção.'),
('Leroy Merlin', 'https://www.leroymerlin.com.br', 'Mobiliário e Decoração', TRUE, FALSE, NULL, 8, 5, 'Além de materiais, possui boa linha de móveis, organização e decoração para ambientes.'),

-- ============================================================
-- UNIFORMES E VESTUÁRIO
-- ============================================================
('Uniformizar', 'https://www.uniformizar.com.br', 'Uniformes e Vestuário', TRUE, FALSE, NULL, 7, 10, 'Especialista em uniformes profissionais para empresas. Personalização com logotipos.'),
('Dan Uniformes', 'https://www.danuniformes.com.br', 'Uniformes e Vestuário', TRUE, FALSE, NULL, 7, 12, 'Fabricante e distribuidor de uniformes profissionais e corporativos.'),
('Alphaville Uniformes', 'https://www.alphauniformes.com.br', 'Uniformes e Vestuário', TRUE, FALSE, NULL, 6, 14, 'Produção de uniformes personalizados para empresas e eventos.'),
('Fardamento Nacional', 'https://www.fardamentonacional.com.br', 'Uniformes e Vestuário', TRUE, FALSE, NULL, 6, 12, 'Distribuidor de fardamentos e uniformes profissionais de diversas categorias.'),
('Confecções Vip', 'https://www.confeccoesvip.com.br', 'Uniformes e Vestuário', TRUE, FALSE, NULL, 6, 15, 'Confecção de uniformes corporativos sob medida com bordado e silk.'),

-- ============================================================
-- MATERIAL DE CONSTRUÇÃO
-- ============================================================
('Leroy Merlin', 'https://www.leroymerlin.com.br', 'Material de Construção', TRUE, FALSE, NULL, 8, 5, 'Líder em materiais de construção, ferramentas e decoração. Ampla rede nacional.'),
('Telhanorte', 'https://www.telhanorte.com.br', 'Material de Construção', TRUE, FALSE, NULL, 7, 5, 'Rede de materiais de construção com foco em acabamentos, pisos e revestimentos.'),
('Cassol', 'https://www.cassol.com.br', 'Material de Construção', TRUE, FALSE, NULL, 7, 6, 'Forte no Sul do Brasil, com amplo portfólio de materiais de construção.'),
('Ferramentas Gerais', 'https://www.ferramentasgerais.com.br', 'Material de Construção', TRUE, TRUE, 350.00, 7, 5, 'E-commerce de ferramentas, fixadores e materiais para construção e manutenção.'),
('C&C', 'https://www.cec.com.br', 'Material de Construção', TRUE, FALSE, NULL, 7, 5, 'Rede de materiais de construção com bom atendimento e variedade de produtos.'),

-- ============================================================
-- ALIMENTOS E BEBIDAS
-- ============================================================
('Makro', 'https://www.makro.com.br', 'Alimentos e Bebidas', TRUE, FALSE, NULL, 8, 3, 'Atacadista referência para compras corporativas de alimentos e bebidas em volume.'),
('Atacadão', 'https://www.atacadao.com.br', 'Alimentos e Bebidas', TRUE, FALSE, NULL, 8, 2, 'Atacarejo com preços imbatíveis para compras de alimentos e bebidas em grande quantidade.'),
('Assaí Atacadista', 'https://www.assai.com.br', 'Alimentos e Bebidas', TRUE, FALSE, NULL, 8, 2, 'Atacarejo com ampla variedade de alimentos, bebidas e produtos de uso geral.'),
('iFood para Empresas', 'https://empresa.ifood.com.br', 'Alimentos e Bebidas', TRUE, FALSE, NULL, 7, 1, 'Solução de alimentação corporativa para equipes e escritórios.'),
('Confiança Distribuidora', 'https://www.confiancadistribuidora.com.br', 'Alimentos e Bebidas', TRUE, FALSE, NULL, 6, 3, 'Distribuidora de alimentos e bebidas para empresas no Rio de Janeiro.'),

-- ============================================================
-- OUTROS
-- ============================================================
('Mercado Livre', 'https://www.mercadolivre.com.br', 'Outros', TRUE, TRUE, 79.00, 8, 5, 'Maior marketplace da América Latina. Boa opção de fallback para categorias diversas.'),
('Shopee Brasil', 'https://shopee.com.br', 'Outros', TRUE, TRUE, 0.00, 7, 7, 'Marketplace com preços muito baixos e frete grátis frequente. Bom para itens genéricos.'),
('AliExpress', 'https://pt.aliexpress.com', 'Outros', TRUE, TRUE, 0.00, 6, 30, 'Marketplace chinês com preços baixíssimos. Prazo de entrega longo (20-40 dias).'),
('Elo7', 'https://www.elo7.com.br', 'Outros', TRUE, FALSE, NULL, 6, 10, 'Marketplace de produtos artesanais e personalizados. Útil para brindes e itens especiais.'),
('OLX Negócios', 'https://www.olx.com.br', 'Outros', FALSE, FALSE, NULL, 5, 0, 'Plataforma de classificados. Indicado para buscas de itens usados ou muito específicos. Usar com cautela.');
