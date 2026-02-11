import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export default function CubeScene() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI * 3 / 4}
        />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </Canvas>
    </div>
  )
}
