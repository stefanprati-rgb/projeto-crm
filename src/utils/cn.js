import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes CSS com suporte a Tailwind CSS
 * Usa clsx para condicionais e twMerge para resolver conflitos do Tailwind
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
