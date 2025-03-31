import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react"

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (value: string) => T = JSON.parse,
): [
    T,
    Dispatch<SetStateAction<T>>,
  ] {
  const [state, setState] = useState<T>(initialValue)

  useEffect(() => {
    const storedValue = localStorage.getItem(key)
    if (storedValue !== null) {
      setState(deserialize(storedValue))
    }
  }, [deserialize, key])

  const storeState = useCallback((update: SetStateAction<T>) => {
    setState((prev) => {
      const newValue = typeof update === "function" ? (update as (value: T) => T)(prev) : update
      localStorage.setItem(key, serialize(newValue))
      return newValue
    })
  }, [key, serialize])

  return [state, storeState] as const
}
