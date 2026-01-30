"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { X, RotateCcw, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/lib/posthog";
import type {
  CrosswordData,
  GridCell,
  Clue,
  HintResult,
  SubmitResult,
} from "@/lib/crossword";

interface CrosswordChallengeModalProps {
  crossword: CrosswordData;
  onClose: () => void;
  onUseHint: (crosswordId: string, userGrid: string[][]) => Promise<HintResult>;
  onSubmit: (crosswordId: string, userGrid: string[][]) => Promise<SubmitResult>;
  onReset: (crosswordId: string) => Promise<void>;
  onSaveProgress: (crosswordId: string, userGrid: string[][]) => Promise<void>;
}

interface CellPosition {
  row: number;
  col: number;
}

type Direction = "across" | "down";

export function CrosswordChallengeModal({
  crossword,
  onClose,
  onUseHint,
  onSubmit,
  onReset,
  onSaveProgress,
}: CrosswordChallengeModalProps) {
  const { track } = useAnalytics();
  const [isPending, startTransition] = useTransition();

  const initializeUserGrid = useCallback(() => {
    if (crossword.userProgress?.userGrid) {
      return crossword.userProgress.userGrid.map((row) => [...row]);
    }
    return Array.from({ length: crossword.rows }, () =>
      Array.from({ length: crossword.cols }, () => "")
    );
  }, [crossword.userProgress?.userGrid, crossword.rows, crossword.cols]);

  const [userGrid, setUserGrid] = useState<string[][]>(initializeUserGrid);
  const [hintsRemaining, setHintsRemaining] = useState(
    3 - (crossword.userProgress?.hintsUsed || 0)
  );
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const [completed, setCompleted] = useState(
    crossword.userProgress?.completed || false
  );
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [startTime] = useState(Date.now());

  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: crossword.rows }, () =>
      Array.from({ length: crossword.cols }, () => null)
    )
  );

  const formattedDate = new Date(
    crossword.activeDate || new Date()
  ).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const isLetterCell = (row: number, col: number): boolean => {
    return crossword.grid[row]?.[col]?.type === "letter";
  };

  const getCellNumber = (row: number, col: number): number | undefined => {
    return crossword.grid[row]?.[col]?.number;
  };

  const findNextCell = (
    row: number,
    col: number,
    dir: Direction
  ): CellPosition | null => {
    if (dir === "across") {
      for (let c = col + 1; c < crossword.cols; c++) {
        if (isLetterCell(row, c)) return { row, col: c };
      }
    } else {
      for (let r = row + 1; r < crossword.rows; r++) {
        if (isLetterCell(r, col)) return { row: r, col };
      }
    }
    return null;
  };

  const findPrevCell = (
    row: number,
    col: number,
    dir: Direction
  ): CellPosition | null => {
    if (dir === "across") {
      for (let c = col - 1; c >= 0; c--) {
        if (isLetterCell(row, c)) return { row, col: c };
      }
    } else {
      for (let r = row - 1; r >= 0; r--) {
        if (isLetterCell(r, col)) return { row: r, col };
      }
    }
    return null;
  };

  const handleCellClick = (row: number, col: number) => {
    if (!isLetterCell(row, col) || completed) return;

    if (selectedCell?.row === row && selectedCell?.col === col) {
      setDirection((prev) => (prev === "across" ? "down" : "across"));
    } else {
      setSelectedCell({ row, col });
    }

    inputRefs.current[row]?.[col]?.focus();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    row: number,
    col: number
  ) => {
    if (completed) return;

    const key = e.key;

    if (key === "Backspace") {
      e.preventDefault();
      if (userGrid[row][col] === "") {
        const prev = findPrevCell(row, col, direction);
        if (prev) {
          setUserGrid((grid) => {
            const newGrid = grid.map((r) => [...r]);
            newGrid[prev.row][prev.col] = "";
            return newGrid;
          });
          setSelectedCell(prev);
          inputRefs.current[prev.row]?.[prev.col]?.focus();
        }
      } else {
        setUserGrid((grid) => {
          const newGrid = grid.map((r) => [...r]);
          newGrid[row][col] = "";
          return newGrid;
        });
      }
      return;
    }

    if (key === "ArrowRight" || key === "ArrowLeft" || key === "ArrowUp" || key === "ArrowDown") {
      e.preventDefault();
      let next: CellPosition | null = null;
      
      if (key === "ArrowRight") {
        next = findNextCell(row, col, "across");
      } else if (key === "ArrowLeft") {
        next = findPrevCell(row, col, "across");
      } else if (key === "ArrowDown") {
        next = findNextCell(row, col, "down");
      } else if (key === "ArrowUp") {
        next = findPrevCell(row, col, "down");
      }

      if (next) {
        setSelectedCell(next);
        inputRefs.current[next.row]?.[next.col]?.focus();
      }
      return;
    }

    if (/^[a-zA-Z]$/.test(key)) {
      e.preventDefault();
      setUserGrid((grid) => {
        const newGrid = grid.map((r) => [...r]);
        newGrid[row][col] = key.toUpperCase();
        return newGrid;
      });

      const next = findNextCell(row, col, direction);
      if (next) {
        setSelectedCell(next);
        inputRefs.current[next.row]?.[next.col]?.focus();
      }
    }
  };

  const handleUseHint = () => {
    if (hintsRemaining <= 0 || completed) return;

    startTransition(async () => {
      const result = await onUseHint(crossword.id, userGrid);
      if (result.success && result.revealedCell) {
        setUserGrid((grid) => {
          const newGrid = grid.map((r) => [...r]);
          newGrid[result.revealedCell!.row][result.revealedCell!.col] =
            result.revealedCell!.letter;
          return newGrid;
        });
        setHintsRemaining(result.hintsRemaining);
        track("crossword_hint_used", {
          crosswordId: crossword.id,
          hintsRemaining: result.hintsRemaining,
        });
      }
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      await onReset(crossword.id);
      setUserGrid(
        Array.from({ length: crossword.rows }, () =>
          Array.from({ length: crossword.cols }, () => "")
        )
      );
      setHintsRemaining(3);
      setCompleted(false);
      setResult(null);
      setSelectedCell(null);
      track("crossword_reset", { crosswordId: crossword.id });
    });
  };

  const checkCompletion = useCallback(() => {
    if (completed) return;

    let allFilled = true;
    for (let row = 0; row < crossword.rows; row++) {
      for (let col = 0; col < crossword.cols; col++) {
        if (isLetterCell(row, col) && !userGrid[row][col]) {
          allFilled = false;
          break;
        }
      }
      if (!allFilled) break;
    }

    if (allFilled) {
      startTransition(async () => {
        const submitResult = await onSubmit(crossword.id, userGrid);
        setResult(submitResult);
        if (submitResult.completed) {
          setCompleted(true);
          const timeSpent = Math.floor((Date.now() - startTime) / 1000);
          track("crossword_completed", {
            crosswordId: crossword.id,
            hintsUsed: 3 - hintsRemaining,
            timeSpentSeconds: timeSpent,
          });
        }
      });
    }
  }, [completed, crossword, userGrid, onSubmit, startTime, hintsRemaining, track]);

  useEffect(() => {
    checkCompletion();
  }, [userGrid, checkCompletion]);

  useEffect(() => {
    if (completed) return;

    const saveTimer = setTimeout(() => {
      onSaveProgress(crossword.id, userGrid);
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [userGrid, crossword.id, onSaveProgress, completed]);

  const getHighlightedCells = (): Set<string> => {
    if (!selectedCell) return new Set();

    const highlighted = new Set<string>();
    const { row, col } = selectedCell;

    if (direction === "across") {
      for (let c = 0; c < crossword.cols; c++) {
        if (isLetterCell(row, c)) {
          highlighted.add(`${row}-${c}`);
        } else {
          if (c < col) {
            highlighted.clear();
          } else {
            break;
          }
        }
      }
    } else {
      for (let r = 0; r < crossword.rows; r++) {
        if (isLetterCell(r, col)) {
          highlighted.add(`${r}-${col}`);
        } else {
          if (r < row) {
            highlighted.clear();
          } else {
            break;
          }
        }
      }
    }

    return highlighted;
  };

  const highlightedCells = getHighlightedCells();

  const acrossClues = crossword.clues.filter((c) => c.direction === "across");
  const downClues = crossword.clues.filter((c) => c.direction === "down");

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-x-4 top-1/2 z-50 max-h-[90vh] -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl md:left-1/2 md:right-auto md:w-full md:max-w-lg md:-translate-x-1/2">
        <div className="bg-linear-to-r from-[#315A3F] to-[#4A7C59] px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Image
                  src="/images/logo-scholarly.svg"
                  alt="Scholarly"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Today&apos;s Challenge
                </h2>
                <p className="text-sm text-white/80">{formattedDate}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-4 md:p-6">
          {!completed && (
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={handleUseHint}
                disabled={hintsRemaining <= 0 || isPending}
                className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#E5A000] px-4 text-sm font-medium text-white transition-colors hover:bg-[#cc8f00] disabled:cursor-not-allowed disabled:opacity-50 md:h-11 md:px-6 md:text-base"
              >
                Use Hint ({hintsRemaining} left)
              </button>
              <button
                onClick={handleReset}
                disabled={isPending}
                className="flex h-10 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 md:h-11 md:px-6 md:text-base"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          )}

          {completed && result?.completed && (
            <div className="mb-4 rounded-xl bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-green-700">
                  Congratulations! Puzzle completed!
                </span>
              </div>
              {result.funFactTitle && result.funFactText && (
                <div className="mt-3 border-t border-green-200 pt-3">
                  <p className="text-sm font-semibold text-gray-700">
                    {result.funFactTitle}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{result.funFactText}</p>
                </div>
              )}
            </div>
          )}

          <div className="mb-4 flex justify-center">
            <div
              className="grid gap-0 border border-gray-800"
              style={{
                gridTemplateColumns: `repeat(${crossword.cols}, minmax(0, 1fr))`,
              }}
            >
              {crossword.grid.map((row, rowIndex) =>
                row.map((cell: GridCell, colIndex: number) => {
                  const isBlocked = cell.type === "blocked";
                  const cellNumber = getCellNumber(rowIndex, colIndex);
                  const isSelected =
                    selectedCell?.row === rowIndex &&
                    selectedCell?.col === colIndex;
                  const isHighlighted = highlightedCells.has(
                    `${rowIndex}-${colIndex}`
                  );

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={cn(
                        "relative flex items-center justify-center border border-gray-400",
                        "h-10 w-10 md:h-12 md:w-12",
                        isBlocked && "bg-gray-900",
                        !isBlocked && isSelected && "bg-yellow-200",
                        !isBlocked && !isSelected && isHighlighted && "bg-blue-100",
                        !isBlocked && !isSelected && !isHighlighted && "bg-white"
                      )}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {cellNumber && !isBlocked && (
                        <span className="absolute left-0.5 top-0 text-[8px] font-medium text-gray-500 md:text-[10px]">
                          {cellNumber}
                        </span>
                      )}
                      {!isBlocked && (
                        <input
                          ref={(el) => {
                            if (inputRefs.current[rowIndex]) {
                              inputRefs.current[rowIndex][colIndex] = el;
                            }
                          }}
                          type="text"
                          maxLength={1}
                          value={userGrid[rowIndex]?.[colIndex] || ""}
                          onChange={() => {}}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          onFocus={() => {
                            setSelectedCell({ row: rowIndex, col: colIndex });
                          }}
                          disabled={completed}
                          className={cn(
                            "h-full w-full bg-transparent text-center text-lg font-bold uppercase outline-none md:text-xl",
                            completed && "cursor-default"
                          )}
                          aria-label={`Cell ${rowIndex + 1}, ${colIndex + 1}`}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-bold text-gray-900">Across</h3>
              <div className="space-y-1 text-xs text-gray-600 md:text-sm">
                {acrossClues.map((clue: Clue) => (
                  <p key={`across-${clue.number}`}>
                    <span className="font-medium">{clue.number}.</span> {clue.text}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-gray-900">Down</h3>
              <div className="space-y-1 text-xs text-gray-600 md:text-sm">
                {downClues.map((clue: Clue) => (
                  <p key={`down-${clue.number}`}>
                    <span className="font-medium">{clue.number}.</span> {clue.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t bg-gray-900 px-4 py-3 text-center md:px-6">
          <p className="flex items-center justify-center gap-2 text-xs text-white md:text-sm">
            <span>💡</span>
            <span>
              Click a cell and type to fill it in. Click again to change direction.
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
