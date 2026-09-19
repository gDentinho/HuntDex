# HuntDex Analytics

Analisador e histórico de hunts para Pokémon Tibia / PxG. Cole o JSON exportado pelo cliente para analisar resultado financeiro, experiência, loot, supplies, kills e dano; salve sessões, acompanhe períodos, compare hunts e acompanhe rares.

O HuntDex possui dois modos de armazenamento:

- **Sem login:** IndexedDB local no navegador.
- **Com Discord:** Supabase Auth + PostgreSQL, com RLS para sincronizar o histórico entre dispositivos.

A análise do JSON é feita no navegador. Login é opcional.

## Executar

Requisitos: Node.js 22 ou superior e npm.

Após instalar este patch ou clonar o projeto:

```sh
npm install
npm run dev
```

Abra `http://127.0.0.1:3000`.

Se a porta 3000 já estiver ocupada, o Next pode sugerir outra porta; ela também precisa estar liberada nas Redirect URLs do Supabase para testar o OAuth.

## Supabase / Discord

O site continua funcionando sem Supabase. Para ativar login e sincronização:

1. aplique `supabase/migrations/202609190001_huntdex_cloud.sql` no projeto Supabase;
2. copie `.env.example` para `.env.local` e informe URL + Publishable key;
3. habilite Discord no Supabase Auth;
4. configure no Discord o callback `https://<PROJECT_REF>.supabase.co/auth/v1/callback`;
5. configure as Redirect URLs do app no Supabase.

O guia completo está em [`supabase/SETUP.md`](supabase/SETUP.md).

**Nunca** coloque `service_role`, secret key do Supabase ou Discord Client Secret no frontend.

## GitHub e Vercel

O projeto está preparado para publicação via GitHub + Vercel. Antes do primeiro push, garanta que o `package-lock.json` local foi atualizado pelo `npm install` que adicionou `@supabase/supabase-js`. O `.env.local` não deve ser enviado ao GitHub.

Há uma validação automática em `.github/workflows/ci.yml` que executa testes, TypeScript, lint e build em pushes para `main` e pull requests.

Para publicar na Vercel, configure no projeto as variáveis:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Depois do primeiro deploy, adicione a URL de produção em **Supabase → Authentication → URL Configuration**. O Redirect URI cadastrado no Discord continua sendo o callback do Supabase, não a URL da Vercel.

Passo a passo completo: [`VERCEL-DEPLOY.md`](VERCEL-DEPLOY.md).

## Sincronização

Ao entrar com Discord:

- hunts novas são salvas no Supabase;
- Dashboard, Histórico, Comparador, Rare Tracker e Backup passam a usar as hunts da conta;
- preço do Diamond é salvo em `user_settings`;
- a sessão do login é persistida pelo Supabase Auth;
- se houver hunts antigas no IndexedDB, aparece uma opção para enviá-las à conta;
- as hunts locais não são apagadas durante essa migração;
- duplicatas são bloqueadas por `user_id + duplicate_key` no banco e também pela aplicação.

Ao sair da conta, o HuntDex volta a mostrar o histórico local daquele navegador.

## Segurança

As tabelas remotas possuem Row Level Security. As policies exigem:

```sql
auth.uid() = user_id
```

para leitura, inserção, alteração e exclusão. O papel `anon` não recebe acesso direto às tabelas do HuntDex.

O frontend usa apenas a Publishable key do Supabase. Ela não substitui autenticação e não contorna RLS.

## Backup

O backup continua disponível nos dois modos:

- sem login: exporta/restaura IndexedDB;
- logado: exporta/restaura as hunts da conta Supabase.

A restauração valida o arquivo antes de modificar os dados e continua impedindo duplicatas.

## Validação

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Com o site disponível na porta 3000, em outro terminal:

```sh
npm run test:e2e
```

Os testes de navegador usam Playwright CLI e Chrome.

## Organização

- `src/components/analyzer/`: analisador de uma hunt.
- `src/components/library/`: dashboard, histórico, comparador, rares e backup.
- `src/components/auth/`: estado e interface do login Discord.
- `src/lib/db/`: IndexedDB para modo local.
- `src/lib/cloud/`: persistência remota e serialização para Supabase.
- `src/lib/supabase/`: configuração e cliente Supabase.
- `src/lib/pxg/`: parser, validação e analytics do JSON.
- `supabase/migrations/`: schema, índices e RLS versionados.
- `supabase/SETUP.md`: configuração de Discord OAuth + Supabase.

## Regras de cálculo

1. Campos de `Session` têm prioridade, inclusive quando valem zero.
2. Na ausência do campo, os arrays fornecem o fallback. Campos extras são aceitos.
3. Área ausente resulta em `null`, exibido como `—` quando necessário. Uma lista explicitamente vazia representa total zero.
4. Taxas calculadas usam duração em segundos e não dividem por zero.
5. Dashboard de período usa totais ÷ tempo total; não usa média simples de XP/h, Profit/h etc.
6. Itens repetidos são agrupados por nome.
7. Dano causado e recebido são agrupados separadamente por Enemy e Element.
8. Rare Tracker usa `Rare === true` como fonte principal; nome contendo `Shiny` serve apenas para categorização.
9. O JSON não permite inferir captura, catch rate, loot por criatura ou Pokémon usado pelo jogador.

## Privacidade

Sem login, os dados persistentes permanecem somente no navegador. Com login, as hunts e configurações são enviadas ao projeto Supabase escolhido para permitir sincronização entre dispositivos. A análise e a montagem dos dashboards continuam sendo executadas no cliente.

