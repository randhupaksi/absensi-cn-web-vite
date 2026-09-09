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
export function useSupportTicketLive({
  liveToken,
  enabled = true,
  onTicketUpdated,
  onRenew,
}: LiveTicketOptions) {
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
    let updateFrame: number | undefined;
    let controller: AbortController | undefined;

    const scheduleTicketUpdate = () => {
      if (updateFrame !== undefined) return;
      updateFrame = window.requestAnimationFrame(() => {
        updateFrame = undefined;
        updateRef.current();
      });
    };

    const reconnect = (delay: number) => {
      if (!active) return;
      retryTimer = window.setTimeout(connect, delay);
    };

    const connect = async () => {
      controller?.abort();
      controller = new AbortController();
      setStatus(retryAttempt === 0 ? "connecting" : "reconnecting");
      let refreshToken = false;
      let serverRetryDelay: number | undefined;
      const connectedAt = Date.now();
      try {
        const response = await fetch(liveEndpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${liveToken}`,
            Accept: "text/event-stream",
          },
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          refreshToken = response.status === 401 || response.status === 503;
          throw new Error(`Live ticket request failed (${response.status})`);
        }

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
            if (event.event === "ticket_updated") scheduleTicketUpdate();
            if (event.event === "reconnect") {
              refreshToken = true;
              try {
                const payload = JSON.parse(event.data) as {
                  retry_after_ms?: unknown;
                };
                if (
                  typeof payload.retry_after_ms === "number" &&
                  Number.isFinite(payload.retry_after_ms)
                ) {
                  serverRetryDelay = Math.max(500, payload.retry_after_ms);
                }
              } catch {
                // The reconnect event still works when the optional payload
                // cannot be parsed; the client falls back to local backoff.
              }
            }
          }
        }
      } catch (error) {
        if (
          !active ||
          (error instanceof DOMException && error.name === "AbortError")
        )
          return;
      }

      if (!active) return;
      if (refreshToken) renewRef.current();
      const connectionWasStable = Date.now() - connectedAt >= 15_000;
      retryAttempt = connectionWasStable ? 0 : retryAttempt + 1;
      setStatus("reconnecting");
      const backoffDelay = Math.min(
        30_000,
        1_000 * 2 ** Math.min(retryAttempt, 5),
      );
      reconnect(serverRetryDelay ?? backoffDelay);
    };

    void connect();
    return () => {
      active = false;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      if (updateFrame !== undefined) window.cancelAnimationFrame(updateFrame);
      controller?.abort();
    };
  }, [enabled, liveToken]);

  return status;
}
