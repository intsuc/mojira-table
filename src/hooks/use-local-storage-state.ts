import { useEffect, useState } from "react"

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (value: string) => T = JSON.parse,
) {
  const [state, setState] = useState<T>(() => {
    const storedValue = localStorage.getItem(key)
    return storedValue === null ? initialValue : deserialize(storedValue)
  })

  useEffect(() => {
    localStorage.setItem(key, serialize(state));
  }, [key, serialize, state]);

  return [state, setState] as const
}
