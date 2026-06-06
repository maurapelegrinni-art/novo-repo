# STATUS DO PROJETO — FisioVet (Padrão Pelegrinni)

Aplicativo web de fisioterapia e reabilitação veterinária (React + TypeScript + Vite + Firebase).
Documento de acompanhamento — atualizado em **05/06/2026**.

---

## 1. Funcionalidades concluídas

**Cadastro e busca**
- Cadastro inteligente por tutor/paciente (CPF do responsável como identificador).
- Dedupe de tutor por CPF; vínculo de múltiplos pacientes ao mesmo tutor.
- Busca por nome do paciente, nome/CPF/telefone/WhatsApp do responsável e prontuário.
- Raças pré-cadastradas por espécie + favoritos aprendidos.
- Painel do responsável (total gasto, pacientes, pacotes, recibos).

**Clínico**
- Avaliação funcional e neurológica totalmente clicável (escalas EVA, claudicação 0-5, ECC, MCS, Frankel modificado).
- **Autonomia funcional calculada** (índice 0-100 + classe sugerida).
- **Classificação neurológica** automática (distribuição, localização provável NMS/NMI/vestibular/cerebelar, gravidade).
- Exames com upload de arquivos, análise de impacto e inclusão no relatório.
- Correlação Avaliação → Exames → Plano (texto gerado e editável).
- Plano terapêutico com **diagnósticos rápidos** e **sugestão automática a partir da avaliação**.
- Sessões com múltiplas terapias e dosimetria individual por modalidade.

**Financeiro**
- Tela reorganizada em 5 blocos (Avaliação, Contratação, Deslocamento, Pagamento, Recibo).
- Avaliação editável; sessão avulsa (mín. R$ 200), pacote 5/10 e personalizado.
- Deslocamento cobrado separado; taxas por forma de pagamento; valor total e líquido.
- Registro de recebimento, comparação de pacotes, histórico do paciente, indicadores globais.
- **Recibo em PDF real** (download no computador), WhatsApp e e-mail.

**Relatórios**
- Relatório de Avaliação e de Evolução em **PDF** (download), com pré-visualização.

**Infra / Firebase**
- Autenticação por **e-mail/senha** com papéis (Administrador / Assistente).
- Bootstrap do administrador no primeiro acesso; gestão de usuários (admin).
- **Firestore offline-first** (cache persistente) com sincronização em tempo real e multiusuário.
- **Firebase Storage** para anexos (IndexedDB local + upload sincronizado).
- **Backup** automático (snapshot no Firestore) + export JSON + restauração.
- Regras de segurança (`firestore.rules`, `storage.rules`).

**Build**
- `npm run build` passa (tsc + vite). Geração de PDF validada em teste headless.

---

## 2. Funcionalidades com erro

> Nenhum erro de compilação. Os itens abaixo dependem de **validação em runtime** com o
> projeto Firebase real e ainda **não foram testados ponta a ponta**:

- **Login / cadastro de usuários ao vivo**: depende de habilitar Authentication (E-mail/senha) e publicar as regras no Console. Não validado em produção.
- **Sincronização entre dispositivos**: lógica implementada; falta testar PC ↔ celular com dados reais.
- **Upload ao Storage**: depende de criar o bucket e publicar `storage.rules`. Offline-first via IndexedDB funciona; o envio efetivo ao Storage precisa de teste.
- **Backup/restauração**: requer regras publicadas (coleção `backups`, somente admin).

---

## 3. Bugs conhecidos

- **Aviso de bundle > 500 kB** no build (Firebase + jsPDF). Apenas aviso; não quebra. Pendente code-splitting.
- **“Importar do WhatsApp” (Exames)**: botão decorativo — hoje abre o seletor de arquivos local (mesma ação de "Selecionar Arquivo").
- **WhatsApp/E-mail (Financeiro)**: enviam **texto** do orçamento, não anexam o PDF do recibo.
- **Seleção de paciente não persiste** ao recarregar a página (era esperado após remover o `persist`; pode ser reintroduzido se desejado).
- **Identidade profissional inconsistente** no código: PDFs/recibos usam "Dra. Maura Dias Adriano" e a pré-visualização de relatório usa "Dra. Maura Pelegrinni". Definir o nome/CRMV oficial.

---

## 4. Próximas tarefas prioritárias

1. **Validar Firebase ao vivo**: habilitar Auth, publicar regras, criar Dra. Maura e Fabiano, testar login/anexos/sync (PC e celular).
2. Anexar o **PDF do recibo** no envio por WhatsApp/e-mail (em vez de só texto).
3. Definir e padronizar a **identificação profissional** (nome + CRMV) nos PDFs.
4. Resolver o botão **“Importar do WhatsApp”** (implementar de fato ou remover).
5. **Deploy no Firebase Hosting** para acesso fora da rede local.

---

## 5. Estrutura do Firebase utilizada

**Authentication**: provedor E-mail/senha. Papéis em `users/{uid}` (`admin` | `assistant`, campo `active`).

**Firestore** (coleções compartilhadas pela equipe, offline-first):

| Caminho | Conteúdo |
|---|---|
| `tutors/{id}` | Responsáveis |
| `patients/{id}` | Pacientes |
| `exams/{id}` | Exames (metadados dos arquivos incluídos) |
| `sessions/{id}` | Sessões e dosimetria |
| `packages/{id}` | Pacotes contratados |
| `payments/{id}` | Recebimentos |
| `evaluations/{patientId}` | Avaliação por paciente |
| `plans/{patientId}` | Plano por paciente |
| `meta/pricing` | Tabela de preços/taxas/cidades |
| `meta/bootstrap` | Marca de "admin configurado" |
| `users/{uid}` | Perfis e papéis |
| `backups/{id}` | Snapshots de backup (somente admin) |

**Storage**: `pacientes/{patientId}/exames/{examId}/arquivos/{fileId}`.

**Regras**: `firestore.rules` e `storage.rules` (na raiz). Equipe ativa lê/grava dados clínicos/financeiros; preços, usuários e backups restritos ao administrador.

**Config**: `src/firebase/config.ts` (projeto `pelegrinnivet`), com Firestore em `persistentLocalCache` (multi-aba).

---

## 6. Como executar o projeto localmente

Pré-requisitos: Node.js 18+ e o projeto Firebase configurado (ver `README.md`).

```bash
npm install        # instala dependências
npm run dev        # http://localhost:5173  (use --host para acessar pelo celular na mesma Wi-Fi)
npm run build      # checa tipos (tsc) e gera build de produção
npm run preview    # serve o build de produção
```

Primeiro acesso: a tela oferece **“Criar administrador”** → cadastre a Dra. Maura.
Depois, em **Usuários**, o admin cria os demais (ex.: Assistente Fabiano).

---

## 7. Último commit realizado

- **Hash**: `3ac835a`
- **Mensagem**: `fix: pdf, financeiro e integração firebase`
- **Data**: 05/06/2026 23:33 (-03:00)
- **Autor**: Maura Pelegrinni
- **Remoto**: `origin/main` → https://github.com/maurapelegrinni-art/novo-repo

---

## 8. Próximas correções planejadas

- Anexar o PDF do recibo no WhatsApp/e-mail.
- Padronizar nome/CRMV da profissional nos documentos.
- Tratar/remover o botão "Importar do WhatsApp".
- Code-splitting para reduzir o tamanho do bundle (lazy load de jsPDF e páginas).
- Reintroduzir, se desejado, a persistência do paciente selecionado entre recargas.
- Indicadores visuais de status de sincronização (online/offline, anexos pendentes).
- Deploy no Firebase Hosting + checklist de teste em PC e celular.
