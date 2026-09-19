Quero evoluir o projeto atual **HuntDex / PokeHunt Analytics** para uma **v2 completa**, mantendo integralmente o MVP atual já funcional.

IMPORTANTE:

* NÃO refazer o projeto do zero.
* NÃO remover nenhuma funcionalidade atual.
* NÃO quebrar o analisador atual.
* NÃO alterar cálculos existentes que já estejam corretos.
* Trabalhar em cima da base existente.
* Preservar o parser atual de JSON do PxG.
* Preservar as abas atuais:

  * Visão Geral
  * Loot
  * Supplies
  * Pokémon
  * Damage
* Preservar:

  * validação do JSON;
  * análise local;
  * gráficos atuais;
  * tabelas;
  * insights;
  * edição do JSON;
  * responsividade;
  * funcionamento sem backend.

A aplicação continuará sendo processada localmente no navegador.

A v2 deve adicionar:

1. Persistência local das hunts
2. Histórico de Hunts
3. Dashboard Geral
4. Filtros por período
5. Comparador de Hunts
6. Rare / Shiny Tracker
7. Agregador de loot
8. Agregador de Pokémon derrotados
9. Agregador de supplies
10. Sistema de Diamonds equivalentes
11. Backup e restauração
12. Melhor navegação entre as áreas

---

# 1. PERSISTÊNCIA LOCAL

Implementar persistência usando:

**IndexedDB**

Pode utilizar uma biblioteca leve como:

* idb

ou implementação própria organizada.

Não utilizar localStorage para armazenar todas as hunts.

localStorage pode ser utilizado apenas para:

* preferências;
* configurações;
* preço do Diamond;
* estado simples da interface.

As hunts devem ficar no IndexedDB.

---

# 2. ESTRUTURA DE HUNT SALVA

Cada hunt salva deve conter pelo menos:

```ts
interface SavedHunt {
  id: string;
  sessionId?: number;

  player: string;

  start?: string;
  startTimestamp?: number;

  durationSeconds: number;

  experience: number;
  experiencePerHour: number;

  profit: number;
  profitPerHour: number;

  rawGains: number;
  rawGainsPerHour: number;

  suppliesCost: number;
  suppliesPerHour: number;

  kills: number;
  killsPerHour: number;

  rareKills: number;
  rareKillsPerHour: number;

  damageDealt: number;
  damageTaken: number;

  damageDealtPerSecond: number;
  damageTakenPerSecond: number;

  drops: NormalizedDrop[];
  supplies: NormalizedSupply[];
  enemies: NormalizedEnemy[];
  damageByEnemy: DamageByEnemy[];
  damageByElement: DamageByElement[];

  rawJson: PxGHuntData;

  createdAt: number;
}
```

Pode adaptar os nomes aos tipos existentes do projeto.

---

# 3. EVITAR HUNTS DUPLICADAS

Criar proteção contra duplicação.

Primeira regra:

```text
Session ID + Player + Start
```

Se esses dados já existirem, considerar hunt duplicada.

Caso Session ID não exista, utilizar fallback baseado em:

* player;
* start;
* duration;
* kills;
* experience;
* profit.

Pode gerar um hash determinístico.

Ao tentar salvar uma hunt duplicada mostrar:

**Esta hunt já está salva no seu histórico.**

Não criar duplicata silenciosamente.

---

# 4. BOTÃO SALVAR HUNT

No dashboard atual da análise, adicionar:

**Salvar Hunt**

Após salvar:

**Hunt salva**

Trocar visualmente o estado do botão.

Se a hunt já estiver salva:

**Já salva**

---

# 5. NAVEGAÇÃO PRINCIPAL

Adicionar uma navegação clara.

Sugestão:

```text
HuntDex

Dashboard
Analisar Hunt
Histórico
Comparar
Rare Tracker
```

Em telas pequenas utilizar menu responsivo.

O analisador atual deve ficar em:

**Analisar Hunt**

---

# 6. DASHBOARD GERAL

Criar uma nova área:

**Dashboard**

Ela deve resumir todas as hunts salvas.

Se não existirem hunts:

Mostrar estado vazio:

**Você ainda não possui hunts salvas.**

Botão:

**Analisar primeira hunt**

