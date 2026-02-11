import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CubeProvider } from './CubeContext'
import { useCubeContext } from '../hooks/useCubeContext'
import { DEFAULT_SPEFFZ_ENCODING } from '../types/encoding'

describe('CubeContext', () => {
  it('provides default encoding', () => {
    const { result } = renderHook(() => useCubeContext(), {
      wrapper: CubeProvider,
    })
    expect(result.current.state.encoding).toEqual(DEFAULT_SPEFFZ_ENCODING)
  })

  it('allows updating corner encoding', () => {
    const { result } = renderHook(() => useCubeContext(), {
      wrapper: CubeProvider,
    })
    act(() => {
      result.current.dispatch({
        type: 'UPDATE_CORNER_ENCODING',
        payload: { position: 'UBL', label: 'X' },
      })
    })
    expect(result.current.state.encoding.corners.UBL).toBe('X')
  })
})
