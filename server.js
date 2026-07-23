const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==========================================
// ADVANCED MINIMAX ENGINE WITH ALPHA-BETA
// ==========================================

class FastCaroEngine {
  constructor() {
    this.DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
  }

  getCandidates(board, size) {
    const candidates = [];
    const visited = new Set();
    let hasPiece = false;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] !== 0) {
          hasPiece = true;
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === 0) {
                const key = `${nr},${nc}`;
                if (!visited.has(key)) {
                  visited.add(key);
                  candidates.push({ r: nr, c: nc });
                }
              }
            }
          }
        }
      }
    }

    if (!hasPiece) return [{ r: Math.floor(size / 2), c: Math.floor(size / 2) }];
    return candidates;
  }

  evaluatePoint(board, r, c, player, size) {
    let score = 0;
    for (const [dr, dc] of this.DIRS) {
      let count = 1;
      let openEnds = 0;

      let step = 1;
      while (true) {
        const nr = r + dr * step, nc = c + dc * step;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === player) {
          count++; step++;
        } else {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === 0) openEnds++;
          break;
        }
      }

      step = 1;
      while (true) {
        const nr = r - dr * step, nc = c - dc * step;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === player) {
          count++; step++;
        } else {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === 0) openEnds++;
          break;
        }
      }

      if (count >= 5) score += 10000000;
      else if (count === 4 && openEnds === 2) score += 1000000;
      else if (count === 4 && openEnds === 1) score += 100000;
      else if (count === 3 && openEnds === 2) score += 50000;
      else if (count === 3 && openEnds === 1) score += 2000;
      else if (count === 2 && openEnds === 2) score += 500;
    }
    return score;
  }
}

class AdvancedMinimaxEngine extends FastCaroEngine {
  constructor(maxDepth = 3) {
    super();
    this.maxDepth = maxDepth;
  }

  minimax(board, depth, alpha, beta, isMaximizing, size) {
    const score = this.evaluateBoardTotal(board, size);
    if (depth === 0 || Math.abs(score) >= 10000000) {
      return score;
    }

    const candidates = this.getCandidates(board, size);
    if (candidates.length === 0) return 0;

    candidates.sort((a, b) => {
      const scoreA = this.evaluatePoint(board, a.r, a.c, isMaximizing ? 1 : 2, size);
      const scoreB = this.evaluatePoint(board, b.r, b.c, isMaximizing ? 1 : 2, size);
      return scoreB - scoreA;
    });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of candidates) {
        board[move.r][move.c] = 1;
        const evaluation = this.minimax(board, depth - 1, alpha, beta, false, size);
        board[move.r][move.c] = 0;
        
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of candidates) {
        board[move.r][move.c] = 2;
        const evaluation = this.minimax(board, depth - 1, alpha, beta, true, size);
        board[move.r][move.c] = 0;
        
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  evaluateBoardTotal(board, size) {
    let totalBotScore = 0;
    let totalHumanScore = 0;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === 1) {
          totalBotScore += this.evaluatePoint(board, r, c, 1, size);
        } else if (board[r][c] === 2) {
          totalHumanScore += this.evaluatePoint(board, r, c, 2, size);
        }
      }
    }
    return totalBotScore - (totalHumanScore * 1.1);
  }

  findBestMove(board, size) {
    const candidates = this.getCandidates(board, size);
    if (candidates.length === 0) return null;

    let bestMove = candidates[0];
    let maxEval = -Infinity;
    const alpha = -Infinity;
    const beta = Infinity;

    candidates.sort((a, b) => {
      const scoreA = this.evaluatePoint(board, a.r, a.c, 1, size) + this.evaluatePoint(board, a.r, a.c, 2, size) * 1.1;
      const scoreB = this.evaluatePoint(board, b.r, b.c, 1, size) + this.evaluatePoint(board, b.r, b.c, 2, size) * 1.1;
      return scoreB - scoreA;
    });

    const topCandidates = candidates.slice(0, 15);

    for (const move of topCandidates) {
      board[move.r][move.c] = 1;
      const moveEval = this.minimax(board, this.maxDepth - 1, alpha, beta, false, size);
      board[move.r][move.c] = 0;

      if (moveEval > maxEval) {
        maxEval = moveEval;
        bestMove = move;
      }
    }

    return bestMove;
  }
}

const engine = new AdvancedMinimaxEngine(3);

// ==========================================
// API ENDPOINT
// ==========================================
app.post('/api/get-move', (req, res) => {
  try {
    const { board, size } = req.body;
    if (!board || !size) {
      return res.status(400).json({ success: false, error: 'Thiếu dữ liệu board hoặc size!' });
    }

    const bestMove = engine.findBestMove(board, size);
    res.json({ success: true, move: bestMove });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Lỗi xử lý server nội bộ.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server Caro API đang chạy tại cổng: ${PORT}`);
});