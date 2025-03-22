import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  LineChart,
  ChartBar,
  Laptop2,
  Signature,
  Info,
  User,
  Facebook,
  FacebookIcon,
  Mail,
  MailIcon,
  Linkedin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaFacebook, FaLinkedin } from "react-icons/fa";
import { GiMailbox } from "react-icons/gi";

export function LoginPage() {

    const navigate = useNavigate()
  const handleLogin = (e) => {
    e.preventDefault()

    navigate('/onboarding')
  };

  return (
    <>
      <div className="flex flex-col min-h-screen md:flex-row">
        <div className="w-full md:w-1/2 login-01 text-white py-8 px-16 flex flex-col m-1 rounded overflow-hidden">
          <div className="glassDiv h-full w-full p-10 flex flex-col justify-center space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
                Move Fast.
                <br />
                Break Nothing.
              </h1>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-white/50 p-2">
                  <Laptop2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl">Lorem, ipsum.</h3>
                  <p className="text-sm">
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Impedit, maxime repellendus! Suscipit perferendis enim
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-white/50 p-2">
                  <ChartBar className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl">Lorem, ipsum.</h3>
                  <p className="text-sm">
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Impedit, maxime repellendus! Suscipit perferendis enim
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-white/50 p-2">
                  <LineChart className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl">Lorem, ipsum.</h3>
                  <p className="text-sm">
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Impedit, maxime repellendus! Suscipit perferendis enim
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h1 className="font-bold tracking-tight">
                <Link to={"/"}>I Source Plus</Link>
              </h1>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 flex flex-col">
          <div className="flex justify-end mb-8">
            <Button variant="secondary">
              <Link to={"/signup"} className="text-sm font-medium">
                Sign Up
              </Link>
              <ArrowRight className="h-3 w-3 ml-4" />
            </Button>
          </div>
          <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full">
            <h1 className="text-2xl font-bold mb-4">Login</h1>
            <p className="text-sm text-gray-600 mb-4">
              Enter your email and password to login
            </p>
            <form className="space-y-4" onSubmit={handleLogin}>
              <Input type="email" name="email" placeholder="name@example.com" />
              <Button
                className="w-full bg-black text-white hover:bg-gray-800"
                type="submit"
              >
                Login with Email
              </Button>
            </form>

            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  or sign up with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <Button variant="outline" className="">
                <FaLinkedin color="#0077B5" />
                LinkedIn
              </Button>

              <Button variant="outline" className="">
                <MailIcon />
                Gmail
              </Button>

              <Button variant="outline" className="">
                <FaFacebook color="#1877F2" />
                Facebook
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function SignUpPage() {

    const navigate = useNavigate()
  const handleEmailSignUp = (e) => {
    e.preventDefault();
    navigate('/onboarding')

  };

  return (
    <>
      <div className="flex flex-col min-h-screen md:flex-row">
        <div className="w-full md:w-1/2 login-01 text-white py-8 px-16 flex flex-col m-1 rounded overflow-hidden">
          <div className="glassDiv h-full w-full p-10 flex flex-col justify-center space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
                Sign Up.
                <br />
                Source Now.
              </h1>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-white/50 p-2">
                  <Signature className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl">Lorem, ipsum.</h3>
                  <p className="text-sm">
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Impedit, maxime repellendus! Suscipit perferendis enim
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-white/50 p-2">
                  <Info className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl">Lorem, ipsum.</h3>
                  <p className="text-sm">
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Impedit, maxime repellendus! Suscipit perferendis enim
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-white/50 p-2">
                  <User className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl">Lorem, ipsum.</h3>
                  <p className="text-sm">
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Impedit, maxime repellendus! Suscipit perferendis enim
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h1 className="font-bold tracking-tight">
                <Link to={"/"}>I Source Plus</Link>
              </h1>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 flex flex-col">
          <div className="flex justify-end mb-8">
            <Button variant="secondary">
              <Link to={"/login"} className="text-sm font-medium">
                Login
              </Link>
              <ArrowRight className="h-3 w-3 ml-4" />
            </Button>
          </div>

          <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full">
            <h1 className="text-2xl font-bold mb-4">Create an account</h1>
            <p className="text-sm text-gray-600 mb-4">
              Enter your email below to create your account
            </p>
            <form className="space-y-4" onSubmit={handleEmailSignUp}>
              <Input
                required
                type="email"
                name="email"
                placeholder="name@example.com"
              />

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                Sign up with Email
              </Button>
            </form>

            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  or sign up with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <Button variant="outline" className="">
                <FaLinkedin color="#0077B5" />
                LinkedIn
              </Button>

              <Button variant="outline" className="">
                <MailIcon />
                Gmail
              </Button>

              <Button variant="outline" className="">
                <FaFacebook color="#1877F2" />
                Facebook
              </Button>
            </div>
            <p className="mt-4 text-xs text-center text-gray-600">
              By clicking continue, you agree to our{" "}
              <Link to="/terms" className="underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
