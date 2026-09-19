# HuntDex — Supabase + Discord

O HuntDex continua funcionando sem conta usando IndexedDB. Quando o usuário entra com Discord, hunts e configurações passam a ser lidas e gravadas no Supabase para sincronizar entre dispositivos.

## 1. Aplicar a migration

A migration está em:

```text
supabase/migrations/202609190001_huntdex_cloud.sql
```

Ela cria:

- `public.hunts`
- `public.user_settings`
- índices de consulta
- `UNIQUE (user_id, duplicate_key)` para impedir duplicatas por usuário
- RLS para que cada usuário só leia/escreva as próprias linhas
- `ON DELETE CASCADE` ligado ao usuário do Supabase Auth

Não use `service_role` no frontend.

## 2. Variáveis do frontend

Copie `.env.example` para `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Use a **Publishable key**. Ela pode estar no frontend porque a segurança dos dados é feita por autenticação + RLS.

Depois de alterar `.env.local`, reinicie `npm run dev`.

## 3. Criar a aplicação no Discord

No Discord Developer Portal:

1. Crie uma nova Application, por exemplo `HuntDex`.
2. Abra **OAuth2**.
3. Em **Redirects**, adicione exatamente:

```text
https://SEU_PROJECT_REF.supabase.co/auth/v1/callback
```

4. Salve.
5. Copie `Client ID` e `Client Secret`.

O Client Secret fica apenas no Discord/Supabase. Nunca coloque esse segredo no código ou em `.env.local` do frontend.

## 4. Ativar Discord no Supabase

No Supabase Dashboard:

1. **Authentication → Sign In / Providers → Discord**.
2. Ative o provider.
3. Cole o Discord `Client ID`.
4. Cole o Discord `Client Secret`.
5. Salve.

## 5. URLs permitidas

Em **Authentication → URL Configuration**:

- `Site URL`: use a URL oficial de produção quando o site estiver publicado.
- Em **Redirect URLs**, para desenvolvimento adicione:

```text
http://127.0.0.1:3000/**
http://127.0.0.1:3001/**
http://localhost:3000/**
http://localhost:3001/**
```

- Adicione também a URL final do HuntDex. Em produção prefira a URL exata.
- Se usar previews da Vercel, pode adicionar um padrão específico para os previews do projeto.

O app usa a origem atual (`window.location.origin`) como `redirectTo`, então a porta/host usados para testar precisam estar na allow list.

## 6. Teste

1. Rode `npm install` após aplicar este patch.
2. Rode `npm run dev`.
3. Abra o site.
4. Clique em **Entrar com Discord**.
5. Autorize no Discord.
6. Ao voltar, o header deve mostrar a conta e `Sincronizado na nuvem`.
7. Se houver hunts antigas no IndexedDB, o HuntDex oferece **Enviar para minha conta**.
8. Salve uma hunt e confirme que ela aparece em `public.hunts` com o `user_id` do usuário autenticado.
9. Abra uma janela anônima ou outro navegador, entre com a mesma conta e confirme que o histórico aparece.

## Modelo de funcionamento

```text
Sem login
  → IndexedDB local

Com Discord
  → Supabase Auth
  → public.hunts + public.user_settings
  → RLS por auth.uid()
```

A análise matemática do JSON continua acontecendo no navegador. Quando logado, os dados persistentes da hunt são sincronizados com o Supabase.

## 7. Publicação na Vercel

Na Vercel, configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` antes do deploy. Após receber a URL pública, use-a como `Site URL` no Supabase e adicione-a aos `Redirect URLs`.

O Redirect URI do Discord permanece:

```text
https://SEU_PROJECT_REF.supabase.co/auth/v1/callback
```

O frontend usa a origem atual como destino de retorno, portanto a URL de produção precisa estar explicitamente autorizada no Supabase. Veja [`../VERCEL-DEPLOY.md`](../VERCEL-DEPLOY.md).
