"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

const selectLayerSelector = "[data-radix-select-content], [data-combobox-content]"

function isSelectLayer(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(selectLayerSelector))
}

function hasOpenSelectLayer() {
  return typeof document !== "undefined" && document.querySelector(selectLayerSelector) !== null
}

function Dialog({ onOpenChange, ...props }: DialogPrimitive.Root.Props) {
  const selectDismissalStartedAt = React.useRef(0)

  React.useEffect(() => {
    const rememberSelectDismissal = (event: Event) => {
      if (!hasOpenSelectLayer() || isSelectLayer(event.target)) return

      // On physical touch devices Radix can unmount the select before the
      // dialog receives its outside-press event. Remember this first tap so
      // it can be reserved for closing the select instead of the modal.
      selectDismissalStartedAt.current = Date.now()
    }

    document.addEventListener("pointerdown", rememberSelectDismissal, true)
    document.addEventListener("touchstart", rememberSelectDismissal, true)

    return () => {
      document.removeEventListener("pointerdown", rememberSelectDismissal, true)
      document.removeEventListener("touchstart", rememberSelectDismissal, true)
    }
  }, [])

  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      {...props}
      onOpenChange={(open, eventDetails) => {
        if (!open && (eventDetails.reason === "outside-press" || eventDetails.reason === "focus-out")) {
          const focusTarget = eventDetails.event instanceof FocusEvent
            ? eventDetails.event.relatedTarget
            : null

          // Radix Select renders its menu in a portal. From the dialog's DOM
          // boundary, a tap or focus inside that menu looks like an outside
          // interaction even though it belongs to a field in this modal.
          const selectDismissalWasJustStarted = Date.now() - selectDismissalStartedAt.current < 750
          const selectIsHandlingOutsidePress = eventDetails.reason === "outside-press"
            && (hasOpenSelectLayer() || selectDismissalWasJustStarted)

          if (
            selectIsHandlingOutsidePress
            || isSelectLayer(eventDetails.event.target)
            || isSelectLayer(focusTarget)
          ) {
            selectDismissalStartedAt.current = 0
            eventDetails.cancel()
            return
          }
        }

        onOpenChange?.(open, eventDetails)
      }}
    />
  )
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-row items-center justify-between gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
