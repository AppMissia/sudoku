import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  initializeBoard,
  createDailyBoard,
  countSolutions,
  candidatesFor,
  toDateKey,
  dailyDifficulty,
} from '../src/utils/sudokuEngine.ts';
import {
  calcXp,
  levelFromXp,
  levelProgress,
  applyGameResult,
  freshPlayer,
  ACHIEVEMENTS,
} from '../src/services/progression.ts';

describe('Sudoku Engine Tests', () => {
  it('generates a valid 9x9 board with clues for easy difficulty', () => {
    const board = initializeBoard('easy');
    assert.strictEqual(board.length, 9);
    assert.strictEqual(board[0].length, 9);

    let clues = 0;
    board.forEach(row => {
      row.forEach(cell => {
        if (cell.value !== null) clues++;
        assert.ok(cell.solution >= 1 && cell.solution <= 9);
      });
    });
    assert.strictEqual(clues, 40); // 40 clues for easy
  });

  it('verifies that the generated puzzle has exactly 1 unique solution', () => {
    const board = initializeBoard('medium');
    const rawGrid = board.map(row => row.map(c => c.value));
    const solutions = countSolutions(rawGrid);
    assert.strictEqual(solutions, 1);
  });

  it('ensures deterministic daily challenge generation with matching dates', () => {
    const dateKey = '2026-10-18';
    const board1 = createDailyBoard(dateKey);
    const board2 = createDailyBoard(dateKey);

    // Both boards generated on the same seed must be identical
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        assert.strictEqual(board1[r][c].value, board2[r][c].value);
        assert.strictEqual(board1[r][c].solution, board2[r][c].solution);
      }
    }
  });

  it('correctly calculates candidates for empty cells', () => {
    const board = initializeBoard('hard');
    let emptyR = -1, emptyC = -1;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c].value === null) {
          emptyR = r; emptyC = c; break;
        }
      }
      if (emptyR !== -1) break;
    }

    const candidates = candidatesFor(board, emptyR, emptyC);
    assert.ok(Array.isArray(candidates));
    assert.ok(candidates.length > 0 && candidates.length <= 9);
    // Correct solution must be one of the candidates
    assert.ok(candidates.includes(board[emptyR][emptyC].solution));
  });
});

describe('Progression & Achievements Tests', () => {
  it('calculates XP correctly based on difficulty and bonuses', () => {
    // Easy won without mistakes and without hints
    const xpEasyClean = calcXp({
      difficulty: 'easy',
      won: true,
      time: 200,
      mistakes: 0,
      hintsUsed: 0,
      dailyDate: null,
    });
    // Base 10 + 50% (5) + 25% (3) = 18 XP
    assert.strictEqual(xpEasyClean, 18);

    // Loss consolation XP
    const xpLoss = calcXp({
      difficulty: 'hard',
      won: false,
      time: 150,
      mistakes: 3,
      hintsUsed: 1,
      dailyDate: null,
    });
    assert.strictEqual(xpLoss, 2);
  });

  it('computes levels accurately from accumulated XP', () => {
    assert.strictEqual(levelFromXp(0), 1);
    assert.strictEqual(levelFromXp(99), 1);
    assert.strictEqual(levelFromXp(100), 2);
    assert.strictEqual(levelFromXp(300), 3);
  });

  it('unlocks flawless achievement when game won with 0 mistakes', () => {
    const player = freshPlayer();
    const { player: updatedPlayer, reward } = applyGameResult(player, {
      id: 'test-game-1',
      difficulty: 'medium',
      won: true,
      time: 300,
      mistakes: 0,
      hintsUsed: 0,
      dailyDate: null,
    });

    assert.ok(reward.newAchievements.includes('first_win'));
    assert.ok(reward.newAchievements.includes('flawless'));
    assert.ok(reward.newAchievements.includes('no_hints'));
    assert.ok(updatedPlayer.achievements['flawless'] > 0);
  });
});
