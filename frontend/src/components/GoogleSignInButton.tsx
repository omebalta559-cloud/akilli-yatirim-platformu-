"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

const API_URL = getApiUrl();
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type GoogleCredentialResponse = {
  credential: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({ onError }: { onError?: (message: string) => void }) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);

  async function handleCredential(response: GoogleCredentialResponse) {
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail ?? "Google ile giris basarisiz oldu.");
      }
      saveToken(data.access_token);
      router.push("/");
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Bir hata olustu.");
    }
  }

  function initGoogleButton() {
    if (!window.google || !buttonRef.current || !GOOGLE_CLIENT_ID) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
    });
    const availableWidth = buttonRef.current.offsetWidth || 320;
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: Math.min(availableWidth, 320),
      text: "continue_with",
      locale: "tr",
    });
  }

  useEffect(() => {
    if (window.google) {
      initGoogleButton();
    }
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleButton}
      />
      <div className="flex justify-center" ref={buttonRef} />
    </>
  );
}
