'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IAP, appLogin } from '@apps-in-toss/web-framework';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { NamingResult, NameSuggestion } from '@/types';
import { FREE_PREVIEW_COUNT, LOCKED_RECOMMENDATION_COUNT, TOTAL_RECOMMENDATION_COUNT } from '@/lib/naming/access-policy';

interface Props {
  namingId: string;
  lastName: string;
  gender: string;
  result: NamingResult;
  paymentStatus: 'pending' | 'free' | 'paid' | 'failed';
  isTossTarget: boolean;
}

interface TossLoginUserKeyResponse {
  ok: boolean;
  userKey: string;
}

interface IapCompleteSuccessResponse {
  ok: boolean;
  paymentStatus: 'pending' | 'free' | 'paid' | 'failed';
  orderId?: string;
}

interface IapCompleteErrorResponse {
  error?: string;
  details?: unknown;
  orderStatus?: unknown;
  rawOrderStatus?: unknown;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

function isTossAppWebView() {
  const maybeWindow = window as Window & {
    ReactNativeWebView?: { postMessage?: (message: string) => void };
  };
  return typeof maybeWindow.ReactNativeWebView?.postMessage === 'function';
}

function getStoredUserKey() {
  const userKey =
    window.localStorage.getItem('toss_user_key') ||
    (window as Window & { __TOSS_USER_KEY__?: string }).__TOSS_USER_KEY__;
  return typeof userKey === 'string' ? userKey.trim() : '';
}

function saveUserKey(userKey: string) {
  window.localStorage.setItem('toss_user_key', userKey);
  (window as Window & { __TOSS_USER_KEY__?: string }).__TOSS_USER_KEY__ = userKey;
}

function getOrderStorageKey(namingId: string) {
  return `toss_last_order_id:${namingId}`;
}

function getStoredOrderId(namingId: string) {
  const value = window.localStorage.getItem(getOrderStorageKey(namingId));
  return typeof value === 'string' ? value.trim() : '';
}

function saveOrderId(namingId: string, orderId: string) {
  window.localStorage.setItem(getOrderStorageKey(namingId), orderId);
}

function clearOrderId(namingId: string) {
  window.localStorage.removeItem(getOrderStorageKey(namingId));
}

function formatDebugPayload(payload: unknown) {
  if (!payload) return '';
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function createErrorWithDebug(message: string, debug?: string) {
  const error = new Error(message) as Error & { debug?: string };
  error.debug = debug;
  return error;
}

async function ensureUserKey() {
  const storedUserKey = getStoredUserKey();
  if (storedUserKey) return storedUserKey;

  if (!isTossAppWebView()) {
    throw new Error('토스 앱에서만 결제가 가능합니다.');
  }

  const loginResult = await appLogin();
  const authorizationCode =
    typeof loginResult?.authorizationCode === 'string' ? loginResult.authorizationCode.trim() : '';
  const referrer = typeof loginResult?.referrer === 'string' ? loginResult.referrer : '';

  if (!authorizationCode || !referrer) {
    throw new Error('토스 로그인 응답이 올바르지 않습니다.');
  }

  const res = await fetch('/api/toss/login/user-key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authorizationCode, referrer }),
  });
  const data = (await res.json()) as Partial<TossLoginUserKeyResponse> & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || '토스 로그인 처리에 실패했습니다.');
  }

  const normalizedUserKey = typeof data?.userKey === 'string' ? data.userKey.trim() : '';
  if (!normalizedUserKey) {
    throw new Error('토스 로그인에서 userKey를 확인하지 못했습니다.');
  }

  saveUserKey(normalizedUserKey);
  return normalizedUserKey;
}