---

# 7. FILTROS DE PERÍODO

O Dashboard deve possuir:

* Hoje
* Esta semana
* Este mês
* Últimos 30 dias
* Tudo
* Personalizado

Filtro personalizado deve permitir:

* Data inicial
* Data final

Todos os cards, gráficos e tabelas da página devem reagir ao mesmo período.

---

# 8. DEFINIÇÃO DE SEMANA

Usar:

segunda-feira até domingo.

Não usar semana iniciando no domingo.

---

# 9. MÉTRICAS DO DASHBOARD

Mostrar cards principais:

* Total de hunts
* Tempo total de hunt
* Experience total
* XP/h médio ponderado
* Profit total
* Profit/h médio ponderado
* Loot total
* Loot/h médio ponderado
* Supplies total
* Supplies/h médio ponderado
* Kills
* Kills/h
* Rare kills
* Damage dealt
* Damage taken

---

# 10. REGRA CRÍTICA PARA MÉTRICAS POR HORA

NÃO calcular média simples dos valores por hora das hunts.

Errado:

```ts
average(hunt.experiencePerHour)
```

Correto:

```ts
totalExperience / totalHours
```

Exemplo:

```ts
xpPerHour =
  totalDurationSeconds > 0
    ? totalExperience / (totalDurationSeconds / 3600)
    : 0;
```

Aplicar a mesma lógica para:

* XP/h
* Profit/h
* Loot/h
* Supplies/h
* Kills/h
* Rare kills/h
* Damage dealt/h
* Damage taken/h

Isso evita distorção entre hunts curtas e longas.

---

# 11. TEMPO TOTAL

Somar:

```ts
durationSeconds
```

Mostrar de forma amigável:

```text
18h 42m
```

ou:

```text
2d 4h 15m
```

quando necessário.

---

# 12. GRÁFICOS DO DASHBOARD

Criar gráficos por período.

Adicionar seletor:

```text
Profit
XP
Kills
Tempo
Loot
Supplies
```

Mostrar evolução agrupada por dia.

Exemplo:

```text
18/09
Profit +42.000

19/09
Profit -12.000

20/09
Profit +71.000
```

Quando filtro for muito grande, pode agrupar por:

* dia;
* semana;
* mês;

desde que a lógica esteja organizada.

Para MVP da v2, agrupar por dia é suficiente.

---

# 13. AGREGADOR DE LOOT

Criar no Dashboard seção:

**Loot acumulado**

Somar itens de todas as hunts do período.

Agrupar por:

```ts
Item
```

Somar:

```ts
Count
Total price
```

Tabela:

| Item | Quantidade | Valor acumulado |
| ---- | ---------: | --------------: |

Permitir ordenar por:

* quantidade;
* valor;
* nome.

Mostrar também:

**Top itens por valor**

---

# 14. AGREGADOR DE POKÉMON DERROTADOS

Criar:

**Pokémon derrotados**

Agrupar todas as hunts do período por:

```ts
Enemy
```

Somar:

```ts
Count
```

Tabela:

| Pokémon | Kills | % das kills | Rare |
| ------- | ----: | ----------: | ---- |

Também cruzar com Damage quando possível.

Mostrar:

* dano causado;
* dano recebido;
* dano recebido por kill.

Exemplo:

```text
Alakazam

8.391 kills
5.331.420 damage taken
635 damage taken / kill
```

Pokémon com:

```ts
Rare === true
```

devem receber badge Rare.

---

# 15. AGREGADOR DE SUPPLIES

Criar:

**Supplies utilizados**

Agrupar por item.

Somar:

* Count
* Total price

Tabela:

| Supply | Quantidade | Custo total | % dos gastos |
| ------ | ---------: | ----------: | -----------: |

Adicionar insight:

```text
Revive representa 76% dos seus gastos no período.
```

Somente se houver dados suficientes.

---

# 16. INSIGHTS DO DASHBOARD

Gerar insights objetivos.

Exemplos:

```text
Item que mais gerou valor:
Enigma Stone — 42.000
```

```text
Maior gasto:
Revive — 112.500
```

```text
Pokémon mais derrotado:
Alakazam — 8.391
```

