"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Button, Card, TextField } from "@/components/ui";

type LoginForm = { email: string; password: string };

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  async function onSubmit(values: LoginForm) {
    setFormError(null);
    try {
      await login(values.email, values.password);
      router.replace("/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-sm space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">engl.app</h1>
          <p className="text-sm text-zinc-500">Log in to continue</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            error={errors.email?.message}
            {...register("email", { required: "Email is required" })}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password", { required: "Password is required" })}
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" loading={isSubmitting} className="w-full">
            Log in
          </Button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          No account?{" "}
          <Link href="/register" className="font-medium text-accent">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
