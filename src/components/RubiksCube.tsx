import Cubie from './Cubie'
import { getCubiePosition } from '../utils/cubeGeometry'

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

// 色彩方案：白色朝下(D), 紅色朝前(F)
// Box geometry face order: +x, -x, +y, -y, +z, -z
function getCubieColors(x: number, y: number, z: number): (string | null)[] {
  return [
    x === 2 ? 'green' : null,   // +x = R face = 綠
    x === 0 ? 'blue' : null,    // -x = L face = 藍
    y === 2 ? 'yellow' : null,  // +y = U face = 黃
    y === 0 ? 'white' : null,   // -y = D face = 白
    z === 2 ? 'red' : null,     // +z = F face = 紅
    z === 0 ? 'orange' : null,  // -z = B face = 橘
  ]
}
