import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PaystackPop from "@paystack/inline-js";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { roles } from "@/utils/user-roles";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneInput } from "@/components/phone-input";
import { supplierPlans, buyerPlans } from "@/utils/user-subscription-plans";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/file-upload";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  orgDetailsFormSchema,
  orgVerDocsFormSchema,
  orgAdminAccountFormSchema,
} from "@/utils/form-schemas";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Building2,
  Calendar,
  Verified,
  User,
  Users,
  CloudUpload,
  Paperclip,
  Check,
  X,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { AppContext } from "@/contexts/app.context";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export function OnBoardingOrgRolePage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate()

  const steps = [
    {
      icon: Building2,
      label: "Organization Information",
      active: false,
      completed: false,
    },
    {
      icon: Verified,
      label: "Verification Documents",
      active: false,
      completed: false,
    },
    {
      icon: Calendar,
      label: "Subscription Plan",
      active: false,
      completed: false,
    },
    {
      icon: User,
      label: "Admin Account Settings",
      active: false,
      completed: false,
    },
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  const handleSubmit = () => {
    if (selectedRole) {
      console.log(`Selected role: ${selectedRole}`);
      navigate("/onboarding/details");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Please select a role to continue.");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 space-y-4 text-center">
          <div className="inline-block rounded-full bg-purple-100 p-2">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome to
            <br />
            I-Source-Plus
          </h1>

          <p className="mx-auto max-w-2xl text-base text-gray-600">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio,
            ullam minima sint dolore autem corporis aut sequi, accusantium
            eveniet, sit quaerat praesentium odio.
          </p>
          <div className="flex justify-center space-x-2 text-sm font-medium">
            <span className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              Step 0 of 4
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-8">
          <div className="mb-8 lg:mb-0 lg:w-64">
            <nav className="flex flex-row flex-wrap justify-center gap-2 lg:flex-col lg:gap-1">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    step.active ? "text-purple-600" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                      step.completed
                        ? "border-purple-600 bg-purple-600 text-white"
                        : ""
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className="hidden lg:inline">{step.label}</span>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex-1">
            <div className="relative overflow-hidden rounded-lg bg-white shadow-lg">
              <div className="relative z-10 p-6 sm:p-8">
                <div className="mb-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Organization Role
                  </h2>
                  <Separator className="my-2 w-[40%]" />
                </div>
                <div className="space-y-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {roles.map((role) => (
                      <div>
                        <Card
                          className={` cursor-pointer transition-all hover:shadow-lg ${
                            selectedRole === role.id
                              ? "ring-2 ring-purple-500"
                              : ""
                          }`}
                          onClick={() => handleRoleSelect(role.id)}
                        >
                          <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl">
                              <div
                                className={`rounded-full p-2 text-white ${role.color}`}
                              >
                                <role.icon className="h-6 w-6" />
                              </div>
                              {role.title}
                            </CardTitle>
                            <CardDescription className="text-lg">
                              {role.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="mt-4 space-y-2">
                              {role.benefits.map((benefit, index) => (
                                <li
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                          <CardFooter>
                            <Button
                              variant={
                                selectedRole === role.id ? "default" : "outline"
                              }
                              className="w-full"
                            >
                              {selectedRole === role.id
                                ? "Selected"
                                : "Choose This Role"}
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex">
                    <Button type="submit" className="gap-6" onClick={handleSubmit}>
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OnBoardingOrgDetailsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { currency } = useContext(AppContext);

  const navigate = useNavigate();

  const steps = [
    {
      icon: Building2,
      label: "Organization Information",
      active: true,
      completed: false,
    },
    {
      icon: Verified,
      label: "Verification Documents",
      active: false,
      completed: false,
    },
    {
      icon: Calendar,
      label: "Subscription Plan",
      active: false,
      completed: false,
    },
    {
      icon: User,
      label: "Admin Account Settings",
      active: false,
      completed: false,
    },
  ];

  const form = useForm({
    resolver: zodResolver(orgDetailsFormSchema),
    defaultValues: {},
  });

  const onSubmit = (values) => {
    console.log(values);
    navigate("/onboarding/verification");
    window.scrollTo({ top: 0, behavior: "smooth" });    
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 space-y-4 text-center">
          <div className="inline-block rounded-full bg-purple-100 p-2">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome to
            <br />
            I-Source-Plus
          </h1>

          <p className="mx-auto max-w-2xl text-base text-gray-600">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio,
            ullam minima sint dolore autem corporis aut sequi, accusantium
            eveniet, sit quaerat praesentium odio.
          </p>
          <div className="flex justify-center space-x-2 text-sm font-medium">
            <span className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              Step 1 of 4
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-8">
          <div className="mb-8 lg:mb-0 lg:w-64">
            <nav className="flex flex-row flex-wrap justify-center gap-2 lg:flex-col lg:gap-1">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    step.active ? "text-purple-600" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                      step.completed
                        ? "border-purple-600 bg-purple-600 text-white"
                        : ""
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className="hidden lg:inline">{step.label}</span>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex-1">
            <div className="relative overflow-hidden rounded-lg bg-white shadow-lg">
              <div className="relative z-10 p-6 sm:p-8">
                <div className="mb-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Organization Information
                  </h2>
                  <Separator className="my-2 w-[40%]" />
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 max-w-3xl"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="orgName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="w-full" />
                              </FormControl>
                              <FormDescription>
                                full name of your organization
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="operationField"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field Of Operation</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select field of operation" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="technology">
                                    Technology
                                  </SelectItem>
                                  <SelectItem value="healthcare">
                                    Healthcare
                                  </SelectItem>
                                  <SelectItem value="education">
                                    Education
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                organization's field of operation
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="orgType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select organization type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="nonprofit">
                                    Non-Profit
                                  </SelectItem>
                                  <SelectItem value="corporate">
                                    Corporate
                                  </SelectItem>
                                  <SelectItem value="startup">
                                    Startup
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                what type of organization do you fall under?
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="orgEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  {...field}
                                  className="w-full"
                                  placeholder="contact@example.com"
                                />
                              </FormControl>
                              <FormDescription>
                                email address of your organization
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="orgLogo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Logo</FormLabel>
                              <FormControl>
                                <Input
                                  type="file"
                                  {...field}
                                  className="w-full"
                                />
                              </FormControl>
                              <FormDescription>
                                image (logo) of your organization
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="industryClass"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry Classification</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select industry" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="tech">
                                    Technology
                                  </SelectItem>
                                  <SelectItem value="finance">
                                    Finance
                                  </SelectItem>
                                  <SelectItem value="healthcare">
                                    Healthcare
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                industry which you fall under
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="orgPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Contact</FormLabel>
                              <FormControl className="w-full">
                                <PhoneInput
                                  {...field}
                                  defaultCountry="GH"
                                  className="w-full"
                                />
                              </FormControl>
                              <FormDescription>
                                phone number of your organization
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="orgWebsite"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Website</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="example.com"
                                  {...field}
                                  className="w-full"
                                />
                              </FormControl>
                              <FormDescription>
                                website address of your organization if
                                applicable
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="orgBio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief description of your organization"
                              className="resize-y w-full min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            brief history of your organization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="orgRegion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Region</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select region" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="greater-accra">
                                    Greater Accra
                                  </SelectItem>
                                  <SelectItem value="ashanti">
                                    Ashanti
                                  </SelectItem>
                                  <SelectItem value="western">
                                    Western
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                In which region is your organization located
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="orgDistrict"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>District</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select district" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="accra-metropolitan">
                                    Accra Metropolitan
                                  </SelectItem>
                                  <SelectItem value="kumasi">Kumasi</SelectItem>
                                  <SelectItem value="sekondi-takoradi">
                                    Sekondi-Takoradi
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                In which district is your organization located
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="orgCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select city" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="accra">Accra</SelectItem>
                                  <SelectItem value="kumasi">Kumasi</SelectItem>
                                  <SelectItem value="takoradi">
                                    Takoradi
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                In which city is your organization located
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name="orgStreet"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Area</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="w-full"
                                  placeholder="Street or neighborhood"
                                />
                              </FormControl>
                              <FormDescription>
                                on which street is your organization located
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex">
                      <Button type="submit" className="gap-6">
                        Continue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OnBoardingOrgVerificationPage() {
  const [files, setFiles] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate()

  const steps = [
    {
      icon: Building2,
      label: "Organization Information",
      active: true,
      completed: true,
    },
    {
      icon: Verified,
      label: "Verification Documents",
      active: true,
      completed: false,
    },
    {
      icon: Calendar,
      label: "Subscription Plan",
      active: false,
      completed: false,
    },
    {
      icon: User,
      label: "Admin Account Settings",
      active: false,
      completed: false,
    },
  ];


  const dropZoneConfig = {
    maxFiles: 5,
    maxSize: 1024 * 1024 * 4, // 4MB
    multiple: true,
  };
  const form = useForm({
    resolver: zodResolver(orgVerDocsFormSchema),
    defaultValues: {
      orgVerDocs: [],
    }
  });

  useEffect(()=>{
    form.setValue("orgVerDocs", files)
  }, [files, form])
  
  const onSubmit = (values) => {
    try {
      console.log("Submitting form with values:", values);
      navigate("/onboarding/subscription");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 space-y-4 text-center">
          <div className="inline-block rounded-full bg-purple-100 p-2">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome to
            <br />
            I-Source-Plus
          </h1>

          <p className="mx-auto max-w-2xl text-base text-gray-600">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio,
            ullam minima sint dolore autem corporis aut sequi, accusantium
            eveniet, sit quaerat praesentium odio.
          </p>
          <div className="flex justify-center space-x-2 text-sm font-medium">
            <span className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              Step 2 of 4
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-8">
          <div className="mb-8 lg:mb-0 lg:w-64">
            <nav className="flex flex-row flex-wrap justify-center gap-2 lg:flex-col lg:gap-1">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    step.active ? "text-purple-600" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                      step.completed
                        ? "border-purple-600 bg-purple-600 text-white"
                        : ""
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className="hidden lg:inline">{step.label}</span>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex-1">
            <div className="relative overflow-hidden rounded-lg bg-white shadow-lg">
              <div className="relative z-10 p-6 sm:p-8">
                <div className="mb-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Organization Verification
                  </h2>
                  <Separator className="my-2 w-[40%]" />
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 max-w-3xl"
                  >
                    <FormField
                      control={form.control}
                      name="orgVerDocs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Verification Documents</FormLabel>
                          <FormControl>
                            <FileUploader
                              value={files}
                              onValueChange={setFiles}
                              dropzoneOptions={dropZoneConfig}
                              className="relative bg-background rounded-lg p-2"
                            >
                              <FileInput
                                id="fileInput"
                                className="outline-dashed outline-1 outline-slate-500"
                              >
                                <div className="flex items-center justify-center flex-col p-8 w-full ">
                                  <CloudUpload className="text-gray-500 w-10 h-10" />
                                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">
                                      Click to upload
                                    </span>
                                    &nbsp; or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    PNG, JPG or PDF
                                  </p>
                                </div>
                              </FileInput>
                              <FileUploaderContent>
                                {files &&
                                  files.length > 0 &&
                                  files.map((file, i) => (
                                    <FileUploaderItem key={i} index={i}>
                                      <Paperclip className="h-4 w-4 stroke-current" />
                                      <span>{file.name}</span>
                                    </FileUploaderItem>
                                  ))}
                              </FileUploaderContent>
                            </FileUploader>
                          </FormControl>
                          <FormDescription>
                            upload any verifiable organization document (VAT
                            certificate, Business License)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="mt-8 flex">
                      <Button type="submit" className="gap-6">
                        Continue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OnBoardingOrgSubscriptionPlanPage() {
  const navigate = useNavigate()
  const steps = [
    {
      icon: Building2,
      label: "Organization Information",
      active: true,
      completed: true,
    },
    {
      icon: Verified,
      label: "Verification Documents",
      active: true,
      completed: true,
    },
    {
      icon: Calendar,
      label: "Subscription Plan",
      active: true,
      completed: false,
    },
    {
      icon: User,
      label: "Admin Account Settings",
      active: false,
      completed: false,
    },
  ];

  const [userRole] = useState("supplier");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handlePlanSelection = (planId) => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    if (selectedPlan) {
      navigate("/onboarding/account");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const plans = userRole === "supplier" ? supplierPlans : buyerPlans;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 space-y-4 text-center">
          <div className="inline-block rounded-full bg-purple-100 p-2">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome to
            <br />
            I-Source-Plus
          </h1>

          <p className="mx-auto max-w-2xl text-base text-gray-600">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio,
            ullam minima sint dolore autem corporis aut sequi, accusantium
            eveniet, sit quaerat praesentium odio.
          </p>
          <div className="flex justify-center space-x-2 text-sm font-medium">
            <span className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              Step 3 of 4
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-8">
          <div className="mb-8 lg:mb-0 lg:w-64">
            <nav className="flex flex-row flex-wrap justify-center gap-2 lg:flex-col lg:gap-1">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    step.active ? "text-purple-600" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                      step.completed
                        ? "border-purple-600 bg-purple-600 text-white"
                        : ""
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className="hidden lg:inline">{step.label}</span>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex-1">
            <div className="relative overflow-hidden rounded-lg bg-white shadow-lg">
              <div className="relative z-10 p-6 sm:p-8">
                <div className="mb-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Organization Subscription Plan
                  </h2>
                  <Separator className="my-2 w-[40%]" />
                </div>

                <div className="mt-4">
                  <div className="mx-auto max-w-7xl">
                    <div className="grid gap-4 lg:grid-cols-3">
                      {plans.map((plan) => (
                        <Card
                          key={plan.id}
                          className={`relative cursor-pointer transition-all hover:shadow-lg ${
                            plan.popular ? "border-purple-600 shadow-lg" : ""
                          } ${
                            selectedPlan === plan.id
                              ? "ring-2 ring-purple-600"
                              : ""
                          }`}
                          onClick={() => handlePlanSelection(plan.id)}
                        >
                          {plan.popular && (
                            <div className="absolute -top-4 left-0 right-0 mx-auto w-fit">
                              <Badge className="bg-purple-600">
                                Popular Choice
                              </Badge>
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <div
                                className={`h-3 w-3 rounded-full ${plan.color}`}
                              />
                              {plan.name}
                            </CardTitle>
                            <CardDescription>
                              {plan.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-3xl font-bold">
                                GHC {plan.price}
                              </span>
                              <span className="text-muted-foreground">
                                /month
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="font-medium">Includes:</div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {plan.users} Default Users
                              </div>
                              {plan.features.map((feature) => (
                                <div
                                  key={feature.name}
                                  className="flex items-center gap-2"
                                >
                                  {feature.included ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <X className="h-4 w-4 text-red-500" />
                                  )}
                                  {feature.name}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button
                              variant={
                                selectedPlan === plan.id ? "default" : "outline"
                              }
                              className="w-full"
                            >
                              {selectedPlan === plan.id
                                ? "Selected"
                                : "Select Plan"}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-8 flex">
                      <Button
                        onClick={handleContinue}
                        disabled={!selectedPlan}
                        className="gap-6"
                      >
                        Continue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OnBoardingOrgAdminAccountPage() {

  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const steps = [
    {
      icon: Building2,
      label: "Organization Information",
      active: true,
      completed: true,
    },
    {
      icon: Verified,
      label: "Verification Documents",
      active: true,
      completed: true,
    },
    {
      icon: Calendar,
      label: "Subscription Plan",
      active: true,
      completed: true,
    },
    {
      icon: User,
      label: "Admin Account Settings",
      active: true,
      completed: false,
    },
  ];

  const form = useForm({
    resolver: zodResolver(orgAdminAccountFormSchema),
  });

  const onSubmit = (values) => {
    console.log(values);

    navigate('/dashboard');
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 space-y-4 text-center">
          <div className="inline-block rounded-full bg-purple-100 p-2">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome to
            <br />
            I-Source-Plus
          </h1>

          <p className="mx-auto max-w-2xl text-base text-gray-600">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio,
            ullam minima sint dolore autem corporis aut sequi, accusantium
            eveniet, sit quaerat praesentium odio.
          </p>
          <div className="flex justify-center space-x-2 text-sm font-medium">
            <span className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              Step 4 of 4
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-8">
          <div className="mb-8 lg:mb-0 lg:w-64">
            <nav className="flex flex-row flex-wrap justify-center gap-2 lg:flex-col lg:gap-1">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    step.active ? "text-purple-600" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                      step.completed
                        ? "border-purple-600 bg-purple-600 text-white"
                        : ""
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className="hidden lg:inline">{step.label}</span>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex-1">
            <div className="relative overflow-hidden rounded-lg bg-white shadow-lg">
              <div className="relative z-10 p-6 sm:p-8">
                <div className="mb-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Organization Admin Account
                  </h2>
                  <Separator className="my-2 w-[40%]" />
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 max-w-3xl"
                  >
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-6">
                        <FormField
                          control={form.control}
                          name="accountFullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fullname (with title)</FormLabel>
                              <FormControl>
                                <Input placeholder="Mr. example" {...field} />
                              </FormControl>
                              <FormDescription>
                                provide your fullname with title where
                                applicable
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-6">
                        <FormField
                          control={form.control}
                          name="accountPhoneNumber"
                          render={({ field }) => (
                            <FormItem className="flex flex-col items-start">
                              <FormLabel>Phone number</FormLabel>
                              <FormControl className="w-full">
                                <PhoneInput
                                  placeholder=""
                                  {...field}
                                  defaultCountry="GH"
                                />
                              </FormControl>
                              <FormDescription>
                                Enter your phone number.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-6">
                        <FormField
                          control={form.control}
                          name="accountRole"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role in Organization</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="m@example.com">
                                    m@example.com
                                  </SelectItem>
                                  <SelectItem value="m@google.com">
                                    m@google.com
                                  </SelectItem>
                                  <SelectItem value="m@support.com">
                                    m@support.com
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                select the role you play in the organization
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-6">
                        <FormField
                          control={form.control}
                          name="accountJobTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Chief procurement officer"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <Button type="submit">Submit</Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
