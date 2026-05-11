import { useParams, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, Heart, CheckCircle, CreditCard, CalendarDays } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGetDoula, useCreateBooking, useGetDoulaAvailability, getGetDoulaQueryKey } from "@workspace/api-client-react";
import { AvailabilityCalendar } from "@/components/availability-calendar";

const bookingSchema = z.object({
  clientName: z.string().min(2, "Please enter your full name"),
  clientEmail: z.string().email("Please enter a valid email address"),
  clientPhone: z.string().optional(),
  serviceType: z.string().min(1, "Please select a service type"),
  dueDate: z.string().optional(),
  preferredDate: z.string().optional(),
  message: z.string().min(20, "Please share at least a little about yourself (20+ characters)"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookingForm() {
  const { id } = useParams<{ id: string }>();
  const doulaId = parseInt(id!, 10);
  const [, setLocation] = useLocation();
  const search = useSearch();
  const cancelled = new URLSearchParams(search).get("cancelled") === "1";
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);

  const { data: doula, isLoading } = useGetDoula(doulaId, {
    query: { enabled: !!doulaId, queryKey: getGetDoulaQueryKey(doulaId) },
  });

  const { data: availability = [] } = useGetDoulaAvailability(doulaId, { year: calYear, month: calMonth }, {
    query: { enabled: !!doulaId, queryKey: ["doulas", doulaId, "availability", calYear, calMonth] },
  });

  const createBooking = useCreateBooking();

  const depositCents = doula?.consultationDepositCents;
  const hasDeposit = !!depositCents && depositCents > 0;
  const depositFormatted = hasDeposit
    ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(depositCents! / 100)
    : null;

  useEffect(() => {
    if (cancelled) {
      toast({
        title: "Payment cancelled",
        description: "No charge was made. You can try again when ready.",
      });
    }
  }, [cancelled, toast]);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      serviceType: "",
      dueDate: "",
      preferredDate: "",
      message: "",
    },
  });

  const preferredDate = form.watch("preferredDate");

  async function onSubmit(values: BookingFormValues) {
    createBooking.mutate(
      {
        data: {
          doulaId,
          clientName: values.clientName,
          clientEmail: values.clientEmail,
          clientPhone: values.clientPhone || undefined,
          serviceType: values.serviceType,
          dueDate: values.dueDate || undefined,
          preferredDate: values.preferredDate || undefined,
          message: values.message,
        },
      },
      {
        onSuccess: (result) => {
          if (result.checkoutUrl) {
            window.location.href = result.checkoutUrl;
          } else {
            setSubmitted(true);
          }
        },
        onError: () => {
          toast({
            title: "Something went wrong",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
        },
      }
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-secondary" />
          </div>
          <h2 className="font-serif text-3xl text-foreground mb-3">Request sent!</h2>
          <p className="text-muted-foreground mb-2">
            Your consultation request has been sent to <strong>{doula?.name}</strong>.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            They'll typically respond within 24–48 hours. Check your inbox for a confirmation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href={`/doulas/${doulaId}`}>Back to profile</Link>
            </Button>
            <Button asChild>
              <Link href="/doulas">Browse more doulas</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-2xl">
        <Link
          href={`/doulas/${doulaId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          data-testid="link-back"
        >
          <ChevronLeft className="h-4 w-4" /> Back to profile
        </Link>

        {isLoading ? (
          <Skeleton className="h-24 rounded-xl mb-8" />
        ) : doula ? (
          <Card className="mb-8 bg-primary/5 border-primary/10">
            <CardContent className="p-5 flex items-center gap-4">
              {doula.photoUrl ? (
                <img src={doula.photoUrl} alt={doula.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-serif text-xl text-primary">{doula.name.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">{doula.name}</p>
                {doula.tagline && <p className="text-sm text-muted-foreground">{doula.tagline}</p>}
              </div>
              {hasDeposit && (
                <Badge className="bg-primary/10 text-primary border-0 flex items-center gap-1 flex-shrink-0">
                  <CreditCard className="h-3 w-3" />
                  {depositFormatted} deposit
                </Badge>
              )}
              <Heart className="h-5 w-5 text-primary/60 flex-shrink-0" />
            </CardContent>
          </Card>
        ) : null}

        <div className="mb-8">
          <h1 className="font-serif text-3xl text-foreground mb-2">Request a consultation</h1>
          <p className="text-muted-foreground">
            Tell {doula?.name ?? "the doula"} a little about yourself. They'll reach out to arrange a discovery call.
          </p>
          {hasDeposit && (
            <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">A {depositFormatted} deposit is required</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  You'll be redirected to a secure payment page after submitting your request. The deposit is credited toward your package.
                </p>
              </div>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} data-testid="input-client-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} data-testid="input-client-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="613-555-0100" {...field} data-testid="input-client-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type of support</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-service-type">
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="birth">Birth doula</SelectItem>
                            <SelectItem value="postpartum">Postpartum doula</SelectItem>
                            <SelectItem value="birth_and_postpartum">Birth & Postpartum</SelectItem>
                            <SelectItem value="education">Childbirth education</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected due date <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="date" className="pl-10" {...field} data-testid="input-due-date" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Preferred consultation date */}
                <FormField
                  control={form.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Preferred consultation date{" "}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      <div className="border border-border rounded-xl p-4">
                        {preferredDate && (
                          <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-sm text-secondary font-medium">
                              {format(new Date(preferredDate + "T12:00:00"), "EEEE, MMMM d, yyyy")}
                            </span>
                            <button
                              type="button"
                              onClick={() => field.onChange("")}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                        <AvailabilityCalendar
                          bookingMode
                          availability={availability}
                          selectedDate={field.value || undefined}
                          onSelectDate={(date) => field.onChange(date)}
                          onMonthChange={(y, m) => {
                            setCalYear(y);
                            setCalMonth(m);
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell them about yourself</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share a little about your pregnancy journey, birth preferences, what kind of support you're looking for..."
                          className="min-h-32 resize-none"
                          {...field}
                          data-testid="textarea-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 rounded-full shadow-lg shadow-primary/20"
                  disabled={createBooking.isPending}
                  data-testid="button-submit-booking"
                >
                  {createBooking.isPending
                    ? "Sending..."
                    : hasDeposit
                    ? `Send request & pay ${depositFormatted} deposit`
                    : "Send consultation request"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
