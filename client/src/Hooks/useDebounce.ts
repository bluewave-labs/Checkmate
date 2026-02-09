import { useState, useEffect } from "react";

/**
 * Custom hook for debouncing values
 * @template T - The type of the value being debounced
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns The debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(search, 300); // Debounces the search input with a 300ms delay
 */
const useDebounce = <T>(value: T, delay: number): T => {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
};

export default useDebounce;
