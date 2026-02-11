import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CubeProvider } from '../context/CubeContext'
import ControlPanel from './ControlPanel'

describe('ControlPanel', () => {
  it('renders toggle labels button', () => {
    render(<CubeProvider><ControlPanel /></CubeProvider>)
    expect(screen.getByText('隱藏標註')).toBeInTheDocument()
  })

  it('toggles label text on click', () => {
    render(<CubeProvider><ControlPanel /></CubeProvider>)
    fireEvent.click(screen.getByText('隱藏標註'))
    expect(screen.getByText('顯示標註')).toBeInTheDocument()
  })
})
