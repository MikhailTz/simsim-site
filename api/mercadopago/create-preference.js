// Cria uma preferência de pagamento (Checkout Pro) do Mercado Pago pra
// assinatura de um dos planos do SimSim. Fica pronta pra usar assim que
// MERCADOPAGO_ACCESS_TOKEN for configurado nas variáveis de ambiente do
// projeto na Vercel — até lá, responde 503 e o botão "Assinar agora"
// cai de volta pro WhatsApp (ver script.js).
const PLANS = {
  bot: { title: 'SimSim Bot — assinatura mensal', price: 200 },
  ia: { title: 'SimSim IA — assinatura mensal', price: 350 },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const plan = PLANS[req.body?.plan];
  if (!plan) {
    res.status(400).json({ error: 'invalid_plan' });
    return;
  }

  const origin = `https://${req.headers.host}`;

  try {
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        items: [{ title: plan.title, quantity: 1, unit_price: plan.price, currency_id: 'BRL' }],
        back_urls: {
          success: `${origin}/planos/?assinatura=sucesso`,
          pending: `${origin}/planos/?assinatura=pendente`,
          failure: `${origin}/planos/?assinatura=falhou`,
        },
        auto_return: 'approved',
        external_reference: req.body.plan,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!mpResponse.ok) {
      res.status(502).json({ error: 'mercadopago_error' });
      return;
    }

    const data = await mpResponse.json();
    res.status(200).json({ url: data.init_point });
  } catch {
    res.status(502).json({ error: 'mercadopago_error' });
  }
}
