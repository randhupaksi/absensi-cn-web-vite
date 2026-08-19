import { createContext, useContext } from "react";

type PopoverContextValue = {
  close: () => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  return useContext(PopoverContext);
}

export { PopoverContext, usePopoverContext };
