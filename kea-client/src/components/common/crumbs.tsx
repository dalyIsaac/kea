import { Component, createSignal, For } from "solid-js";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/shadcn/breadcrumb";

export interface CrumbProps {
  label: string;
  href: string;
}

export const [crumbs, setCrumb] = createSignal<CrumbProps[]>([]);

export const Crumbs: Component = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <For each={crumbs()}>
          {(crumb, index) => (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              </BreadcrumbItem>

              {index() < crumbs().length - 1 ? <BreadcrumbSeparator /> : null}
            </>
          )}
        </For>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
