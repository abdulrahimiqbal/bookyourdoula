import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, Video, Upload, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateDoula,
  useUpdateDoula,
  useGetDoula,
  useGetDoulaAvailability,
  useSetDoulaAvailability,
  getGetDoulaQueryKey,
} from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { useQueryClient } from "@tanstack/react-query";
import { AvailabilityCalendar } from "@/components/availability-calendar";

const STEPS = [
  { id: "basic", label: "Basic Info" },
  { id: "bio", label: "Bio & Story" },
  { id: "services", label: "Services & Rates" },
  { id: "credentials", label: "Credentials" },
  { id: "availability", label: "Availability" },
];

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  tagline: z.string().max(120, "Keep it under 120 characters").optional(),
  bio: z.string().min(50, "Please write at least 50 characters about yourself"),
  philosophyStatement: z.string().optional(),
  approachDescription: z.string().optional(),
  photoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  videoIntroUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  serviceTypes: z.array(z.string()).min(1, "Select at least one service type"),
  yearsExperience: z.coerce.number().int().min(0).optional().or(z.literal("")),
  birthsAttended: z.coerce.number().int().min(0).optional().or(z.literal("")),
  certifications: z.array(z.object({ value: z.string() })),
  trainings: z.array(z.object({ value: z.string() })),
  specialties: z.array(z.object({ value: z.string() })),
  languages: z.array(z.object({ value: z.string() })),
  rateMin: z.coerce.number().int().min(0).optional().or(z.literal("")),
  rateMax: z.coerce.number().int().min(0).optional().or(z.literal("")),
  consultationDepositCents: z.coerce.number().int().min(0).optional().or(z.literal("")),
  acceptingClients: z.boolean(),
  insuranceAccepted: z.boolean(),
  slidingScaleAvailable: z.boolean(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  instagramHandle: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const SERVICE_TYPES = [
  { value: "birth", label: "Birth Doula" },
  { value: "postpartum", label: "Postpartum Doula" },
  { value: "birth_and_postpartum", label: "Birth & Postpartum" },
];

const COMMON_CERTS = ["DONA International", "CAPPA", "Lamaze International", "Evidence Based Birth", "Spinning Babies"];
const COMMON_SPECIALTIES = ["Water birth", "VBAC", "Twins", "High-risk pregnancy", "Teen parents", "LGBTQ+ families", "Loss & grief", "Breastfeeding support", "Infant massage"];
const COMMON_LANGUAGES = ["English", "French", "Arabic", "Spanish", "Mandarin", "Somali", "Swahili"];

type SimpleFieldArray = {
  fields: Array<{ id: string; value: string }>;
  append: (val: { value: string }) => void;
  remove: (index: number) => void;
};

function ArrayField({
  label,
  fieldArray,
  placeholder,
  suggestions = [],
  testPrefix,
}: {
  label: string;
  fieldArray: SimpleFieldArray;
  placeholder: string;
  suggestions?: string[];
  testPrefix: string;
}) {
  const [input, setInput] = useState("");

  function addItem(val: string) {
    const trimmed = val.trim();
    if (trimmed) {
      fieldArray.append({ value: trimmed } as never);
      setInput("");
    }
  }

  return (
    <div className="space-y-3">
      <FormLabel>{label}</FormLabel>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem(input);
            }
          }}
          data-testid={`input-${testPrefix}`}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => addItem(input)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => addItem(s)}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {fieldArray.fields.map((field, i) => (
          <Badge
            key={field.id}
            variant="secondary"
            className="flex items-center gap-1 pr-1"
            data-testid={`badge-${testPrefix}-${i}`}
          >
            {(field as { value: string }).value}
            <button
              type="button"
              onClick={() => fieldArray.remove(i)}
              className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

function computeCompleteness(values: Partial<FormValues>): number {
  let score = 0;
  if (values.name) score += 10;
  if (values.bio && values.bio.length > 50) score += 15;
  if (values.tagline) score += 5;
  if (values.photoUrl) score += 15;
  if (values.serviceTypes && values.serviceTypes.length > 0) score += 10;
  if (values.yearsExperience) score += 5;
  if (values.certifications && values.certifications.length > 0) score += 10;
  if (values.rateMin || values.rateMax) score += 10;
  if (values.languages && values.languages.length > 0) score += 5;
  if (values.philosophyStatement) score += 10;
  if (values.approachDescription) score += 5;
  return Math.min(score, 100);
}

/** Availability step sub-component */
function AvailabilityStep({ doulaId }: { doulaId: number | null }) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const { data: availability = [] } = useGetDoulaAvailability(
    doulaId!,
    { year: calYear, month: calMonth },
    { query: { enabled: !!doulaId, queryKey: ["doulas", doulaId, "availability", calYear, calMonth] } }
  );

  const setAvailability = useSetDoulaAvailability();

  const mergedAvailability = [
    ...availability.filter((a) => !(a.date in localOverrides)),
    ...Object.entries(localOverrides).map(([date, available]) => ({ date, available, id: 0, doulaId: doulaId! })),
  ];

  const handleToggle = useCallback(
    (date: string, available: boolean) => {
      if (!doulaId) return;
      setLocalOverrides((prev) => ({ ...prev, [date]: available }));
      const dates = [
        ...mergedAvailability.filter((a) => a.date !== date),
        { date, available },
      ].map((a) => ({ date: a.date, available: a.available }));
      setAvailability.mutate(
        { id: doulaId, data: { dates } },
        {
          onError: () => {
            toast({ title: "Could not save availability", variant: "destructive" });
            setLocalOverrides((prev) => {
              const next = { ...prev };
              delete next[date];
              return next;
            });
          },
        }
      );
    },
    [doulaId, mergedAvailability, setAvailability, toast]
  );

  if (!doulaId) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <p>Create your profile first, then set your availability from the edit view.</p>
      </div>
    );
  }

  return (
    <AvailabilityCalendar
      editable
      availability={mergedAvailability}
      onToggle={handleToggle}
      onMonthChange={(y, m) => {
        setCalYear(y);
        setCalMonth(m);
        setLocalOverrides({});
      }}
    />
  );
}

