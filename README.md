# FisioVet — Padrão Pelegrinni

Aplicativo web de **fisioterapia e reabilitação veterinária** (React + TypeScript + Vite).
Gerencia pacientes, tutores, avaliações funcionais/neurológicas, exames, planos
terapêuticos, sessões, financeiro e relatórios — com dados na nuvem (Firebase),
funcionamento **offline** e sincronização automática.

## Principais funcionalidades

- **Cadastro inteligente** por tutor/paciente (CPF do responsável é o identificador).
- **Busca** por nome do paciente, nome/CPF/telefone do responsável ou prontuário.
- **Avaliação** funcional e neurológica clicável, com **autonomia funcional calculada**
  e **classificação neurológica** automática (apoio à decisão).
- **Exames** com upload de PDF/JPG/PNG/DOCX (e mais), relacionados ao paciente.
- **Plano terapêutico** com diagnósticos rápidos e **sugestão automática a partir da avaliação**.
- **Sessões** com múltiplas terapias e dosimetria individual.
- **Financeiro**: sessão avulsa, pacotes de 5 e 10, deslocamento, taxas de cartão,
  valor líquido, recibo em PDF e envio por WhatsApp/e-mail.
- **Relatórios** de avaliação e evolução em PDF.
- **Multiusuário** (Administrador / Assistente) com login por e-mail e senha.
- **Backup automático** (snapshot no Firestore) + export JSON.

## Arquitetura

- Estado de UI: **Zustand** (em memória, reativo).
- Persistência/sincronização: **Firestore** com cache local persistente
  (offline-first; escritas enfileiram e sincronizam ao reconectar). Ver `src/services/sync.ts`.
- Arquivos: **IndexedDB** (offline imediato) + **Firebase Storage** (sincronizado). Ver `src/services/fileStorage.ts`.
- Autenticação e papéis: `src/auth/`.
- Lógica clínica: `src/utils/clinicalLogic.ts`.

## Configuração do Firebase (obrigatória)

1. Crie um projeto em https://console.firebase.google.com.
2. **Authentication** → *Sign-in method* → habilite **E-mail/senha**.
3. **Firestore Database** → crie o banco (modo produção).
4. **Storage** → crie o bucket.
5. Copie a config do app (Configurações do projeto → Seus apps → SDK) e cole em
   `src/firebase/config.ts` no objeto `firebaseConfig`.
6. Publique as regras de segurança deste repositório:
   - Firestore → cole o conteúdo de `firestore.rules`.
   - Storage → cole o conteúdo de `storage.rules`.
   - (Opcional, via CLI) `firebase deploy --only firestore:rules,storage`.

### Primeiro acesso

Ao abrir o app pela primeira vez (sem nenhum usuário), a tela oferece
**“Criar administrador”**. Cadastre a Dra. Maura como administradora.
Depois, em **Usuários**, o administrador cria os demais (ex.: Assistente Fabiano).

### Papéis

- **Administrador**: tudo + gerenciar usuários, preços, exclusões e backup/restauração.
- **Assistente**: cadastra/edita pacientes, avaliações, exames, sessões e recebimentos.

## Executar localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # checa tipos e gera build de produção
```

## Estrutura de pastas

- `src/pages/` – páginas (Identificação, Avaliação, Exames, Plano, Sessões, Financeiro, Relatórios, Usuários).
- `src/auth/` – autenticação, contexto e papéis.
- `src/store/` – store Zustand.
- `src/services/` – sync (Firestore), arquivos (Storage) e backup.
- `src/utils/` – busca, resumos, lógica clínica e geração de PDF.
- `src/constants/` – listas clínicas e comerciais.
- `firestore.rules`, `storage.rules` – regras de segurança.

## Licença

MIT — consulte `LICENSE`.
