import { Link, useParams } from "wouter";
import { Star, MapPin, Languages, CheckCircle, XCircle, Award, BookOpen, Heart, Globe, Instagram, Calendar, Clock, ChevronLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useGetDoula, useListDoulaReviews, useListDoulaServices, getGetDoulaQueryKey } from "@workspace/api-client-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted/40"}`}
        />
      ))}
    </span>
  );
}

export default function DoulaProfile() {
  const { id } = useParams<{ id: string }>();
  const doulaId = parseInt(id!, 10);

  const { data: doula, isLoading: doulaLoading } = useGetDoula(doulaId, {
    query: { enabled: !!doulaId, queryKey: getGetDoulaQueryKey(doulaId) },
  });
  const { data: reviews } = useListDoulaReviews(doulaId, {
    query: { enabled: !!doulaId, queryKey: ["doulas", doulaId, "reviews"] },
  });
  const { data: services } = useListDoulaServices(doulaId, {
    query: { enabled: !!doulaId, queryKey: ["doulas", doulaId, "services"] },
  });

  if (doulaLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 max-w-5xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Skeleton className="aspect-square rounded-2xl mb-4" />
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!doula) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-24 text-center max-w-xl">
        <h2 className="font-serif text-2xl mb-3">Doula not found</h2>
        <p className="text-muted-foreground mb-6">This profile may no longer be active.</p>
        <Button asChild variant="outline"><Link href="/doulas">Browse doulas</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        <Link href="/doulas" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8" data-testid="link-back-to-doulas">
          <ChevronLeft className="h-4 w-4" /> Back to all doulas
        </Link>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted" data-testid="img-doula-photo">
              {doula.photoUrl ? (
                <img src={doula.photoUrl} alt={doula.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                  <span className="text-8xl font-serif text-primary/40">{doula.name.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Accepting status */}
            {doula.acceptingClients ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/10 border border-secondary/20" data-testid="status-accepting-clients">
                <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                <span className="text-sm font-medium text-secondary">Accepting new clients</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border" data-testid="status-not-accepting">
                <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Not currently accepting clients</span>
              </div>
            )}

            {/* Quick info */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{doula.location}</span>
                </div>

                {(doula.languages?.length ?? 0) > 0 && (
                  <div className="flex items-start gap-3">
                    <Languages className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {doula.languages?.map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs" data-testid={`badge-language-${lang}`}>{lang}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {doula.yearsExperience && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{doula.yearsExperience} years experience</span>
                  </div>
                )}

                {doula.birthsAttended && (
                  <div className="flex items-center gap-3">
                    <Heart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{doula.birthsAttended}+ births attended</span>
                  </div>
                )}

                {(doula.rateMin || doula.rateMax) && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Rate</p>
                    <p className="font-medium text-foreground" data-testid="text-rate">
                      ${doula.rateMin}{doula.rateMax && doula.rateMax !== doula.rateMin ? `–$${doula.rateMax}` : ""}
                    </p>
                    {doula.insuranceAccepted && <p className="text-xs text-muted-foreground mt-1">Insurance accepted</p>}
                    {doula.slidingScaleAvailable && <p className="text-xs text-muted-foreground mt-0.5">Sliding scale available</p>}
                  </div>
                )}

                {doula.website && (
                  <a href={doula.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Globe className="h-4 w-4" /> Website
                  </a>
                )}
                {doula.instagramHandle && (
                  <a href={`https://instagram.com/${doula.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Instagram className="h-4 w-4" /> @{doula.instagramHandle}
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Profile completeness */}
            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Profile completeness</p>
                  <p className="text-xs font-medium text-foreground" data-testid="text-profile-completeness">{doula.profileCompleteness}%</p>
                </div>
                <Progress value={doula.profileCompleteness} className="h-2" />
              </CardContent>
            </Card>

            {/* CTA */}
            {doula.acceptingClients && (
              <Button asChild className="w-full h-12 rounded-full shadow-lg shadow-primary/20" size="lg" data-testid="button-book-doula">
                <Link href={`/doulas/${doula.id}/book`}>Request a Consultation</Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full" data-testid="button-edit-doula">
              <Link href={`/doulas/${doula.id}/edit`}>Edit Profile</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full" data-testid="button-doula-dashboard">
              <Link href={`/doulas/${doula.id}/dashboard`}>Dashboard</Link>
            </Button>
          </div>

          {/* Main content */}
          <div className="md:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {doula.serviceTypes.map((type) => (
                  <Badge key={type} className="bg-primary/10 text-primary border-0 capitalize" data-testid={`badge-service-${type}`}>
                    {type.replace("_", " & ")} Doula
                  </Badge>
                ))}
                {doula.featured && (
                  <Badge className="bg-amber-100 text-amber-800 border-0" data-testid="badge-featured">Featured</Badge>
                )}
              </div>
              <h1 className="font-serif text-4xl text-foreground mb-2" data-testid="text-doula-name">{doula.name}</h1>
              {doula.tagline && (
                <p className="text-lg text-muted-foreground italic" data-testid="text-tagline">"{doula.tagline}"</p>
              )}

              {doula.averageRating && (
                <div className="flex items-center gap-2 mt-3">
                  <StarRating rating={doula.averageRating} />
                  <span className="font-medium text-foreground" data-testid="text-avg-rating">{doula.averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">({doula.reviewCount} {doula.reviewCount === 1 ? "review" : "reviews"})</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {doula.bio && (
              <div>
                <h2 className="font-serif text-xl mb-3 text-foreground">About</h2>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-line" data-testid="text-bio">{doula.bio}</p>
              </div>
            )}

            {/* Philosophy */}
            {doula.philosophyStatement && (
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-6">
                  <blockquote className="font-serif text-lg italic text-foreground/90 leading-relaxed" data-testid="text-philosophy">
                    "{doula.philosophyStatement}"
                  </blockquote>
                </CardContent>
              </Card>
            )}

            {/* Approach */}
            {doula.approachDescription && (
              <div>
                <h2 className="font-serif text-xl mb-3 text-foreground">My approach</h2>
                <p className="text-foreground/80 leading-relaxed" data-testid="text-approach">{doula.approachDescription}</p>
              </div>
            )}

            {/* Specialties */}
            {(doula.specialties?.length ?? 0) > 0 && (
              <div>
                <h2 className="font-serif text-xl mb-3 text-foreground">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {doula.specialties?.map((specialty) => (
                    <Badge key={specialty} variant="outline" className="bg-secondary/5 border-secondary/20 text-secondary-foreground" data-testid={`badge-specialty-${specialty}`}>
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {(doula.certifications?.length ?? 0) > 0 && (
              <div>
                <h2 className="font-serif text-xl mb-3 text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Certifications
                </h2>
                <div className="space-y-2">
                  {doula.certifications?.map((cert) => (
                    <div key={cert} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border" data-testid={`badge-cert-${cert}`}>
                      <Award className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trainings */}
            {(doula.trainings?.length ?? 0) > 0 && (
              <div>
                <h2 className="font-serif text-xl mb-3 text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-secondary" /> Training & Education
                </h2>
                <div className="space-y-2">
                  {doula.trainings?.map((training) => (
                    <div key={training} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border" data-testid={`badge-training-${training}`}>
                      <BookOpen className="h-4 w-4 text-secondary flex-shrink-0" />
                      <span className="text-sm">{training}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {services && services.length > 0 && (
              <div>
                <h2 className="font-serif text-xl mb-4 text-foreground">Services offered</h2>
                <div className="space-y-3">
                  {services.map((service) => (
                    <Card key={service.id} className="border-border" data-testid={`card-service-${service.id}`}>
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-foreground">{service.name}</h3>
                              <Badge variant="outline" className="text-xs capitalize">{service.serviceType}</Badge>
                            </div>
                            {service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
                            {service.includedHours && (
                              <p className="text-xs text-muted-foreground mt-1">{service.includedHours} hours included</p>
                            )}
                            {service.packageDetails && (
                              <p className="text-xs text-muted-foreground mt-1">{service.packageDetails}</p>
                            )}
                          </div>
                          {service.rate && (
                            <div className="text-right">
                              <p className="font-semibold text-foreground">${service.rate}</p>
                              {service.rateType && <p className="text-xs text-muted-foreground">{service.rateType}</p>}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h2 className="font-serif text-xl mb-4 text-foreground">Client reviews</h2>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="border-border" data-testid={`card-review-${review.id}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{review.clientName}</span>
                              {review.verified && (
                                <Badge className="bg-secondary/10 text-secondary border-0 text-xs" data-testid={`badge-verified-${review.id}`}>
                                  <Shield className="h-3 w-3 mr-1" /> Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <StarRating rating={review.rating} />
                              {review.birthYear && <span className="text-xs text-muted-foreground">· {review.birthYear}</span>}
                              <Badge variant="outline" className="text-xs capitalize">{review.serviceType}</Badge>
                            </div>
                          </div>
                          <time className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString("en-CA", { year: "numeric", month: "long" })}
                          </time>
                        </div>
                        {review.title && <h4 className="font-medium text-foreground mb-1">{review.title}</h4>}
                        <p className="text-sm text-foreground/80 leading-relaxed">{review.body}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl bg-muted/40 border border-border">
                  <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No reviews yet — be the first to share your experience.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
