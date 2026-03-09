import { motion } from "framer-motion";
import type { StarredRepo } from "../types";

interface ProjectCardProps {
  project: StarredRepo;
  onPin: () => void;
  onDismiss: () => void;
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function ProjectCard({ project, onPin, onDismiss }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      className="w-80 md:w-95 bg-retro-card border-2 border-retro-green/50 relative select-none"
    >
      {/* Card header with suit-like decorations */}
      <div className="flex items-center justify-between p-3 border-b border-retro-green/20">
        <span className="text-retro-gold text-lg">&#9830;</span>
        <span className="text-[8px] text-retro-green/50 uppercase tracking-wider">
          {project.language || "Unknown"}
        </span>
        <span className="text-retro-gold text-lg">&#9830;</span>
      </div>

      {/* Card body */}
      <div className="p-5 space-y-4">
        {/* Owner avatar & name */}
        <div className="flex items-center gap-3">
          <img
            src={project.owner.avatarUrl}
            alt={project.owner.login}
            className="w-10 h-10 border border-retro-green/30"
            style={{ imageRendering: "pixelated" }}
          />
          <div className="min-w-0">
            <h2 className="text-sm text-retro-gold truncate">
              {project.name}
            </h2>
            <p className="text-[8px] opacity-50 truncate">{project.owner.login}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-[10px] leading-relaxed opacity-80 line-clamp-3 min-h-[3em]">
          {project.description || "No description available."}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-[9px]">
          <span className="text-retro-gold">
            &#9733; {formatStars(project.stars)}
          </span>
          {project.homepage && (
            <a
              href={project.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-retro-accent hover:underline truncate max-w-37.5"
              onClick={(e) => e.stopPropagation()}
            >
              Website &#8599;
            </a>
          )}
        </div>

        {/* Topics */}
        {project.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.topics.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[7px] px-2 py-0.5 border border-retro-green/30 text-retro-green/70"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card footer with suit-like decorations */}
      <div className="flex items-center justify-between p-3 border-t border-retro-green/20">
        <span className="text-retro-gold text-lg rotate-180">&#9830;</span>
        <div className="flex gap-2">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[8px] text-retro-green/40 hover:text-retro-green transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            GitHub &#8599;
          </a>
        </div>
        <span className="text-retro-gold text-lg rotate-180">&#9830;</span>
      </div>

      {/* Action buttons */}
      <div className="flex border-t-2 border-retro-green/30">
        <motion.button
          onClick={onDismiss}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-4 bg-retro-accent/20 text-retro-accent text-xs font-[inherit] cursor-pointer border-none border-r border-r-retro-green/30 hover:bg-retro-accent/40 transition-colors"
        >
          &#10005; PASS
        </motion.button>
        <motion.button
          onClick={onPin}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-4 bg-retro-green/20 text-retro-green text-xs font-[inherit] cursor-pointer border-none hover:bg-retro-green/40 transition-colors"
        >
          &#127919; PIN IT
        </motion.button>
      </div>
    </motion.div>
  );
}
