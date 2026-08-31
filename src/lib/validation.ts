import { z } from "zod";
import { PICKUP_AT_PATTERN } from "@/lib/rental";

export const dateStrSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
export const pickupAtSchema = z.string().regex(PICKUP_AT_PATTERN, "Expected YYYY-MM-DDTHH:mm");

export const customerInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().toLowerCase().email().max(200).optional().or(z.literal("")),
  phone: z.string().trim().min(1, "Phone is required").max(50),
  org: z.string().trim().max(200).optional().or(z.literal("")),
});

const bookingCommonSchema = {
  pickupAt: pickupAtSchema,
  eventName: z.string().trim().max(200).optional().or(z.literal("")),
  eventAddress: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  customer: customerInputSchema,
  // Section 3.6: online bookings must be e-signed at checkout — this is the
  // typed name; the hash/IP/timestamp are computed server-side, never
  // trusted from the client.
  signatureName: z.string().trim().min(1, "Type your name to sign the rental agreement").max(200),
  agreedToTerms: z
    .boolean()
    .refine((v) => v === true, { message: "You must agree to the rental agreement terms." }),
  humanVerified: z
    .boolean()
    .refine((v) => v === true, { message: "Please confirm you're not a robot." }),
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

// A cart checkout — multiple different items in one booking, as opposed to
// itemBookingSchema's single item + quantity.
export const cartBookingSchema = z.object({
  kind: z.literal("cart"),
  lines: z
    .array(
      z.object({
        itemId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(50),
      })
    )
    .min(1, "Add at least one item to the cart"),
  ...bookingCommonSchema,
});

export const bookingInputSchema = z.discriminatedUnion("kind", [
  itemBookingSchema,
  packageBookingSchema,
  cartBookingSchema,
]);

export type BookingInput = z.infer<typeof bookingInputSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const customerSignupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const customerLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const leadInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().min(1, "Phone is required").max(50),
  eventDate: dateStrSchema,
  eventTimeSlot: z.string().trim().max(20).optional().or(z.literal("")),
  eventType: z.enum(["Home", "Commercial", "Corporate", "Other"]),
  guestCount: z.coerce.number().int().min(0).max(100000),
  eventAddress: z.string().trim().min(1, "Venue name & address is required").max(300),
  venueType: z.enum(["Indoor", "Outdoor"]),
  powerAvailable: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  signatureName: z.string().trim().min(1, "Printed name is required to sign.").max(200),
  agreedToTerms: z
    .boolean()
    .refine((v) => v === true, { message: "You must agree to the rental agreement terms." }),
  humanVerified: z
    .boolean()
    .refine((v) => v === true, { message: "Please confirm you're not a robot." }),
  // honeypot — real visitors never see or fill this field
  website: z.string().max(200).optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(2000),
  // honeypot — real visitors never see or fill this field
  website: z.string().max(200).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactInputSchema>;
