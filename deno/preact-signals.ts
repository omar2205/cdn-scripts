import { useMemo, effect } from './deps.ts'

export function useSignalEffect(cb: () => void) {
  return useMemo(() => effect(cb), [])
}