```text
Pokémon que mais causou dano:
Shiny Alakazam — 318.420
```

Não inventar interpretações subjetivas.

Não dizer:

**Você está jogando mal**

ou:

**Essa hunt é ruim**

Mostrar apenas fatos.

---

# 17. SISTEMA DE DIAMONDS

Criar no Dashboard:

**Preço do Diamond**

Campo numérico:

```text
Preço de 1 Diamond no seu servidor
[ 7500 ]
```

Salvar no localStorage.

Usar esse preço para converter o Profit do período.

---

# 18. CÁLCULO DE DIAMONDS

Se:

```text
Profit = 842.430
Diamond = 7.500
```

Calcular:

```ts
842430 / 7500
```

Mostrar:

```text
Diamonds equivalentes

112,32
```

Também mostrar:

```text
Diamonds inteiros:
112

Saldo restante:
2.430
```

Cálculo:

```ts
fullDiamonds = Math.floor(profit / diamondPrice)
remaining = profit - fullDiamonds * diamondPrice
```

---

# 19. CASO DE PREJUÍZO

Se Profit <= 0:

Não mostrar Diamond negativo.

Mostrar:

```text
0 Diamonds disponíveis
```

e:

```text
O período selecionado está com prejuízo líquido de 48.000.
```

---

# 20. CASO PREÇO NÃO INFORMADO

Se preço do Diamond não estiver definido:

Mostrar:

```text
Informe o preço do Diamond para calcular o equivalente do seu profit.
```

---

# 21. HISTÓRICO DE HUNTS

Criar página:

**Histórico**

Listar todas as hunts salvas.

Tabela ou cards contendo:

* data;
* player;
* duração;
* XP;
* XP/h;
* profit;
* profit/h;
* kills;
* rares.

---

# 22. FILTROS DO HISTÓRICO

Permitir:

* busca por jogador;
* período;
* profit positivo;
* profit negativo;
* com Rare;
* ordenar por data;
* ordenar por XP/h;
* ordenar por Profit/h;
* ordenar por duração.

---

# 23. AÇÕES DO HISTÓRICO

Cada hunt deve permitir:

* Abrir análise completa
* Comparar
* Excluir

Excluir deve pedir confirmação.

---

# 24. DETALHES DA HUNT SALVA

Ao abrir uma hunt salva:

Reutilizar o dashboard já existente do analisador.

Não criar uma segunda implementação duplicada.

A mesma tela deve aceitar:

* hunt recém analisada;
* hunt carregada do IndexedDB.

---

# 25. COMPARADOR DE HUNTS

Criar página:

**Comparar Hunts**

Usuário escolhe hunts salvas.

Permitir selecionar:

mínimo:

2

máximo:

5

---

# 26. INTERFACE DE SELEÇÃO

Mostrar lista de hunts:

```text
18/09/2026
Spectral Flame
29m 29s
394.846 XP/h
-16.693 profit/h
```

Checkbox para selecionar.

Botão:

**Comparar selecionadas**

---

# 27. COMPARAÇÃO DE TOTAIS

Mostrar:

| Métrica      | Hunt 1 | Hunt 2 | Hunt 3 |
| ------------ | -----: | -----: | -----: |
| Duração      |        |        |        |
| XP           |        |        |        |
| Profit       |        |        |        |
| Loot         |        |        |        |
| Supplies     |        |        |        |
| Kills        |        |        |        |
| Rare Kills   |        |        |        |
| Damage dealt |        |        |        |
| Damage taken |        |        |        |

---

# 28. COMPARAÇÃO NORMALIZADA

Essa é a parte mais importante.

Mostrar:

| Métrica           | Hunt 1 | Hunt 2 |
| ----------------- | -----: | -----: |
| XP/h              |        |        |
| Profit/h          |        |        |
| Loot/h            |        |        |
| Supplies/h        |        |        |
| Kills/h           |        |        |
| Damage taken/h    |        |        |
| XP/kill           |        |        |
| Profit/kill       |        |        |
| Loot/kill         |        |        |
| Supplies/kill     |        |        |
| Damage taken/kill |        |        |

---

# 29. DIFERENÇAS

Para duas hunts, mostrar também:

```text
XP/h
+11,8%

Profit/h
+24.500

Kills/h
+9,4%
```

