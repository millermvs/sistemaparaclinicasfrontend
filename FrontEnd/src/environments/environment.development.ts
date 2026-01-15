const baseUrl = 'http://localhost:8080/api/v1';
const baseUrlWhatsApp = 'http://localhost:8082/whatsapp';

export const environment = {
  production: false,
  api: {
    medicos: `${baseUrl}/medicos`,
    clinicas: `${baseUrl}/clinicas`,
    pacientes: `${baseUrl}/pacientes`,
    consultas: `${baseUrl}/consultas`,
    mensagemInicialTemplate: `${baseUrlWhatsApp}/mensagens`
  }
};

