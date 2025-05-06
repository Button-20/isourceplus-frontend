import { z } from "zod";

export const onboardingSchema = z.object({
  // Role step
  role: z.enum(["supplier", "buyer", "transporter"]),
  
  // Profile step
  job_title: z.string().min(2, "Job title is required"),
  job_position: z.string().min(2, "Job position is required"),
  profile_photo: z.any().optional(),
  cell_1: z.string().min(6, "Phone number is required"),
  cell_2: z.string().optional(),
  social_links: z.string().url("Invalid URL").or(z.literal("")).optional(),
  
  // Organization step
  name: z.string().min(2, "Name is required"),
  type: z.string().optional(),
  field: z.string().min(1, "Field is required"),
  industry: z.string().min(1, "Industry is required"),
  sector: z.string().min(1, "Sector is required"),
  bio: z.string().min(10, "Description is too short"),
  logo: z.any().optional(),
  email: z.string().email("Invalid email"),
  office_line: z.string().min(6, "Phone number is required"),
  office_line_2: z.string().optional(),
  web_address: z.string().url("Invalid URL").or(z.literal("")).optional(),
  
  // Transporter specific
  transport_mode: z.string().optional(),
  transport_means: z.string().optional(),
  vehicle_image: z.any().optional(),
});