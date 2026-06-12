# Analise do Banco de Dados

Esta parte do projeto usa SQLite no backend Node.js. A escolha mantém o projeto simples para uma primeira versão acadêmica, sem exigir servidor de banco separado, mas já organiza os dados necessários para o aplicativo funcionar com frontend e API.

## O que o banco precisa resolver

O aplicativo precisa armazenar:

- pacientes idosos e suas informações básicas;
- familiares/cuidadores vinculados ao paciente;
- medicamentos com nome, dose, descrição visual, cor de apoio e imagem opcional;
- horários de cada medicamento;
- confirmações do checklist diário;
- alertas para cuidadores quando uma dose não for confirmada;
- localização opcional, somente quando autorizada.

## Tabelas usadas

`users`: guarda usuários do tipo `patient` e `caregiver`.

`patients`: guarda o perfil do idoso, código de acesso para familiares e a opção `location_sharing_enabled`.

`caregiver_links`: liga pacientes e cuidadores, incluindo preferências de notificação para dose não confirmada e localização.

`caregiver_invites`: guarda convites de familiares/cuidadores ainda não cadastrados.

`medications`: guarda remédios ativos do paciente, dose, cor da caixa, cor visual no app, instruções e imagem opcional.

`medication_schedules`: guarda os horários de cada remédio e o limite de confirmação, em minutos.

`medication_checkins`: guarda as confirmações do checklist por data.

`alerts`: guarda histórico de alertas exibido na tela Família.

`location_events`: guarda pontos de localização autorizados pelo paciente.

`sessions`: guarda tokens de login.

## Como atende os objetivos

- Baixa carga cognitiva: a API entrega dados prontos para telas simples, como próximo lembrete, progresso do dia e lista de remédios.
- Identificação visual: `medications.box_color`, `ui_color`, `instructions` e `image_uri` apoiam a exibição de caixa, comprimido ou cartela.
- Alarmes e checklist: `medication_schedules` define horários e `medication_checkins` registra o que foi tomado.
- Escalonamento: `alerts` registra avisos de dose não confirmada para os cuidadores.
- Localização: `patients.location_sharing_enabled` controla autorização e `location_events` guarda os registros quando permitido.

## Integração com o app

O frontend usa `src/api/client.js` para falar com o backend. O backend carrega `backend/database/schema.sql` automaticamente ao iniciar e cria `backend/database/medcare.sqlite` quando necessário.

Para rodar:

```bash
cd backend
npm start
```

Depois, no app Expo, configure a URL da API se estiver testando em celular físico:

```bash
EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:3333/api
```
