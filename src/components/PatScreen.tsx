import { useState } from "react";
import { motion } from "framer-motion";

interface PatScreenProps {
  onSubmit: (pat: string) => void;
  error: string | null;
  loading: boolean;
}

export default function PatScreen({ onSubmit, error, loading }: PatScreenProps) {
  const [pat, setPat] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pat.trim()) onSubmit(pat.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl md:text-5xl mb-4 text-[var(--color-retro-gold)]">
          QUIVER
        </h1>
        <p className="text-xs md:text-sm leading-relaxed max-w-md mx-auto opacity-80">
          Pin your favorite self-hosted projects to the wall.
          <br />
          One card at a time.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[var(--color-retro-blue)] border-2 border-[var(--color-retro-green)] p-6 md:p-8"
      >
        <label className="block text-xs mb-4 text-[var(--color-retro-green)]">
          ENTER GITHUB PAT
        </label>
        <input
          type="password"
          value={pat}
          onChange={(e) => setPat(e.target.value)}
          placeholder="ghp_..."
          className="w-full bg-[var(--color-retro-dark)] border border-[var(--color-retro-green)] text-[var(--color-retro-green)] px-4 py-3 text-xs font-[inherit] placeholder:text-[var(--color-retro-green)]/30 focus:outline-none focus:border-[var(--color-retro-gold)] transition-colors"
          autoFocus
          autoComplete="off"
        />
        <p className="text-[8px] md:text-[10px] mt-2 opacity-50 leading-relaxed">
          Needs read access to your starred repositories.
          <br />
          Stored in session only. Deleted on export.
        </p>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[var(--color-retro-accent)] text-[10px] mt-3"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={!pat.trim() || loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 bg-[var(--color-retro-green)] text-[var(--color-retro-dark)] py-3 text-xs font-[inherit] cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-retro-gold)] transition-colors"
        >
          {loading ? "VALIDATING..." : "START GAME"}
        </motion.button>
      </motion.form>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1 }}
        className="mt-8 text-[8px]"
      >
        INSERT TOKEN TO CONTINUE
      </motion.p>
    </div>
  );
}
