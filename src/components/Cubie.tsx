import { useRef } from 'react'
import { Mesh } from 'three'
import type { Color } from '../types/cube'
import { getColorHex } from '../utils/cubeGeometry'

interface CubieProps {
  position: [number, number, number]
  colors: Color[]
}

export default function Cubie({ position, colors }: CubieProps) {
  const meshRef = useRef<Mesh>(null)
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.95, 0.95, 0.95]} />
      {colors.map((color, index) => (
        <meshStandardMaterial
          key={index}
          attach={`material-${index}`}
          color={getColorHex(color)}
        />
      ))}
    </mesh>
  )
}
