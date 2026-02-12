import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CubeProvider } from '../context/CubeContext'
import ControlPanel from './ControlPanel'

describe('ControlPanel', () => {
  it('renders label mode button', () => {
    render(<CubeProvider><ControlPanel /></CubeProvider>)
    expect(screen.getByText('標註：全部')).toBeInTheDocument()
  })

  it('cycles label modes on click', () => {
    render(<CubeProvider><ControlPanel /></CubeProvider>)
    fireEvent.click(screen.getByText('標註：全部'))
    expect(screen.getByText('標註：角塊')).toBeInTheDocument()
    fireEvent.click(screen.getByText('標註：角塊'))
    expect(screen.getByText('標註：邊塊')).toBeInTheDocument()
    fireEvent.click(screen.getByText('標註：邊塊'))
    expect(screen.getByText('標註：隱藏')).toBeInTheDocument()
    fireEvent.click(screen.getByText('標註：隱藏'))
    expect(screen.getByText('標註：全部')).toBeInTheDocument()
  })
})
