import { db } from "./db";
import { getOrCreateUser } from "./user";

export type CellType = "letter" | "blocked";

export interface GridCell {
  type: CellType;
  letter?: string;
  number?: number;
}

export interface Clue {
  number: number;
  direction: "across" | "down";
  text: string;
  answer: string;
  row: number;
  col: number;
}

export interface CrosswordData {
  id: string;
  title: string | null;
  rows: number;
  cols: number;
  grid: GridCell[][];
  clues: Clue[];
  hint: string | null;
  funFactTitle: string | null;
  funFactText: string | null;
  activeDate: Date | null;
  userProgress?: {
    userGrid: string[][];
    hintsUsed: number;
    completed: boolean;
    completedAt: Date | null;
  } | null;
}

export interface HintResult {
  success: boolean;
  revealedCell?: { row: number; col: number; letter: string };
  hintsRemaining: number;
  error?: string;
}

export interface SubmitResult {
  success: boolean;
  completed: boolean;
  correctCells: number;
  totalCells: number;
  funFactTitle: string | null;
  funFactText: string | null;
}

const MAX_HINTS = 3;

export async function getTodaysCrossword(): Promise<CrosswordData | null> {
  const user = await getOrCreateUser();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let crossword = await db.crossword.findFirst({
    where: {
      activeDate: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    include: user
      ? {
          userProgress: {
            where: { userId: user.id },
          },
        }
      : undefined,
  });

  if (!crossword) {
    crossword = await db.crossword.findFirst({
      orderBy: { createdAt: "desc" },
      include: user
        ? {
            userProgress: {
              where: { userId: user.id },
            },
          }
        : undefined,
    });
  }

  if (!crossword) return null;

  const crosswordWithProgress = crossword as typeof crossword & {
    userProgress?: Array<{ userGrid: unknown; hintsUsed: number; completed: boolean; completedAt: Date | null }>;
  };

  const progress =
    user && crosswordWithProgress.userProgress && crosswordWithProgress.userProgress.length > 0
      ? crosswordWithProgress.userProgress[0]
      : null;

  return {
    id: crossword.id,
    title: crossword.title,
    rows: crossword.rows,
    cols: crossword.cols,
    grid: crossword.grid as unknown as GridCell[][],
    clues: crossword.clues as unknown as Clue[],
    hint: crossword.hint,
    funFactTitle: crossword.funFactTitle,
    funFactText: crossword.funFactText,
    activeDate: crossword.activeDate,
    userProgress: progress
      ? {
          userGrid: progress.userGrid as string[][],
          hintsUsed: progress.hintsUsed,
          completed: progress.completed,
          completedAt: progress.completedAt,
        }
      : null,
  };
}

export async function saveCrosswordProgress(
  crosswordId: string,
  userGrid: string[][]
): Promise<void> {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  await db.crosswordProgress.upsert({
    where: {
      crosswordId_userId: {
        crosswordId,
        userId: user.id,
      },
    },
    update: {
      userGrid,
    },
    create: {
      crosswordId,
      userId: user.id,
      userGrid,
      hintsUsed: 0,
      completed: false,
    },
  });
}

export async function useCrosswordHint(
  crosswordId: string,
  userGrid: string[][]
): Promise<HintResult> {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  const crossword = await db.crossword.findUnique({
    where: { id: crosswordId },
  });

  if (!crossword) {
    return { success: false, hintsRemaining: 0, error: "Crossword not found" };
  }

  const existingProgress = await db.crosswordProgress.findUnique({
    where: {
      crosswordId_userId: {
        crosswordId,
        userId: user.id,
      },
    },
  });

  const currentHintsUsed = existingProgress?.hintsUsed || 0;

  if (currentHintsUsed >= MAX_HINTS) {
    return {
      success: false,
      hintsRemaining: 0,
      error: "No hints remaining",
    };
  }

  const grid = crossword.grid as unknown as GridCell[][];
  const emptyCells: { row: number; col: number; letter: string }[] = [];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      if (cell.type === "letter" && cell.letter) {
        const userValue = userGrid[row]?.[col] || "";
        if (userValue.toUpperCase() !== cell.letter.toUpperCase()) {
          emptyCells.push({ row, col, letter: cell.letter });
        }
      }
    }
  }

  if (emptyCells.length === 0) {
    return {
      success: false,
      hintsRemaining: MAX_HINTS - currentHintsUsed,
      error: "Puzzle is already complete",
    };
  }

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newHintsUsed = currentHintsUsed + 1;

  const newUserGrid = userGrid.map((row) => [...row]);
  newUserGrid[randomCell.row][randomCell.col] = randomCell.letter;

  await db.crosswordProgress.upsert({
    where: {
      crosswordId_userId: {
        crosswordId,
        userId: user.id,
      },
    },
    update: {
      userGrid: newUserGrid,
      hintsUsed: newHintsUsed,
    },
    create: {
      crosswordId,
      userId: user.id,
      userGrid: newUserGrid,
      hintsUsed: newHintsUsed,
      completed: false,
    },
  });

  return {
    success: true,
    revealedCell: randomCell,
    hintsRemaining: MAX_HINTS - newHintsUsed,
  };
}

export async function submitCrossword(
  crosswordId: string,
  userGrid: string[][]
): Promise<SubmitResult> {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  const crossword = await db.crossword.findUnique({
    where: { id: crosswordId },
  });

  if (!crossword) {
    return {
      success: false,
      completed: false,
      correctCells: 0,
      totalCells: 0,
      funFactTitle: null,
      funFactText: null,
    };
  }

  const grid = crossword.grid as unknown as GridCell[][];
  let correctCells = 0;
  let totalCells = 0;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      if (cell.type === "letter" && cell.letter) {
        totalCells++;
        const userValue = userGrid[row]?.[col] || "";
        if (userValue.toUpperCase() === cell.letter.toUpperCase()) {
          correctCells++;
        }
      }
    }
  }

  const completed = correctCells === totalCells;

  await db.crosswordProgress.upsert({
    where: {
      crosswordId_userId: {
        crosswordId,
        userId: user.id,
      },
    },
    update: {
      userGrid,
      completed,
      completedAt: completed ? new Date() : null,
    },
    create: {
      crosswordId,
      userId: user.id,
      userGrid,
      hintsUsed: 0,
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  return {
    success: true,
    completed,
    correctCells,
    totalCells,
    funFactTitle: completed ? crossword.funFactTitle : null,
    funFactText: completed ? crossword.funFactText : null,
  };
}

export async function resetCrossword(crosswordId: string): Promise<void> {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  await db.crosswordProgress.deleteMany({
    where: {
      crosswordId,
      userId: user.id,
    },
  });
}

export function createEmptyUserGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
}
