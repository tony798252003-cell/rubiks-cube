import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock CubeScene to avoid WebGL/ResizeObserver issues in jsdom
vi.mock('./components/CubeScene', () => ({
  default: () => <div data-testid="cube-scene-mock" />,
}))

describe('App', () => {
  it('renders heading', () => {
    render(<App />)
    expect(screen.getByText('魔術方塊盲解訓練')).toBeInTheDocument()
  })
})
