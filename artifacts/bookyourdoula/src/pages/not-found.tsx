import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Heart className="h-10 w-10 text-primary/60" />
        </div>
        <h1 className="font-serif text-4xl text-foreground mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist. Let's get you back to finding a doula.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild>
            <Link href="/doulas">Browse doulas</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
