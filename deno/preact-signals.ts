import { useMemo } from 'https://esm.sh/preact@10.10.6/hooks'
import { effect } from 'https://esm.sh/*@preact/signals@1.0.3/signals'

export function useSignalEffect(cb: () => void) {
  return useMemo(() => effect(cb), [])
}
