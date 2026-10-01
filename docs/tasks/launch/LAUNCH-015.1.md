# TASK ID: LAUNCH-015.1
# TITLE: Add i18n: Hindi (hi) and Portuguese (pt)
# STATUS: pending
# DEPENDENCIES: LAUNCH-014.2
# ALLOWED FILES: product/apps/admin/src/i18n/hi.json, product/apps/admin/src/i18n/pt.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Hindi for India, Portuguese for Brazil.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/i18n/hi.json`:

```json
{
  "common": {
    "save": "सहेजें",
    "cancel": "रद्द करें",
    "delete": "हटाएं",
    "edit": "संपादित करें",
    "search": "खोजें",
    "loading": "लोड हो रहा है…",
    "error": "एक त्रुटि हुई",
    "success": "सफलता",
    "confirm": "पुष्टि करें",
    "yes": "हाँ",
    "no": "नहीं",
    "today": "आज",
    "yesterday": "कल",
    "thisWeek": "इस सप्ताह",
    "thisMonth": "इस महीने"
  },
  "nav": {
    "dashboard": "डैशबोर्ड",
    "projects": "प्रोजेक्ट",
    "users": "उपयोगकर्ता",
    "patients": "मरीज",
    "samples": "नमूने",
    "appointments": "अपॉइंटमेंट",
    "audit": "ऑडिट लॉग",
    "modules": "मॉड्यूल",
    "settings": "सेटिंग्स",
    "help": "मदद",
    "logout": "लॉग आउट"
  },
  "patients": {
    "title": "मरीज",
    "addPatient": "मरीज जोड़ें",
    "name": "नाम",
    "phone": "फ़ोन",
    "email": "ईमेल",
    "dateOfBirth": "जन्म तिथि",
    "archive": "संग्रहित करें",
    "search": "मरीज खोजें…"
  },
  "appointments": {
    "title": "अपॉइंटमेंट",
    "today": "आज के अपॉइंटमेंट",
    "newAppointment": "नया अपॉइंटमेंट",
    "patient": "मरीज",
    "doctor": "डॉक्टर",
    "time": "समय",
    "duration": "अवधि",
    "status": "स्थिति",
    "checkIn": "चेक इन",
    "cancel": "रद्द करें"
  },
  "samples": {
    "title": "नमूने",
    "intake": "नमूना लें",
    "sampleId": "नमूना ID",
    "type": "प्रकार",
    "submittedBy": "प्रस्तुतकर्ता",
    "receivedAt": "प्राप्ति समय",
    "status": "स्थिति",
    "start": "टेस्ट शुरू करें",
    "results": "परिणाम",
    "issueReport": "रिपोर्ट जारी करें"
  },
  "errors": {
    "notFound": "नहीं मिला",
    "forbidden": "मना",
    "unauthorized": "अनधिकृत",
    "validation": "अमान्य इनपुट",
    "network": "नेटवर्क त्रुटि",
    "serverError": "सर्वर त्रुटि"
  },
  "auth": {
    "login": "लॉग इन",
    "signup": "साइन अप",
    "email": "ईमेल",
    "password": "पासवर्ड",
    "forgotPassword": "पासवर्ड भूल गए?",
    "verifyEmail": "ईमेल सत्यापित करें"
  }
}
```

Create `product/apps/admin/src/i18n/pt.json`:

```json
{
  "common": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "edit": "Editar",
    "search": "Pesquisar",
    "loading": "Carregando…",
    "error": "Ocorreu um erro",
    "success": "Sucesso",
    "confirm": "Confirmar",
    "yes": "Sim",
    "no": "Não",
    "today": "Hoje",
    "yesterday": "Ontem",
    "thisWeek": "Esta semana",
    "thisMonth": "Este mês"
  },
  "nav": {
    "dashboard": "Painel",
    "projects": "Projetos",
    "users": "Usuários",
    "patients": "Pacientes",
    "samples": "Amostras",
    "appointments": "Consultas",
    "audit": "Log de auditoria",
    "modules": "Módulos",
    "settings": "Configurações",
    "help": "Ajuda",
    "logout": "Sair"
  },
  "patients": {
    "title": "Pacientes",
    "addPatient": "Adicionar paciente",
    "name": "Nome",
    "phone": "Telefone",
    "email": "E-mail",
    "dateOfBirth": "Data de nascimento",
    "archive": "Arquivar",
    "search": "Pesquisar pacientes…"
  },
  "appointments": {
    "title": "Consultas",
    "today": "Consultas de hoje",
    "newAppointment": "Nova consulta",
    "patient": "Paciente",
    "doctor": "Médico",
    "time": "Hora",
    "duration": "Duração",
    "status": "Status",
    "checkIn": "Check-in",
    "cancel": "Cancelar"
  },
  "samples": {
    "title": "Amostras",
    "intake": "Receber amostra",
    "sampleId": "ID da amostra",
    "type": "Tipo",
    "submittedBy": "Enviado por",
    "receivedAt": "Recebido em",
    "status": "Status",
    "start": "Iniciar teste",
    "results": "Resultados",
    "issueReport": "Emitir relatório"
  },
  "errors": {
    "notFound": "Não encontrado",
    "forbidden": "Proibido",
    "unauthorized": "Não autorizado",
    "validation": "Entrada inválida",
    "network": "Erro de rede",
    "serverError": "Erro do servidor"
  },
  "auth": {
    "login": "Entrar",
    "signup": "Cadastrar",
    "email": "E-mail",
    "password": "Senha",
    "forgotPassword": "Esqueceu a senha?",
    "verifyEmail": "Verificar e-mail"
  }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/i18n/hi.json || { echo "FAIL"; exit 1; }
test -f apps/admin/src/i18n/pt.json || { echo "FAIL: no pt"; exit 1; }
python3 -c "import json; json.load(open('apps/admin/src/i18n/hi.json'))" || { echo "FAIL: hi invalid"; exit 1; }
python3 -c "import json; json.load(open('apps/admin/src/i18n/pt.json'))" || { echo "FAIL: pt invalid"; exit 1; }
echo "OK"
```
