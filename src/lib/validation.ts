import { z } from "zod";

export const slotSchema = z.enum(["MORNING", "AFTERNOON"]);
export const dateStrSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const customerInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  phone: z.string().trim().min(1, "Phone is required").max(50),
  org: z.string().trim().max(200).optional().or(z.literal("")),
});

const bookingCommonSchema = {
  date: dateStrSchema,
  slot: slotSchema,
  eventName: z.string().trim().max(200).optional().or(z.literal("")),
  eventAddress: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  customer: customerInputSchema,
};

export const itemBookingSchema = z.object({
  kind: z.literal("item"),
  itemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
  ...bookingCommonSchema,
});

export const packageBookingSchema = z.object({
  kind: z.literal("package"),
  packageId: z.string().min(1),
  ...bookingCommonSchema,
});

export const bookingInputSchema = z.discriminatedUnion("kind", [
  itemBookingSchema,
  packageBookingSchema,
]);

export type BookingInput = z.infer<typeof bookingInputSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const leadInputSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    email: z.string().trim().email().max(200).optional().or(z.literal("")),
    phone: z.string().trim().max(50).optional().or(z.literal("")),
    org: z.string().trim().max(200).optional().or(z.literal("")),
    eventDate: dateStrSchema.optional().or(z.literal("")),
    roomSize: z.string().trim().max(200).optional().or(z.literal("")),
    guestCount: z.coerce.number().int().min(0).max(100000).optional(),
    recommendedTier: z.string().trim().max(100).optional().or(z.literal("")),
    eventAddress: z.string().trim().max(300).optional().or(z.literal("")),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    // honeypot — real visitors never see or fill this field
    website: z.string().max(200).optional().or(z.literal("")),
  })
  .refine((data) => data.email || data.phone, {
    message: "Provide an email or phone number so we can reach you.",
    path: ["email"],
  });

export type LeadInput = z.infer<typeof leadInputSchema>;
