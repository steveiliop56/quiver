import { useState, useCallback } from "react";
import type { GameScreen, StarredRepo } from "./types";
import { storePat, getPat, clearPat, clearPinned } from "./utils/storage";
import { createOctokit, validatePat } from "./utils/github";
import PatScreen from "./components/PatScreen";
import ListSelector, { type DeckFilter } from "./components/ListSelector";
import GameBoard from "./components/GameBoard";
import ExportScreen from "./components/ExportScreen";

export default function App() {
  const [screen, setScreen] = useState<GameScreen>(() => {
    return getPat() ? "lists" : "pat";
  });
  const [pat, setPat] = useState<string>(() => getPat() || "");
  const [patError, setPatError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [pinnedForExport, setPinnedForExport] = useState<StarredRepo[]>([]);
  const [deckFilter, setDeckFilter] = useState<DeckFilter>({ type: "all", value: "" });
  const [preloadedRepos, setPreloadedRepos] = useState<StarredRepo[]>([]);
  // Key to force GameBoard remount on restart/filter change
  const [gameKey, setGameKey] = useState(0);

  const handlePatSubmit = useCallback(async (token: string) => {
    setValidating(true);
    setPatError(null);
    try {
      const octokit = createOctokit(token);
      const valid = await validatePat(octokit);
      if (!valid) {
        setPatError("Invalid token. Check your PAT and try again.");
        return;
      }
      storePat(token);
      setPat(token);
      setScreen("lists");
    } catch {
      setPatError("Connection failed. Check your network and try again.");
    } finally {
      setValidating(false);
    }
  }, []);

  const handleListSelect = useCallback((filter: DeckFilter, preloaded: StarredRepo[]) => {
    setDeckFilter(filter);
    setPreloadedRepos(preloaded);
    setGameKey((k) => k + 1);
    setScreen("game");
  }, []);

  const handleExport = useCallback((pinned: StarredRepo[]) => {
    setPinnedForExport(pinned);
    setScreen("export");
  }, []);

  const handleBackToGame = useCallback(() => {
    if (!getPat()) {
      setScreen("pat");
    } else {
      setScreen("game");
    }
  }, []);

  const handleRestart = useCallback(() => {
    clearPat();
    clearPinned();
    setPat("");
    setDeckFilter({ type: "all", value: "" });
    setPreloadedRepos([]);
    setPinnedForExport([]);
    setPatError(null);
    setScreen("pat");
  }, []);

  const handleChangePat = useCallback(() => {
    clearPat();
    setPat("");
    setPatError(null);
    setScreen("pat");
  }, []);

  return (
    <div className="h-full w-full crt">
      <div className="crt-refresh" />
      {screen === "pat" && (
        <PatScreen
          onSubmit={handlePatSubmit}
          error={patError}
          loading={validating}
        />
      )}
      {screen === "lists" && (
        <ListSelector
          pat={pat}
          onSelect={handleListSelect}
          onChangePat={handleChangePat}
        />
      )}
      {screen === "game" && (
        <GameBoard
          key={gameKey}
          pat={pat}
          filter={deckFilter}
          preloadedRepos={preloadedRepos}
          onExport={handleExport}
          onRestart={handleRestart}
          onChangePat={handleChangePat}
        />
      )}
      {screen === "export" && (
        <ExportScreen
          projects={pinnedForExport}
          onBack={handleBackToGame}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
