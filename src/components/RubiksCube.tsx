import Cubie from './Cubie'
import { getCubiePosition } from '../utils/cubeGeometry'
import { useCubeContext } from '../hooks/useCubeContext'
import { getCubieColorsFromState } from '../utils/cubeState'

export default function RubiksCube() {
  const { state } = useCubeContext()
  const cubies: React.JSX.Element[] = []

  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      for (let z = 0; z < 3; z++) {
        if (x === 1 && y === 1 && z === 1) continue
        const position = getCubiePosition(x, y, z)
        const colors = getCubieColorsFromState(state.cubeStickers, x, y, z)
        cubies.push(<Cubie key={`${x}-${y}-${z}`} position={position} colors={colors} />)
      }
    }
  }

  return <group>{cubies}</group>
}