Cuidado com divisão por zero.

---

# 30. GRÁFICOS DO COMPARADOR

Criar gráficos comparando:

* XP/h
* Profit/h
* Kills/h
* Supplies/h
* Damage taken/h

Pode utilizar barras lado a lado.

---

# 31. COMPARAÇÃO DE LOOT

Mostrar quais hunts tiveram:

* maior loot;
* maior profit;
* maiores gastos;
* maior XP/h.

Não criar nota artificial.

---

# 32. RARE / SHINY TRACKER

Criar página:

**Rare Tracker**

IMPORTANTE:

O JSON informa Pokémon derrotados.

Ele NÃO informa captura.

Portanto usar:

* derrotado;
* encontrado;
* rare kill.

Nunca usar:

**capturado**

---

# 33. FONTE DE VERDADE PARA RARE

Prioridade:

```ts
Rare === true
```

Essa é a informação principal.

Nome contendo:

```text
Shiny
```

pode ser usado para categorização visual.

Mas não deve substituir o campo Rare.

---

# 34. RESUMO RARE TRACKER

Mostrar:

* Rare kills totais
* Shinies derrotados
* Outros rares
* Hunts com Rare
* Rare kills/h
* Número de espécies Rare diferentes

---

# 35. TABELA RARE TRACKER

Agrupar por Enemy.

Mostrar:

| Pokémon | Quantidade | Primeira vez | Última vez |
| ------- | ---------: | ------------ | ---------- |

Exemplo:

```text
Shiny Alakazam
7
18/09/2026
25/09/2026
```

---

# 36. FILTRO RARE TRACKER

Permitir:

* Hoje
* Semana
* Mês
* Tudo
* Personalizado

Reutilizar componente de filtro do Dashboard.

---

# 37. TIMELINE DE RARES

Adicionar seção:

**Últimos Rares**

Exemplo:

```text
18/09/2026 21:42
Shiny Alakazam

18/09/2026 21:53
Shiny Hypno
```

Se o JSON não fornece horário individual do kill, usar o horário da sessão e deixar claro que é a data da hunt.

Não inventar horário exato de spawn.

---

# 38. BACKUP

Criar área:

**Backup dos dados**

Botão:

**Exportar Backup**

Gerar arquivo:

```text
huntdex-backup-YYYY-MM-DD.json
```

---

# 39. CONTEÚDO DO BACKUP

O backup deve conter:

```ts
{
  version: string;
  exportedAt: string;
  settings: {};
  hunts: [];
}
```

Incluir:

* hunts;
* preço do Diamond;
* preferências importantes.

---

# 40. RESTAURAÇÃO

Botão:

**Importar Backup**

Permitir selecionar JSON.

Validar antes de importar.

Nunca apagar dados existentes automaticamente.

Perguntar:

```text
Como deseja restaurar?

[Mesclar dados]
[Substituir tudo]
```

---

# 41. MESCLAR

Ao mesclar:

Evitar duplicatas usando a mesma lógica de hunt duplicada.

---

# 42. SUBSTITUIR

Ao substituir:

Mostrar confirmação clara:

```text
Esta ação apagará todas as hunts locais antes da restauração.
```

---

# 43. ERRO DE BACKUP

Arquivo inválido:

```text
Este arquivo não parece ser um backup válido do HuntDex.
```

---

# 44. FILTROS REUTILIZÁVEIS

Criar componente reutilizável:

```tsx
<PeriodFilter />
```

Usar em:

* Dashboard
* Rare Tracker
* Histórico se fizer sentido.

Não duplicar lógica.

---

# 45. CAMADA DE SERVIÇO

Criar estrutura organizada.

Sugestão:

```text
src/
  lib/
    db/
      index.ts
      huntsRepository.ts
      migrations.ts

    analytics/
      dashboard.ts
      compare.ts
      rares.ts
      aggregations.ts

    backup/
      exportBackup.ts
      importBackup.ts
```

Pode adaptar à arquitetura atual.

---

# 46. REPOSITÓRIO DE HUNTS

Criar funções:

```ts
saveHunt()
getHunt()
getAllHunts()
deleteHunt()
checkDuplicateHunt()
clearAllHunts()
```

