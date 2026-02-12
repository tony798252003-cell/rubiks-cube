import { useRef } from 'react'
import { Mesh } from 'three'
import { Edges } from '@react-three/drei'

interface CubieProps {
  position: [number, number, number]
  colors: string[] // hex color strings for each face
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
          color={color}
        />
      ))}
      <Edges threshold={15} color="black" lineWidth={2} />
    </mesh>
  )
}
