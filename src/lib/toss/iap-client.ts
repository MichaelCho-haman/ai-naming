import { readFileSync } from 'node:fs';
import https from 'node:https';

const DEFAULT_ORDER_STATUS_URL =
  'https://api-partner.toss.im/api-partner/v1/apps-in-toss/order/get-order-status';

interface TossOrderStatusRequest {
  orderId: string;
  userKey: string;
}

interface TossApiResponse {
  code?: string;
  message?: string;
  data?: Record<string, unknown>;
  success?: Record<string, unknown>;
  resultType?: string;
  [key: string]: unknown;
}

function readPemValue(inlineValue?: string, pathValue?: string) {
  if (inlineValue) return inlineValue;
  if (pathValue) return readFileSync(pathValue, 'utf-8');
  return undefined;
}

function parseMaybeJson(raw: string) {
  try {
    return JSON.parse(raw) as TossApiResponse;
  } catch {
    return { message: raw } as TossApiResponse;
  }
}

function hasMtlsCredentials() {
  const cert = process.env.TOSS_MTLS_CERT_PEM || process.env.TOSS_MTLS_CERT_PATH;
  const key = process.env.TOSS_MTLS_KEY_PEM || process.env.TOSS_MTLS_KEY_PATH;
  return Boolean(cert && key);
}

function shouldUseMtlsForIap() {
  const explicit = process.env.TOSS_IAP_USE_MTLS;
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;

  if (process.env.TOSS_LOGIN_USE_MTLS === 'true') return true;
  return hasMtlsCredentials();
}

async function requestWithMtls(url: string, userKey: string, body: string) {
  const cert = readPemValue(process.env.TOSS_MTLS_CERT_PEM, process.env.TOSS_MTLS_CERT_PATH);
  const key = readPemValue(process.env.TOSS_MTLS_KEY_PEM, process.env.TOSS_MTLS_KEY_PATH);
  const ca = readPemValue(process.env.TOSS_MTLS_CA_PEM, process.env.TOSS_MTLS_CA_PATH);

  if (!cert || !key) {
    throw new Error('mTLS가 활성화되었지만 인증서/키 설정이 없습니다');
  }

  const target = new URL(url);
  const agent = new https.Agent({
    cert,
    key,
    ca,
    rejectUnauthorized: process.env.TOSS_MTLS_REJECT_UNAUTHORIZED !== 'false',
  });

  return await new Promise<{ status: number; json: TossApiResponse }>((resolve, reject) => {
    const req = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port ? Number(target.port) : 443,
        path: target.pathname + target.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'x-toss-user-key': userKey,
        },
        agent,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode || 500,
            json: parseMaybeJson(raw),
          });
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function getTossOrderStatus({ orderId, userKey }: TossOrderStatusRequest) {
  const url = process.env.TOSS_IAP_ORDER_STATUS_URL || DEFAULT_ORDER_STATUS_URL;
  const requestBody = JSON.stringify({ orderId });
  const useMtls = shouldUseMtlsForIap();

  if (useMtls) {
    return requestWithMtls(url, userKey, requestBody);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-toss-user-key': userKey,
    },
    body: requestBody,
  });

  const text = await res.text();
  return {
    status: res.status,
    json: parseMaybeJson(text),
  };
}

export function isTossOrderPaid(payload: TossApiResponse) {
  const success = (payload?.success ?? {}) as Record<string, unknown>;
  const data = (payload?.data ?? {}) as Record<string, unknown>;
  const root = payload as Record<string, unknown>;

  const rawStatus =
    success.status ??
    success.orderStatus ??
    success.purchaseStatus ??
    success.paymentStatus ??
    success.state ??
    success.purchaseState ??
    data.orderStatus ??
    data.status ??
    data.purchaseStatus ??
    data.paymentStatus ??
    data.state ??
    data.purchaseState ??
    root.orderStatus ??
    root.status ??
    root.state;

  const status = String(rawStatus ?? '').toUpperCase().trim();

  const paidLikeStatuses = new Set([
    'COMPLETE',
    'COMPLETED',
    'DONE',
    'SUCCESS',
    'PAID',
    'PURCHASED',
    'PURCHASE_COMPLETE',
    'PURCHASE_COMPLETED',
    'PAYMENT_COMPLETED',
    'CHARGED',
  ]);

  const failedLikeStatuses = new Set([
    'CANCELED',
    'CANCELLED',
    'REFUNDED',
    'FAILED',
    'FAIL',
    'PENDING',
    'READY',
    'WAITING',
  ]);

  if (paidLikeStatuses.has(status)) return true;
  if (failedLikeStatuses.has(status)) return false;

  if (
    success.isCompleted === true ||
    success.isPaid === true ||
    success.purchased === true ||
    data.isCompleted === true ||
    data.isPaid === true ||
    data.purchased === true
  ) {
    return true;
  }

  // 응답 코드가 성공인데 상태 문자열만 예외적으로 들어온 경우를 보완
  if (typeof payload.code === 'string' && payload.code.toUpperCase() === 'SUCCESS' && status) {
    return !failedLikeStatuses.has(status);
  }
  if (typeof payload.resultType === 'string' && payload.resultType.toUpperCase() === 'SUCCESS' && status) {
    return !failedLikeStatuses.has(status);
  }
  return false;
}
