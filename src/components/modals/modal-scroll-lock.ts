import { useEffect } from "react";

type ScrollLockStyleSnapshot = {
  htmlOverflow: string;
  htmlOverscrollBehavior: string;
  bodyOverflow: string;
  bodyOverscrollBehavior: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
};

let modalScrollLockCount = 0;
let modalScrollPosition = 0;
let modalScrollLockSnapshot: ScrollLockStyleSnapshot | null = null;

const modalScrollableTargetSelector = [
  "[data-modal-scroll-area]",
  "[data-radix-select-content]",
  "[data-combobox-content]",
].join(",");

/**
 * Locks the document behind an open dialog, including Safari/iOS rubber-band
 * scrolling. The dialog content itself stays scrollable through the marked
 * scroll area.
 */
export function useModalScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const body = document.body;

    if (modalScrollLockCount === 0) {
      modalScrollPosition = window.scrollY;
      modalScrollLockSnapshot = {
        htmlOverflow: html.style.overflow,
        htmlOverscrollBehavior: html.style.overscrollBehavior,
        bodyOverflow: body.style.overflow,
        bodyOverscrollBehavior: body.style.overscrollBehavior,
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyLeft: body.style.left,
        bodyRight: body.style.right,
        bodyWidth: body.style.width,
      };

      html.style.overflow = "hidden";
      html.style.overscrollBehavior = "none";
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
      body.style.position = "fixed";
      body.style.top = `-${modalScrollPosition}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
    }

    modalScrollLockCount += 1;

    const preventBackgroundTouchMove = (event: TouchEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(modalScrollableTargetSelector)) {
        return;
      }

      event.preventDefault();
    };

    document.addEventListener("touchmove", preventBackgroundTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventBackgroundTouchMove);
      modalScrollLockCount = Math.max(0, modalScrollLockCount - 1);

      if (modalScrollLockCount !== 0 || !modalScrollLockSnapshot) return;

      const snapshot = modalScrollLockSnapshot;
      html.style.overflow = snapshot.htmlOverflow;
      html.style.overscrollBehavior = snapshot.htmlOverscrollBehavior;
      body.style.overflow = snapshot.bodyOverflow;
      body.style.overscrollBehavior = snapshot.bodyOverscrollBehavior;
      body.style.position = snapshot.bodyPosition;
      body.style.top = snapshot.bodyTop;
      body.style.left = snapshot.bodyLeft;
      body.style.right = snapshot.bodyRight;
      body.style.width = snapshot.bodyWidth;
      modalScrollLockSnapshot = null;
      window.scrollTo({ top: modalScrollPosition, left: 0, behavior: "auto" });
    };
  }, [open]);
}
