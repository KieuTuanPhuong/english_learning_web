"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { Avatar, Badge, Button, Card, PageHeader, TextField } from "@/components/ui";

type ProfileForm = { full_name: string; avatar_url: string };

export default function ProfilePage() {
  const { user, role, refreshMe, logout } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<ProfileForm>({
    values: {
      full_name: user?.full_name ?? "",
      avatar_url: user?.avatar_url ?? "",
    },
  });

  const save = useMutation({
    mutationFn: (body: ProfileForm) =>
      api.updateMe({
        full_name: body.full_name,
        avatar_url: body.avatar_url || null,
      }),
    onSuccess: async () => {
      await refreshMe();
      setSaved(true);
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn’t save."),
  });

  function onLogout() {
    if (window.confirm("Log out? Any unsaved drafts stay on this device.")) {
      logout();
      router.replace("/login");
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <PageHeader title="Profile" />
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.full_name} size={48} />
          <div>
            <p className="font-medium">{user?.full_name}</p>
            <p className="text-sm text-zinc-500">{user?.email}</p>
            <div className="mt-1 flex gap-2">
              {role && <Badge kind={role}>{role}</Badge>}
              {user?.status && <Badge kind={user.status}>{user.status}</Badge>}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit((v) => {
            setSaved(false);
            save.mutate(v);
          })}
          className="space-y-4"
        >
          <TextField label="Full name" {...register("full_name", { required: true })} />
          <TextField label="Avatar URL" placeholder="https://…" {...register("avatar_url")} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-emerald-600">Saved.</p>}
          <Button type="submit" loading={save.isPending}>
            Save changes
          </Button>
        </form>
      </Card>

      <Button variant="danger" onClick={onLogout} className="w-full">
        Log out
      </Button>
    </div>
  );
}
