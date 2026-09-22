// Cria um plano de assinatura recorrente (Mercado Pago Assinaturas —
// endpoint /preapproval_plan) pro plano escolhido do SimSim, e devolve o
// link de checkout (init_point) que o Mercado Pago já retorna pronto.
// Cobra automaticamente todo mês, sem o cliente precisar pagar de novo na
// mão (diferente de Checkout Pro, que é cobrança única).
//
// O Access Token é configurado no painel Aiex
// (admin.aiexbrasil.com.br > Integrações), não numa env var aqui — busca
// no mesmo Supabase que todos os produtos da Aiex já usam (tabela
// platform_secrets, sem nenhuma política de RLS: só o service_role lê).
// Se ainda não tiver sido configurado por lá, responde 503 e o botão
// "Assinar agora" cai de volta pro WhatsApp (ver script.js).
//
// Precisa de SUPABASE_SERVICE_ROLE_KEY nas env vars deste projeto na
// Vercel (Supabase > Project Settings > API Keys > "service_role secret")
// — configuração única, não muda quando o token do Mercado Pago é trocado.
const SUPABASE_URL = 'https://syewayifxwinkcatuewd.supabase.co';

const PLANS = {
  bot: { title: 'SimSim Bot — assinatura mensal', price: 200 },
  ia: { title: 'SimSim IA — assinatura mensal', price: 350 },
};

async function getMercadoPagoAccessToken() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/platform_secrets?key=eq.mercadopago_access_token&select=value`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }, signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) return null;
  const rows = await response.json();
  return rows[0]?.value || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const plan = PLANS[req.body?.plan];
  if (!plan) {
    res.status(400).json({ error: 'invalid_plan' });
    return;
  }

  const accessToken = await getMercadoPagoAccessToken().catch(() => null);
  if (!accessToken) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const origin = `https://${req.headers.host}`;

  try {
    const mpResponse = await fetch('https://api.mercadopago.com/preapproval_plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        reason: plan.title,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan.price,
          currency_id: 'BRL',
        },
        back_url: `${origin}/planos/?assinatura=sucesso`,
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
