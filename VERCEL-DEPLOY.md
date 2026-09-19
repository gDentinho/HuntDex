# Publicar o HuntDex na Vercel

O HuntDex é um Next.js com `output: "export"`. Não precisa de servidor próprio: a Vercel faz o build e publica os arquivos estáticos. O login continua usando Supabase Auth.

## 1. Antes de subir para o GitHub

O repositório deve conter `package.json` e `package-lock.json` atualizados. Como o Supabase foi adicionado depois do MVP, execute uma vez:

```bash
npm install
```

Depois valide:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Não faça commit de `.env.local`. Ele já é ignorado por `.gitignore`.

## 2. Variáveis na Vercel

No projeto da Vercel, em **Settings → Environment Variables**, cadastre:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Use os mesmos valores do seu `.env.local`.

Essas duas variáveis são públicas por definição. Nunca adicione `service_role`, `sb_secret_*` ou Discord Client Secret à Vercel para este frontend.

Recomendação: marque as variáveis para **Production**, **Preview** e **Development** se quiser testar login também nos previews.

## 3. Primeiro deploy

Conecte o repositório GitHub ao Vercel e use:

- Framework Preset: **Next.js**
- Build Command: `npm run build` (o padrão também funciona)
- Install Command: `npm install` ou padrão
- Node.js: **22.x**

Não defina Output Directory manualmente. O Next/Vercel reconhece o `output: "export"` do projeto.

Depois do primeiro deploy, copie a URL de produção, por exemplo:

```text
https://huntdex.vercel.app
```

## 4. Ajustar o Supabase Auth para produção

No Supabase, abra **Authentication → URL Configuration**.

Defina o **Site URL** para a URL oficial da Vercel:

```text
https://huntdex.vercel.app
```

Em **Redirect URLs**, mantenha os endereços locais e adicione a produção:

```text
https://huntdex.vercel.app/**
```

Se quiser login nos deployments Preview da Vercel, adicione também um padrão restrito aos previews do seu projeto/equipe. Evite wildcard amplo em produção quando puder usar a URL exata.

O HuntDex usa `window.location.origin` no `redirectTo`, então cada origem em que o login será usado precisa estar liberada no Supabase.

## 5. Discord Developer Portal

O Redirect URI cadastrado no Discord **não muda para a Vercel**. Continue usando o callback do Supabase:

```text
https://SEU_PROJECT_REF.supabase.co/auth/v1/callback
```

O fluxo é:

```text
HuntDex (Vercel)
→ Discord
→ callback do Supabase
→ Supabase Auth
→ HuntDex (Vercel)
```

## 6. Teste de produção

Depois de ajustar o Supabase:

1. abra a URL da Vercel em janela anônima;
2. entre com Discord;
3. confirme `Sincronizado na nuvem`;
4. salve uma hunt;
5. atualize a página;
6. confirme que a hunt continua no Histórico;
7. entre em outro navegador com a mesma conta e confirme a sincronização;
8. teste Dashboard, Comparar, Rare Tracker e preço do Diamond.

## 7. Domínio próprio no futuro

Se adicionar domínio próprio, por exemplo `huntdex.com.br`, atualize:

- Supabase `Site URL`;
- Supabase `Redirect URLs`;
- links públicos/README, se existirem.

O callback no Discord continua sendo o callback do Supabase.
