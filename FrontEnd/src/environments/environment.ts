const baseUrl = 'https://sistema.automica.com.br/api/v1';
const baseUrlWhatsApp = 'https://whatsappapi.automica.com.br//whatsapp/mensagens';

export const environment = {
  production: true,
  api: {
    medicos: `${baseUrl}/medicos`,
    clinicas: `${baseUrl}/clinicas`,
    pacientes: `${baseUrl}/pacientes`,
    consultas: `${baseUrl}/consultas`,
    mensagemInicialTemplate: `${baseUrlWhatsApp}/template`
  }
};

