"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type MsgResult = { error?: string; message?: string };

const ALLOWED_DOMAIN = "@jocodingax.ai";

function checkDomain(email: string): MsgResult | undefined {
  if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
    return { error: `${ALLOWED_DOMAIN} 이메일만 가입할 수 있습니다.` };
  }
}

export async function signInWithPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const domainError = checkDomain(email);
  if (domainError) return domainError;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: formData.get("password") as string,
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(formData: FormData): Promise<MsgResult> {
  const email = formData.get("email") as string;
  const domainError = checkDomain(email);
  if (domainError) return domainError;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: formData.get("password") as string,
  });
  if (error) return { error: error.message };
  return { message: "확인 이메일을 발송했습니다. 받은 편지함을 확인해 주세요." };
}

export async function signInWithOtp(formData: FormData): Promise<MsgResult> {
  const email = formData.get("email") as string;
  const domainError = checkDomain(email);
  if (domainError) return domainError;

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  return { message: "매직 링크를 이메일로 발송했습니다. 받은 편지함을 확인해 주세요." };
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  const newPassword = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;
  if (newPassword !== confirm) return { error: "비밀번호가 일치하지 않습니다." };
  if (newPassword.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." };
  if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return { error: "비밀번호는 영문자와 숫자를 모두 포함해야 합니다." };
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { message: "비밀번호가 변경되었습니다." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
