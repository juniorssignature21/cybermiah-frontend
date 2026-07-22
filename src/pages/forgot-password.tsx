import { z } from "zod";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export default function ForgotPassword() {
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof forgotPasswordSchema>) =>
      fetchApi<{ message: string; reset_link?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const parsed = forgotPasswordSchema.safeParse({
      email: String(formData.get("email") || ""),
    });

    if (!parsed.success) {
      form.clearErrors();
      form.setError("email", { message: parsed.error.issues[0]?.message || "Invalid email" });
      return;
    }

    mutation.mutate(parsed.data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md bg-card border shadow-sm p-8 rounded-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif text-foreground mb-2">Forgot Password</h1>
          <p className="text-muted-foreground">Enter your email to receive a reset link</p>
        </div>

        {mutation.isError && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{mutation.error.message}</span>
          </div>
        )}

        {mutation.isSuccess && (
          <div className="mb-6 p-4 bg-primary/10 text-primary text-sm rounded flex gap-2 items-start">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{mutation.data.message}</span>
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
          <Button type="submit" className="w-full mt-6" disabled={mutation.isPending}>
            {mutation.isPending ? "Sending link..." : "Send Reset Link"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
