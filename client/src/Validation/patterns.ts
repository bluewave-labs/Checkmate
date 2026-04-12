export const specialCharPattern = /[!?@#$%^&*()\-_=+[\]{};:'",.<>~`|\\/]/;

// Unicode-aware name pattern (allows letters, marks, apostrophes, parentheses, hyphens, periods, spaces)
export const namePattern = /^[\p{L}\p{M}''()\-\. ]+$/u;
