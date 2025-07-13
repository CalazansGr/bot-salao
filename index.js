const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

const profissionais = {
  Ana: { servico: 'manicure', dias: [1, 2, 3, 4, 5] },
  Beatriz: { servico: 'cabeleireira', dias: [2, 3, 4, 5] },
  Clara: { servico: 'pedicure', dias: [1, 2, 3, 4, 5] }
};

const estados = {};
const API_URL = 'https://api.z-api.io/SEU_ID/instances/SUA_INSTANCIA/token/SEU_TOKEN/send-messages'; // TROQUE PELO SEU LINK

app.post('/', async (req, res) => {
  const numero = req.body.phone;
  const mensagem = req.body.message?.trim();

  if (!mensagem || !numero) return res.sendStatus(400);

  if (!estados[numero]) {
    estados[numero] = { etapa: 'servico' };
    return await enviarMensagem(numero, 'Olá! Qual serviço deseja?\n1 - Manicure\n2 - Cabelo\n3 - Pé');
  }

  const estado = estados[numero];

  if (estado.etapa === 'servico') {
    let profissional;
    if (mensagem === '1') profissional = 'Ana';
    else if (mensagem === '2') profissional = 'Beatriz';
    else if (mensagem === '3') profissional = 'Clara';
    else return await enviarMensagem(numero, 'Opção inválida. Envie 1, 2 ou 3.');

    estados[numero] = { etapa: 'data', profissional };
    return await enviarMensagem(
      numero,
      `Você escolheu ${profissional} (${profissionais[profissional].servico}).\nQual dia deseja agendar?\n(1=Seg, ..., 5=Sex)`
    );
  }

  if (estado.etapa === 'data') {
    const dia = parseInt(mensagem);
    const { profissional } = estado;
    const disponiveis = profissionais[profissional].dias;

    if (!disponiveis.includes(dia)) {
      return await enviarMensagem(
        numero,
        `Esse dia não está disponível para ${profissional}. Dias disponíveis: ${disponiveis.join(', ')}`
      );
    }

    await enviarMensagem(
      numero,
      `✅ Agendamento confirmado com ${profissional} (${profissionais[profissional].servico}) para o dia ${dia}. Obrigado!`
    );

    estados[numero] = null;
  }

  res.sendStatus(200);
});

async function enviarMensagem(numero, mensagem) {
  try {
    await axios.post(API_URL, { phone: numero, message: mensagem });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error.message);
  }
}

app.listen(port, () => {
  console.log(`Bot rodando na porta ${port}`);
});
