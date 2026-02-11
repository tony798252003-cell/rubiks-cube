import { Html } from '@react-three/drei'

interface CubeLabelProps {
  position: [number, number, number]
  label: string
  visible?: boolean
}

export default function CubeLabel({ position, label, visible = true }: CubeLabelProps) {
  if (!visible) return null
  return (
    <Html position={position} center>
      <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-bold pointer-events-none select-none">
        {label}
      </div>
    </Html>
  )
}
