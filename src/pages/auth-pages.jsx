import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, LineChart, ChartBar, Laptop2, Signature, Info, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


export function LoginPage() {

    const handleLogin = () => {

    }

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
                                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Impedit, maxime repellendus!
                                        Suscipit perferendis enim
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
                                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Impedit, maxime repellendus!
                                        Suscipit perferendis enim
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
                                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Impedit, maxime repellendus!
                                        Suscipit perferendis enim
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h1 className="font-bold tracking-tight">
                                <Link to={"/"}>
                                    I Source Plus
                                </Link>
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-1/2 p-8 flex flex-col">
                    <div className="flex justify-end mb-8">
                        <Button variant="secondary">
                            <Link to={"/signup"} className="text-sm font-medium">Sign Up</Link>
                            <ArrowRight className="h-3 w-3 ml-4" />
                        </Button>
                    </div>
                    <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full">
                        <h1 className="text-2xl font-bold mb-4">Login</h1>
                        <p className="text-sm text-gray-600 mb-4">Enter your email and password to login</p>
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
                                <span className="bg-white px-2 text-muted-foreground">or sign up with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="mt-4"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" className="h-4 w-4 mr-2" viewBox="0 0 48 48">
                                    <path fill="#0288D1" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z"></path>
                                    <path fill="#FFF" d="M12 19H17V36H12zM14.485 17h-.028C12.965 17 12 15.888 12 14.499 12 13.08 12.995 12 14.514 12c1.521 0 2.458 1.08 2.486 2.499C17 15.887 16.035 17 14.485 17zM36 36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698-1.501 0-2.313 1.012-2.707 1.99C24.957 25.543 25 26.511 25 27v9h-5V19h5v2.616C25.721 20.5 26.85 19 29.738 19c3.578 0 6.261 2.25 6.261 7.274L36 36 36 36z"></path>
                                </svg>
                                LinkedIn
                            </Button>

                            <Button
                                variant="outline"
                                className="mt-4"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" className="h-4 w-4 mr-2" viewBox="0 0 48 48">
                                    <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"></path>
                                    <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"></path>
                                    <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"></polygon>
                                    <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"></path>
                                    <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"></path>
                                </svg>
                                Gmail
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export function SignUpPage() {

    const handleEmailSignUp = () => {

    }

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
                                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Impedit, maxime repellendus!
                                        Suscipit perferendis enim
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
                                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Impedit, maxime repellendus!
                                        Suscipit perferendis enim
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
                                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Impedit, maxime repellendus!
                                        Suscipit perferendis enim
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h1 className="font-bold tracking-tight">
                                <Link to={"/"}>
                                    I Source Plus
                                </Link>
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-1/2 p-8 flex flex-col">
                    <div className="flex justify-end mb-8">
                        <Button variant="secondary">
                            <Link to={"/login"} className="text-sm font-medium">Login</Link>
                            <ArrowRight className="h-3 w-3 ml-4" />
                        </Button>
                    </div>

                    <div className="flex-grow flex flex-col justify-center max-w-sm mx-auto w-full">
                        <h1 className="text-2xl font-bold mb-4">Create an account</h1>
                        <p className="text-sm text-gray-600 mb-4">Enter your email below to create your account</p>
                        <form className="space-y-4" onSubmit={handleEmailSignUp}>
                            <Input required type="email" name="email" placeholder="name@example.com" />

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
                                <span className="bg-white px-2 text-muted-foreground">or sign up with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="mt-4"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" className="h-4 w-4 mr-2" viewBox="0 0 48 48">
                                    <path fill="#0288D1" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z"></path>
                                    <path fill="#FFF" d="M12 19H17V36H12zM14.485 17h-.028C12.965 17 12 15.888 12 14.499 12 13.08 12.995 12 14.514 12c1.521 0 2.458 1.08 2.486 2.499C17 15.887 16.035 17 14.485 17zM36 36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698-1.501 0-2.313 1.012-2.707 1.99C24.957 25.543 25 26.511 25 27v9h-5V19h5v2.616C25.721 20.5 26.85 19 29.738 19c3.578 0 6.261 2.25 6.261 7.274L36 36 36 36z"></path>
                                </svg>
                                LinkedIn
                            </Button>

                            <Button
                                variant="outline"
                                className="mt-4"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" className="h-4 w-4 mr-2" viewBox="0 0 48 48">
                                    <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"></path>
                                    <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"></path>
                                    <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"></polygon>
                                    <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"></path>
                                    <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"></path>
                                </svg>
                                Gmail
                            </Button>
                        </div>
                        <p className="mt-4 text-xs text-center text-gray-600">
                            By clicking continue, you agree to our{' '}
                            <Link to="/terms" className="underline">Terms of Service</Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="underline">Privacy Policy</Link>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}