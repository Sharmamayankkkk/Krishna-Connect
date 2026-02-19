import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { createBrowserClient } from '@supabase/ssr'


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export function getAvatarUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return url; // Local public file

  // Check for known static avatars or simple filenames
  if (url === 'male.png' || url === 'female.png' || url === 'verified.png' || url === 'KCS-verified.png') {
    return `/user_Avatar/${url}`;
  }

  // Handle local /avatars/ path (legacy or incorrect DB entries)
  if (url.startsWith('/avatars/')) {
    return `/user_Avatar/${url.replace('/avatars/', '')}`;
  }



  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return url;

  // Clean up the path to avoid double slashes
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${supabaseUrl}/storage/v1/object/public/attachments/${cleanPath}`;
}

export function getContrastingTextColor(color: string): string {
  if (!color) return '#000000';

  let r: number, g: number, b: number;

  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/);
    if (!match) return '#000000'; // fallback

    const h = parseFloat(match[1]);
    const s = parseFloat(match[2]) / 100;
    const l = parseFloat(match[3]) / 100;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h / 360 + 1 / 3);
      g = hue2rgb(p, q, h / 360);
      b = hue2rgb(p, q, h / 360 - 1 / 3);
    }
    r = Math.round(r * 255);
    g = Math.round(g * 255);
    b = Math.round(b * 255);
  } else {
    const hex = color.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  // Using the HSP (Highly Sensitive Poo) equation to determine brightness
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  // hsp > 127.5 is a good threshold for light/dark
  return hsp > 127.5 ? '#000000' : '#FFFFFF';
}

export function formatNumber(num: number): string {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}
