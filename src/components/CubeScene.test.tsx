import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import CubeScene from './CubeScene'

describe('CubeScene', () => {
  // Skip: jsdom doesn't support WebGL/ResizeObserver required by React Three Fiber
  it.skip('renders canvas element', () => {
    const { container } = render(<CubeScene />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })
})
