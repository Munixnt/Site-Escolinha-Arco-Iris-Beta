# Arco Íris — site e painel administrativo

Site público + painel admin (atletas, financeiro, frequência, escalações, galeria, transparência, avisos).
**Sem dependência do Base44**: o front (React + Vite) conversa com um backend próprio em Node.js que está na pasta `server/`.

## Como rodar (desenvolvimento)

Requisitos: Node.js 18.17 ou superior.

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev
```

- Configure `SUPABASE_URL`, `SUPABASE_SECRET_KEY` e um `JWT_SECRET` estável no `.env`.
- `SUPABASE_PUBLISHABLE_KEY` não dá acesso de escrita ao backend; nunca use a secret/service-role key no front-end ou no Git.
- Site: http://localhost:5173
- API: http://localhost:3001 (o Vite redireciona `/api` para ela)
- Painel: http://localhost:5173/login

Antes de iniciar, execute [supabase/schema.sql](./supabase/schema.sql) no SQL Editor do Supabase. Ele cria a tabela `app_records` com RLS habilitado e os buckets `public-assets` e `athlete-documents`.

Na primeira execução é criado no Supabase um administrador com `ADMIN_EMAIL`/`ADMIN_PASSWORD` do `.env`. Se `ADMIN_PASSWORD` estiver vazio, uma senha aleatória aparece no terminal (anote).

Criar outro admin ou redefinir uma senha:

```bash
npm run create-admin -- email@exemplo.com SenhaComPeloMenos8 "Nome"
```

## Migrar os dados locais para o Supabase

Com o schema criado e `SUPABASE_SECRET_KEY` configurada no `.env`, execute:

```bash
npm run migrate-data
```

O comando transfere registros de `data/db.json`, inclusive o administrador existente, preserva IDs e envia arquivos de `data/uploads`. É idempotente: IDs que já existirem no Supabase não são sobrescritos. Documentos e fotos dos atletas ficam no bucket privado; os demais arquivos ficam no bucket público. O comando não apaga nem altera os dados locais — mantenha a pasta `data/` como backup até confirmar a migração.

## Logo do site (passo manual obrigatório)

O logo estava hospedado no Base44. Salve-o como `public/logo.jpeg` **enquanto o link ainda funciona**:

```bash
curl -L -o public/logo.jpeg "https://media.base44.com/images/public/user_6a0878cfca0239b00e85500e/fa92b9223_WhatsAppImage2026-05-23at172425.jpeg"
```

(ou copie o arquivo original do logo para `public/logo.jpeg`).

## Migrar os dados que já estão no Base44

1. No painel do Base44, exporte cada entidade (Athlete, Payment, Attendance, Sponsor, TimelineEvent, GalleryAlbum, GalleryItem, TransparencyDocument, Aviso, Lineup) em CSV ou JSON.
2. Importe uma por uma (os `id` originais são mantidos, então os vínculos entre atleta/pagamento/frequência continuam valendo):

```bash
npm run import-data -- Athlete caminho/Athlete.csv
npm run import-data -- Payment caminho/Payment.csv
# ...e assim por diante
```

3. Os arquivos já enviados (fotos, RG, atestados, logos, PDFs) ainda apontam para o Base44. Baixe-os para o seu servidor e reescreva as URLs:

```bash
npm run localize-files -- --dry-run   # só lista o que seria migrado
npm run localize-files
```

Faça o passo 3 enquanto sua conta/app no Base44 ainda estiver ativa. Rode o `import-data` só uma vez por arquivo (registros sem `id` seriam duplicados).

## Produção

```bash
npm run build
npm start                    # um único processo serve o site (dist/) + API + uploads
```

Defina no ambiente: `PORT`, `JWT_SECRET` (valor longo e aleatório), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
Se usar proxy reverso (Nginx, Cloudflare etc.), use HTTPS e defina `TRUST_PROXY=true`.

Configure `SUPABASE_URL`, `SUPABASE_SECRET_KEY` e um `JWT_SECRET` estável também no ambiente de produção. A chave secreta do Supabase só deve existir no servidor.

**Backup:** os registros e uploads ficam no Supabase. Use os backups do projeto Supabase e mantenha uma cópia da pasta `data/` local durante e depois da migração como backup independente.

## O que mudou em relação ao Base44

| Antes | Agora |
|---|---|
| `@base44/sdk`, `@base44/vite-plugin` | removidos |
| `base44.entities.X...` | `api.entities.X...` (`src/api/client.js`, mesma interface) |
| Login/SSO do Base44 | Login por e-mail e senha em `/login` |
| `base44.integrations.Core.UploadFile` | upload via backend para Supabase Storage |
| Banco local JSON | Supabase Postgres (`app_records`) |
| Regras `rls` das entidades | `server/entities.js` |

Permissões (`server/entities.js`):
- Público pode **ler** patrocinadores ativos, galeria, linha do tempo e documentos de transparência ativos, e **criar** matrícula (sempre salva como `pendente`).
- Todo o resto (atletas, financeiro, frequência, avisos, escalações e qualquer alteração) exige login de admin.

## Arquivos e permissões

- Uploads aceitam imagens, PDF, vídeo (mp4/webm/mov) e documentos Office/txt, até 25 MB (`MAX_UPLOAD_MB`). SVG e HTML são bloqueados de propósito.
- `public-assets` contém arquivos públicos do site. `athlete-documents` é privado e os links temporários só são emitidos para administradores autenticados.
- A tabela `app_records` não tem políticas públicas de RLS; somente o backend, usando a chave secreta, acessa os dados. Mantenha essa chave exclusivamente no servidor.
