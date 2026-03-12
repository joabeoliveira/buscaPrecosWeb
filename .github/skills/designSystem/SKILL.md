---
name: design-system-busca-precos
description: "Skill de design system para BuscaPrecosWeb. Use para criar ou ajustar telas/components com consistencia visual, tokens reutilizaveis, temas light/dark, acessibilidade e padrao de UI com Tailwind CSS."
argument-hint: "Descreva a tela/componente, objetivo visual, estado (light/dark) e restricoes de UX."
user-invocable: true
---

# Skill: Design System BuscaPrecosWeb

## Objetivo
Padronizar a implementacao visual do BuscaPrecosWeb com foco em consistencia, escalabilidade e legibilidade, evitando estilos ad-hoc e regressao de interface. O sistema deve ser responsivo, acessivel e alinhado com a identidade visual do projeto, utilizando tokens de design e componentes reutilizaveis.

## Quando usar
- Criar novas telas, cards, tabelas, formularios ou estados vazios.
- Refatorar UI para reutilizar tokens e componentes.
- Ajustar contraste, hierarquia tipografica e comportamento light/dark.
- Revisar PRs com foco em consistencia visual.

## Fundamentos visuais do projeto
- Cor principal: Azul Petroleo.
- Estilo: limpo, funcional, com destaque claro para preco.
- Prioridade de informacao: produto, menor preco, loja, acao de compra.

## Tokens obrigatorios (Tailwind)

### Paleta `petroleum`
```js
petroleum: {
  50: '#f0f7f9',
  100: '#dbeafe',
  400: '#38bdf8',
  500: '#0284c7',
  700: '#0369a1',
  900: '#0c4a6e',
  950: '#082f49',
}
```

### Regras de tema
- Light Mode:
  - fundo: `bg-slate-50`
  - superficies: `bg-white shadow-sm`
  - texto principal: `text-slate-900`
  - texto secundario: `text-slate-500`
  - CTA principal: `bg-petroleum-900 text-white`
- Dark Mode:
  - fundo: `bg-petroleum-950`
  - superficies: `bg-petroleum-900 border border-slate-800`
  - texto principal: `text-slate-50`
  - texto secundario: `text-slate-400`
  - CTA principal: `bg-petroleum-500 text-white`

### Cores semanticas
- Preco em destaque:
  - light: `text-emerald-500`
  - dark: `text-emerald-400`
- Erro/indisponivel:
  - light: `text-rose-600`
  - dark: `text-rose-400`

## Regras de composicao
- Tipografia sem serifa com escala clara de hierarquia.
- Bordas e raio:
  - cards e blocos: `rounded-xl`
  - botoes e inputs: `rounded-lg`
- Espacamento consistente em escala (4, 8, 12, 16, 24, 32).
- Evitar uso de valores inline arbitrarios sem justificativa.

## Componentes-base esperados
- `PriceBadge`:
  - exibe preco com alta legibilidade e cor semantica.
  - suporta estados: normal, promocao, indisponivel.
- `ProductCard`:
  - nome do produto, menor preco, loja, link de compra.
  - responsivo e com estrutura consistente entre temas.
- `SearchInput`:
  - estados de foco, erro, desabilitado e loading.
- `ResultList`:
  - lista de resultados com estado vazio e estado de erro.

## Workflow de implementacao
1. Definir contexto da tela/componente
- Qual problema visual sera resolvido.
- Qual dado e prioritario na leitura.
- Quais estados precisam existir (loading, vazio, erro, sucesso).

2. Escolher tokens antes de escrever markup
- Selecionar classes de cor, tipografia, espacamento e raio.
- Garantir compatibilidade light/dark desde o inicio.

3. Montar estrutura semantica
- Usar hierarquia clara de titulo, conteudo e acoes.
- Manter o foco no fluxo principal de comparacao de preco.

4. Aplicar estados de interacao
- Hover, focus, disabled, erro e loading.
- Garantir contraste suficiente e feedback visual claro.

5. Validar responsividade
- Conferir comportamento em mobile e desktop.
- Evitar quebra de layout em textos longos e precos grandes.

6. Revisar consistencia final
- Verificar se o componente reaproveita tokens existentes.
- Remover variacoes visuais desnecessarias.

## Decision points
- Se o elemento se repete em 2 ou mais telas:
  - promover para componente reutilizavel.
- Se uma variacao muda apenas cor/espacamento:
  - criar variante por props, nao duplicar componente.
- Se houver conflito entre "bonito" e "legivel":
  - priorizar legibilidade e escaneabilidade.

## Checklist de qualidade (DoD)
- Light e dark mode funcionando sem perda de contraste.
- Preco sempre com destaque visual correto.
- Estados vazios/erro/loading implementados.
- Layout responsivo validado em telas pequenas e grandes.
- Componentes reutilizam tokens, sem proliferacao de classes aleatorias.
- Sem quebra de acessibilidade basica (focus visivel, contraste, labels).

## Entrega esperada pelo agente
- Explicar o que mudou visualmente.
- Listar arquivos alterados e impacto por arquivo.
- Informar validacoes feitas (tema, responsividade, acessibilidade).
- Sugerir no maximo 3 proximos passos.

## Prompts de exemplo
- "/design-system-busca-precos Crie um ProductCard para resultados de menor preco com suporte a dark mode."
- "/design-system-busca-precos Refatore os botoes para usar variantes primario/secundario sem mudar comportamento."
- "/design-system-busca-precos Revise a tela de resultados e aponte inconsistencias de tokens e contraste."