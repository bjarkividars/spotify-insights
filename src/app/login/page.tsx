import { cookies } from "next/headers";
import { LoginForm } from "./LoginForm";

async function checkReturningVisitor() {
  const cookieStore = await cookies();
  const hasVisited = cookieStore.get("has_visited");
  return !!hasVisited;
}

export default async function LoginPage() {
  const isReturningVisitor = await checkReturningVisitor();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isReturningVisitor ? "Welcome back" : "Get started"}
          </h1>
          <p className="text-foreground/60">
            {isReturningVisitor 
              ? "Log in with your Spotify account to continue"
              : "Sign up with Spotify to get started"}
          </p>
        </div>

        <LoginForm isReturningVisitor={isReturningVisitor} />
      </div>
    </div>
  );
}

