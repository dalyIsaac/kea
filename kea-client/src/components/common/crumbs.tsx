import { Component, createSignal, For } from "solid-js";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/shadcn/breadcrumb";

export interface CrumbProps {
  label?: string;
  href: string;
}

export const [crumbs, setCrumbs] = createSignal<CrumbProps[]>([]);

export const createOwnerCrumb = (
  ownerParam: string,
  owner: string | undefined,
): CrumbProps => ({
  label: owner,
  href: `/gh/${ownerParam}`,
});

export const createRepoCrumb = (
  ownerParam: string,
  repoParam: string,
  repo: string | undefined,
): CrumbProps => ({
  label: repo,
  href: `/gh/${ownerParam}/${repoParam}`,
});

export const createPullsListCrumb = (
  ownerParam: string,
  repoParam: string,
): CrumbProps => ({
  label: "PR",
  href: `/gh/${ownerParam}/${repoParam}/pulls`,
});

export const createPullCrumb = (
  ownerParam: string,
  repoParam: string,
  pullParam: string,
): CrumbProps => ({
  label: `#${pullParam}`,
  href: `/gh/${ownerParam}/${repoParam}/pull/${pullParam}`,
});

export const Crumbs: Component = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <For each={crumbs()}>
          {(crumb, index) => (
            <>
              <BreadcrumbItem>
                {/* TODO: Handle undefined */}
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
