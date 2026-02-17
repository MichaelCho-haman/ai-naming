This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Toss 앱인토스 모드

같은 코드베이스에서 `web`/`toss` 모드를 분기합니다.

### 1) 환경변수

`.env.example`를 참고해 `.env.local`을 설정합니다.

```bash
NEXT_PUBLIC_APP_TARGET=toss
NEXT_PUBLIC_TOSS_IAP_PRODUCT_ID=YOUR_PRODUCT_ID
TOSS_IAP_ORDER_STATUS_URL=https://api-partner.toss.im/api-partner/v1/apps-in-toss/order/get-order-status
TOSS_IAP_USE_MTLS=false
ALLOW_IAP_MOCK=true
```

### 2) 동작 방식

- `web` 모드: 기존처럼 결과 전체 공개
- `toss` 모드: 결과 5개 중 1개만 먼저 공개, 나머지 4개는 잠금
- 결제 완료 API(`/api/iap/complete`) 호출 시 잠금 해제

### 3) 현재 상태

- `/api/iap/complete`는 `orderId` + `x-toss-user-key`를 받아 토스 주문 상태 API로 검증합니다.
- 토스 로그인에서 얻은 userKey를 헤더(`x-toss-user-key`) 또는 body(`userKey`)로 전달해야 합니다.
- `ALLOW_IAP_MOCK=true`이면 `orderId` 없이도 개발용으로 결제 완료 처리가 가능합니다.
- mTLS가 필요한 환경이면 `TOSS_IAP_USE_MTLS=true`와 인증서/키 환경변수를 설정해야 합니다.
- 토스 로그인 userKey 교환 API(`/api/toss/login/user-key`)도 mTLS를 사용하므로 `TOSS_LOGIN_USE_MTLS=true`와 동일 인증서 환경변수를 설정하세요.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
