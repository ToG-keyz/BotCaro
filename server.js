const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

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

// ==========================================
// 6. BOT LOGIC CHO SERVER
// ==========================================

class CaroBotServer {
  constructor() {
    this.engine = new AdvancedMinimaxEngine(3);
    this.lastBoardState = null;
    this.gameConfig = {
      botPlayer: 1, // Bot là player 1 (O)
      humanPlayer: 2 // Human là player 2 (X)
    };
  }

  // Phân tích bàn cờ và xác định lượt chơi
  analyzeBoard(board, size) {
    let botPieces = 0;
    let humanPieces = 0;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === this.gameConfig.botPlayer) botPieces++;
        if (board[r][c] === this.gameConfig.humanPlayer) humanPieces++;
      }
    }

    // Bot đi nếu số quân bằng nhau hoặc bot ít hơn (lượt của bot)
    const isBotTurn = botPieces <= humanPieces;
    const isGameOver = this.checkWin(board, size);

    return {
      isBotTurn,
      isGameOver,
      botPieces,
      humanPieces,
      totalMoves: botPieces + humanPieces
    };
  }

  // Kiểm tra thắng cuộc
  checkWin(board, size) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === 0) continue;
        const player = board[r][c];
        
        for (const [dr, dc] of this.engine.DIRS) {
          let count = 1;
          for (let step = 1; step < 5; step++) {
            const nr = r + dr * step, nc = c + dc * step;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === player) {
              count++;
            } else break;
          }
          for (let step = 1; step < 5; step++) {
            const nr = r - dr * step, nc = c - dc * step;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === player) {
              count++;
            } else break;
          }
          if (count >= 5) return true;
        }
      }
    }
    return false;
  }

  // Lấy nước đi tốt nhất
  getBestMove(board, size) {
    // Kiểm tra bàn cờ hợp lệ
    if (!board || !size || size < 5) {
      return { error: 'Bàn cờ không hợp lệ' };
    }

    // Clone board để tránh sửa đổi
    const boardClone = board.map(row => [...row]);

    // Phân tích trạng thái
    const analysis = this.analyzeBoard(boardClone, size);
    
    if (analysis.isGameOver) {
      return { 
        error: 'Trò chơi đã kết thúc',
        analysis 
      };
    }

    if (!analysis.isBotTurn) {
      return { 
        error: 'Không phải lượt của bot',
        analysis 
      };
    }

    // Tìm nước đi tốt nhất
    const bestMove = this.engine.findBestMove(boardClone, size);
    
    if (!bestMove) {
      return { 
        error: 'Không tìm thấy nước đi hợp lệ',
        analysis 
      };
    }

    // Kiểm tra nước đi có hợp lệ không
    if (boardClone[bestMove.r][bestMove.c] !== 0) {
      return { 
        error: 'Nước đi không hợp lệ - ô đã bị chiếm',
        analysis 
      };
    }

    return {
      move: bestMove,
      analysis,
      evaluation: this.engine.evaluateBoardTotal(boardClone, size)
    };
  }

  // Lấy gợi ý nước đi (không cần là lượt của bot)
  getSuggestion(board, size) {
    const boardClone = board.map(row => [...row]);
    const bestMove = this.engine.findBestMove(boardClone, size);
    
    if (!bestMove) {
      return { error: 'Không tìm thấy nước đi hợp lệ' };
    }

    return {
      move: bestMove,
      evaluation: this.engine.evaluateBoardTotal(boardClone, size)
    };
  }

  // Đánh giá bàn cờ
  evaluateBoard(board, size) {
    return {
      score: this.engine.evaluateBoardTotal(board, size),
      analysis: this.analyzeBoard(board, size)
    };
  }
}

// Tạo instance bot
const bot = new CaroBotServer();

// ==========================================
// 7. API ENDPOINTS
// ==========================================

// Endpoint chính: Lấy nước đi cho bot
app.post('/api/get-move', (req, res) => {
  try {
    const { board, size, mode = 'auto' } = req.body;
    
    if (!board || !size) {
      return res.status(400).json({ 
        success: false, 
        error: 'Thiếu dữ liệu board hoặc size!' 
      });
    }

    // Kiểm tra kích thước board
    if (!Array.isArray(board) || board.length !== size || !board.every(row => row.length === size)) {
      return res.status(400).json({
        success: false,
        error: 'Board không khớp với size!'
      });
    }

    let result;

    if (mode === 'suggest') {
      // Chế độ gợi ý (không cần lượt bot)
      result = bot.getSuggestion(board, size);
    } else {
      // Chế độ tự động (cần lượt bot)
      result = bot.getBestMove(board, size);
    }

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error,
        analysis: result.analysis || null
      });
    }

    res.json({
      success: true,
      move: result.move,
      analysis: result.analysis || null,
      evaluation: result.evaluation || null
    });

  } catch (error) {
    console.error('Error in /api/get-move:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi xử lý server nội bộ.' 
    });
  }
});

// Endpoint: Đánh giá bàn cờ
app.post('/api/evaluate', (req, res) => {
  try {
    const { board, size } = req.body;
    
    if (!board || !size) {
      return res.status(400).json({ 
        success: false, 
        error: 'Thiếu dữ liệu board hoặc size!' 
      });
    }

    const evaluation = bot.evaluateBoard(board, size);
    res.json({
      success: true,
      evaluation
    });

  } catch (error) {
    console.error('Error in /api/evaluate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi xử lý server nội bộ.' 
    });
  }
});

// Endpoint: Kiểm tra trạng thái bàn cờ
app.post('/api/analyze', (req, res) => {
  try {
    const { board, size } = req.body;
    
    if (!board || !size) {
      return res.status(400).json({ 
        success: false, 
        error: 'Thiếu dữ liệu board hoặc size!' 
      });
    }

    const analysis = bot.analyzeBoard(board, size);
    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error in /api/analyze:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi xử lý server nội bộ.' 
    });
  }
});

// Endpoint: Lấy danh sách nước đi tiềm năng
app.post('/api/candidates', (req, res) => {
  try {
    const { board, size } = req.body;
    
    if (!board || !size) {
      return res.status(400).json({ 
        success: false, 
        error: 'Thiếu dữ liệu board hoặc size!' 
      });
    }

    const candidates = bot.engine.getCandidates(board, size);
    res.json({
      success: true,
      candidates,
      total: candidates.length
    });

  } catch (error) {
    console.error('Error in /api/candidates:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi xử lý server nội bộ.' 
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Caro Bot Server API',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Kiểm tra sức khỏe server',
      'POST /api/get-move': 'Lấy nước đi cho bot (mode: auto|suggest)',
      'POST /api/evaluate': 'Đánh giá bàn cờ',
      'POST /api/analyze': 'Phân tích trạng thái bàn cờ',
      'POST /api/candidates': 'Lấy danh sách nước đi tiềm năng'
    },
    bot_config: {
      maxDepth: 3,
      botPlayer: 1,
      humanPlayer: 2
    }
  });
});

// ==========================================
// 8. START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`🚀 Caro Bot Server đang chạy tại cổng: ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Bot depth: 3`);
  console.log(`🎯 Bot player: 1 (O), Human player: 2 (X)`);
});