export default function ResultClient({ namingId, lastName, result, paymentStatus, isTossTarget }: Props) {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState(paymentStatus);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [unlockDebug, setUnlockDebug] = useState('');
  const [lastOrderId, setLastOrderId] = useState('');

  useEffect(() => {
    if (currentPaymentStatus === 'paid') {
      clearOrderId(namingId);
      setLastOrderId('');
      return;
    }
    setLastOrderId(getStoredOrderId(namingId));
  }, [namingId, currentPaymentStatus]);

  const isLockedMode = isTossTarget && currentPaymentStatus !== 'paid';
  const lockedCount = Math.max(result.names.length - FREE_PREVIEW_COUNT, 0);

  const namesWithLock = useMemo(
    () => result.names.map((name, index) => ({ name, locked: isLockedMode && index >= FREE_PREVIEW_COUNT })),
    [result.names, isLockedMode]
  );

  const handleShare = async () => {
    const url = window.location.href;
    const text = '애기 이름짓기에서 작명 결과를 확인해보세요!';

    if (navigator.share) {
      try {
        await navigator.share({ title: '애기 이름짓기 작명 결과', text, url });
      } catch {
        // 무시
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다!');
    }
  };

  const handleUnlock = async () => {
    setUnlockError('');
    setUnlockDebug('');
    setUnlocking(true);

    try {
      const sku = process.env.NEXT_PUBLIC_TOSS_IAP_PRODUCT_ID;
      if (!sku) {
        throw new Error('상품 ID가 설정되지 않았습니다. 관리자에게 문의해주세요.');
      }
      if (!isTossAppWebView()) {
        throw new Error('토스 앱에서만 결제가 가능합니다.');
      }
      const normalizedUserKey = await ensureUserKey();

      const completePayment = async (orderId: string) => {
        saveOrderId(namingId, orderId);
        setLastOrderId(orderId);

        const res = await fetch('/api/iap/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-toss-user-key': normalizedUserKey,
          },
          body: JSON.stringify({ namingId, orderId, userKey: normalizedUserKey }),
        });

        const json = (await res.json()) as IapCompleteSuccessResponse | IapCompleteErrorResponse;
        const isSuccessResponse =
          typeof json === 'object' && json !== null && 'ok' in json && (json as IapCompleteSuccessResponse).ok === true;
        if (!res.ok || !isSuccessResponse) {
          const errRes = json as IapCompleteErrorResponse;
          const debug = formatDebugPayload({
            status: res.status,
            details: errRes.details ?? null,
            orderStatus: errRes.orderStatus ?? null,
            rawOrderStatus: errRes.rawOrderStatus ?? null,
          });
          throw createErrorWithDebug(errRes.error || '결제 처리에 실패했습니다', debug);
        }
      };

      await new Promise<void>((resolve, reject) => {
        let cleanup: (() => void) | undefined;
        let settled = false;
        const timeoutId = window.setTimeout(() => {
          rejectOnce(new Error('결제 확인 시간이 초과되었습니다. 다시 시도해주세요.'));
        }, 35000);

        const finish = (action: () => void) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          try {
            cleanup?.();
          } catch {
            // ignore cleanup error
          }
          action();
        };

        const resolveOnce = () => finish(() => resolve());
        const rejectOnce = (error: unknown) =>
          finish(() => reject(error instanceof Error ? error : new Error('결제에 실패했습니다.')));

        try {
          cleanup = IAP.createOneTimePurchaseOrder({
            options: {
              sku,
              processProductGrant: async ({ orderId }) => {
                try {
                  await completePayment(orderId);
                  resolveOnce();
                  return true;
                } catch (error) {
                  rejectOnce(error);
                  return false;
                }
              },
            },
            onEvent: (event) => {
              const type = String(event?.type ?? '').toLowerCase();
              if (type === 'success') {
                resolveOnce();
                return;
              }
              if (type === 'canceled' || type === 'cancel' || type === 'cancelled' || type === 'user_canceled') {
                rejectOnce(new Error('결제가 취소되었습니다.'));
              }
            },
            onError: (error) => {
              rejectOnce(new Error(getErrorMessage(error, '결제에 실패했습니다.')));
            },
          });
        } catch (error) {
          rejectOnce(error);
        }
      });

      setCurrentPaymentStatus('paid');
      clearOrderId(namingId);
      setLastOrderId('');
      setUnlocking(false);
      router.refresh();
    } catch (error) {
      const message = getErrorMessage(error, '결제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      const debug =
        typeof error === 'object' && error !== null && 'debug' in error
          ? String((error as { debug?: unknown }).debug || '')
          : '';
      setUnlockError(message);
      setUnlockDebug(debug);
      setUnlocking(false);
    }
  };

  const handleRetryLastOrder = async () => {
    if (!lastOrderId) return;

    setUnlockError('');
    setUnlockDebug('');
    setUnlocking(true);

    try {
      const normalizedUserKey = await ensureUserKey();
      const res = await fetch('/api/iap/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-toss-user-key': normalizedUserKey,
        },
        body: JSON.stringify({ namingId, orderId: lastOrderId, userKey: normalizedUserKey }),
      });
      const json = (await res.json()) as IapCompleteSuccessResponse | IapCompleteErrorResponse;
      const isSuccessResponse =
        typeof json === 'object' && json !== null && 'ok' in json && (json as IapCompleteSuccessResponse).ok === true;
      if (!res.ok || !isSuccessResponse) {
        const errRes = json as IapCompleteErrorResponse;
        const debug = formatDebugPayload({
          status: res.status,
          details: errRes.details ?? null,
          orderStatus: errRes.orderStatus ?? null,
          rawOrderStatus: errRes.rawOrderStatus ?? null,
        });
        throw createErrorWithDebug(errRes.error || '재검증에 실패했습니다.', debug);
      }

      setCurrentPaymentStatus('paid');
      clearOrderId(namingId);
      setLastOrderId('');
      setUnlocking(false);
      router.refresh();
    } catch (error) {
      const message = getErrorMessage(error, '재검증 중 오류가 발생했습니다.');
      const debug =
        typeof error === 'object' && error !== null && 'debug' in error
          ? String((error as { debug?: unknown }).debug || '')
          : '';
      setUnlockError(message);
      setUnlockDebug(debug);
      setUnlocking(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">✨</div>
        <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-2">
          {lastName}씨 아이를 위한<br />추천 이름
        </h1>
        <p className="text-[var(--gray-500)]">총 {TOTAL_RECOMMENDATION_COUNT}개의 이름을 추천해드려요</p>
      </div>

      {isLockedMode && (
        <Card className="mb-4 bg-[var(--blue-light)] border border-[var(--blue-primary)]/20">
          <h2 className="font-bold text-[var(--gray-900)] mb-1">3개 무료 공개 / 나머지 7개는 결제 후 바로 확인할 수 있어요.</h2>
          <p className="text-sm text-[var(--gray-600)]">
            결제 전에는 상위 3개만 먼저 확인할 수 있어요.
          </p>
        </Card>
      )}

      <div className="space-y-4 mb-8">
        {namesWithLock.map(({ name, locked }, index) => (
          <NameCard
            key={index}
            name={name}
            lastName={lastName}
            rank={index + 1}
            expanded={expandedIndex === index}
            locked={locked}
            onToggle={() => {
              if (locked) return;
              setExpandedIndex(expandedIndex === index ? -1 : index);
            }}
          />
        ))}
      </div>

      {isLockedMode && (
        <Card className="mb-8">
          <h2 className="font-bold text-[var(--gray-900)] mb-2">유료 공개</h2>
          <p className="text-sm text-[var(--gray-600)] mb-4">
            숨겨진 {lockedCount || LOCKED_RECOMMENDATION_COUNT}개 이름을 모두 확인할 수 있어요.
          </p>
          <Button onClick={handleUnlock} disabled={unlocking}>
            {unlocking ? '결제 확인 중...' : '550원 결제로 전체 이름 보기'}
          </Button>
          {unlockError && <p className="text-red-500 text-sm mt-3">{unlockError}</p>}
          {lastOrderId && (
            <Button onClick={handleRetryLastOrder} disabled={unlocking} variant="secondary" className="mt-3">
              마지막 결제 재검증
            </Button>
          )}
          {unlockDebug && (
            <pre className="mt-3 p-3 text-[11px] leading-5 bg-[var(--gray-900)] text-white rounded-xl overflow-auto whitespace-pre-wrap">
{unlockDebug}
            </pre>
          )}
        </Card>
      )}

      {result.philosophy && (
        <Card className="mb-4">
          <h2 className="font-bold text-[var(--gray-900)] mb-3 flex items-center gap-2">
            📖 작명 철학 추천 기준
          </h2>
          <p className="text-sm text-[var(--gray-600)] leading-relaxed whitespace-pre-wrap">
            {result.philosophy}
          </p>
        </Card>
      )}

      {result.avoidance && (
        <Card className="mb-8">
          <h2 className="font-bold text-[var(--gray-900)] mb-3 flex items-center gap-2">
            ⚠️ 참고 사항
          </h2>
          <p className="text-sm text-[var(--gray-600)] leading-relaxed whitespace-pre-wrap">
            {result.avoidance}
          </p>
        </Card>
      )}

      <div className="space-y-3">
        <Button onClick={handleShare} variant="secondary">
          결과 공유하기
        </Button>
        <a href="/naming">
          <Button variant="ghost">
            다시 작명하기
          </Button>
        </a>
      </div>
    </div>
  );
}

