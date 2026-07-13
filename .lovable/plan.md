## O que muda

Na tela de login do painel (`/painel`), substituir o campo "Usuário" (texto livre de e-mail) por um **dropdown com os nomes** das usuárias. A senha continua digitada normalmente.

Mapeamento fixo no código:
- **Morgana** → `morgckummer@gmail.com`
- **Marina** → `morganamavi26@gmail.com`

## Como fica a UI

```
┌─────────────────────────────┐
│  🔒 Painel MAVI             │
│                             │
│  Usuária                    │
│  ┌───────────────────────┐  │
│  │ Selecione…         ▾  │  │  ← dropdown
│  └───────────────────────┘  │
│                             │
│  Senha                      │
│  ┌───────────────────────┐  │
│  │ ••••••••              │  │
│  └───────────────────────┘  │
│                             │
│  [        Entrar        ]   │
└─────────────────────────────┘
```

Dropdown com duas opções: **Morgana** e **Marina**. Sem campo de e-mail visível, sem "usar outro e-mail". Se um dia surgir uma terceira usuária, é só adicionar uma linha na lista.

## Detalhes técnicos

- Editar apenas `LoginForm` em `src/routes/painel.tsx`.
- Criar constante local:
  ```ts
  const USUARIAS = [
    { nome: "Morgana", email: "morgckummer@gmail.com" },
    { nome: "Marina",  email: "morganamavi26@gmail.com" },
  ] as const;
  ```
- Trocar `<input type="email">` por um `<select>` estilizado no mesmo padrão visual dos outros campos (mesma classe de borda/arredondamento/foco).
- Estado passa a guardar o `email` selecionado; `entrar(email, senha)` continua igual — nada muda no `painel.ts`, no Supabase, nem no fluxo de sessão.
- Validação: botão "Entrar" desabilitado enquanto nenhuma usuária estiver selecionada.
- Mensagem de erro atual ("E-mail ou senha inválidos") continua servindo.

## Fora do escopo

- Não mexer no Supabase (usuárias continuam sendo criadas por e-mail lá).
- Não mexer no menu do usuário logado, troca de senha, ou nomes de exibição — `nomeExibicao(email)` já deriva "Morgana Kummer" / "Morgana Mavi" a partir do e-mail e segue funcionando.
