Quero criar uma aplicação web chamada provisoriamente de **PokeHunt Analytics**, focada em análise de estatísticas de hunts do jogo Pokémon Tibia / PxG.

A principal referência de produto, estrutura, organização de informações e experiência de uso é o **Hunt Intelligence**, um analisador de hunts de Tibia.

Quero uma experiência muito semelhante em conceito: o jogador cola os dados de uma hunt e imediatamente recebe um dashboard completo mostrando se aquela hunt foi boa, quanto gastou, quanto ganhou, XP/h, kills, dano, loot, supplies e outras métricas.

Porém, NÃO copie logotipo, nome, textos, imagens, assets ou identidade visual proprietária do Hunt Intelligence.

Use a referência principalmente para:

* densidade de informações;
* organização do dashboard;
* facilidade para identificar rapidamente o resultado de uma hunt;
* cards de métricas;
* tabelas;
* gráficos;
* hierarquia visual;
* experiência de análise.

O produto deve possuir identidade própria voltada para Pokémon Tibia / PxG.

# OBJETIVO DO MVP

Nesta primeira versão o site terá **uma única função**:

> O jogador cola o JSON de estatísticas de uma sessão de hunt exportado pelo cliente do PxG e o site transforma isso em uma análise visual completa.

Não criar ainda:

* login;
* cadastro;
* banco de dados;
* rankings;
* compartilhamento;
* perfil de jogador;
* comparação entre jogadores;
* upload para servidor;
* sistema social;
* assinatura;
* histórico online.

O foco agora é fazer o **melhor analisador possível para uma única hunt**.

A arquitetura, entretanto, deve ser organizada de maneira que futuramente seja possível adicionar histórico de hunts, comparação de sessões, usuários e rankings sem reescrever o projeto inteiro.

---

# STACK

Utilizar:

* Next.js com App Router
* TypeScript
* Tailwind CSS
* shadcn/ui
* Recharts para gráficos
* Lucide Icons
* processamento do JSON inteiramente no navegador

Não é necessário backend no MVP.

O JSON da hunt deve ser processado localmente.

Nenhum dado deve ser enviado para um servidor.

---

# PÁGINA INICIAL

A página inicial deve ser extremamente objetiva.

Header discreto contendo:

**PokeHunt Analytics**

subtítulo:

**Analise suas hunts do PxG**

Pode haver uma frase curta:

**Cole as estatísticas da sua sessão e descubra exatamente como foi sua hunt.**

Logo abaixo, criar uma grande área central para entrada dos dados.

## Campo de JSON

Criar um textarea grande, estilo editor de código, com fonte monoespaçada.

Placeholder:

```
Cole aqui o JSON das estatísticas da sua hunt...
```

Botões:

**Analisar Hunt**

**Limpar**

**Usar exemplo**

O botão "Usar exemplo" deve preencher o campo com um JSON de demonstração compatível com o formato real do PxG.

Quando o JSON for colado, validar automaticamente.

Mostrar:

* "JSON válido" quando estiver correto;
* "JSON inválido" quando houver problema;
* descrição simples do erro quando possível.

O botão "Analisar Hunt" só deve ficar realmente ativo se o JSON puder ser interpretado.

Não usar `eval`.

Usar JSON.parse e validação dos campos.

---

# FORMATO REAL DOS DADOS DO PXG

O JSON possui a seguinte estrutura principal:

```ts
interface PxGHuntData {
    Drops?: DropItem[];
    Supplies?: SupplyItem[];
    Damage?: DamageEntry[];
    "Enemies Defeated"?: EnemyDefeated[];
    Experience?: ExperienceEntry[];
    Session?: SessionData;
}
```

## Drops

```ts
interface DropItem {
    "Unit price": number;
    "Total price": number;
    Ignored: boolean | null;
    Item: string;
    Player: string;
    Count: number;
}
```

Exemplo:

```json
{
    "Unit price": 5000,
    "Total price": 5000,
    "Ignored": null,
    "Item": "Enigma Stone",
    "Player": "Spectral Flame",
    "Count": 1
}
```

---

# SUPPLIES

```ts
interface SupplyItem {
    "Unit price": number;
    "Total price": number;
    Ignored: boolean | null;
    Item: string;
    Player: string;
    Count: number;
}
```

Exemplo:

```json
{
    "Unit price": 250,
    "Total price": 18750,
    "Ignored": null,
    "Item": "Revive",
    "Player": "Spectral Flame",
    "Count": 75
}
```

