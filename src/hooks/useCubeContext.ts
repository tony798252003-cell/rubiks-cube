import { useContext } from 'react'
import { CubeContext } from '../context/CubeContext'

export function useCubeContext() {
  const context = useContext(CubeContext)
  if (!context) {
    throw new Error('useCubeContext must be used within CubeProvider')
  }
  return context
}
