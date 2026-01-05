export function Footer() {
  return (
    <footer className="py-8 bg-slate-50 dark:bg-slate-900 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
        &copy; {new Date().getFullYear()} BookTheCall. All rights reserved.
      </div>
    </footer>
  )
}