---

# DAMAGE

```ts
interface DamageEntry {
    "Damage dealt": number;
    Enemy: string;
    Element: string;
    Player: string;
    "Damage taken": number;
}
```

Exemplo:

```json
{
    "Damage dealt": 1818638,
    "Enemy": "Alakazam",
    "Element": "Ghost",
    "Player": "Spectral Flame",
    "Damage taken": 0
}
```

Um mesmo Pokémon inimigo pode aparecer várias vezes porque os dados são separados por elemento.

Portanto:

Alakazam / Ghost

Alakazam / Psychic

Alakazam / Fire

Alakazam / Grass

etc.

devem poder ser agrupados.

---

# ENEMIES DEFEATED

```ts
interface EnemyDefeated {
    Rare: boolean;
    Enemy: string;
    Ignored: boolean;
    Player: string;
    Count: number;
}
```

Exemplo:

```json
{
    "Rare": true,
    "Enemy": "Shiny Alakazam",
    "Ignored": false,
    "Player": "Spectral Flame",
    "Count": 1
}
```

Pokémon com:

```json
"Rare": true
```

devem receber destaque visual.

Exemplo:

**★ Shiny Alakazam**

---

# EXPERIENCE

```ts
interface ExperienceEntry {
    Player: string;
    Experience: number;
}
```

---

# SESSION

A parte mais importante do JSON é `Session`.

Ela pode possuir:

```ts
interface SessionData {
    Status?: string;
    "Time to next level"?: string;
    Profit?: number;
    "Time to next level seconds"?: number;
    "Damage taken"?: number;
    "Session type"?: string;
    "Paused seconds"?: number;
    Supplies?: number;
    "Session ID"?: number;
    "Supplies per hour"?: number;
    "Profit per hour"?: number;
    "Duration seconds"?: number;
    Duration?: string;
    Start?: string;
    "Rare kills"?: number;
    "Damage dealt per second"?: number;
    "Experience per hour"?: number;
    "Kills per hour"?: number;
    "Damage dealt"?: number;
    "Damage taken per second"?: number;
    "Rare kills per hour"?: number;
    Kills?: number;
    "Raw gains"?: number;
    "Raw gains per hour"?: number;
    Experience?: number;
}
```

O sistema deve ser tolerante caso versões futuras do cliente incluam novos campos.

Campos desconhecidos não devem quebrar o parser.

---

# REGRA IMPORTANTE SOBRE OS VALORES

Quando uma informação existir dentro de `Session`, ela deve ser considerada a fonte principal.

Por exemplo:

```json
"Raw gains": 11436
```

deve ser usado para o card principal de ganhos.

Mesmo que a soma individual dos Drops dê 11436.5 por algum arredondamento interno.

A hierarquia deve ser:

1. valor informado por `Session`;
2. cálculo utilizando arrays caso o valor não exista em `Session`.

Isso é importante para que o site apresente os mesmos valores que o cliente do PxG.

---

# DASHBOARD DA HUNT

Depois que o usuário clicar em **Analisar Hunt**, esconder ou minimizar o editor de JSON e mostrar o dashboard.

No topo:

**Hunt de Spectral Flame**

Exibir também:

* início da sessão;
* duração;
* status;
* Session ID.

Exemplo:

**Spectral Flame**

29m 29s de hunt

18/09/2026 • 21:23

---

# CARDS PRINCIPAIS

Primeira linha:

### Profit

Exemplo:

**-8.203**

Se negativo:

vermelho.

Se positivo:

verde.

Mostrar abaixo:

**-16.693/h**

---

### Experience

**194.023 XP**

abaixo:

**394.846 XP/h**

---

### Loot

**11.436**

abaixo:

**23.273/h**

---

### Supplies

**19.639**

abaixo:

**39.966/h**

---

### Kills

**344**

abaixo:

**700/h**

---

### Duração

**29:29**

Também mostrar:

**Time to next level: 01:12:15**

quando existir.

---

# SEGUNDA LINHA DE MÉTRICAS

Criar cards menores para:

* Damage Dealt
* Damage Taken
* DPS
* Damage Taken/s
* Rare Kills
* Rare Kills/h
* Profit por Kill
* XP por Kill
* Supply por Kill
* Loot por Kill

Exemplo da sessão de teste:

Damage dealt:

