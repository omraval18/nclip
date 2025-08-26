import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatByte(
    bytes: number,
    options?: {
        decimals?: number;
        binary?: boolean;
        spacer?: string;
        stripTrailingZeros?: boolean;
    }
): string {
    const { decimals = 2, binary = true, spacer = " ", stripTrailingZeros = true } = options ?? {};

    if (!Number.isFinite(bytes)) return `0${spacer}B`;
    if (bytes === 0) return `0${spacer}B`;
    const negative = bytes < 0;
    let value = Math.abs(bytes);

    const base = binary ? 1024 : 1000;
    const units = binary
        ? ["B", "KiB", "MiB", "GiB", "TiB", "PiB"]
        : ["B", "KB", "MB", "GB", "TB", "PB"];

    if (value < base) {
        return `${negative ? "-" : ""}${value}${spacer}${units[0]}`;
    }

    let idx = Math.floor(Math.log(value) / Math.log(base));
    idx = Math.min(idx, units.length - 1);

    const num = value / Math.pow(base, idx);
    let formatted = num.toFixed(decimals);

    if (stripTrailingZeros && decimals > 0) {
        formatted = formatted.replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, "");
    }

    return `${negative ? "-" : ""}${formatted}${spacer}${units[idx]}`;
}

export const formatTime = (time: number): string => {
    if (!isFinite(time) || time < 0) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const formatRemainingTime = (currentTime: number, duration: number): string => {
    if (!isFinite(currentTime) || !isFinite(duration)) return "--:--";
    const remaining = Math.max(0, duration - currentTime);
    return `-${formatTime(remaining)}`;
};

