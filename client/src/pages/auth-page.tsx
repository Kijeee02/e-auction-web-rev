import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Loader2, Gavel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  agreeToTerms: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.agreeToTerms === true, {
  message: "You must agree to the terms and conditions",
  path: ["agreeToTerms"],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const onLogin = async (data: LoginData) => {
    try {
      await loginMutation.mutateAsync(data);
      setLocation("/");
    } catch (error) {
      // Error handled in useAuth hook
    }
  };

  const onRegister = async (data: RegisterData) => {
    try {
      const { confirmPassword, agreeToTerms, ...registerData } = data;
      await registerMutation.mutateAsync(registerData);

      toast({
        title: "Pendaftaran berhasil",
        description: "Silakan login untuk melanjutkan.",
      });

      setActiveTab("login");
      registerForm.reset(); // opsional: reset form

    } catch (error) {
      // Error handled in useAuth hook
    }
  };

  if (user) {
    return null; // Prevent flash before redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Gavel className="h-8 w-8 text-primary mr-2" />
              <span className="text-2xl font-bold text-primary">3D Auction</span>
            </div>
            <CardTitle className="text-2xl">
              {activeTab === "login" ? "Masuk ke Akun" : "Daftar Akun Baru"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Masukkan username"
                      {...loginForm.register("username")}
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Masukkan password"
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <Label htmlFor="remember" className="text-sm">Ingat saya</Label>
                    </div>
                    <Button variant="link" className="text-sm p-0">
                      Lupa password?
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Masuk
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nama Depan</Label>
                      <Input
                        id="firstName"
                        placeholder="Ahmad"
                        {...registerForm.register("firstName")}
                      />
                      {registerForm.formState.errors.firstName && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nama Belakang</Label>
                      <Input
                        id="lastName"
                        placeholder="Rizki"
                        {...registerForm.register("lastName")}
                      />
                      {registerForm.formState.errors.lastName && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username-reg">Username</Label>
                    <Input
                      id="username-reg"
                      placeholder="username"
                      {...registerForm.register("username")}
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      {...registerForm.register("email")}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      placeholder="08123456789"
                      {...registerForm.register("phone")}
                    />
                    {registerForm.formState.errors.phone && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-reg">Password</Label>
                    <Input
                      id="password-reg"
                      type="password"
                      placeholder="Minimal 8 karakter"
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Ulangi password"
                      {...registerForm.register("confirmPassword")}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreeToTerms"
                      checked={registerForm.watch("agreeToTerms")}
                      onCheckedChange={(checked) => {
                        registerForm.setValue("agreeToTerms", checked as boolean);
                      }}
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm">
                      Saya setuju dengan{" "}
                      <Button variant="link" className="p-0 h-auto text-sm">
                        Syarat & Ketentuan
                      </Button>{" "}
                      dan{" "}
                      <Button variant="link" className="p-0 h-auto text-sm">
                        Kebijakan Privasi
                      </Button>
                    </Label>
                  </div>
                  {registerForm.formState.errors.agreeToTerms && (
                    <p className="text-sm text-destructive">
                      {registerForm.formState.errors.agreeToTerms.message}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Daftar Sekarang
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex flex-1 gradient-bg items-center justify-center p-8">
        <div className="text-center text-white max-w-md">
          <h1 className="text-4xl font-bold mb-4">
            PT. Auctioneer Tridaya
          </h1>
          <Gavel className="h-16 w-16 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">
            Bergabung dengan Platform Lelang Terpercaya
          </h2>
          <p className="text-lg text-blue-100 mb-6">
            Dapatkan produk berkualitas dengan harga terbaik melalui sistem lelang online yang aman dan transparan di wilayah Jabodetabek.
          </p>
          <div className="space-y-4">
            <div className="flex items-center text-left">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-bold text-gray-900">✓</span>
              </div>
              <span>Real-time bidding system</span>
            </div>
            <div className="flex items-center text-left">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-bold text-gray-900">✓</span>
              </div>
              <span>Sistem keamanan berlapis</span>
            </div>
            <div className="flex items-center text-left">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-bold text-gray-900">✓</span>
              </div>
              <span>Dukungan customer service 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