2.341.130

Damage taken:

272.869

DPS:

1.323

Rare kills:

2

---

# RESUMO FINANCEIRO

Criar um componente visual mostrando:

```
Loot
+ 11.436

Supplies
- 19.639

──────────

Profit
- 8.203
```

Também mostrar por hora:

```
Loot/h       23.273
Supplies/h   39.966
Profit/h    -16.693
```

O usuário deve conseguir entender em poucos segundos por que a hunt deu lucro ou prejuízo.

---

# ABAS DO DASHBOARD

Criar:

**Visão Geral**

**Loot**

**Supplies**

**Pokémon**

**Damage**

A troca entre abas deve acontecer sem recarregar a página.

---

# ABA VISÃO GERAL

Mostrar:

* cards principais;
* resumo financeiro;
* principais drops;
* maiores gastos;
* Pokémon mais mortos;
* distribuição de kills;
* dano causado;
* dano recebido;
* elementos responsáveis pelo dano;
* rare kills.

Adicionar alguns insights automáticos simples.

Por exemplo:

**Maior gasto**

Revive

18.750

95,5% dos supplies

---

**Drop mais valioso**

Enigma Stone

5.000

---

**Pokémon mais derrotado**

Alakazam

242 kills

---

**Principal fonte de dano**

Ghost

---

Os insights devem ser baseados exclusivamente nos dados disponíveis.

Não inventar informações.

---

# LOOT

Criar tabela:

| Item | Quantidade | Valor Unit. | Valor Total | % do Loot |
| ---- | ---------: | ----------: | ----------: | --------: |

Ordenar inicialmente pelo maior valor total.

Permitir ordenar por:

* quantidade;
* valor unitário;
* valor total.

Exemplo:

Enigma Stone

1

5.000

5.000

psychic spoon

9

180

1.620

future orb

102

15,5

1.581

enchanted gem

4.831

0,5

2.415,5

Adicionar gráfico horizontal:

**Itens que mais geraram valor**

Não tentar relacionar um item a determinado Pokémon, pois o JSON atual não fornece essa informação.

---

# SUPPLIES

Tabela:

| Supply | Quantidade | Unitário | Total | % dos Gastos |
| ------ | ---------: | -------: | ----: | -----------: |

Exemplo:

Revive

75

250

18.750

Medicine

417

2

834

Hyper Potion

1

55

55

Mostrar um gráfico:

**Distribuição dos gastos**

Com destaque para o supply mais caro da sessão.

Itens com valor 0 devem aparecer normalmente, mas não interferir no total financeiro.

Exemplo:

Empty Yume Ball

2 utilizadas

0 de custo

---

# POKÉMON DERROTADOS

Criar tabela:

| Pokémon | Kills | % das Kills | Raro |
| ------- | ----: | ----------: | ---- |

Ordenar por quantidade.

Para a sessão de teste:

Alakazam — 242

Kadabra — 46

Hypno — 41

Abra — 8

Drowzee — 5

Shiny Alakazam — 1

Shiny Hypno — 1

Pokémon raros devem receber:

* badge "Rare";
* ícone de estrela;
* destaque discreto.

Não tornar visualmente exagerado.

Adicionar gráfico horizontal:

**Kills por Pokémon**

---

# DAMAGE

Essa deve ser uma das análises mais interessantes do site.

Criar duas perspectivas:

## Damage by Pokémon

Agrupar todos os registros pelo campo `Enemy`.

Para cada Pokémon calcular:

* dano causado;
* dano recebido;
* participação no dano causado;
* participação no dano recebido.

Tabela:

| Pokémon | Damage Dealt | Damage Taken |
| ------- | -----------: | -----------: |

---

## Damage by Element

Agrupar por `Element`.

Exemplos:

Ghost

Psychic

Fire

Grass

Melee

Neutral

Dark

Mostrar:

### Damage Dealt por Element

Gráfico de barras.

### Damage Taken por Element

Outro gráfico.

Não misturar os dois valores em uma única métrica porque eles representam coisas diferentes.

---

# ANÁLISES DERIVADAS

Calcular quando possível:

### Profit por minuto

```
profit / durationMinutes
```

### Profit por kill

```
profit / kills
```

### XP por kill

```
experience / kills
```

### Supply por kill

```
supplies / kills
```

### Loot por kill

```
rawGains / kills
```

### Damage dealt por kill

```
damageDealt / kills
```

