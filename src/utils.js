import { COUNTRY_CODES } from './constants';

export function buildUrl(appId, cc, num) {
  const clean = (cc + num).replace(/\D/g, '');
  if (appId === 'whatsapp') return `https://wa.me/${clean}`;
  if (appId === 'telegram') return `tg://resolve?phone=%2B${clean}`;
  if (appId === 'signal')   return `sgnl://signal.me/#p/%2B${clean}`;
  return '';
}

export function isValidNumber(n) {
  return /^\d{6,15}$/.test(n.replace(/[\s\-(). ]/g, ''));
}

export function relativeTime(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)     return 'Just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return new Date(ts).toLocaleDateString([], { weekday: 'short' });
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function parseClipboard(text) {
  if (!text) return null;
  const raw = text.trim().replace(/[\s\-(). \u00A0]/g, '');
  if (raw.startsWith('+')) {
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
      if (raw.startsWith(c.code)) {
        const rest = raw.slice(c.code.length);
        if (rest.length >= 6 && rest.length <= 12 && /^\d+$/.test(rest)) {
          return { cc: c.code, flag: c.flag, num: rest };
        }
      }
    }
  }
  if (raw.startsWith('00')) return parseClipboard('+' + raw.slice(2));
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 6 && digits.length <= 15) return { cc: null, num: digits };
  return null;
}

export function detectCC(phoneNumber) {
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (phoneNumber.startsWith(c.code)) {
      return { cc: c.code, flag: c.flag, num: phoneNumber.slice(c.code.length) };
    }
  }
  return null;
}

export function getInitials(name) {
  if (!name) return '#';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
