const MOVES = ['R', 'L', 'U', 'D', 'F', 'B']
const MODIFIERS = ['', "'", '2']

// 定義對面關係
const OPPOSITE_FACES: Record<string, string> = {
  'R': 'L', 'L': 'R',
  'U': 'D', 'D': 'U',
  'F': 'B', 'B': 'F'
}

export function generateScramble(length: number = 20): string {
  const scramble: string[] = []
  let lastMove = ''
  let secondLastMove = ''

  for (let i = 0; i < length; i++) {
    let move: string
    do {
      move = MOVES[Math.floor(Math.random() * MOVES.length)]
    } while (
      // 避免與上一個移動相同
      move === lastMove ||
      // 避免與上上個移動相同（會產生可合併的序列，如 R L R）
      move === secondLastMove ||
      // 避免與上一個移動是對面且上上個移動也是這個面（會產生如 B F B 的序列）
      (OPPOSITE_FACES[move] === lastMove && move === secondLastMove)
    )

    secondLastMove = lastMove
    lastMove = move
    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]
    scramble.push(move + modifier)
  }

  return scramble.join(' ')
}
