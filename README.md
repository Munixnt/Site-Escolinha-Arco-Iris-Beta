# Arco Íris — site estático com painel no Supabase

O projeto compila as páginas em arquivos estáticos para hospedagem compartilhada, como HostGator. O navegador acessa o Supabase diretamente para autenticação, banco e arquivos; não é necessário manter Node.js ou uma VPS em produção. A interface existente é compilada pelo Vite, portanto os arquivos HTML, CSS e JavaScript ficam prontos na pasta `dist/`.

## Preparar o Supabase

1. No Supabase, abra o **SQL Editor** e execute [`supabase/static-host-schema.sql`](./supabase/static-host-schema.sql). O script cria/configura `app_records`, as políticas RLS e os buckets de arquivos.
2. Em **Project Settings → API**, copie a **Project URL** e a **publishable key** (ou a antiga `anon` key). Nunca use `secret`/`service_role` no navegador.
3. Crie a conta do administrador em **Authentication → Users → Add user**. A senha do antigo login próprio não pode ser reaproveitada: crie uma senha nova no Supabase.
4. No SQL Editor, conceda a função administrativa a essa conta, substituindo o e-mail:

   ```sql
   update auth.users
   set raw_app_meta_data =
     coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where lower(email) = lower('admin@seudominio.com');
   ```

   Confirme que uma linha foi atualizada. Depois, saia e entre novamente no painel para receber as permissões atualizadas.
5. Em **Authentication → URL Configuration**, configure o domínio do site em **Site URL** e adicione o mesmo domínio em **Redirect URLs**.

As políticas RLS permitem ao público ler apenas conteúdo publicado, enviar matrículas pendentes e carregar documentos de matrícula para o bucket privado. Os outros registros e arquivos exigem uma sessão cujo `app_metadata.role` seja `admin`. Não atribua essa função pelo navegador. A matrícula pública exige endereço completo, tipo sanguíneo, declaração de alergias/restrições e status do atestado. O Supabase gera o número de matrícula no formato `AI-AAAA-CATEGORIA-SEQUENCIAL`, com sequência atômica por ano/categoria e índice único. Administradores podem suspender ou reabrir matrículas na tela **Atletas**; quando suspensas, o formulário informa os contatos da escolinha e o backend também bloqueia novos envios. Para aplicar ou atualizar essas regras, execute o arquivo SQL completo no SQL Editor antes de publicar o novo frontend.

## Compilar e publicar no HostGator

Requisitos para compilar: Node.js 18.17 ou superior.

1. Crie `/.env.production.local` com as chaves públicas do projeto Supabase:

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
   ```

   Essas duas chaves são públicas por definição; o acesso é protegido pelas políticas RLS. **Não** coloque `SUPABASE_SECRET_KEY`, `service_role`, senhas ou segredos em variáveis `VITE_`.
2. Na pasta do projeto, execute:

   ```bash
   npm install
   npm run build
   ```

3. Envie **o conteúdo** de `dist/` (incluindo `.htaccess`) para a pasta raiz do domínio no HostGator, normalmente `public_html/`. Se usar FTP, habilite a visualização de arquivos ocultos para enviar `.htaccess`.
4. Ative HTTPS no domínio. As rotas do painel (`/login`, `/admin/...`) usam o fallback Apache em `public/.htaccess`, copiado automaticamente para `dist/`.

Não envie `.env*`, `node_modules/`, `data/` ou a pasta completa do projeto para `public_html`. Quando alterar o site ou as chaves, gere outro build e envie novamente o conteúdo de `dist/`.

## Dados e arquivos existentes

Se o banco já está no Supabase, o script de hospedagem estática conserva a tabela `app_records`; ele adiciona as regras necessárias para acesso direto do navegador. Confira e faça backup dos dados antes de alterar políticas ou buckets.

Se os dados ainda estiverem em `data/db.json`, os scripts legados de migração podem ser executados em uma máquina local confiável, com `SUPABASE_URL` e `SUPABASE_SECRET_KEY` em `.env`:

```bash
npm run migrate-data
```

Não publique o arquivo `.env`. Os registros `User` antigos guardam senhas em formato próprio e não autenticam no Supabase Auth: crie uma conta administrativa nova seguindo os passos acima.

## Desenvolvimento local

Para testar o site estático localmente, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em `.env.local`, depois execute:

```bash
npm install
npm run dev:client
```

`npm run dev` e `npm start` continuam disponíveis para o servidor Node legado e não são necessários para a hospedagem estática.

## Limites do acesso público

O formulário público pode criar apenas matrículas pendentes dentro da faixa etária permitida; dados de atletas, financeiro e painel não ficam disponíveis para visitantes. Os documentos de matrícula são privados e os links temporários só são gerados após autenticação administrativa. O limite de upload configurado é 25 MB.

A hospedagem estática não executa o rate limit por IP do servidor legado. Antes de divulgar amplamente o formulário de matrícula, monitore o uso do Supabase e considere proteção anti-spam (por exemplo, CAPTCHA ou uma Supabase Edge Function com rate limit). A chave secreta do Supabase nunca deve ser colocada no site.
