import Cubie from './Cubie'
import { getCubiePosition } from '../utils/cubeGeometry'
import type { Color } from '../types/cube'

export default function RubiksCube() {
  const cubies: JSX.Element[] = []

  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      for (let z = 0; z < 3; z++) {
        if (x === 1 && y === 1 && z === 1) continue
        const position = getCubiePosition(x, y, z)
        const colors = getCubieColors(x, y, z)
        cubies.push(<Cubie key={`${x}-${y}-${z}`} position={position} colors={colors} />)
      }
    }
  }

  return <group>{cubies}</group>
}

function getCubieColors(x: number, y: number, z: number): Color[] {
  // Box geometry face order: +x, -x, +y, -y, +z, -z
  const black: Color = 'white' // placeholder for internal faces
  return [
    x === 2 ? 'red' : black,     // +x = R face
    x === 0 ? 'orange' : black,  // -x = L face
    y === 2 ? 'white' : black,   // +y = U face
    y === 0 ? 'yellow' : black,  // -y = D face
    z === 2 ? 'green' : black,   // +z = F face
    z === 0 ? 'blue' : black,    // -z = B face
  ]
}
