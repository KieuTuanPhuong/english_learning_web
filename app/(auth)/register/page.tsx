"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Button, Card, TextField } from "@/components/ui";
import { cn } from "@/lib/cn";

type RegisterForm = {
  full_name: string;
  email: string;
  password: string;
  role: "student" | "teacher";
};

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ defaultValues: { role: "student" } });
  const role = watch("role");

  async function onSubmit(values: RegisterForm) {
    setFormError(null);
    try {
      await registerUser(values);
      router.replace("/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-sm space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-sm text-zinc-500">Join engl.app</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <input type="hidden" {...register("role")} />
          <TextField
            label="Full name"
            error={errors.full_name?.message}
            {...register("full_name", { required: "Name is required" })}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email", { required: "Email is required" })}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            })}
          />
          <div className="space-y-1">
            <span className="block text-sm font-medium text-zinc-700">I am a</span>
            <div className="grid grid-cols-2 gap-2">
              {(["student", "teacher"] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setValue("role", r)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm capitalize",
                    role === r
                      ? "border-accent bg-accent/10 font-semibold text-accent"
                      : "border-zinc-300 text-zinc-600",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" loading={isSubmitting} className="w-full">
            Create account
          </Button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          Have an account?{" "}
          <Link href="/login" className="font-medium text-accent">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
