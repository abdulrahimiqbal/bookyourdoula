import { Link, useSearch } from "wouter";
import { CheckCircle, Calendar, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function BookingSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const bookingId = params.get("booking_id");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-secondary" />
          </div>
          <h1 className="font-serif text-3xl text-foreground mb-3">You're all set!</h1>
          <p className="text-muted-foreground">
            Your consultation deposit was received. The doula will be in touch within 24–48 hours to confirm your appointment.
          </p>
        </div>

        <Card className="mb-6 bg-primary/5 border-primary/10">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">What happens next</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The doula will review your request and reach out to confirm the consultation time. Keep an eye on your email.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Your deposit</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The deposit secures your consultation and is credited toward your package if you move forward.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {bookingId && (
          <p className="text-center text-xs text-muted-foreground mb-6">
            Booking reference: #{bookingId}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/doulas">Browse more doulas</Link>
          </Button>
          <Button asChild className="flex-1 rounded-full shadow-lg shadow-primary/20">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
