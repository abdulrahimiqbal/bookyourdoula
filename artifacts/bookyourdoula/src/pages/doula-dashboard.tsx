import { useParams } from "wouter";
import { Link } from "wouter";
import { ChevronLeft, Calendar, Star, CheckCircle, Clock, Award, TrendingUp, AlertCircle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDoulasDashboard, useGetDoula, getGetDoulasDashboardQueryKey, getGetDoulaQueryKey } from "@workspace/api-client-react";

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-serif text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-0" },
  accepted: { label: "Accepted", className: "bg-secondary/10 text-secondary border-0" },
  declined: { label: "Declined", className: "bg-destructive/10 text-destructive border-0" },
  completed: { label: "Completed", className: "bg-primary/10 text-primary border-0" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-0" },
};

export default function DoulaDashboard() {
  const { id } = useParams<{ id: string }>();
  const doulaId = parseInt(id!, 10);

  const { data: dashboard, isLoading } = useGetDoulasDashboard(doulaId, {
    query: { enabled: !!doulaId, queryKey: getGetDoulasDashboardQueryKey(doulaId) },
  });
  const { data: doula } = useGetDoula(doulaId, {
    query: { enabled: !!doulaId, queryKey: getGetDoulaQueryKey(doulaId) },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-xl">
        <h2 className="font-serif text-2xl mb-3">Dashboard not found</h2>
        <Button asChild variant="outline"><Link href="/doulas">Browse doulas</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <Link href={`/doulas/${doulaId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ChevronLeft className="h-4 w-4" /> Back to profile
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl text-foreground mb-1">Dashboard</h1>
            {doula && <p className="text-muted-foreground">{doula.name}</p>}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" data-testid="button-edit-from-dashboard">
              <Link href={`/doulas/${doulaId}/edit`}>Edit profile</Link>
            </Button>
            <Button asChild size="sm" data-testid="button-view-profile">
              <Link href={`/doulas/${doulaId}`}>View profile</Link>
            </Button>
          </div>
        </div>

        {/* Profile completeness */}
        <Card className="mb-6 bg-primary/5 border-primary/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Profile completeness</span>
              <span className="text-sm font-semibold text-primary" data-testid="text-completeness">{dashboard.profileCompleteness}%</span>
            </div>
            <Progress value={dashboard.profileCompleteness} className="h-2.5 mb-2" />
            {dashboard.profileCompleteness < 80 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <AlertCircle className="h-3 w-3" />
                Complete your profile to increase visibility and build trust with families.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Clock}
            label="Pending requests"
            value={dashboard.pendingBookings}
            color="bg-amber-100 text-amber-700"
          />
          <StatCard
            icon={CheckCircle}
            label="Active clients"
            value={dashboard.acceptedBookings}
            color="bg-secondary/10 text-secondary"
          />
          <StatCard
            icon={TrendingUp}
            label="Completed"
            value={dashboard.completedBookings}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            icon={Star}
            label="Avg rating"
            value={dashboard.averageRating ? dashboard.averageRating.toFixed(1) : "—"}
            color="bg-amber-100 text-amber-700"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent bookings */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-lg">Recent requests</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/bookings">
                    View all <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.recentBookings.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No booking requests yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Complete your profile to attract families</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.recentBookings.map((booking) => {
                    const statusInfo = statusConfig[booking.status] ?? statusConfig.pending;
                    return (
                      <div key={booking.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border" data-testid={`card-dashboard-booking-${booking.id}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-foreground truncate">{booking.clientName}</span>
                            <Badge className={`${statusInfo.className} text-xs flex-shrink-0`}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">{booking.serviceType.replace("_", " & ")}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{booking.message}</p>
                        </div>
                        <time className="text-xs text-muted-foreground flex-shrink-0">
                          {new Date(booking.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                        </time>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent reviews */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-lg">Recent reviews</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/doulas/${doulaId}#reviews`}>
                    View all <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.recentReviews.length === 0 ? (
                <div className="text-center py-10">
                  <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No reviews yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Reviews from families build trust with future clients</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.recentReviews.map((review) => (
                    <div key={review.id} className="p-3 rounded-lg bg-muted/40 border border-border" data-testid={`card-dashboard-review-${review.id}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium text-foreground">{review.clientName}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className={`h-3 w-3 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted/30"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{review.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm" data-testid="button-edit-profile-quick">
              <Link href={`/doulas/${doulaId}/edit`}>
                <Award className="h-4 w-4 mr-2" /> Update credentials
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" data-testid="button-view-bookings-quick">
              <Link href="/bookings">
                <Calendar className="h-4 w-4 mr-2" /> All bookings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
