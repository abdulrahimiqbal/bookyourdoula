import { useState } from "react";
import { Link } from "wouter";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useListBookings } from "@workspace/api-client-react";

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-amber-100 text-amber-800 border-0" },
  accepted: { label: "Accepted", icon: CheckCircle, className: "bg-secondary/10 text-secondary border-0" },
  declined: { label: "Declined", icon: XCircle, className: "bg-destructive/10 text-destructive border-0" },
  completed: { label: "Completed", icon: Star, className: "bg-primary/10 text-primary border-0" },
  cancelled: { label: "Cancelled", icon: AlertCircle, className: "bg-muted text-muted-foreground border-0" },
};

export default function BookingsList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: bookings, isLoading } = useListBookings(
    statusFilter !== "all" ? { status: statusFilter as "pending" | "accepted" | "declined" | "completed" | "cancelled" } : {}
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card py-10">
        <div className="container mx-auto px-4 sm:px-6">
          <h1 className="font-serif text-3xl text-foreground mb-2">Booking requests</h1>
          <p className="text-muted-foreground">Track and manage consultation requests</p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !bookings?.length ? (
          <div className="text-center py-24 rounded-xl bg-muted/40 border border-border">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-serif text-xl text-foreground mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-6">When families reach out, their requests will appear here.</p>
            <Button asChild variant="outline">
              <Link href="/doulas">Find a doula</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const statusInfo = statusConfig[booking.status] ?? statusConfig.pending;
              const StatusIcon = statusInfo.icon;
              return (
                <Card key={booking.id} className="hover:border-primary/20 hover:shadow-md transition-all" data-testid={`card-booking-${booking.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <span className="font-medium text-foreground" data-testid={`text-client-name-${booking.id}`}>{booking.clientName}</span>
                          <Badge className={statusInfo.className} data-testid={`badge-status-${booking.id}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">{booking.serviceType.replace("_", " & ")}</Badge>
                        </div>
                        {booking.doulaName && (
                          <p className="text-sm text-muted-foreground mb-1">For: {booking.doulaName}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">{booking.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(booking.createdAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
                          </span>
                          {booking.dueDate && (
                            <span>Due: {new Date(booking.dueDate).toLocaleDateString("en-CA")}</span>
                          )}
                        </div>
                      </div>
                      {booking.doulaId && (
                        <Button asChild variant="ghost" size="sm" className="flex-shrink-0">
                          <Link href={`/doulas/${booking.doulaId}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                    {booking.doulaResponse && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Doula's response:</p>
                        <p className="text-sm text-foreground/80">{booking.doulaResponse}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
