import { useState } from "react";
import { motion } from "framer-motion";

interface RateLimitPromptProps {
  onPatProvided: (pat: string) => void;
}

export default function RateLimitPrompt({ onPatProvided }: RateLimitPromptProps) {
  const [token, setToken] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) onPatProvided(token.trim());
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="border border-[var(--color-retro-accent)]/50 bg-[var(--color-retro-accent)]/10 p-4 space-y-3 text-left"
    >
      <p className="text-[10px] text-[var(--color-retro-accent)]">
        RATE LIMITED — GitHub allows 60 requests/hour without a token.
      </p>
      <p className="text-[8px] opacity-60">
        Provide a PAT to continue (5,000 requests/hour). It will only be held
        in memory and never stored.
      </p>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="ghp_..."
        className="w-full bg-[var(--color-retro-dark)] border border-[var(--color-retro-green)]/40 text-[var(--color-retro-green)] px-3 py-2 text-[10px] font-[inherit] placeholder:text-[var(--color-retro-green)]/30 focus:outline-none focus:border-[var(--color-retro-gold)] transition-colors"
        autoComplete="off"
      />
      <motion.button
        type="submit"
        disabled={!token.trim()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-[var(--color-retro-accent)] text-white py-2 text-[10px] font-[inherit] cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed"
      >
        UNLOCK
      </motion.button>
    </motion.form>
  );
}
