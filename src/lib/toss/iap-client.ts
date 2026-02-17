import { readFileSync } from 'node:fs';
import https from 'node:https';

const ORDER_STATUS_PATH = '/api-partner/v1/apps-in-toss/order/get-order-status';
const DEFAULT_IAP_BASE_URL = 'https://apps-in-toss-api.toss.im';
const FALLBACK_IAP_BASE_URL = 'https://api-partner.toss.im';

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

function getOrderStatusUrls() {
  const fromEnv = (process.env.TOSS_IAP_ORDER_STATUS_URL || '').trim().replace(/\/$/, '');
  const defaultUrl = `${DEFAULT_IAP_BASE_URL}${ORDER_STATUS_PATH}`;
  const fallbackUrl = `${FALLBACK_IAP_BASE_URL}${ORDER_STATUS_PATH}`;
  const urls = [fromEnv || defaultUrl];

  if (!urls.includes(defaultUrl)) {
    urls.push(defaultUrl);
  }
  if (!urls.includes(fallbackUrl)) {
    urls.push(fallbackUrl);
  }

  return urls;
}

function walkDeep(
  input: unknown,
  visitor: (value: unknown, key?: string) => boolean | void,
  depth = 0,
  visited = new WeakSet<object>()
) {
  if (depth > 6) return;
  if (input === null || input === undefined) return;

  const stop = visitor(input);
  if (stop === true) return;

  if (typeof input !== 'object') return;
  const obj = input as object;
  if (visited.has(obj)) return;
  visited.add(obj);

  if (Array.isArray(input)) {
    for (const item of input) {
      walkDeep(item, visitor, depth + 1, visited);
    }
    return;
  }

  const entries = Object.entries(input as Record<string, unknown>);
  for (const [key, value] of entries) {
    const shouldStop = visitor(value, key);
    if (shouldStop === true) return;
    walkDeep(value, visitor, depth + 1, visited);
  }
}

function findFirstDeepByKeys(input: unknown, keys: string[]) {
  const keySet = new Set(keys.map((key) => key.toLowerCase()));
  let found: unknown = undefined;
  walkDeep(input, (value, key) => {
    if (found !== undefined) return true;
    if (!key) return;
    if (keySet.has(key.toLowerCase()) && value !== undefined && value !== null) {
      found = value;
      return true;
    }
  });
  return found;
}

function findAnyDeepBooleanTrue(input: unknown, keys: string[]) {
  const keySet = new Set(keys.map((key) => key.toLowerCase()));
  let matched = false;
  walkDeep(input, (value, key) => {
    if (matched) return true;
    if (!key) return;
    if (keySet.has(key.toLowerCase()) && value === true) {
      matched = true;
      return true;
    }
  });
  return matched;
}

function collectDeepStatuses(input: unknown) {
  const statusKeys = new Set(
    ['status', 'orderStatus', 'purchaseStatus', 'paymentStatus', 'state', 'purchaseState'].map((key) =>
      key.toLowerCase()
    )
  );
  const statuses: string[] = [];

  walkDeep(input, (value, key) => {
    if (!key) return;
    if (!statusKeys.has(key.toLowerCase())) return;
    if (typeof value !== 'string' && typeof value !== 'number') return;
    const normalized = String(value).toUpperCase().trim();
    if (!normalized) return;
    if (!statuses.includes(normalized)) {
      statuses.push(normalized);
    }
  });

  return statuses;
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
  const requestBody = JSON.stringify({ orderId });
  const useMtls = shouldUseMtlsForIap();
  const urls = getOrderStatusUrls();
  const networkErrors: string[] = [];

  for (const url of urls) {
    try {
      if (useMtls) {
        return await requestWithMtls(url, userKey, requestBody);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      networkErrors.push(`${url}: ${message}`);
    }
  }

  throw new Error(`IAP order status API 호출 실패: ${networkErrors.join(' | ')}`);
}

export function isTossOrderPaid(payload: TossApiResponse) {
  const statusCandidates = collectDeepStatuses(payload);

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

  const hasPaidLikeStatus = statusCandidates.some((status) => paidLikeStatuses.has(status));
  const hasFailedLikeStatus = statusCandidates.some((status) => failedLikeStatuses.has(status));

  if (hasPaidLikeStatus) return true;
  if (hasFailedLikeStatus) return false;

  if (findAnyDeepBooleanTrue(payload, ['isCompleted', 'isPaid', 'purchased', 'paid', 'granted'])) {
    return true;
  }

  const rawCode = findFirstDeepByKeys(payload, ['code', 'resultType', 'result_code']);
  const code = String(rawCode ?? '').toUpperCase().trim();
  if (code === 'SUCCESS' && statusCandidates.length > 0) {
    return !hasFailedLikeStatus;
  }

  return false;
}
