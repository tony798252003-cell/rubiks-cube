import { useRef } from 'react'
import { Mesh } from 'three'
import { Edges } from '@react-three/drei'
import { getColorHex, INTERNAL_COLOR } from '../utils/cubeGeometry'
import type { Color } from '../types/cube'

interface CubieProps {
  position: [number, number, number]
  colors: (string | null)[] // null = 內部面
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
          color={color ? getColorHex(color as Color) : INTERNAL_COLOR}
        />
      ))}
      <Edges threshold={15} color="black" lineWidth={2} />
    </mesh>
  )
}
