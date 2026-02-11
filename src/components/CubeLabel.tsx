import { Text } from '@react-three/drei'

interface CubeLabelProps {
  position: [number, number, number]
  rotation: [number, number, number]
  label: string
}

export default function CubeLabel({ position, rotation, label }: CubeLabelProps) {
  return (
    <Text
      position={position}
      rotation={rotation}
      fontSize={0.35}
      color="black"
      anchorX="center"
      anchorY="middle"
      fontWeight="bold"
      outlineWidth={0.02}
      outlineColor="white"
    >
      {label}
    </Text>
  )
}
