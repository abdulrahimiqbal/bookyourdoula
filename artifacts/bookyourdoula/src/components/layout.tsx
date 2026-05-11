import { Link } from "wouter";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Heart className="h-5 w-5 fill-primary" />
            </div>
            <span className="font-serif text-xl font-medium tracking-tight text-foreground">
              BookYourDoula
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/doulas" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Find a Doula
            </Link>
            <Link href="/bookings" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              My Bookings
            </Link>
            <div className="flex items-center gap-4 ml-4">
              <Button variant="ghost" asChild className="font-medium">
                <Link href="/doulas/new">For Doulas</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-serif text-lg font-medium">BookYourDoula</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-sm">
                A warm, reassuring marketplace connecting Ottawa families with trusted birth and postpartum doulas.
              </p>
            </div>
            <div>
              <h4 className="font-serif font-medium mb-4 text-foreground">For Families</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/doulas" className="hover:text-primary transition-colors">Find a Doula</Link></li>
                <li><Link href="/about" className="hover:text-primary transition-colors">How it Works</Link></li>
                <li><Link href="/resources" className="hover:text-primary transition-colors">Resources</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif font-medium mb-4 text-foreground">For Doulas</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/doulas/new" className="hover:text-primary transition-colors">Join Directory</Link></li>
                <li><Link href="/doulas/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} BookYourDoula. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
