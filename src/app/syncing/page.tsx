"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { syncUserData } from "./actions";

export default function SyncingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"syncing" | "error" | "complete">("syncing");
  const [message, setMessage] = useState("Fetching your Spotify listening history...");

  useEffect(() => {
    let mounted = true;

    async function performSync() {
      try {
        setMessage("Fetching your Spotify listening history...");
        
        const result = await syncUserData();
        
        if (!mounted) return;

        if (result.success) {
          setMessage(`Found ${result.playsSynced} plays! Setting up your dashboard...`);
          setStatus("complete");
          
          // Wait a bit to show the success message
          setTimeout(() => {
            router.push("/");
          }, 1500);
        } else {
          setStatus("error");
          setMessage(result.error || "Failed to sync your data. You can try again from your dashboard.");
          
          // Redirect after showing error
          setTimeout(() => {
            router.push("/");
          }, 3000);
        }
      } catch (error) {
        if (!mounted) return;
        
        console.error("Sync error:", error);
        setStatus("error");
        setMessage("Something went wrong. Redirecting to your dashboard...");
        
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    }

    performSync();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center py-12">
        {status === "syncing" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Crunching your data
            </h1>
            <p className="text-foreground/60 mb-6">{message}</p>
            <div className="flex gap-2 justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </>
        )}

        {status === "complete" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              All set!
            </h1>
            <p className="text-foreground/60">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-warn rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Oops!
            </h1>
            <p className="text-foreground/60">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

