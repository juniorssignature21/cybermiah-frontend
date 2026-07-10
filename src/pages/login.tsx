import { z } from "zod";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof loginSchema>) =>
      fetchApi<{ access_token: string; role: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      login(data.access_token, data.role);
      if (data.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    });

    if (!parsed.success) {
      form.clearErrors();
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          form.setError(field, { message: issue.message });
        }
      }
      return;
    }

    mutation.mutate(parsed.data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md bg-card border shadow-sm p-8 rounded-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif text-foreground mb-2">Log In</h1>
          <p className="text-muted-foreground">Access your quiz platform</p>
        </div>

        {mutation.isError && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{mutation.error.message}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              {...form.register("email")}
              id="email"
              className="w-full bg-background border px-3 py-2 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              type="email"
              placeholder="you@example.com"
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-xs mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              {...form.register("password")}
              id="password"
              className="w-full bg-background border px-3 py-2 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              type="password"
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-xs mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full mt-6"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground space-y-2">
          <p>Don't have an account?</p>
          <div className="flex justify-center gap-4">
            <Link href="/register/student" className="text-primary hover:underline">
              Student Registration
            </Link>
            <span className="text-border">•</span>
            <Link href="/register/admin" className="text-primary hover:underline">
              Admin Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
