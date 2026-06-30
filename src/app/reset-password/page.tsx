import { ResetPasswordForm } from "./ResetPasswordForm";
import Brand from "../components/Brand";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <main className="flex min-h-dvh items-center justify-center bg-muted p-4"><div className="w-full max-w-md space-y-6"><div className="flex justify-center"><Brand /></div><ResetPasswordForm token={token} /></div></main>;
}
