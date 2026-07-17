import { createElement, lazy, Suspense, type ComponentType, type ReactNode } from "react";

type LoadedComponent<Props> = ComponentType<Props> | { default: ComponentType<Props> };

export default function dynamic<Props extends object>(
  loader: () => Promise<LoadedComponent<Props>>,
  options?: { ssr?: boolean; fallback?: ReactNode },
) {
  const LazyComponent = lazy(async () => {
    const loaded = await loader();
    return typeof loaded === "function" ? { default: loaded } : loaded;
  });

  return function DynamicComponent(props: Props) {
    return (
      <Suspense fallback={options?.fallback ?? null}>
        {createElement(LazyComponent, props)}
      </Suspense>
    );
  };
}
