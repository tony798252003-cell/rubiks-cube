import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import RubiksCube from './RubiksCube'
import CubeLabels from './CubeLabels'

export default function CubeScene() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [4, 3, 5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        <RubiksCube />
        <CubeLabels />
      </Canvas>
    </div>
  )
}
