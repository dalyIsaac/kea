import { Link } from "@tanstack/react-router";
import { atom, useAtom } from "jotai";
import { FC, Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/shadcn/ui/breadcrumb";

export interface Crumb {
  text: string;
  href: string;
}

export const appCrumbs = atom<Crumb[]>([]);

export const AppCrumbs: FC = () => {
  const [crumbs] = useAtom(appCrumbs);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <Fragment key={i}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={crumb.href}>{crumb.text}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {i < crumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
