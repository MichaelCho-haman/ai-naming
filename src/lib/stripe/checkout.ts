import { stripe } from './client';

export async function createCheckoutSession(params: {
  namingId: string;
  baseUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'krw',
          product_data: {
            name: 'AI작명소 — AI 작명 서비스',
            description: '사주 기반 AI 이름 추천 5개 + 한자/획수/음양오행 분석',
          },
          unit_amount: 990,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${params.baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&naming_id=${params.namingId}`,
    cancel_url: `${params.baseUrl}/checkout?cancelled=true`,
    metadata: {
      namingId: params.namingId,
    },
  });

  return session;
}
