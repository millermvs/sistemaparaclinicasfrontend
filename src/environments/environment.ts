const baseUrl = 'https://sistemaapi.automica.com.br/api/v1';
const baseUrlConversas = 'https://whatsappapi.automica.com.br/conversas';
const baseUrlMensagens = 'https://whatsappapi.automica.com.br/mensagens';

export const environment = {
  production: true,
  api: {
    medicos: `${baseUrl}/medicos`,
    clinicas: `${baseUrl}/clinicas`,
    pacientes: `${baseUrl}/pacientes`,
    consultas: `${baseUrl}/consultas`,
    mensagemInicialTemplate: `${baseUrlConversas}/criar`,
    listarConversas: `${baseUrlConversas}/listar`,
    enviarMsgTexto: `${baseUrlMensagens}/enviar/texto`
  }
};

