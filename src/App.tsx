import { useState, useCallback } from "react";
import type { GameScreen, StarredRepo } from "./types";
import { storeUsername, getUsername, clearUsername, clearPinned } from "./utils/storage";
import { createOctokit, validateUsername } from "./utils/github";
import PatScreen from "./components/PatScreen";
import ListSelector, { type DeckFilter } from "./components/ListSelector";
import GameBoard from "./components/GameBoard";
import ExportScreen from "./components/ExportScreen";

export default function App() {
  const [screen, setScreen] = useState<GameScreen>(() => {
    return getUsername() ? "lists" : "username";
  });
  const [username, setUsername] = useState<string>(() => getUsername() || "");
  const [pat, setPat] = useState<string | undefined>(undefined);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [pinnedForExport, setPinnedForExport] = useState<StarredRepo[]>([]);
  const [totalStarsForExport, setTotalStarsForExport] = useState(0);
  const [deckFilter, setDeckFilter] = useState<DeckFilter>({ type: "all", value: "" });
  const [preloadedRepos, setPreloadedRepos] = useState<StarredRepo[]>([]);
  const [gameKey, setGameKey] = useState(0);

  const handleUsernameSubmit = useCallback(async (name: string) => {
    setValidating(true);
    setUsernameError(null);
    try {
      const octokit = createOctokit(pat);
      const valid = await validateUsername(octokit, name);
      if (!valid) {
        setUsernameError("User not found. Check the username and try again.");
        return;
      }
      storeUsername(name);
      setUsername(name);
      setScreen("lists");
    } catch {
      setUsernameError("Connection failed. Check your network and try again.");
    } finally {
      setValidating(false);
    }
  }, [pat]);

  const handlePatProvided = useCallback((token: string) => {
    setPat(token);
  }, []);

  const handleListSelect = useCallback((filter: DeckFilter, preloaded: StarredRepo[]) => {
    setDeckFilter(filter);
    setPreloadedRepos(preloaded);
    setGameKey((k) => k + 1);
    setScreen("game");
  }, []);

  const handleExport = useCallback((pinned: StarredRepo[], totalStars: number) => {
    setPinnedForExport(pinned);
    setTotalStarsForExport(totalStars);
    setScreen("export");
  }, []);

  const handleBackToGame = useCallback(() => {
    setScreen("game");
  }, []);

  const handleRestart = useCallback(() => {
    clearUsername();
    clearPinned();
    setUsername("");
    setPat(undefined);
    setDeckFilter({ type: "all", value: "" });
    setPreloadedRepos([]);
    setPinnedForExport([]);
    setUsernameError(null);
    setScreen("username");
  }, []);

  const handleChangeUsername = useCallback(() => {
    clearUsername();
    setUsername("");
    setUsernameError(null);
    setScreen("username");
  }, []);

  return (
    <div className="h-full w-full crt">
      <div className="crt-refresh" />
      {screen === "username" && (
        <PatScreen
          onSubmit={handleUsernameSubmit}
          error={usernameError}
          loading={validating}
          defaultUsername={username}
        />
      )}
      {screen === "lists" && (
        <ListSelector
          username={username}
          pat={pat}
          onSelect={handleListSelect}
          onChangeUsername={handleChangeUsername}
          onPatProvided={handlePatProvided}
        />
      )}
      {screen === "game" && (
        <GameBoard
          key={gameKey}
          username={username}
          pat={pat}
          filter={deckFilter}
          preloadedRepos={preloadedRepos}
          onExport={handleExport}
          onRestart={handleRestart}
          onChangeUsername={handleChangeUsername}
          onPatProvided={handlePatProvided}
        />
      )}
      {screen === "export" && (
        <ExportScreen
          projects={pinnedForExport}
          totalStars={totalStarsForExport}
          onBack={handleBackToGame}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
