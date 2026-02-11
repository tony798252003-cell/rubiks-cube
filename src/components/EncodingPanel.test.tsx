import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CubeProvider } from '../context/CubeContext'
import EncodingPanel from './EncodingPanel'

describe('EncodingPanel', () => {
  it('renders when open', () => {
    render(<CubeProvider><EncodingPanel isOpen={true} onClose={() => {}} /></CubeProvider>)
    expect(screen.getByText('編碼設定')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<CubeProvider><EncodingPanel isOpen={false} onClose={() => {}} /></CubeProvider>)
    expect(screen.queryByText('編碼設定')).not.toBeInTheDocument()
  })

  it('allows editing encoding', () => {
    render(<CubeProvider><EncodingPanel isOpen={true} onClose={() => {}} /></CubeProvider>)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'X' } })
    expect(inputs[0]).toHaveValue('X')
  })
})
