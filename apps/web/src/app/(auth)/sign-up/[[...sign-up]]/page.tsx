import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-soft/20 to-sky/10 p-6">
      <SignUp />
    </main>
  );
}