Interface não deve acessar IndexedDB diretamente.

---

# 47. DASHBOARD ANALYTICS

Criar:

```ts
buildDashboardAnalytics(
  hunts: SavedHunt[],
  period: DateRange
)
```

Retornar estrutura já pronta para UI.

---

# 48. COMPARE ANALYTICS

Criar:

```ts
compareHunts(hunts: SavedHunt[])
```

---

# 49. RARE ANALYTICS

Criar:

```ts
buildRareTracker(hunts: SavedHunt[])
```

---

# 50. FILTRO DE DATAS

Utilizar:

```ts
startTimestamp
```

Não comparar strings diretamente quando possível.

---

# 51. START SEM TIMEZONE

O PxG fornece:

```text
2026-09-18 21:23:46
```

Não presumir timezone externo.

Interpretar como horário local do jogador.

Manter consistência com o comportamento atual.

---

# 52. EMPTY STATES

Criar estados vazios bem feitos.

Dashboard:

```text
Nenhuma hunt encontrada neste período.
```

Comparador:

```text
Salve pelo menos duas hunts para utilizar o comparador.
```

Rare Tracker:

```text
Nenhum Rare registrado neste período.
```

Histórico:

```text
Nenhuma hunt salva.
```

---

# 53. NÃO CRIAR BACKEND

Nesta versão:

NÃO implementar:

* Supabase;
* Firebase;
* banco remoto;
* login;
* conta;
* autenticação;
* API;
* cloud sync.

Tudo deve continuar local.

---

# 54. PRIVACIDADE

Manter mensagem:

```text
Seus dados são processados e armazenados localmente no navegador.
```

---

# 55. PERFORMANCE

O sistema pode futuramente ter centenas ou milhares de hunts.

Evitar processamento extremamente ineficiente.

Utilizar:

* useMemo;
* Maps para agregação;
* filtros eficientes;
* IndexedDB indexes se necessário.

---

# 56. INDEXEDDB INDEXES

Criar índices úteis quando possível:

* player
* startTimestamp
* sessionId

---

# 57. MIGRAÇÃO FUTURA

Versionar o IndexedDB para permitir migrations.

Exemplo:

```ts
DB_VERSION = 1
```

Não deixar uma implementação impossível de evoluir.

---

# 58. DESIGN

Preservar o estilo atual.

Dashboard gamer profissional.

Dark mode.

Evitar aparência infantil.

Não exagerar:

* neon;
* glow;
* gradientes.

---

# 59. CARDS

Cards devem ter:

* título;
* valor principal;
* contexto secundário.

Exemplo:

```text
Profit

842.430

45.043 / hora
```

---

# 60. PROFIT

Profit positivo:

verde.

Profit negativo:

vermelho.

Profit zero:

neutro.

---

# 61. DIAMOND

Pode utilizar:

ícone genérico de gem/diamond do Lucide.

Não utilizar assets oficiais sem necessidade.

---

# 62. RESPONSIVIDADE

Todas as novas páginas devem funcionar em:

* desktop;
* notebook;
* tablet;
* celular.

Comparador em mobile pode utilizar scroll horizontal.

---

# 63. FORMATAÇÃO

Manter pt-BR.

```text
1.234.567
```

```text
12.345,5
```

Datas:

```text
18/09/2026
```

---

# 64. TESTES

Expandir os testes atuais.

Criar testes para:

* salvar hunt;
* impedir duplicata;
* carregar hunts;
* excluir hunt;
* agregação de Dashboard;
* filtro por dia;
* filtro por semana;
* filtro por mês;
* métricas ponderadas por hora;
* agregador de drops;
* agregador de supplies;
* agregador de inimigos;
* Diamond;
* Diamond com profit negativo;
* comparador;
* Rare Tracker;
* export de backup;
* import de backup;
* merge sem duplicatas.

---

# 65. DADOS DE TESTE

Criar pelo menos 4 hunts fictícias baseadas na estrutura real do PxG.

Exemplo:

Hunt A:

```text
18/09
29 minutos
Profit negativo
Rare kills 2
```

Hunt B:

```text
19/09
1 hora
Profit positivo
Rare 0
```

Hunt C:

