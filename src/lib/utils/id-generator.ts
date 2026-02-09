import { nanoid } from 'nanoid';

export function generateNamingId(): string {
  return `nm_${nanoid(12)}`;
}
