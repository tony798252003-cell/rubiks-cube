const MOVES = ['R', 'L', 'U', 'D', 'F', 'B']
const MODIFIERS = ['', "'", '2']

export function generateScramble(length: number = 20): string {
  const scramble: string[] = []
  let lastMove = ''

  for (let i = 0; i < length; i++) {
    let move: string
    do {
      move = MOVES[Math.floor(Math.random() * MOVES.length)]
    } while (move === lastMove)
    lastMove = move
    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]
    scramble.push(move + modifier)
  }

  return scramble.join(' ')
}
