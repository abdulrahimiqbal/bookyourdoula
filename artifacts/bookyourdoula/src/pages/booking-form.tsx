import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, CalendarDays, Heart, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useGetDoula, useCreateBooking, getGetDoulaQueryKey } from "@workspace/api-client-react";

const bookingSchema = z.object({
  clientName: z.string().min(2, "Please enter your full name"),
  clientEmail: z.string().email("Please enter a valid email address"),
  clientPhone: z.string().optional(),
  serviceType: z.string().min(1, "Please select a service type"),
  dueDate: z.string().optional(),
  message: z.string().min(20, "Please share at least a little about yourself and what you're looking for (20+ characters)"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookingForm() {
  const { id } = useParams<{ id: string }>();
  const doulaId = parseInt(id!, 10);
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const { data: doula, isLoading } = useGetDoula(doulaId, {
    query: { enabled: !!doulaId, queryKey: getGetDoulaQueryKey(doulaId) },
  });

  const createBooking = useCreateBooking();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      serviceType: "",
      dueDate: "",
      message: "",
    },
  });

  async function onSubmit(values: BookingFormValues) {
    createBooking.mutate(
      {
        data: {
          doulaId,
          clientName: values.clientName,
          clientEmail: values.clientEmail,
          clientPhone: values.clientPhone,
          serviceType: values.serviceType,
          dueDate: values.dueDate,
          message: values.message,
        },
      },
      {
        onSuccess: () => {
          setSubmitted(true);
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
          <h2 className="font-serif text-3xl text-foreground mb-3">Request sent</h2>
          <p className="text-muted-foreground mb-2">
            Your consultation request has been sent to <strong>{doula?.name}</strong>.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            They will typically respond within 24–48 hours. Check your inbox for a confirmation email.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" data-testid="button-back-to-profile">
              <Link href={`/doulas/${doulaId}`}>Back to profile</Link>
            </Button>
            <Button asChild data-testid="button-browse-more">
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
        <Link href={`/doulas/${doulaId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8" data-testid="link-back">
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
              <div>
                <p className="font-medium text-foreground">{doula.name}</p>
                {doula.tagline && <p className="text-sm text-muted-foreground">{doula.tagline}</p>}
              </div>
              <div className="ml-auto">
                <Heart className="h-5 w-5 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="mb-8">
          <h1 className="font-serif text-3xl text-foreground mb-2">Request a consultation</h1>
          <p className="text-muted-foreground">
            Tell {doula?.name ?? "the doula"} a little about yourself and what you're looking for. They'll reach out to arrange a free discovery call.
          </p>
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

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell them about yourself</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share a little about your pregnancy journey, birth preferences, what kind of support you're looking for, any questions you have..."
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
                  {createBooking.isPending ? "Sending..." : "Send consultation request"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
