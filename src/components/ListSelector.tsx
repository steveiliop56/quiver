import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  createOctokit,
  fetchStarSample,
  extractLanguages,
  extractTopics,
  RateLimitError,
} from "../utils/github";
import type { StarredRepo } from "../types";
import { playClickSound } from "../utils/sound";
import RateLimitPrompt from "./RateLimitPrompt";

export interface DeckFilter {
  type: "all" | "language" | "topic";
  value: string;
}

interface ListSelectorProps {
  username: string;
  pat?: string;
  onSelect: (filter: DeckFilter, preloaded: StarredRepo[]) => void;
  onChangeUsername: () => void;
  onPatProvided: (pat: string) => void;
}

export default function ListSelector({ username, pat, onSelect, onChangeUsername, onPatProvided }: ListSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [languages, setLanguages] = useState<Map<string, number>>(new Map());
  const [topics, setTopics] = useState<Map<string, number>>(new Map());
  const [tab, setTab] = useState<"language" | "topic">("language");
  const [preloaded, setPreloaded] = useState<StarredRepo[]>([]);

  useEffect(() => {
    const load = async () => {
      setError(null);
      setRateLimited(false);
      setLoading(true);
      try {
        const octokit = createOctokit(pat);
        const repos = await fetchStarSample(octokit, username, 3);
        setPreloaded(repos);
        setLanguages(extractLanguages(repos));
        setTopics(extractTopics(repos));
      } catch (err) {
        if (err instanceof RateLimitError) {
          setRateLimited(true);
        } else {
          const msg = err instanceof Error ? err.message : "Unknown error";
          setError(`Failed to fetch stars: ${msg}`);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username, pat]);

  const handleSelect = (filter: DeckFilter) => {
    playClickSound();
    onSelect(filter, preloaded);
  };

  const currentMap = tab === "language" ? languages : topics;
  const entries = [...currentMap.entries()].slice(0, 20);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-5 text-center"
      >
        <h2 className="text-lg md:text-xl text-retro-gold">
          CHOOSE YOUR DECK
        </h2>
        <p className="text-[9px] opacity-60 leading-relaxed">
          Browsing stars for <span className="text-retro-gold">{username}</span>.
          <br />
          Filter by language or topic, or browse them all.
        </p>

        {loading && (
          <motion.p
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-xs"
          >
            SCANNING YOUR STARS...
          </motion.p>
        )}

        {rateLimited && (
          <RateLimitPrompt onPatProvided={onPatProvided} />
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-retro-accent/50 bg-retro-accent/10 p-3 space-y-2"
          >
            <p className="text-[10px] text-retro-accent">{error}</p>
          </motion.div>
        )}

        {!loading && !rateLimited && (
          <>
            {/* All stars */}
            <motion.button
              onClick={() => handleSelect({ type: "all", value: "" })}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left bg-retro-blue border-2 border-retro-gold p-4 font-[inherit] cursor-pointer hover:border-retro-green transition-colors"
            >
              <span className="text-xs text-retro-gold">
                &#9733; ALL STARS
              </span>
              <p className="text-[8px] mt-1 opacity-50 text-retro-green">
                {preloaded.length}+ starred repositories
              </p>
            </motion.button>

            {/* Tab switcher */}
            <div className="flex border border-retro-green/20">
              <button
                onClick={() => { playClickSound(); setTab("language"); }}
                className={`flex-1 py-2 text-[9px] font-[inherit] cursor-pointer border-none transition-colors ${
                  tab === "language"
                    ? "bg-retro-green/20 text-retro-green"
                    : "bg-transparent text-retro-green/40 hover:text-retro-green/70"
                }`}
              >
                BY LANGUAGE
              </button>
              <button
                onClick={() => { playClickSound(); setTab("topic"); }}
                className={`flex-1 py-2 text-[9px] font-[inherit] cursor-pointer border-none border-l border-l-retro-green/20 transition-colors ${
                  tab === "topic"
                    ? "bg-retro-green/20 text-retro-green"
                    : "bg-transparent text-retro-green/40 hover:text-retro-green/70"
                }`}
              >
                BY TOPIC
              </button>
            </div>

            {/* Filter options */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {entries.map(([name, count], i) => (
                <motion.button
                  key={name}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleSelect({ type: tab, value: name })}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left bg-retro-card border border-retro-green/20 px-4 py-2.5 font-[inherit] cursor-pointer hover:border-retro-green/60 transition-colors flex items-center justify-between"
                >
                  <span className="text-[10px] text-retro-green">
                    &#9830; {name.toUpperCase()}
                  </span>
                  <span className="text-[8px] text-retro-gold">
                    {count}
                  </span>
                </motion.button>
              ))}
              {entries.length === 0 && (
                <p className="text-[8px] opacity-40 py-2">
                  No {tab === "language" ? "languages" : "topics"} found.
                </p>
              )}
            </div>
          </>
        )}

        {/* Change username */}
        <motion.button
          onClick={() => { playClickSound(); onChangeUsername(); }}
          whileHover={{ scale: 1.02 }}
          className="text-[9px] bg-transparent border-none text-retro-green/50 font-[inherit] cursor-pointer hover:text-retro-green transition-colors"
        >
          &#8592; CHANGE USERNAME
        </motion.button>
      </motion.div>
    </div>
  );
}
