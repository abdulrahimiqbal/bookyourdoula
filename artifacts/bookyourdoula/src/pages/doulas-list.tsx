import { useState } from "react";
import { Link } from "wouter";
import { Search, Star, MapPin, Languages, CheckCircle, XCircle, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListDoulas, ListDoulasServiceType } from "@workspace/api-client-react";
import type { Doula } from "@workspace/api-client-react";

function StarRating({ rating, small }: { rating: number; small?: boolean }) {
  const size = small ? "h-3 w-3" : "h-4 w-4";
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted/40"}`}
        />
      ))}
    </span>
  );
}

function DoulaCard({ doula }: { doula: Doula }) {
  return (
    <Link href={`/doulas/${doula.id}`} data-testid={`card-doula-${doula.id}`}>
      <Card className="group h-full border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
        <div className="relative h-48 bg-muted overflow-hidden">
          {doula.photoUrl ? (
            <img
              src={doula.photoUrl}
              alt={doula.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <span className="text-5xl font-serif text-primary/40">{doula.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {doula.acceptingClients ? (
              <Badge className="bg-secondary/90 text-secondary-foreground text-xs backdrop-blur-sm" data-testid={`status-accepting-${doula.id}`}>
                <CheckCircle className="h-3 w-3 mr-1" /> Accepting
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-card/90 text-muted-foreground text-xs backdrop-blur-sm" data-testid={`status-not-accepting-${doula.id}`}>
                <XCircle className="h-3 w-3 mr-1" /> Not Accepting
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-5 flex flex-col gap-3">
          <div>
            <h3 className="font-serif text-xl text-foreground mb-1 group-hover:text-primary transition-colors" data-testid={`text-doula-name-${doula.id}`}>{doula.name}</h3>
            {doula.tagline && (
              <p className="text-sm text-muted-foreground line-clamp-1">{doula.tagline}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {doula.serviceTypes.map((type) => (
              <Badge
                key={type}
                variant="outline"
                className="text-xs capitalize bg-primary/5 border-primary/20 text-primary"
                data-testid={`badge-service-${doula.id}-${type}`}
              >
                {type.replace("_", " & ")} Doula
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {doula.location}
            </span>
            {(doula.languages?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Languages className="h-3.5 w-3.5" />
                {doula.languages?.slice(0, 2).join(", ")}
              </span>
            )}
          </div>

          {doula.averageRating ? (
            <div className="flex items-center gap-2">
              <StarRating rating={doula.averageRating} small />
              <span className="text-sm font-medium text-foreground">{doula.averageRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({doula.reviewCount})</span>
            </div>
          ) : null}

          <div className="pt-1 border-t border-border mt-auto">
            {doula.rateMin || doula.rateMax ? (
              <span className="text-sm font-medium text-foreground" data-testid={`text-rate-${doula.id}`}>
                ${doula.rateMin}{doula.rateMax && doula.rateMax !== doula.rateMin ? `–$${doula.rateMax}` : ""}
                {doula.slidingScaleAvailable && <span className="text-xs text-muted-foreground ml-1">· Sliding scale</span>}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Contact for rates</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DoulaCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <CardContent className="p-5 flex flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

export default function DoulasList() {
  const [search, setSearch] = useState("");
  const [serviceType, setServiceType] = useState<string>("all");
  const [acceptingOnly, setAcceptingOnly] = useState(false);
  const [language, setLanguage] = useState<string>("all");

  const queryParams = {
    ...(search ? { search } : {}),
    ...(serviceType && serviceType !== "all" ? { serviceType: serviceType as (typeof ListDoulasServiceType)[keyof typeof ListDoulasServiceType] } : {}),
    ...(acceptingOnly ? { acceptingClients: true } : {}),
    ...(language && language !== "all" ? { language } : {}),
  };

  const { data: doulas, isLoading } = useListDoulas(queryParams);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <h1 className="font-serif text-4xl text-foreground mb-3">Find your doula</h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl">
            Browse Ottawa's trusted network of birth and postpartum doulas, each with verified profiles and real client reviews.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, specialty, or approach..."
              className="pl-10 h-12 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-doulas"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filter:</span>
            </div>

            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger className="w-44 h-9 bg-background" data-testid="select-service-type">
                <SelectValue placeholder="Service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                <SelectItem value="birth">Birth doula</SelectItem>
                <SelectItem value="postpartum">Postpartum doula</SelectItem>
                <SelectItem value="birth_and_postpartum">Birth & Postpartum</SelectItem>
              </SelectContent>
            </Select>

            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-36 h-9 bg-background" data-testid="select-language">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any language</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="Arabic">Arabic</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="Mandarin">Mandarin</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={acceptingOnly ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setAcceptingOnly(!acceptingOnly)}
              data-testid="button-accepting-filter"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Accepting clients
            </Button>

            {(search || serviceType !== "all" || acceptingOnly || language !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={() => {
                  setSearch("");
                  setServiceType("all");
                  setAcceptingOnly(false);
                  setLanguage("all");
                }}
                data-testid="button-clear-filters"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 sm:px-6 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <DoulaCardSkeleton key={i} />
            ))}
          </div>
        ) : !doulas?.length ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-xl text-foreground mb-2">No doulas found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms</p>
            <Button variant="outline" onClick={() => { setSearch(""); setServiceType("all"); setAcceptingOnly(false); setLanguage("all"); }}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6" data-testid="text-results-count">
              {doulas.length} {doulas.length === 1 ? "doula" : "doulas"} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {doulas.map((doula) => (
                <DoulaCard key={doula.id} doula={doula} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
