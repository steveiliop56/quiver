import { useState } from "react";
import { motion } from "framer-motion";
import type { StarredRepo } from "../types";
import { exportMarkdown, exportJson, downloadFile } from "../utils/export";
import { clearPat, clearPinned } from "../utils/storage";
import { playExportSound, playClickSound } from "../utils/sound";

interface ExportScreenProps {
  projects: StarredRepo[];
  onBack: () => void;
  onRestart: () => void;
}

export default function ExportScreen({ projects, onBack, onRestart }: ExportScreenProps) {
  const [exported, setExported] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleExport = (format: "md" | "json") => {
    const content =
      format === "md" ? exportMarkdown(projects) : exportJson(projects);
    const filename = `quiver-projects.${format === "md" ? "md" : "json"}`;
    downloadFile(content, filename);
    playExportSound();
    clearPat();
    clearPinned();
    setExported(true);
  };

  const handlePreview = (format: "md" | "json") => {
    const content =
      format === "md" ? exportMarkdown(projects) : exportJson(projects);
    setPreview(content);
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <p className="text-lg text-[var(--color-retro-accent)]">EMPTY QUIVER!</p>
          <p className="text-[10px] opacity-60">You didn't pin any projects.</p>
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-xs bg-[var(--color-retro-green)] text-[var(--color-retro-dark)] px-6 py-3 font-[inherit] cursor-pointer border-none"
          >
            &#8592; GO BACK
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6 text-center"
      >
        <h2 className="text-xl md:text-2xl text-[var(--color-retro-gold)]">
          YOUR QUIVER
        </h2>
        <p className="text-[10px] opacity-70">
          {projects.length} project{projects.length !== 1 ? "s" : ""} pinned to
          the wall.
        </p>

        {/* Project list */}
        <div className="max-h-48 overflow-y-auto border border-[var(--color-retro-green)]/20 p-3 text-left space-y-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 text-[9px] border-b border-[var(--color-retro-green)]/10 pb-1"
            >
              <span className="text-[var(--color-retro-accent)]">&#9830;</span>
              <span className="text-[var(--color-retro-gold)] truncate flex-1">
                {p.fullName}
              </span>
              <span className="text-[var(--color-retro-green)]/50">
                &#9733;{p.stars.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Preview */}
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border border-[var(--color-retro-green)]/30 p-3"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[8px] opacity-50">PREVIEW</span>
              <button
                onClick={() => setPreview(null)}
                className="text-[8px] text-[var(--color-retro-accent)] bg-transparent border-none font-[inherit] cursor-pointer"
              >
                CLOSE
              </button>
            </div>
            <pre className="text-[7px] text-left overflow-auto max-h-40 whitespace-pre-wrap opacity-80 font-[inherit]">
              {preview}
            </pre>
          </motion.div>
        )}

        {!exported ? (
          <div className="space-y-3">
            {/* Preview buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handlePreview("md")}
                className="text-[8px] bg-transparent border border-[var(--color-retro-green)]/30 text-[var(--color-retro-green)] px-4 py-2 font-[inherit] cursor-pointer hover:border-[var(--color-retro-green)] transition-colors"
              >
                PREVIEW MD
              </button>
              <button
                onClick={() => handlePreview("json")}
                className="text-[8px] bg-transparent border border-[var(--color-retro-green)]/30 text-[var(--color-retro-green)] px-4 py-2 font-[inherit] cursor-pointer hover:border-[var(--color-retro-green)] transition-colors"
              >
                PREVIEW JSON
              </button>
            </div>

            {/* Export buttons */}
            <div className="flex gap-3 justify-center">
              <motion.button
                onClick={() => handleExport("md")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-xs bg-[var(--color-retro-green)] text-[var(--color-retro-dark)] px-6 py-3 font-[inherit] cursor-pointer border-none"
              >
                EXPORT .MD
              </motion.button>
              <motion.button
                onClick={() => handleExport("json")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-xs bg-[var(--color-retro-gold)] text-[var(--color-retro-dark)] px-6 py-3 font-[inherit] cursor-pointer border-none"
              >
                EXPORT .JSON
              </motion.button>
            </div>

            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.02 }}
              className="text-[9px] bg-transparent border-none text-[var(--color-retro-green)]/50 font-[inherit] cursor-pointer hover:text-[var(--color-retro-green)] transition-colors"
            >
              &#8592; KEEP PLAYING
            </motion.button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-sm text-[var(--color-retro-green)]">
              EXPORTED! PAT CLEARED. &#10003;
            </p>
            <p className="text-[8px] opacity-50">
              Your token has been removed from session storage.
            </p>
            <motion.button
              onClick={() => { playClickSound(); onRestart(); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-xs bg-[var(--color-retro-accent)] text-white px-6 py-3 font-[inherit] cursor-pointer border-none hover:opacity-80 transition-opacity"
            >
              &#8634; PLAY AGAIN
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
