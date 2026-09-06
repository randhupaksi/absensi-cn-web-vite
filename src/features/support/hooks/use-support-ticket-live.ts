import { siteConfig } from "@/lib/config/site";
import type { SupportLiveStatus } from "@/types/support";
import { useEffect, useRef, useState } from "react";

type LiveTicketOptions = {
  liveToken?: string;
  enabled?: boolean;
  onTicketUpdated: () => void;
  onRenew: () => void;
};

type ParsedEvent = { event: string; data: string };

const liveEndpoint = `${siteConfig.apiBaseUrl.replace(/\/$/, "")}/support/live`;

function takeFrames(buffer: string): [ParsedEvent[], string] {
  const frames = buffer.split(/\r?\n\r?\n/);
  const remainder = frames.pop() ?? "";
  const events = frames.flatMap((frame) => {
    let event = "message";
    const data: string[] = [];
    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      if (line.startsWith("data:")) data.push(line.slice(5).trim());
    }
    return data.length > 0 ? [{ event, data: data.join("\n") }] : [];
  });
  return [events, remainder];
}

// Server-Sent Events keeps receive traffic one-way and lightweight. Sending a
// message remains a regular POST, so all validation and audit behavior stays
// exactly the same as the non-live ticket flow.
export function useSupportTicketLive({ liveToken, enabled = true, onTicketUpdated, onRenew }: LiveTicketOptions) {
  const [status, setStatus] = useState<SupportLiveStatus>("offline");
  const updateRef = useRef(onTicketUpdated);
  const renewRef = useRef(onRenew);
  updateRef.current = onTicketUpdated;
  renewRef.current = onRenew;

  useEffect(() => {
    if (!enabled || !liveToken) {
      setStatus("offline");
      return;
    }

    let active = true;
    let retryAttempt = 0;
    let retryTimer: number | undefined;
    let controller: AbortController | undefined;

    const reconnect = (delay: number) => {
      if (!active) return;
      retryTimer = window.setTimeout(connect, delay);
    };

    const connect = async () => {
      controller?.abort();
      controller = new AbortController();
      setStatus(retryAttempt === 0 ? "connecting" : "reconnecting");
      let refreshToken = false;
      try {
        const response = await fetch(liveEndpoint, {
          method: "GET",
          headers: { Authorization: `Bearer ${liveToken}`, Accept: "text/event-stream" },
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          refreshToken = response.status === 401 || response.status === 503;
          throw new Error(`Live ticket request failed (${response.status})`);
        }

        retryAttempt = 0;
        setStatus("live");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (active) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const [events, remainder] = takeFrames(buffer);
          buffer = remainder;
          for (const event of events) {
            if (event.event === "ticket_updated") updateRef.current();
            if (event.event === "reconnect") refreshToken = true;
          }
        }
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
      }

      if (!active) return;
      if (refreshToken) renewRef.current();
      retryAttempt += 1;
      setStatus("reconnecting");
      reconnect(Math.min(10_000, 750 * (2 ** Math.min(retryAttempt, 4))));
    };

    void connect();
    return () => {
      active = false;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      controller?.abort();
    };
  }, [enabled, liveToken]);

  return status;
}
