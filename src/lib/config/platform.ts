const appTarget = process.env.NEXT_PUBLIC_APP_TARGET ?? 'web';

export const isTossTarget = appTarget === 'toss';
export const isWebTarget = !isTossTarget;

export function shouldRequireUnlock(paymentStatus: string | null | undefined) {
  if (!isTossTarget) return false;
  return paymentStatus !== 'paid';
}
