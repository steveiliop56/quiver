import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  createOctokit,
  fetchStarSample,
  extractLanguages,
  extractTopics,
} from "../utils/github";
import type { StarredRepo } from "../types";
import { playClickSound } from "../utils/sound";

export interface DeckFilter {
  type: "all" | "language" | "topic";
  value: string;
}

interface ListSelectorProps {
  pat: string;
  onSelect: (filter: DeckFilter, preloaded: StarredRepo[]) => void;
  onChangePat: () => void;
}

export default function ListSelector({ pat, onSelect, onChangePat }: ListSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Map<string, number>>(new Map());
  const [topics, setTopics] = useState<Map<string, number>>(new Map());
  const [tab, setTab] = useState<"language" | "topic">("language");
  const [preloaded, setPreloaded] = useState<StarredRepo[]>([]);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const octokit = createOctokit(pat);
        const repos = await fetchStarSample(octokit, 3);
        setPreloaded(repos);
        setLanguages(extractLanguages(repos));
        setTopics(extractTopics(repos));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to fetch stars: ${msg}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pat]);

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
        <h2 className="text-lg md:text-xl text-[var(--color-retro-gold)]">
          CHOOSE YOUR DECK
        </h2>
        <p className="text-[9px] opacity-60 leading-relaxed">
          Filter your stars by language or topic,
          <br />
          or browse them all.
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

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-[var(--color-retro-accent)]/50 bg-[var(--color-retro-accent)]/10 p-3 space-y-2"
          >
            <p className="text-[10px] text-[var(--color-retro-accent)]">{error}</p>
          </motion.div>
        )}

        {!loading && (
          <>
            {/* All stars */}
            <motion.button
              onClick={() => handleSelect({ type: "all", value: "" })}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left bg-[var(--color-retro-blue)] border-2 border-[var(--color-retro-gold)] p-4 font-[inherit] cursor-pointer hover:border-[var(--color-retro-green)] transition-colors"
            >
              <span className="text-xs text-[var(--color-retro-gold)]">
                &#9733; ALL STARS
              </span>
              <p className="text-[8px] mt-1 opacity-50 text-[var(--color-retro-green)]">
                {preloaded.length}+ starred repositories
              </p>
            </motion.button>

            {/* Tab switcher */}
            <div className="flex border border-[var(--color-retro-green)]/20">
              <button
                onClick={() => { playClickSound(); setTab("language"); }}
                className={`flex-1 py-2 text-[9px] font-[inherit] cursor-pointer border-none transition-colors ${
                  tab === "language"
                    ? "bg-[var(--color-retro-green)]/20 text-[var(--color-retro-green)]"
                    : "bg-transparent text-[var(--color-retro-green)]/40 hover:text-[var(--color-retro-green)]/70"
                }`}
              >
                BY LANGUAGE
              </button>
              <button
                onClick={() => { playClickSound(); setTab("topic"); }}
                className={`flex-1 py-2 text-[9px] font-[inherit] cursor-pointer border-none border-l border-l-[var(--color-retro-green)]/20 transition-colors ${
                  tab === "topic"
                    ? "bg-[var(--color-retro-green)]/20 text-[var(--color-retro-green)]"
                    : "bg-transparent text-[var(--color-retro-green)]/40 hover:text-[var(--color-retro-green)]/70"
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
                  className="w-full text-left bg-[var(--color-retro-card)] border border-[var(--color-retro-green)]/20 px-4 py-2.5 font-[inherit] cursor-pointer hover:border-[var(--color-retro-green)]/60 transition-colors flex items-center justify-between"
                >
                  <span className="text-[10px] text-[var(--color-retro-green)]">
                    &#9830; {name.toUpperCase()}
                  </span>
                  <span className="text-[8px] text-[var(--color-retro-gold)]">
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

        {/* Change PAT */}
        <motion.button
          onClick={() => { playClickSound(); onChangePat(); }}
          whileHover={{ scale: 1.02 }}
          className="text-[9px] bg-transparent border-none text-[var(--color-retro-green)]/50 font-[inherit] cursor-pointer hover:text-[var(--color-retro-green)] transition-colors"
        >
          &#8592; CHANGE PAT
        </motion.button>
      </motion.div>
    </div>
  );
}
