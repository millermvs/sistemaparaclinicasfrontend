const baseUrl = 'http://localhost:8080/api/v1';
const baseUrlConversas = 'http://localhost:8082/conversas';
const baseUrlMensagens = 'http://localhost:8082/mensagens';

export const environment = {
  production: false,
  api: {
    medicos: `${baseUrl}/medicos`,
    clinicas: `${baseUrl}/clinicas`,
    pacientes: `${baseUrl}/pacientes`,
    consultas: `${baseUrl}/consultas`,
    mensagemInicialTemplate: `${baseUrlConversas}/criar`,
    listarConversas: `${baseUrlConversas}/listar`,
    listarMensagens: `${baseUrlMensagens}`,
    enviarMsgTexto: `${baseUrlMensagens}/enviar/texto`
  }
};

