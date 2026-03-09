import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StarredRepo, PinnedProject } from "../types";
import {
  fetchStarredRepos,
  createOctokit,
  shuffleRepos,
  RateLimitError,
} from "../utils/github";
import type { DeckFilter } from "./ListSelector";
import { storePinned, getPinned } from "../utils/storage";
import {
  playPinSound,
  playDismissSound,
  playCardSound,
  playClickSound,
  playMilestoneSound,
  startBgm,
  stopBgm,
  setBgmVolume,
  isBgmPlaying,
} from "../utils/sound";
import ProjectCard from "./ProjectCard";
import RateLimitPrompt from "./RateLimitPrompt";

const MILESTONES = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

interface GameBoardProps {
  username: string;
  pat?: string;
  filter: DeckFilter;
  preloadedRepos: StarredRepo[];
  onExport: (pinned: StarredRepo[], totalStars: number) => void;
  onRestart: () => void;
  onChangeUsername: () => void;
  onPatProvided: (pat: string) => void;
}

const dismissVariants = {
  exit: {
    y: 800,
    rotate: 20,
    opacity: 0,
    transition: { duration: 0.5, ease: "easeIn" as const },
  },
};

const pinVariants = {
  exit: {
    scale: 0.3,
    opacity: 0,
    y: -200,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

function applyFilter(repos: StarredRepo[], filter: DeckFilter): StarredRepo[] {
  if (filter.type === "all") return repos;
  if (filter.type === "language") {
    return repos.filter((r) => (r.language || "Unknown") === filter.value);
  }
  return repos.filter((r) => r.topics.includes(filter.value));
}

function formatStarCount(n: number): string {
  if (n >= 100000) return `${(n / 1000).toFixed(0)}K`;
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export default function GameBoard({ username, pat, filter, preloadedRepos, onExport, onRestart, onChangeUsername, onPatProvided }: GameBoardProps) {
  const [repos, setRepos] = useState<StarredRepo[]>(() => {
    return shuffleRepos(applyFilter(preloadedRepos, filter));
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(() => {
    return new Set(getPinned().map((p) => p.id));
  });
  const [pinnedRepos, setPinnedRepos] = useState<StarredRepo[]>([]);
  const [totalStars, setTotalStars] = useState(0);
  const [starPop, setStarPop] = useState(false);
  const [milestone, setMilestone] = useState<number | null>(null);
  const passedMilestones = useRef(new Set<number>());
  const [page, setPage] = useState(4);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [animatingAction, setAnimatingAction] = useState<"pin" | "dismiss" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [paused, setPaused] = useState(false);
  const prevIndex = useRef(0);
  const seenIds = useRef(new Set(preloadedRepos.map((r) => r.id)));

  const checkMilestone = useCallback((prevTotal: number, newTotal: number) => {
    // Find the highest milestone crossed by this pin
    let highest: number | null = null;
    for (const m of MILESTONES) {
      if (newTotal >= m && prevTotal < m) {
        highest = m;
      }
    }
    if (highest) {
      // Mark all milestones up to the highest as passed
      for (const m of MILESTONES) {
        if (m <= highest) passedMilestones.current.add(m);
      }
      setMilestone(highest);
      playMilestoneSound();
      setTimeout(() => setMilestone(null), 2000);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    setLoading(true);
    setError(null);
    setRateLimited(false);
    try {
      const octokit = createOctokit(pat);
      const result = await fetchStarredRepos(octokit, username, page, 100);
      const newRepos = result.repos.filter((r) => !seenIds.current.has(r.id));
      for (const r of newRepos) seenIds.current.add(r.id);
      const filtered = applyFilter(newRepos, filter);
      const shuffled = shuffleRepos(filtered);
      setRepos((prev) => [...prev, ...shuffled]);
      setHasMore(result.hasMore);
      setPage((p) => p + 1);
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRateLimited(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch repos");
      }
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, filter, username, pat]);

  useEffect(() => {
    if (repos.length - currentIndex <= 5 && hasMore && !loading && !rateLimited) {
      loadMore();
    }
  }, [currentIndex, repos.length, hasMore, loading, rateLimited]);

  useEffect(() => {
    if (currentIndex !== prevIndex.current && repos[currentIndex]) {
      playCardSound();
      prevIndex.current = currentIndex;
    }
  }, [currentIndex, repos]);

  const currentRepo = repos[currentIndex];
  const remaining = repos.length - currentIndex;
  const isDone = !loading && !rateLimited && remaining <= 0;

  const savePinned = (newPinnedRepos: StarredRepo[], newPinnedIds: Set<number>) => {
    const compact: PinnedProject[] = Array.from(newPinnedIds).map((id) => {
      const repo = newPinnedRepos.find((r) => r.id === id);
      return { id, fullName: repo?.fullName || "" };
    });
    storePinned(compact);
  };

  const handlePin = () => {
    if (!currentRepo || animatingAction || paused) return;
    playPinSound();
    setAnimatingAction("pin");

    // Update star counter
    const prevTotal = totalStars;
    const newTotal = prevTotal + currentRepo.stars;
    setTotalStars(newTotal);
    setStarPop(true);
    setTimeout(() => setStarPop(false), 300);
    checkMilestone(prevTotal, newTotal);

    setTimeout(() => {
      const newIds = new Set(pinnedIds);
      newIds.add(currentRepo.id);
      setPinnedIds(newIds);
      const newPinned = [...pinnedRepos, currentRepo];
      setPinnedRepos(newPinned);
      savePinned(newPinned, newIds);
      setCurrentIndex((i) => i + 1);
      setAnimatingAction(null);
    }, 400);
  };

  const handleDismiss = () => {
    if (!currentRepo || animatingAction || paused) return;
    playDismissSound();
    setAnimatingAction("dismiss");
    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setAnimatingAction(null);
    }, 500);
  };

  const handleExport = () => {
    playClickSound();
    onExport(pinnedRepos, totalStars);
  };

  const toggleMusic = () => {
    if (isBgmPlaying()) {
      stopBgm();
      setMusicOn(false);
    } else {
      startBgm();
      setBgmVolume(0.4);
      setMusicOn(true);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        playClickSound();
        setPaused((p) => !p);
        return;
      }
      if (paused) return;
      if (e.key === "ArrowRight" || e.key === "d") handlePin();
      if (e.key === "ArrowLeft" || e.key === "a") handleDismiss();
      if (e.key === "m") toggleMusic();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentRepo, animatingAction, musicOn, paused]);

  useEffect(() => {
    return () => stopBgm();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-retro-green)]/20">
        <div className="text-[8px] md:text-[10px] space-x-4 flex items-center">
          <span>PINNED: <span className="text-[var(--color-retro-gold)]">{pinnedIds.size}</span></span>
          <span className="text-[var(--color-retro-green)]/30">|</span>
          {/* Mario-style star counter */}
          <span className="flex items-center gap-1">
            <span className={`text-[var(--color-retro-gold)] text-sm inline-block ${starPop ? "star-pop" : ""}`}>
              &#9733;
            </span>
            <span className="text-[var(--color-retro-gold)] tabular-nums">
              {formatStarCount(totalStars)}
            </span>
          </span>
          <span className="text-[var(--color-retro-green)]/30">|</span>
          <span>LEFT: <span className="text-[var(--color-retro-accent)]">{remaining > 0 ? remaining : 0}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => { playClickSound(); setPaused(true); }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-[10px] md:text-xs bg-transparent border border-[var(--color-retro-green)]/30 text-[var(--color-retro-green)] px-2 py-1.5 font-[inherit] cursor-pointer hover:border-[var(--color-retro-green)] transition-colors"
            title="Pause (ESC)"
          >
            II
          </motion.button>
          <motion.button
            onClick={toggleMusic}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-[10px] md:text-xs bg-transparent border border-[var(--color-retro-green)]/30 text-[var(--color-retro-green)] px-2 py-1.5 font-[inherit] cursor-pointer hover:border-[var(--color-retro-green)] transition-colors"
            title="Toggle music (M)"
          >
            {musicOn ? "\u266B ON" : "\u266B OFF"}
          </motion.button>
          <motion.button
            onClick={handleExport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[8px] md:text-[10px] bg-[var(--color-retro-gold)] text-[var(--color-retro-dark)] px-4 py-2 font-[inherit] cursor-pointer border-none hover:opacity-80 transition-opacity"
          >
            EXPORT &#9654;
          </motion.button>
        </div>
      </div>

      {/* Cork board background */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, var(--color-cork-dark) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, var(--color-cork-dark) 0%, transparent 50%),
            linear-gradient(135deg, var(--color-cork) 25%, var(--color-cork-dark) 75%)
          `,
          backgroundSize: "100% 100%",
        }}
      >
        {/* Milestone celebration overlay */}
        <AnimatePresence>
          {milestone && (
            <motion.div
              key={milestone}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.6, repeat: 2 }}
                  className="text-[var(--color-retro-gold)] text-2xl md:text-4xl"
                >
                  &#9733; {formatStarCount(milestone)} STARS! &#9733;
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs text-[var(--color-retro-green)] mt-2"
                >
                  MILESTONE REACHED!
                </motion.p>
              </div>
              {/* Radial flash */}
              <motion.div
                initial={{ opacity: 0.4, scale: 0 }}
                animate={{ opacity: 0, scale: 3 }}
                transition={{ duration: 1 }}
                className="absolute w-64 h-64 rounded-full"
                style={{ background: "radial-gradient(circle, var(--color-retro-gold) 0%, transparent 70%)" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pinned cards on the wall (miniature) */}
        <div className="absolute inset-0 pointer-events-none">
          {pinnedRepos.slice(-12).map((repo, i) => (
            <motion.div
              key={repo.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              className="absolute w-16 h-20 md:w-20 md:h-24 bg-[var(--color-retro-card)] border border-[var(--color-retro-green)]/30 flex flex-col items-center justify-center p-1"
              style={{
                left: `${10 + (i % 6) * 15}%`,
                top: `${10 + Math.floor(i / 6) * 40}%`,
                transform: `rotate(${(i % 3 - 1) * 5}deg)`,
              }}
            >
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--color-retro-accent)] border border-[var(--color-retro-dark)] z-10" />
              <img
                src={repo.owner.avatarUrl}
                alt=""
                className="w-6 h-6 md:w-8 md:h-8 mb-1"
                style={{ imageRendering: "pixelated" }}
              />
              <span className="text-[5px] md:text-[6px] text-[var(--color-retro-green)] text-center truncate w-full">
                {repo.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Current card */}
        <AnimatePresence mode="wait">
          {currentRepo && !isDone && !paused && !rateLimited && (
            <motion.div
              key={currentRepo.id}
              variants={animatingAction === "pin" ? pinVariants : dismissVariants}
              exit="exit"
            >
              <ProjectCard
                project={currentRepo}
                onPin={handlePin}
                onDismiss={handleDismiss}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rate limit prompt */}
        {rateLimited && !paused && (
          <div className="z-40 w-full max-w-md px-4">
            <RateLimitPrompt onPatProvided={onPatProvided} />
          </div>
        )}

        {/* Pause menu overlay */}
        <AnimatePresence>
          {paused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[var(--color-retro-dark)]/90 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="text-center space-y-6 p-8"
              >
                <h2 className="text-xl text-[var(--color-retro-gold)]">PAUSED</h2>
                <p className="text-[10px] text-[var(--color-retro-gold)] opacity-70">
                  &#9733; {totalStars.toLocaleString()} stars collected
                </p>
                <div className="space-y-3 flex flex-col items-center">
                  <motion.button
                    onClick={() => { playClickSound(); setPaused(false); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-48 text-xs bg-[var(--color-retro-green)] text-[var(--color-retro-dark)] px-6 py-3 font-[inherit] cursor-pointer border-none"
                  >
                    &#9654; RESUME
                  </motion.button>
                  <motion.button
                    onClick={() => { playClickSound(); onChangeUsername(); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-48 text-[10px] bg-[var(--color-retro-blue)] text-[var(--color-retro-green)] px-6 py-3 font-[inherit] cursor-pointer border border-[var(--color-retro-green)]/30"
                  >
                    &#9881; CHANGE USER
                  </motion.button>
                  <motion.button
                    onClick={handleExport}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-48 text-[10px] bg-[var(--color-retro-gold)] text-[var(--color-retro-dark)] px-6 py-3 font-[inherit] cursor-pointer border-none"
                  >
                    &#9654; EXPORT
                  </motion.button>
                  <motion.button
                    onClick={() => { playClickSound(); onRestart(); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-48 text-[10px] bg-[var(--color-retro-accent)] text-white px-6 py-3 font-[inherit] cursor-pointer border-none"
                  >
                    &#8634; RESTART GAME
                  </motion.button>
                </div>
                <p className="text-[7px] opacity-30">PRESS ESC TO RESUME</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {loading && !currentRepo && (
          <motion.p
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-xs"
          >
            SHUFFLING CARDS...
          </motion.p>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center space-y-4">
            <p className="text-[var(--color-retro-accent)] text-xs">{error}</p>
            <button
              onClick={loadMore}
              className="text-[10px] bg-[var(--color-retro-green)] text-[var(--color-retro-dark)] px-4 py-2 font-[inherit] cursor-pointer border-none"
            >
              RETRY
            </button>
          </div>
        )}

        {/* Done state */}
        {isDone && !paused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4 bg-[var(--color-retro-dark)]/80 p-8"
          >
            <p className="text-sm text-[var(--color-retro-gold)]">NO MORE CARDS!</p>
            <p className="text-[10px] opacity-70">
              You pinned {pinnedIds.size} project{pinnedIds.size !== 1 ? "s" : ""} to your wall.
            </p>
            <p className="text-[10px] text-[var(--color-retro-gold)]">
              &#9733; {totalStars.toLocaleString()} total stars
            </p>
            <motion.button
              onClick={handleExport}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-xs bg-[var(--color-retro-gold)] text-[var(--color-retro-dark)] px-6 py-3 font-[inherit] cursor-pointer border-none"
            >
              EXPORT YOUR QUIVER
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="px-4 py-2 border-t border-[var(--color-retro-green)]/20 text-center">
        <p className="text-[7px] md:text-[8px] opacity-40">
          &#8592; A/LEFT = PASS &nbsp;&nbsp;|&nbsp;&nbsp; D/RIGHT = PIN &#8594; &nbsp;&nbsp;|&nbsp;&nbsp; M = MUSIC &nbsp;&nbsp;|&nbsp;&nbsp; ESC = PAUSE
        </p>
      </div>
    </div>
  );
}
