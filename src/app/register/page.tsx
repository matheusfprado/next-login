import Brand from "@/src/app/components/Brand"
import { SignupForm } from "@/src/components/signup-form"

export default function RegisterPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="self-center"><Brand compact /></div>
        <SignupForm />
      </div>
    </div>
  )
}
