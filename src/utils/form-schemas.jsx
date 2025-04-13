import * as z from "zod"


export const orgDetailsFormSchema = z.object({
    orgName: z.string(),
    operationField: z.string(),
    orgType: z.string(),
    orgEmail: z.string(),
    orgLogo: z.string(),
    industryClass: z.string(),
    orgPhone: z.string(),
    orgWebsite: z.string().optional(),
    orgBio: z.string().min(10).max(1000),
    orgRegion: z.string(),
    orgDistrict: z.string(),
    orgCity: z.string(),
    orgStreet: z.string()
})

export const orgVerDocsFormSchema = z.object({
    orgVerDocs: z
      .array(z.any())  // Accepts an array of files
      .nonempty("At least one document is required")
      .refine(
        (files) => files.every((file) => file.size <= 4 * 1024 * 1024),
        "Each file must be less than 4MB"
      )
      .refine(
        (files) => files.every((file) => 
          ['image/png', 'image/jpeg', 'application/pdf'].includes(file.type)
        ),
        "Only PNG, JPG, and PDF files are allowed"
      )
  });

export const orgAdminAccountFormSchema = z.object({
    accountFullName: z.string(),
    accountPhoneNumber: z.string(),
    accountRole: z.string(),
    accountJobTitle: z.string()
})
