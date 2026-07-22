import { z } from "zod";
import type { FormEvent } from "react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof resetPasswordSchema>) =>
      fetchApi<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: data.password }),
      }),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      password: String(formData.get("password") || ""),
      confirmPassword: String(formData.get("confirmPassword") || ""),
    });

    if (!parsed.success) {
      form.clearErrors();
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "password" || field === "confirmPassword") {
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
          <h1 className="text-3xl font-serif text-foreground mb-2">Reset Password</h1>
          <p className="text-muted-foreground">Choose a new password for your account</p>
        </div>

        {!token && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>This reset link is missing a token.</span>
          </div>
        )}

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

        {!mutation.isSuccess && (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="password">
                New Password
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
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                {...form.register("confirmPassword")}
                id="confirmPassword"
                className="w-full bg-background border px-3 py-2 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                type="password"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-destructive text-xs mt-1">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full mt-6" disabled={mutation.isPending || !token}>
              {mutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
