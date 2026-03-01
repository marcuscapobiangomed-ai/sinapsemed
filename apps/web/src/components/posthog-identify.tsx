"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

interface PostHogIdentifyProps {
  userId: string;
  email: string;
  name: string;
}

export function PostHogIdentify({ userId, email, name }: PostHogIdentifyProps) {
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;
    posthog.identify(userId, { email, name });
  }, [posthog, userId, email, name]);

  return null;
}
