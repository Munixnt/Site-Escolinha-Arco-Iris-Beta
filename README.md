# Arco Íris — site e painel administrativo

Site público + painel admin (atletas, financeiro, frequência, escalações, galeria, transparência, avisos).
**Sem dependência do Base44**: o front (React + Vite) conversa com um backend próprio em Node.js que está na pasta `server/`.

## Como rodar (desenvolvimento)

Requisitos: Node.js 18.17 ou superior.

```bash
npm install
cp .env.example .env        # (Windows: copy .env.example .env) e ajuste ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev
```

- Site: http://localhost:5173
- API: http://localhost:3001 (o Vite já redireciona `/api` e `/uploads` para ela)
- Painel: http://localhost:5173/login

Na primeira execução é criado um administrador com `ADMIN_EMAIL`/`ADMIN_PASSWORD` do `.env`.
Se `ADMIN_PASSWORD` estiver vazio, uma senha aleatória aparece no terminal (anote).

Criar outro admin ou redefinir uma senha:

```bash
npm run create-admin -- email@exemplo.com SenhaComPeloMenos8 "Nome"
```

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

**Backup:** tudo que importa fica na pasta `data/` (`db.json` = banco, `uploads/` = arquivos, `secret.key` = segredo de login). Copie essa pasta regularmente.
A pasta `data/` precisa ser persistente: em hospedagens que apagam o disco a cada deploy (Heroku, Render free, Vercel...), use um volume/disco persistente ou outro servidor (VPS).

## O que mudou em relação ao Base44

| Antes | Agora |
|---|---|
| `@base44/sdk`, `@base44/vite-plugin` | removidos |
| `base44.entities.X...` | `api.entities.X...` (`src/api/client.js`, mesma interface) |
| Login/SSO do Base44 | Login por e-mail e senha em `/login` |
| `base44.integrations.Core.UploadFile` | upload para `data/uploads` (`POST /api/upload`) |
| Banco do Base44 | `data/db.json` (arquivo JSON, sem instalar banco) |
| Regras `rls` das entidades | `server/entities.js` |

Permissões (`server/entities.js`):
- Público pode **ler** patrocinadores ativos, galeria, linha do tempo e documentos de transparência ativos, e **criar** matrícula (sempre salva como `pendente`).
- Todo o resto (atletas, financeiro, frequência, avisos, escalações e qualquer alteração) exige login de admin.

## Limites conhecidos

- O banco em arquivo JSON atende bem uma escolinha (centenas/poucos milhares de registros). Se crescer muito, troque `server/store.js` por SQLite/Postgres mantendo a mesma API.
- Uploads aceitam imagens, PDF, vídeo (mp4/webm/mov) e documentos Office/txt, até 25 MB (`MAX_UPLOAD_MB`). SVG e HTML são bloqueados de propósito.
- Os arquivos de `/uploads` são acessíveis por quem tiver o link (nome aleatório e impossível de adivinhar), como era no Base44. Não compartilhe links de RG/atestado.