### Damage taken por kill

```
damageTaken / kills
```

### Relação Loot / Supplies

```
rawGains / supplies
```

Por exemplo:

0,58x

Isso significa apenas que a hunt recuperou em loot o equivalente a aproximadamente 58% do gasto.

Não mostrar divisões caso o denominador seja zero.

---

# CLASSIFICAÇÃO VISUAL DA HUNT

Não precisa criar um "score" artificial nesta primeira versão.

O resultado financeiro pode receber estados objetivos:

Profit > 0:

**Lucro**

Profit = 0:

**Empate**

Profit < 0:

**Prejuízo**

Exemplo:

**Prejuízo de 8.203**

Evitar frases genéricas como:

"Essa foi uma hunt ruim."

Mostrar os fatos e deixar o jogador interpretar.

---

# FORMATAÇÃO DOS NÚMEROS

Utilizar padrão brasileiro.

Exemplos:

```
2341130
```

mostrar como:

```
2.341.130
```

Decimal:

```
2415.5
```

mostrar como:

```
2.415,5
```

Não inserir casas decimais desnecessárias.

Para números grandes, cards podem opcionalmente mostrar:

394,8k XP/h

mas ao passar o mouse deve mostrar:

394.846 XP/h

Nas tabelas prefiro o número completo.

---

# DURAÇÃO

Os dados podem chegar tanto como:

```json
"Duration": "00:29:29"
```

quanto:

```json
"Duration seconds": 1769
```

Criar utilitário para converter corretamente.

Exibir de maneira amigável:

29m 29s

ou, dependendo do local:

00:29:29

---

# DATA

Entrada:

```json
"Start": "2026-09-18 21:23:46"
```

Exibir:

```
18/09/2026 às 21:23
```

Não alterar o horário presumindo timezone desconhecido.

---

# IDENTIFICAÇÃO DO JOGADOR

Descobrir automaticamente o jogador.

Prioridade:

1. Experience[0].Player
2. Drops[0].Player
3. Supplies[0].Player
4. Damage[0].Player
5. Enemies Defeated[0].Player

Se nenhum existir:

**Jogador desconhecido**

---

# UX

O fluxo deve ser extremamente simples:

```
COLAR JSON
↓
ANALISAR HUNT
↓
DASHBOARD
```

Sem etapas desnecessárias.

Adicionar no dashboard botão:

**Analisar outra hunt**

Ele deve voltar ao editor.

Também permitir:

**Editar JSON**

sem perder imediatamente os dados atuais.

---

# DESIGN

Quero um dashboard moderno, escuro, elegante e voltado para gamers.

Não quero algo infantil ou excessivamente colorido.

Usar predominantemente:

* background quase preto;
* superfícies em cinza muito escuro;
* bordas discretas;
* tipografia clara;
* verde para lucro;
* vermelho para prejuízo;
* dourado ou roxo discreto para rare/shiny;
* cores elementais apenas em detalhes dos gráficos.

Visual semelhante a ferramentas modernas de analytics.

Referências conceituais:

* Hunt Intelligence;
* dashboards de analytics;
* interfaces de ferramentas para Tibia;
* aplicações modernas SaaS dark mode.

A temática Pokémon deve aparecer de forma sutil.

Não utilizar assets, logos, sprites ou artes oficiais de Pokémon/PxG sem que sejam fornecidos posteriormente.

Por enquanto utilizar:

* texto;
* ícones genéricos;
* badges;
* símbolos;
* elementos geométricos.

---

# ELEMENTOS

Para elementos utilizar badges discretos.

Exemplo:

Ghost

Psychic

Fire

Grass

Dark

Neutral

Melee

Cada elemento pode receber uma identidade visual própria.

Manter um mapa de configuração:

```ts
const elementConfig = {
    Ghost: {},
    Psychic: {},
    Fire: {},
    Grass: {},
    Dark: {},
    Neutral: {},
    Melee: {}
}
```

Deixar simples adicionar novos elementos futuramente.

---

# RESPONSIVIDADE

O site deve funcionar perfeitamente em:

* desktop;
* notebook;
* tablet;
* celular.

No desktop:

cards em grid.

Tabelas ocupando a largura disponível.

No celular:

cards empilhados ou em duas colunas quando possível.

Tabelas devem permitir scroll horizontal.

O textarea deve continuar confortável para colar JSON grande.

---

# ESTRUTURA DO CÓDIGO

