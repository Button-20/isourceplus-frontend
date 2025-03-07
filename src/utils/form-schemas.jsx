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
    orgVerDocs: z.string()
})

export const orgAdminAccountFormSchema = z.object({
    accountFullName: z.string(),
    accountPhoneNumber: z.string(),
    accountRole: z.string(),
    accountJobTitle: z.string()
})
