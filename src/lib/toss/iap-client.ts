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
  const useMtls = process.env.TOSS_IAP_USE_MTLS === 'true';

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
  const data = (payload?.data ?? {}) as Record<string, unknown>;
  const status = String(
    data.orderStatus ?? data.status ?? payload.orderStatus ?? payload.status ?? ''
  ).toUpperCase();
  const paidLikeStatuses = new Set(['COMPLETE', 'COMPLETED', 'DONE', 'SUCCESS', 'PAID']);

  if (paidLikeStatuses.has(status)) return true;
  if (data.isCompleted === true || data.isPaid === true) return true;
  return false;
}
