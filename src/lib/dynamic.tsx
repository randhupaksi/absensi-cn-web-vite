import { lazy, type ComponentType } from "react";

type LoadedComponent<Props> = ComponentType<Props> | { default: ComponentType<Props> };

export default function dynamic<Props>(
  loader: () => Promise<LoadedComponent<Props>>,
  _options?: { ssr?: boolean },
) {
  return lazy(async () => {
    const loaded = await loader();
    return typeof loaded === "function" ? { default: loaded } : loaded;
  });
}
