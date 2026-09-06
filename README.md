# Concurso ACI-DF — Painel de Acompanhamento

Repositório para trabalhos e projetos feitos com o Claude.

Este projeto reúne um **painel informativo** sobre o concurso público de **Auditor de Controle Interno do Distrito Federal (ACI-DF)** — Edital nº 01 - SEPLAD, de 23/12/2022 — e uma análise sobre a evolução da ocupação desse cargo no Quadro de Pessoal do GDF.

- **Site publicado:** https://concurso-aci.github.io/informacoes/
- **Organização GitHub:** [Concurso-ACI/informacoes](https://github.com/Concurso-ACI/informacoes)

## Estrutura do site

Site estático (HTML/CSS/JS puro), com tema escuro e dourado inspirado no distintivo da carreira. Publicado via GitHub Pages.

### Abas do painel

1. **Resumo** — cards com totais (candidatos, já nomeados, aprovados a nomear, fim de fila, sem efeito, vacâncias, remanescentes na LDO 2026), gráfico de situação das nomeações (FC + PO combinados), gráfico de vacâncias por ano, e lista dos DODFs de nomeação com links e contagem por cargo.
2. **Ordem de Nomeação** — lista completa de candidatos, com seletor de cargo (Finanças e Controle / Planejamento e Orçamento), filtros (nome, tipo de vaga, situação — incluindo "A nomear" para quem ainda não tem situação definida —, já nomeado, CGDF-PO, TCDF/TCU, Senado/Câmara, observação) e exportação CSV.
3. **Vacâncias** — aposentadorias e exonerações do cargo desde 2010, com filtros por ano e tipo de ato.
4. **Sem Efeito** — nomeações tornadas sem efeito, com link para o DODF de publicação.
5. **Cálculo de Impacto** — base orçamentária (RGF 2026) e um **simulador interativo** (régua de 0 a 121 nomeações, limite da LDO 2026) que recalcula em tempo real o impacto orçamentário e a "folga" para o limite prudencial.
6. **Defesa Técnica** — resumos objetivos dos 3 fundamentos jurídicos que embasam nomeações em período eleitoral (Parecer PGDF nº 534/2022, artigo Jurisite, Manual de Condutas Vedadas), cada um com link para o documento original.
7. **Ocupação dos Cargos** — dados mensais (01/2021 a 07/2026) extraídos do Portal da Transparência do DF sobre o cargo Auditor de Controle Interno: total de cargos (630), gráfico de evolução da taxa de ocupação, filtro por mês com cards de vagos/ocupados/taxa, e uma análise de 3 marcos (01/2023, 01/2025, 04/2026) demonstrando que o acréscimo líquido de pessoal foi ínfimo frente ao total de nomeações realizadas.

## Dados e fontes

- `lista-nomeacao.csv` / `data/nomeacoes.json` — ordem de nomeação, cargo Finanças e Controle (214 candidatos).
- `Aprovados PO.xlsx` / `data/nomeacoes-po.json` — ordem de nomeação, cargo Planejamento e Orçamento (43 candidatos).
- `vacancias.csv` / `data/vacancias.json` — vacâncias (aposentadorias/exonerações) de 2010 a 2026.
- `nomeacoes-sem-efeito.csv` / `data/sem-efeito.json` — nomeações tornadas sem efeito.
- `Impacto Financeiro - Nomeação ACI - Set-26.xlsx` / `data/impacto.json` — base orçamentária e critérios de cálculo (RGF 2026).
- `data/dodf-nomeacoes.json` — decretos de nomeação publicados no DODF, com link e contagem por cargo.
- `data/defesa-tecnica.json` — resumos e links da fundamentação jurídica.
- `data/ocupacao-cargos.json` — série mensal de cargos vagos/ocupados (Portal da Transparência DF, API `cargo-efetivo`).
- `data/marcos-ocupacao.json` — os 3 marcos usados na análise de impacto de pessoal.
- `assets/distintivo.png` — distintivo da carreira (fundo removido), usado no cabeçalho.

### Campo "já nomeado" (histórico)

Além da **situação atual** de cada candidato (SIM, FIM DE FILA, EXONERAÇÃO, SUBJUDICE, DESISTÊNCIA...), cada registro tem um campo `foiNomeado` que indica se a pessoa já teve algum ato de nomeação publicado alguma vez — mesmo que hoje não esteja mais ativa (por exoneração, desistência ou anulação do ato). Isso evita confundir "nunca foi chamado" com "foi chamado e depois saiu".

## Conferência de dados (pente-fino)

Os dados de nomeação foram cruzados manualmente com os decretos publicados no DODF:

1. **DODF nº 237, de 12/12/2024** — [link](https://dodf.df.gov.br/dodf/jornal/visualizar-pdf?pasta=2024|12_Dezembro|DODF%20237%2012-12-2024|&arquivo=DODF%20237%2012-12-2024%20INTEGRA.pdf) — 50 nomeados FC + 20 nomeados PO (70 no total).
2. **DODF nº 024, de 27/03/2026 (Edição Extra A)** — [link](https://dodf.df.gov.br/dodf/jornal/visualizar-pdf?pasta=2026|03_Março|DODF%20024%2027-03-2026%20EDICAO%20EXTRA%20A|&arquivo=DODF%20024%2027-03-2026%20EDICAO%20EXTRA%20A.pdf) — 20 nomeados FC + 10 nomeados PO (30 no total).

Correções aplicadas a partir dessa conferência:
- Inclusão de **Andryani Piacini** e **Andressa Cervellini de Farias Parpinelli** na planilha de PO (situação: FIM DE FILA).
- **Stefany Valentim Mendes da Silva** (FC): deixou de ser subjudice, assumiu o cargo em PO e pediu fim de fila em FC.
- **Caio Jorge dos Santos Vasconcellos** (FC): dupla aprovação — assumiu PO, situação em FC atualizada para FIM DE FILA.

## Como rodar localmente

```bash
python3 -m http.server 8123
```

Depois acesse `http://localhost:8123`.

## Publicação

```bash
git add -A
git commit -m "mensagem"
git push
```

O GitHub Pages atualiza automaticamente a partir da branch `main`.

## Outros arquivos do repositório

- `dados-transparencia/ocupacao-aci-2021-2026.xlsx` — planilha Excel com a série histórica de ocupação do cargo (mesma fonte da aba "Ocupação dos Cargos"), incluindo gráfico.
