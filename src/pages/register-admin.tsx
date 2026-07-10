import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const registerSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  admin_secret: z.string().min(1, "Admin secret is required"),
});

export default function AdminRegister() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      admin_secret: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof registerSchema>) =>
      fetchApi<{ access_token: string; role: string }>("/auth/register/admin", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      login(data.access_token, data.role);
      setLocation("/admin");
    },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4 py-12">
      <div className="w-full max-w-md bg-card border shadow-sm p-8 rounded-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-foreground mb-2">Admin Registration</h1>
          <p className="text-muted-foreground">Authorized personnel only</p>
        </div>

        {mutation.isError && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{mutation.error.message}</span>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input
              {...form.register("full_name")}
              className="w-full bg-background border px-3 py-2 rounded focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              {...form.register("email")}
              type="email"
              className="w-full bg-background border px-3 py-2 rounded focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              {...form.register("password")}
              type="password"
              className="w-full bg-background border px-3 py-2 rounded focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Admin Secret</label>
            <input
              {...form.register("admin_secret")}
              type="password"
              className="w-full bg-background border px-3 py-2 rounded focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          <Button type="submit" className="w-full mt-6" disabled={mutation.isPending}>
            {mutation.isPending ? "Registering..." : "Create Admin Account"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
