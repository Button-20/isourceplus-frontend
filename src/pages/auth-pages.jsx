import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
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
  EyeClosed,
  Eye,
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
import { AppContext, useAuth } from "@/contexts/app.context";
import { useContext, useEffect, useState } from "react";

export function LoginPage() {
  const { login, loading, error, setError, user, token, googleLogin } =
    useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const location = useLocation();

  const [displayPassword, setDisplayPassword] = useState(false);

  const handleDisplayPassword = () => {
    setDisplayPassword(!displayPassword);
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password, navigate); // Pass navigate to login
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
      console.error("Login error:", err);
    }
  };

  const handleGoogleLogin = async () => {
    await googleLogin();
  };

  return (
    <>
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left panel - hidden on mobile, visible on lg screens */}
        <div className="hidden lg:flex login-01 text-white p-8 w-full  rounded overflow-hidden">
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

        {/* Right panel - login form (always visible) */}
        <div className="p-8 flex flex-col">
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
              <Input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="relative">
                <Input
                  type={displayPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <div
                  onClick={handleDisplayPassword}
                  className="absolute right-5 top-2 cursor-pointer"
                >
                  {displayPassword ? <EyeClosed /> : <Eye />}
                </div>
              </div>

              <Button
                className="w-full bg-black text-white hover:bg-gray-800"
                type="submit"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login with Email"}
              </Button>
            </form>

            {/* forgot password */}
            <div className="flex justify-end mt-4">
              <Link to="/forgot-password" className="text-sm text-gray-600">
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {typeof error === "string" ? error : "An error occurred"}
              </div>
            )}

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

              <Button
                variant="outline"
                onClick={handleGoogleLogin}
                className=""
              >
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
  const { signup, loading, error, user, token } = useAuth();

  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [displayPassword, setDisplayPassword] = useState(false);
  const navigate = useNavigate();


  const handleDisplayPassword = () => {
    setDisplayPassword(!displayPassword);
    console.log("display", displayPassword);
  };

  const handleEmailSignUp = async (e) => {
  e.preventDefault();
  try {
    await signup(email, password1, password2, navigate); 
  } catch (error) {
    console.error("Signup error:", error);
  }
};

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left side - hidden on small screens */}
        <div className="lg:flex hidden w-full  login-01 text-white py-8 px-16  flex-col  rounded overflow-hidden">
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

        {/* Right side - always visible */}
        <div className="p-8 flex flex-col">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
              <Input
                type={displayPassword ? `text` : `password`}
                name="password"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                placeholder="Enter your password"
                required
              />

              <Input
                type={displayPassword ? `text` : `password`}
                name="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Confirm your password"
                required
              />

              <div className="flex gap-2 text-sm justify-end">
                <input type="checkbox" onClick={handleDisplayPassword} />
                <p>{!displayPassword ? "Show" : "Hide"} Password</p>
              </div>
              <Button
                disabled={loading}
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                {loading ? "Signing up..." : "Sign up with Email"}
              </Button>
            </form>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {loading && <p className="text-sm text-gray-500">Signing up...</p>}

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
