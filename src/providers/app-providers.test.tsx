import { act, render, waitFor } from "@testing-library/react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/providers/app-providers";
import { clearAuthSession } from "@/lib/auth";

function QueryClientCapture({
  onReady,
}: {
  onReady: (client: QueryClient) => void;
}) {
  const queryClient = useQueryClient();

  useEffect(() => onReady(queryClient), [onReady, queryClient]);

  return null;
}

describe("AppProviders authentication isolation", () => {
  it("clears server-state cache when authentication changes", async () => {
    let queryClient: QueryClient | undefined;
    const captureClient = (client: QueryClient) => {
      queryClient = client;
    };

    const { unmount } = render(
      <AppProviders>
        <QueryClientCapture onReady={captureClient} />
      </AppProviders>,
    );

    await waitFor(() => expect(queryClient).toBeDefined());
    act(() => {
      queryClient?.setQueryData(["private-test-data"], "sensitive");
    });
    expect(queryClient?.getQueryData(["private-test-data"])).toBe("sensitive");

    await act(async () => clearAuthSession());
    await waitFor(() => {
      expect(queryClient?.getQueryData(["private-test-data"])).toBeUndefined();
    });

    await act(async () => unmount());
  });
});
