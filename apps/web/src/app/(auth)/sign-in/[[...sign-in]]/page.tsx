import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-soft/20 to-sky/10 p-6">
      <SignIn />
    </main>
  );
}
