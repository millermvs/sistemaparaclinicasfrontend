# 🏥 Sistema de Agendamentos para Clínicas  
Aplicação completa desenvolvida em **Angular** (frontend) e **Spring Boot** (backend), com foco em agendamento de consultas médicas, gestão de médicos, pacientes e controle da agenda diária da clínica.

Este projeto foi construído para ser um sistema **escalável**, **organizado** e **pronto para produção**, com arquitetura limpa e componentes reutilizáveis.

---

## 🚀 Tecnologias Utilizadas

### **Frontend**
- Angular 18+ (SPA)
- Signals (modo Zoneless – sem zone.js)
- Bootstrap 5
- HTML5 + CSS3
- Arquitetura em componentes
- Organização em módulos / páginas / compartilhados

### **Backend** (repositório separado)
- Java 21
- Spring Boot 3.x
- Spring Data JPA
- PostgreSQL
- Padrão DTO
- Controllers → Services → Repositories
- Entidades ricas (Consulta como entidade de associação médico ↔ paciente)

---

## 📌 Funcionalidades do Sistema

### ✔️ **Dashboard**
- Visão geral da clínica:
  - Total de médicos
  - Total de pacientes
  - Consultas do dia
  - Consultas do mês
- Cards responsivos e layout moderno

---

### ✔️ **Gestão de Médicos**
- Listagem de médicos com:
  - Nome, CPF, CRM e telefone
- Botão **+ Novo Médico**
- Botão **Editar**
- Botão **Inativar**
- Tabela responsiva e estilizada
- Layout padronizado com restante do sistema

---

### ✔️ **Gestão de Pacientes**
- Listagem com:
  - Nome, CPF, Telefone e E-mail
- Botão **+ Novo Paciente**
- Botão **Editar**
- Botão **Inativar**
- Mesmo padrão visual dos Médicos

---

### ✔️ **Agenda de Consultas**
- Listagem completa:
  - Médico
  - Paciente
  - Data
  - Hora
  - Status (Agendada, Confirmada, Cancelada, Realizada)
- Cores diferentes para cada status
- Botões:
  - Editar
  - Remarcar
  - Cancelar

---

### ✔️ **Filtros Avançados**
Filtro moderno e centralizado permitindo buscar consultas por:

- **Data início**
- **Data fim**
- **Médico**

Preparado para integração com backend e signals.

---

## 🧱 Arquitetura do Frontend

```
src/
│
├── app/
│   ├── components/
│   │   ├── shared/
│   │   │   └── navbar/        → menu lateral fixo
│   │   └── pages/
│   │       ├── dashboard/
│   │       ├── medicos/
│   │       ├── pacientes/
│   │       └── consultas/
│   ├── app.component.html      → layout SPA
│   ├── app.component.ts
│   └── app-routing.module.ts   → rotas da aplicação
│
└── assets/
```

---

## 🧭 Navegação do Sistema (SPA)

O sistema utiliza `router-outlet` para carregar apenas o conteúdo da página selecionada:

- Navbar fixa à esquerda (sempre visível)
- Conteúdo carregado ao lado (Single Page Application)
- Páginas:
  - `/dashboard`
  - `/medicos`
  - `/pacientes`
  - `/consultas`

---

## 🧰 Como rodar o frontend

### 1. Instalar dependências
```bash
npm install
```

### 2. Rodar em modo desenvolvimento
```bash
ng serve
```

Acesse:  
👉 http://localhost:4200

---

## 🔮 Próximos Passos (planejados)

- Integração total com backend (REST)
- Telas de cadastro/edição de Médico
- Telas de cadastro/edição de Paciente
- Tela de agendamento de Consulta
- Paginação nas tabelas
- Autenticação e autorização (login)
- Layout com módulo de autenticação isolado

---

## 👨‍💻 Autor

**Miller Santos**  
Desenvolvedor Full Stack em formação, estudando Angular, Java, Spring Boot e boas práticas de arquitetura.

---

## 📄 Licença

Este projeto é aberto para estudos, melhorias e evolução.