function NameCard({
  name,
  lastName,
  rank,
  expanded,
  locked,
  onToggle,
}: {
  name: NameSuggestion;
  lastName: string;
  rank: number;
  expanded: boolean;
  locked: boolean;
  onToggle: () => void;
}) {
  const isNativeKoreanName =
    name.hanjaName === '순한글' ||
    name.hanjaChars.every((char) => char.character === '-' || char.element === '순한글');

  const scoreColor =
    name.score >= 90 ? 'text-green-600 bg-green-50' :
    name.score >= 80 ? 'text-blue-600 bg-blue-50' :
    'text-yellow-600 bg-yellow-50';

  return (
    <Card className="overflow-hidden relative">
      <button onClick={onToggle} className="w-full text-left" disabled={locked}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--blue-primary)] text-white flex items-center justify-center text-sm font-bold">
              {rank}
            </div>
            <div>
              {locked ? (
                <div className="text-xl font-bold text-[var(--gray-300)] tracking-[0.3em]">•••</div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-[var(--gray-900)]">
                    {`${lastName}${name.koreanName.replace(new RegExp(`^${lastName}`), '')}`}
                  </span>
                  <span className="text-sm text-[var(--gray-400)]">{name.hanjaName || '한자 미제공'}</span>
                </div>
              )}
            </div>
          </div>
          {!locked && (
            <div className={`px-2.5 py-1 rounded-lg text-sm font-bold ${scoreColor}`}>
              {name.score}점
            </div>
          )}
        </div>
      </button>

      {locked && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
          <div className="text-sm font-semibold text-[var(--gray-700)]">결제 후 전체 공개</div>
        </div>
      )}

      {expanded && !locked && (
        <div className="mt-5 pt-5 border-t border-[var(--gray-100)] space-y-5 animate-fade-in">
          {!isNativeKoreanName && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-3">한자 의미</h4>
              <div className="space-y-2">
                {name.hanjaChars.map((char, i) => (
                  <div key={i} className="flex items-start gap-3 bg-[var(--gray-50)] rounded-xl p-3">
                    <span className="text-2xl font-serif">{char.character}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[var(--gray-900)]">{char.meaning}</div>
                      <div className="text-xs text-[var(--gray-400)] mt-0.5">
                        {char.strokes}획 · {char.element}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isNativeKoreanName && name.fiveElements && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-2">음양오행</h4>
              <p className="text-sm text-[var(--gray-600)] leading-relaxed">{name.fiveElements}</p>
            </div>
          )}

          {name.energyInterpretation && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-2">작명 로직</h4>
              <p className="text-sm text-[var(--gray-600)] leading-relaxed">{name.energyInterpretation}</p>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[var(--gray-700)]">종합 점수</span>
              <span className="text-sm font-bold text-[var(--blue-primary)]">{name.score}/100</span>
            </div>
            <div className="w-full h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--blue-primary)] rounded-full animate-gauge"
                style={{ width: `${name.score}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
