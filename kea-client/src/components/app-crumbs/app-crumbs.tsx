import { Link } from "@tanstack/react-router";
import { FC, Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/shadcn/ui/breadcrumb";
import { useKeaSelector } from "~/state/store";

export interface Crumb {
  text: string;
  href: string;
}

export const AppCrumbs: FC = () => {
  const crumbs = useKeaSelector((state) => state.crumbs.crumbs);

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
