import { Link } from "wouter";
import { ArrowRight, Search, Star, ShieldCheck, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetDoulaStats, useListFeaturedDoulas } from "@workspace/api-client-react";

export default function Home() {
  const { data: stats } = useGetDoulaStats();
  const { data: featuredDoulas } = useListFeaturedDoulas();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        
        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary mb-6">
              <span className="flex h-2 w-2 rounded-full bg-secondary"></span>
              Serving the Ottawa Region
            </div>
            <h1 className="text-5xl font-medium tracking-tight text-foreground sm:text-6xl md:text-7xl mb-6">
              Find confident, calm support for your birth.
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              Connect with trusted birth and postpartum doulas who provide evidence-based care, emotional grounding, and fierce advocacy for your growing family.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="h-14 px-8 text-base rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Link href="/doulas">
                  <Search className="mr-2 h-5 w-5" />
                  Find your doula
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-8 text-base rounded-full border-2">
                <Link href="/about">How it works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="border-y border-border bg-card py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50 text-center">
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-serif text-primary">{stats?.totalDoulas || "50+"}</span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Trusted Doulas</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-serif text-primary">{stats?.totalBookings || "500+"}</span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Families Supported</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-serif text-primary flex items-center justify-center gap-1">
                {stats?.averageRating ? stats.averageRating.toFixed(1) : "5.0"} <Star className="h-6 w-6 fill-primary text-primary" />
              </span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Average Rating</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-serif text-primary">{stats?.acceptingClients || "30+"}</span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Accepting Clients</span>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-serif text-foreground mb-4">A sanctuary of support</h2>
            <p className="text-lg text-muted-foreground">We believe every family deserves compassionate, personalized care during one of life's most profound transitions.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 text-secondary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-serif mb-3">Vetted Professionals</h3>
              <p className="text-muted-foreground">Every doula on our platform is verified, with transparent certifications, trainings, and community reviews.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <HeartHandshake className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-serif mb-3">Personalized Match</h3>
              <p className="text-muted-foreground">Filter by birth philosophy, language, specialties, and budget to find the perfect addition to your birth team.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-6 text-accent-foreground">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-serif mb-3">Real Experiences</h3>
              <p className="text-muted-foreground">Read verified reviews from other local families who have navigated pregnancy, birth, and postpartum.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
