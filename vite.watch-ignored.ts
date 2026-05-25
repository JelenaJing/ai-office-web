/**
 * Paths excluded from Vite dev file watching to avoid ENOSPC (inotify limit).
 * The backend (`server/`) and build artifacts are watched by their own dev processes.
 */
export const viteWatchIgnored: string[] = [
  '**/server/**',
  '**/dist/**',
  '**/dist-electron/**',
  '**/dist-web/**',
  '**/node_modules/**',
  '**/.git/**',
  '**/aioffice-workflow-service/**',
  '**/ai_writer3.0/**',
  '**/excel-and-relay/**',
  '**/skill_platform_next/**',
  '**/docs/**',
  '**/data/**',
  '**/data/slidev-apps/**',
  '**/server/slidev-runtime/**',
  '**/server/**/minimax-docx/**',
  '**/server/**/scripts/dotnet/**',
  '**/temp/**',
  '**/agent-docs/**',
  '**/*.pptx',
]