Separar responsabilidades.

Sugestão:

```text
src/
 ├─ app/
 │   └─ page.tsx
 │
 ├─ components/
 │   ├─ analyzer/
 │   │   ├─ JsonInput.tsx
 │   │   ├─ HuntDashboard.tsx
 │   │   ├─ SessionSummary.tsx
 │   │   ├─ MetricCard.tsx
 │   │   ├─ FinancialSummary.tsx
 │   │   ├─ LootTable.tsx
 │   │   ├─ SuppliesTable.tsx
 │   │   ├─ EnemiesTable.tsx
 │   │   ├─ DamageAnalysis.tsx
 │   │   └─ HuntInsights.tsx
 │   │
 │   └─ ui/
 │
 ├─ lib/
 │   ├─ pxg/
 │   │   ├─ parser.ts
 │   │   ├─ analytics.ts
 │   │   ├─ validators.ts
 │   │   └─ types.ts
 │   │
 │   ├─ formatters.ts
 │   └─ utils.ts
 │
 └─ data/
     └─ exampleHunt.ts
```

Não concentrar toda a aplicação dentro de `page.tsx`.

---

# ANALYTICS

Criar uma função central:

```ts
analyzeHunt(data: PxGHuntData)
```

Ela deve transformar os dados brutos em uma estrutura normalizada para a interface.

Exemplo:

```ts
interface HuntAnalysis {
    player: string;

    session: {
        start?: string;
        durationSeconds: number;
        durationFormatted: string;
        status?: string;
    };

    financial: {
        rawGains: number;
        supplies: number;
        profit: number;

        rawGainsPerHour: number;
        suppliesPerHour: number;
        profitPerHour: number;

        profitPerKill: number | null;
        lootPerKill: number | null;
        supplyPerKill: number | null;
    };

    experience: {
        total: number;
        perHour: number;
        perKill: number | null;
        timeToNextLevel?: string;
    };

    combat: {
        kills: number;
        killsPerHour: number;
        rareKills: number;
        rareKillsPerHour: number;

        damageDealt: number;
        damageTaken: number;

        dps: number;
        damageTakenPerSecond: number;
    };

    drops: NormalizedDrop[];
    supplies: NormalizedSupply[];
    enemies: NormalizedEnemy[];

    damageByEnemy: DamageByEnemy[];
    damageByElement: DamageByElement[];

    insights: HuntInsight[];
}
```

Isso é importante para que a interface não tenha que interpretar diretamente o JSON bruto.

---

# FALLBACKS

Caso Session não possua:

`Raw gains`

usar:

```
sum(Drops["Total price"])
```

Caso não possua:

`Supplies`

usar:

```
sum(Supplies["Total price"])
```

Caso não possua:

`Profit`

usar:

```
rawGains - supplies
```

Caso não possua:

`Kills`

usar:

```
sum(Enemies Defeated.Count)
```

Caso não possua:

`Experience`

usar:

```
sum(Experience.Experience)
```

Valores por hora podem ser calculados:

```
value / durationHours
```

somente quando `Duration seconds > 0`.

---

# VALIDAÇÃO

Um JSON não precisa possuir absolutamente todas as áreas.

Por exemplo, isto ainda deve ser aceito:

```json
{
    "Drops": [],
    "Supplies": [],
    "Enemies Defeated": [],
    "Session": {
        "Duration seconds": 1200
    }
}
```

Mostrar apenas o que estiver disponível.

O sistema deve evitar:

* undefined;
* NaN;
* Infinity;
* crash;
* tela branca.

---

# ESTADOS DE ERRO

Criar mensagens amigáveis.

JSON com erro de sintaxe:

**Não foi possível ler este JSON. Verifique se você copiou todo o conteúdo das estatísticas do PxG.**

JSON válido mas aparentemente não pertencente ao PxG:

**O JSON é válido, mas não encontramos dados de uma sessão de hunt do PxG.**

Nenhuma hunt registrada:

**Esta sessão não possui dados suficientes para análise.**

---

# PERFORMANCE

Os arquivos podem possuir muitos registros.

As análises devem ser feitas utilizando funções eficientes.

Evitar loops desnecessários.

Quando possível, fazer agregações em uma única passagem.

Usar `useMemo` adequadamente para dados derivados da interface.

---

# PRIVACIDADE

Mostrar discretamente próximo ao campo:

