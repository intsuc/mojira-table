import { useCallback, useMemo, useSyncExternalStore, type Dispatch, type SetStateAction } from "react"

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (value: string) => T = JSON.parse,
): [T, Dispatch<SetStateAction<T>>] {
  const initialValueString = useMemo(() => serialize(initialValue), [initialValue, serialize])

  const getSnapshot = useCallback(() => window.localStorage.getItem(key) ?? initialValueString, [initialValueString, key])
  const getServerSnapshot = useCallback(() => {
    const value = globalThis?.window?.localStorage?.getItem(key) ?? undefined
    return value === undefined ? initialValueString : value
  }, [initialValueString, key])

  const valueString = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const value = useMemo(() => deserialize(valueString), [deserialize, valueString])
  const setValue = useCallback((action: SetStateAction<T>) => {
    const newValue = typeof action === "function" ? (action as (prev: T) => T)(value) : action
    window.localStorage.setItem(key, serialize(newValue))
    window.dispatchEvent(new Event("localstoragechange"))
  }, [key, serialize, value])

  return [value, setValue]
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("localstoragechange", onStoreChange)
  return () => {
    window.removeEventListener("localstoragechange", onStoreChange)
  }
}
