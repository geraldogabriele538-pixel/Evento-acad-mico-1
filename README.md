# Sistema de Evento Acadêmico — GitHub Pages + Supabase

Este projeto foi preparado para o Caso 2 do trabalho de Banco de Dados.

## Importante
GitHub Pages hospeda apenas arquivos estáticos. Ele NÃO executa PHP, Node.js ou MySQL.
Por isso, este projeto usa:
- Front-end: HTML + CSS + JavaScript
- Banco/API: Supabase (PostgreSQL)
- Hospedagem: GitHub Pages

## 1. Criar o banco
1. Crie uma conta em https://supabase.com/
2. Crie um projeto.
3. Abra SQL Editor.
4. Cole todo o conteúdo de `banco.sql`.
5. Execute.

## 2. Configurar a aplicação
Abra `js/config.js` e substitua:
- SUPABASE_URL
- SUPABASE_ANON_KEY

Use a chave pública `anon` do projeto. NÃO coloque a `service_role` no GitHub.

## 3. Publicar
Envie todos os arquivos para um repositório GitHub.
Depois:
Settings > Pages > Deploy from branch > main > / (root)

## 4. Segurança
O banco usa Row Level Security (RLS) para permitir o uso da aplicação com a chave anon.
Este modelo é adequado para um trabalho acadêmico/demo. Para um sistema real, seria recomendável autenticação e políticas mais restritivas.

## Funcionalidades
- Cadastro de pessoas
- Inscrições
- Equipe organizadora
- Equipe de apoio
- Tipos de atividade
- Atividades
- Organizadores e apoio por atividade (N:N)
- Ministrantes
- Presenças
- Hotéis, quartos e alocações
- Consultas
- Relatórios
- Impressão de certificado