**Seus dados são analisados localmente no navegador e não são enviados para nenhum servidor.**

Isso deve realmente ser verdade no MVP.

---

# DADOS DE TESTE OBRIGATÓRIOS

Utilize como teste uma sessão cujo `Session` contém:

```json
{
    "Status": "Paused",
    "Time to next level": "01:12:15",
    "Profit": -8203,
    "Damage taken": 272869,
    "Supplies": 19639,
    "Session ID": 1742,
    "Supplies per hour": 39966,
    "Profit per hour": -16693,
    "Duration seconds": 1769,
    "Duration": "00:29:29",
    "Start": "2026-09-18 21:23:46",
    "Rare kills": 2,
    "Damage dealt per second": 1323,
    "Experience per hour": 394846,
    "Kills per hour": 700,
    "Damage dealt": 2341130,
    "Damage taken per second": 154,
    "Rare kills per hour": 4,
    "Kills": 344,
    "Raw gains": 11436,
    "Raw gains per hour": 23273,
    "Experience": 194023
}
```

O dashboard deve apresentar corretamente:

```text
Jogador:
Spectral Flame

Duração:
29:29

Kills:
344

Kills/h:
700

Experience:
194.023

XP/h:
394.846

Loot:
11.436

Loot/h:
23.273

Supplies:
19.639

Supplies/h:
39.966

Profit:
-8.203

Profit/h:
-16.693

Damage dealt:
2.341.130

Damage taken:
272.869

DPS:
1.323

Rare kills:
2
```

Os inimigos dessa sessão totalizam:

```text
Alakazam          242
Kadabra            46
Hypno              41
Abra                8
Drowzee             5
Shiny Alakazam      1
Shiny Hypno         1
----------------------
TOTAL              344
```

Portanto, utilizar isso também como teste de consistência.

---

# DETALHE IMPORTANTE

Não presuma informações que o JSON não fornece.

Por exemplo:

Não podemos saber qual Pokémon dropou `Enigma Stone`, pois atualmente `Drops` não possui relação com `Enemy`.

Não inventar esta relação.

Da mesma forma, não tentar calcular:

* catch rate;
* quantidade de balls utilizadas para captura;
* XP individual de cada Pokémon;
* loot por criatura;
* preço de mercado externo;

a menos que futuramente existam dados suficientes.

---

# QUALIDADE VISUAL

Quero que o resultado pareça um produto real, e não um projeto escolar ou dashboard genérico.

Prestar muita atenção em:

* espaçamento;
* hierarquia;
* alinhamento;
* tipografia;
* densidade das informações;
* estados hover;
* skeletons/transições discretas;
* responsividade;
* tabelas;
* tooltips;
* formatação dos números;
* contraste.

Não exagerar em:

* gradientes;
* glow;
* neon;
* animações;
* glassmorphism.

O dashboard deve transmitir a sensação de:

**ferramenta de análise profissional feita especificamente para jogadores de PxG.**

---

# PRIMEIRA ENTREGA

Entregue o projeto funcional completo.

Não entregar somente mockup.

Não deixar TODOs para funções essenciais.

A primeira versão deve permitir:

1. abrir o site;
2. colar o JSON;
3. validar;
4. clicar em "Analisar Hunt";
5. interpretar o JSON;
6. calcular métricas;
7. mostrar dashboard;
8. navegar entre Visão Geral, Loot, Supplies, Pokémon e Damage;
9. voltar e analisar outra hunt.

Crie também um JSON de exemplo baseado na estrutura informada para que o botão **Usar exemplo** possa ser testado.

---

# CRITÉRIO DE ACEITE

Considerarei o MVP concluído quando:

* JSON real do PxG puder ser colado sem alteração;
* parser não quebrar com campos extras;
* valores do Session forem respeitados;
* fallback funcionar quando algum valor de Session não existir;
* somatório de kills estiver correto;
* loot estiver correto;
* supplies estiver correto;
* profit estiver correto;
* damage aggregation estiver correta;
* damage por elemento estiver correta;
* rare Pokémon estiverem identificados;
* números estiverem formatados em pt-BR;
* interface estiver responsiva;
* nenhum dado for enviado para servidor;
* dashboard tiver aparência profissional;
* nenhuma informação inexistente for inventada.

Antes de considerar a implementação concluída, teste todo o fluxo usando a sessão de exemplo e corrija erros de cálculo, TypeScript, console e responsividade.
