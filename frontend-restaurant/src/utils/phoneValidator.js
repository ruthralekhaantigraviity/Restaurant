/**
 * Strict Indian Mobile Number Utilities
 * Mobile numbers must start only with 6, 7, 8, or 9 and be exactly 10 digits.
 */

export const filterIndianMobile = (val) => {
    const raw = String(val || '').replace(/\D/g, '');
    if (!raw) return '';
    if (!['6', '7', '8', '9'].includes(raw[0])) {
        return '';
    }
    return raw.slice(0, 10);
};

export const isValidIndianMobile = (val) => {
    const clean = String(val || '').replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(clean);
};