export default function DoulaForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const doulaId = id ? parseInt(id, 10) : null;
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existing, isLoading: existingLoading } = useGetDoula(doulaId!, {
    query: { enabled: !!doulaId, queryKey: getGetDoulaQueryKey(doulaId!) },
  });

  const createDoula = useCreateDoula();
  const updateDoula = useUpdateDoula();

  const { uploadFile, isUploading: isVideoUploading, progress: videoProgress } = useUpload({
    onSuccess: (response) => {
      const videoUrl = `/api/storage${response.objectPath}`;
      form.setValue("videoIntroUrl", videoUrl);
      toast({ title: "Video uploaded", description: "Your intro video has been saved." });
    },
    onError: (err) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "Ottawa, ON",
      tagline: "",
      bio: "",
      philosophyStatement: "",
      approachDescription: "",
      photoUrl: "",
      videoIntroUrl: "",
      serviceTypes: [],
      yearsExperience: "",
      birthsAttended: "",
      certifications: [],
      trainings: [],
      specialties: [],
      languages: [],
      rateMin: "",
      rateMax: "",
      consultationDepositCents: "",
      acceptingClients: true,
      insuranceAccepted: false,
      slidingScaleAvailable: false,
      website: "",
      instagramHandle: "",
    },
  });

  useEffect(() => {
    if (existing && isEdit) {
      form.reset({
        name: existing.name,
        email: existing.email,
        phone: existing.phone ?? "",
        location: existing.location,
        tagline: existing.tagline ?? "",
        bio: existing.bio,
        philosophyStatement: existing.philosophyStatement ?? "",
        approachDescription: existing.approachDescription ?? "",
        photoUrl: existing.photoUrl ?? "",
        videoIntroUrl: existing.videoIntroUrl ?? "",
        serviceTypes: existing.serviceTypes,
        yearsExperience: existing.yearsExperience ?? "",
        birthsAttended: existing.birthsAttended ?? "",
        certifications: (existing.certifications ?? []).map((v) => ({ value: v })),
        trainings: (existing.trainings ?? []).map((v) => ({ value: v })),
        specialties: (existing.specialties ?? []).map((v) => ({ value: v })),
        languages: (existing.languages ?? []).map((v) => ({ value: v })),
        rateMin: existing.rateMin ?? "",
        rateMax: existing.rateMax ?? "",
        consultationDepositCents: existing.consultationDepositCents ?? "",
        acceptingClients: existing.acceptingClients,
        insuranceAccepted: existing.insuranceAccepted,
        slidingScaleAvailable: existing.slidingScaleAvailable,
        website: existing.website ?? "",
        instagramHandle: existing.instagramHandle ?? "",
      });
    }
  }, [existing, isEdit, form]);

  const certifications = useFieldArray({ control: form.control, name: "certifications" }) as unknown as SimpleFieldArray;
  const trainings = useFieldArray({ control: form.control, name: "trainings" }) as unknown as SimpleFieldArray;
  const specialties = useFieldArray({ control: form.control, name: "specialties" }) as unknown as SimpleFieldArray;
  const languages = useFieldArray({ control: form.control, name: "languages" }) as unknown as SimpleFieldArray;

  const watchedValues = form.watch();
  const completeness = computeCompleteness(watchedValues);
  const videoIntroUrl = form.watch("videoIntroUrl");

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      location: values.location,
      tagline: values.tagline || undefined,
      bio: values.bio,
      philosophyStatement: values.philosophyStatement || undefined,
      approachDescription: values.approachDescription || undefined,
      photoUrl: values.photoUrl || undefined,
      videoIntroUrl: values.videoIntroUrl || undefined,
      serviceTypes: values.serviceTypes,
      yearsExperience: values.yearsExperience ? Number(values.yearsExperience) : undefined,
      birthsAttended: values.birthsAttended ? Number(values.birthsAttended) : undefined,
      certifications: values.certifications.map((c) => c.value),
      trainings: values.trainings.map((t) => t.value),
      specialties: values.specialties.map((s) => s.value),
      languages: values.languages.map((l) => l.value),
      rateMin: values.rateMin ? Number(values.rateMin) : undefined,
      rateMax: values.rateMax ? Number(values.rateMax) : undefined,
      consultationDepositCents: values.consultationDepositCents ? Number(values.consultationDepositCents) : undefined,
      acceptingClients: values.acceptingClients,
      insuranceAccepted: values.insuranceAccepted,
      slidingScaleAvailable: values.slidingScaleAvailable,
      website: values.website || undefined,
      instagramHandle: values.instagramHandle || undefined,
    };

    if (isEdit && doulaId) {
      updateDoula.mutate(
        { id: doulaId, data: payload },
        {
          onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: getGetDoulaQueryKey(doulaId) });
            toast({ title: "Profile updated", description: "Your changes have been saved." });
            setLocation(`/doulas/${updated.id}`);
          },
          onError: () => {
            toast({ title: "Error", description: "Could not save changes. Please try again.", variant: "destructive" });
          },
        }
      );
    } else {
      createDoula.mutate(
        { data: payload },
        {
          onSuccess: (created) => {
            toast({ title: "Profile created", description: "Welcome to BookYourDoula!" });
            setLocation(`/doulas/${created.id}`);
          },
          onError: () => {
            toast({ title: "Error", description: "Could not create profile. Please try again.", variant: "destructive" });
          },
        }
      );
    }
  }

  if (isEdit && existingLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const isPending = createDoula.isPending || updateDoula.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-2xl">
        <Link href={isEdit && doulaId ? `/doulas/${doulaId}` : "/doulas"} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ChevronLeft className="h-4 w-4" />
          {isEdit ? "Back to profile" : "Back to directory"}
        </Link>

        <div className="mb-8">
          <h1 className="font-serif text-3xl text-foreground mb-1">
            {isEdit ? "Edit your profile" : "Join as a doula"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? "Keep your profile up to date to attract the right families."
              : "Create a comprehensive profile that helps families find and trust you."}
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-6 bg-primary/5 border-primary/10">
          <CardContent className="p-4">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-medium text-foreground">Profile completeness</span>
              <span className="text-xs font-medium text-primary" data-testid="text-completeness-score">{completeness}%</span>
            </div>
            <Progress value={completeness} className="h-2" />
          </CardContent>
        </Card>

        {/* Step nav */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-secondary/20 text-secondary"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid={`button-step-${s.id}`}
            >
              {i < step && <CheckCircle className="h-3 w-3 inline mr-1" />}
              {s.label}
            </button>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Basic information</CardTitle>
                  <CardDescription>The essentials families need to find you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl><Input placeholder="Your name" {...field} data-testid="input-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid sm:grid-cols-2 gap-5">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="you@example.com" {...field} data-testid="input-email" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl><Input type="tel" placeholder="613-555-0100" {...field} data-testid="input-phone" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl><Input placeholder="City, Province" {...field} data-testid="input-location" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tagline" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tagline <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl><Input placeholder="Your care philosophy in one sentence..." {...field} data-testid="input-tagline" /></FormControl>
                      <FormDescription>Max 120 characters. This shows on your profile card.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="photoUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile photo URL <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl><Input type="url" placeholder="https://example.com/your-photo.jpg" {...field} data-testid="input-photo-url" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Video intro upload */}
                  <FormField control={form.control} name="videoIntroUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Video className="h-4 w-4" /> Video introduction <span className="text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      {videoIntroUrl ? (
                        <div className="rounded-xl overflow-hidden bg-black relative aspect-video">
                          <video src={videoIntroUrl} controls className="w-full h-full" />
                          <button
                            type="button"
                            onClick={() => field.onChange("")}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <label className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-border rounded-xl hover:border-primary/40 hover:bg-primary/3 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                              {isVideoUploading ? (
                                <div className="relative w-5 h-5">
                                  <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                                  <div
                                    className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"
                                    style={{ clipPath: `inset(0 ${100 - videoProgress}% 0 0)` }}
                                  />
                                </div>
                              ) : (
                                <Upload className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">
                                {isVideoUploading ? `Uploading… ${videoProgress}%` : "Upload a video intro"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">MP4, WebM up to 100 MB</p>
                            </div>
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              className="hidden"
                              disabled={isVideoUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadFile(file);
                              }}
                            />
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground">or paste a URL</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://youtube.com/watch?v=..."
                              {...field}
                              data-testid="input-video-url"
                            />
                          </FormControl>
                        </div>
                      )}
                      <FormDescription>YouTube, Vimeo, or direct video link. Families see this on your profile.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            )}

            {/* Step 1: Bio & Story */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Your story</CardTitle>
                  <CardDescription>Help families understand who you are and how you work</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>About you</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your journey to becoming a doula, your values, what drives your work, and what families can expect from you..."
                          className="min-h-36 resize-none"
                          {...field}
                          data-testid="textarea-bio"
                        />
                      </FormControl>
                      <FormDescription>{field.value?.length ?? 0} characters (50 minimum)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="philosophyStatement" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth philosophy <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A statement that captures your core beliefs about birth and support..."
                          className="min-h-24 resize-none"
                          {...field}
                          data-testid="textarea-philosophy"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="approachDescription" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your approach <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="How do you support families during labour, postpartum, or through challenges?"
                          className="min-h-24 resize-none"
                          {...field}
                          data-testid="textarea-approach"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <ArrayField
                    label="Specialties"
                    fieldArray={specialties}
                    placeholder="Add a specialty..."
                    suggestions={COMMON_SPECIALTIES}
                    testPrefix="specialty"
                  />
                  <ArrayField
                    label="Languages spoken"
                    fieldArray={languages}
                    placeholder="Add a language..."
                    suggestions={COMMON_LANGUAGES}
                    testPrefix="language"
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Services & Rates */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Services & rates</CardTitle>
                  <CardDescription>What do you offer and what's your pricing?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField control={form.control} name="serviceTypes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service types</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SERVICE_TYPES.map((type) => {
                          const selected = field.value?.includes(type.value);
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => {
                                const current = field.value ?? [];
                                field.onChange(
                                  selected ? current.filter((v) => v !== type.value) : [...current, type.value]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                selected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border text-muted-foreground hover:text-foreground"
                              }`}
                              data-testid={`button-service-type-${type.value}`}
                            >
                              {type.label}
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid sm:grid-cols-2 gap-5">
                    <FormField control={form.control} name="rateMin" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum rate ($)</FormLabel>
                        <FormControl><Input type="number" min={0} placeholder="e.g. 800" {...field} data-testid="input-rate-min" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="rateMax" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum rate ($)</FormLabel>
                        <FormControl><Input type="number" min={0} placeholder="e.g. 1500" {...field} data-testid="input-rate-max" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="consultationDepositCents" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultation deposit <span className="text-muted-foreground font-normal">(optional, in cents)</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">¢</span>
                          <Input type="number" min={0} className="pl-7" placeholder="e.g. 7500 = $75.00 CAD" {...field} data-testid="input-deposit" />
                        </div>
                      </FormControl>
                      <FormDescription>Enter in cents (e.g. 7500 for $75). Families pay this when submitting a booking request.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="space-y-4">
                    <FormField control={form.control} name="insuranceAccepted" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel className="text-base">Insurance accepted</FormLabel>
                          <p className="text-sm text-muted-foreground">You work with families using insurance coverage</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-insurance" />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="slidingScaleAvailable" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel className="text-base">Sliding scale available</FormLabel>
                          <p className="text-sm text-muted-foreground">Rate adjustable based on family's financial situation</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-sliding-scale" />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Credentials */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Credentials & training</CardTitle>
                  <CardDescription>Certifications and training that build client trust</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of experience</FormLabel>
                        <FormControl><Input type="number" min={0} placeholder="e.g. 5" {...field} data-testid="input-years" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="birthsAttended" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Births attended</FormLabel>
                        <FormControl><Input type="number" min={0} placeholder="e.g. 75" {...field} data-testid="input-births" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <ArrayField
                    label="Certifications"
                    fieldArray={certifications}
                    placeholder="Add a certification..."
                    suggestions={COMMON_CERTS}
                    testPrefix="cert"
                  />
                  <ArrayField
                    label="Trainings & workshops"
                    fieldArray={trainings}
                    placeholder="Add a training or workshop..."
                    testPrefix="training"
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 4: Availability */}
            {step === 4 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif">Availability & links</CardTitle>
                    <CardDescription>Set your open dates and let families know how to reach you</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <FormField control={form.control} name="acceptingClients" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-secondary/5">
                        <div>
                          <FormLabel className="text-base">Accepting new clients</FormLabel>
                          <p className="text-sm text-muted-foreground">Toggle off when your schedule is full</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-accepting" />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="website" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl><Input type="url" placeholder="https://yourwebsite.com" {...field} data-testid="input-website" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="instagramHandle" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram handle <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                            <Input className="pl-7" placeholder="yourhandle" {...field} data-testid="input-instagram" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                {/* Availability calendar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-base">Monthly availability</CardTitle>
                    <CardDescription>Mark the days you're available for consultations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AvailabilityStep doulaId={doulaId} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                data-testid="button-prev-step"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  data-testid="button-next-step"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isPending}
                  className="shadow-lg shadow-primary/20"
                  data-testid="button-submit-profile"
                >
                  {isPending ? "Saving..." : isEdit ? "Save changes" : "Create profile"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
