import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CubeProvider } from './CubeContext'
import { useCubeContext } from '../hooks/useCubeContext'
import { DEFAULT_SPEFFZ_ENCODING } from '../types/encoding'

describe('CubeContext', () => {
  it('provides default encoding and label mode', () => {
    const { result } = renderHook(() => useCubeContext(), {
      wrapper: CubeProvider,
    })
    expect(result.current.state.encoding).toEqual(DEFAULT_SPEFFZ_ENCODING)
    expect(result.current.state.labelMode).toBe('all')
  })

  it('allows updating a sticker encoding', () => {
    const { result } = renderHook(() => useCubeContext(), {
      wrapper: CubeProvider,
    })
    act(() => {
      result.current.dispatch({
        type: 'UPDATE_STICKER',
        payload: { type: 'corners', key: 'UBL-U', label: 'Z' },
      })
    })
    expect(result.current.state.encoding.corners['UBL-U']).toBe('Z')
  })
})
