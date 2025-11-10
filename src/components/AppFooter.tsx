export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-card/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span className="font-medium text-foreground/80">© {year} CodeNebula</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
            Built by Jai Redddy
          </span>
          <span className="hidden h-3 w-px bg-border/70 md:block" />
          <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
            Crafted for cosmic code explorers
          </span>
          <span className="hidden h-3 w-px bg-border/70 md:block" />
          <a
            className="text-xs font-semibold text-primary transition-colors hover:text-accent"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
          >
            View source
          </a>
        </div>
      </div>
    </footer>
  );
}