```text
20/09
45 minutos
Profit positivo
Rare 1
```

Hunt D:

```text
01/10
2 horas
Profit alto
Rare 3
```

Isso permitirá validar filtros de período.

---

# 66. TESTAR MÉTRICAS PONDERADAS

Exemplo:

Hunt A:

```text
30 min
100.000 XP
```

Hunt B:

```text
2h
200.000 XP
```

Total:

```text
300.000 XP
2,5h
```

XP/h correto:

```text
120.000 XP/h
```

Não:

```text
média simples de XP/h
```

---

# 67. TESTE DE DIAMOND

Profit:

```text
842430
```

Diamond:

```text
7500
```

Resultado:

```text
112 Diamonds inteiros
2430 restante
112,324 Diamonds equivalentes
```

Interface pode arredondar equivalente para:

```text
112,32
```

---

# 68. TESTE RARE

Se hunts contiverem:

```text
Shiny Alakazam 2
Shiny Hypno 1
Rare X 4
```

Resultado:

```text
Rare total: 7
Shiny total: 3
Outros Rare: 4
```

---

# 69. TESTE DE HISTÓRICO

Criar hunts em datas diferentes.

Confirmar que:

Hoje

Semana

Mês

Tudo

retornam corretamente.

---

# 70. NÃO DUPLICAR CÓDIGO

Reutilizar:

* MetricCard;
* tabelas;
* formatters;
* gráficos;
* PeriodFilter;
* HuntDashboard;
* parser.

---

# 71. COMPATIBILIDADE

O JSON atual do PxG deve continuar funcionando sem alteração.

Campos extras futuros não devem quebrar.

---

# 72. UX DO PRIMEIRO USO

Se não houver hunts:

Dashboard deve ajudar o usuário.

Mostrar:

```text
Comece analisando sua primeira hunt.
```

Botão:

```text
Analisar Hunt
```

---

# 73. UX APÓS SALVAR

Após salvar uma hunt:

Mostrar toast:

```text
Hunt salva no histórico.
```

E opção:

```text
Ver histórico
```

---

# 74. UX DE DUPLICATA

Mostrar:

```text
Esta hunt já está salva.
```

Não tratar como erro grave.

---

# 75. IMPORTANTE SOBRE DADOS

Não inferir dados inexistentes.

Não inventar:

* captura;
* catch rate;
* balls;
* mapa;
* localização da hunt;
* Pokémon utilizado pelo player;
* loot de determinado Pokémon;
* preço externo.

Somente utilizar informações do JSON.

---

# 76. ENTREGA FINAL

Implementar tudo.

Não entregar apenas plano.

Não parar pedindo confirmação.

Não deixar TODO em funções essenciais.

Após terminar:

1. executar testes;
2. executar TypeScript;
3. executar lint;
4. executar build;
5. iniciar ambiente local;
6. testar as principais rotas no navegador;
7. testar responsividade;
8. testar salvar hunt;
9. testar dashboard;
10. testar filtros;
11. testar comparação;
12. testar Rare Tracker;
13. testar Diamond;
14. testar backup;
15. corrigir qualquer erro encontrado.

---

# 77. CRITÉRIO DE ACEITE

Só considerar concluído quando:

* analisador antigo continuar funcionando;
* hunt puder ser salva;
* duplicatas forem bloqueadas;
* histórico funcionar;
* Dashboard somar corretamente;
* filtros por período funcionarem;
* métricas por hora forem ponderadas corretamente;
* loot acumulado funcionar;
* supplies acumulados funcionarem;
* Pokémon derrotados acumulados funcionarem;
* Damage acumulado funcionar;
* Diamond equivalente funcionar;
* Comparador funcionar com 2 a 5 hunts;
* Rare Tracker funcionar;
* backup exportar corretamente;
* backup importar corretamente;
* merge não duplicar hunts;
* TypeScript estiver sem erros;
* lint estiver sem erros;
* testes passarem;
* build passar;
* console do navegador estiver sem erros;
* layout funcionar em desktop e mobile.

Ao final, apresente um resumo curto contendo:

* funcionalidades adicionadas;
* quantidade de testes executados;
* resultado do build;
* principais arquivos criados/alterados;
* endereço local para teste.
