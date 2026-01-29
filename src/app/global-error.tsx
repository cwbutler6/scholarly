"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background-subtle">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="mb-6 text-foreground-muted">
            We&apos;ve been notified and are working on a fix.
          </p>
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
