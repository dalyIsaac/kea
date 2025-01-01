import { Component } from "solid-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/card";
import { createMeQuery } from "~/api/api";
import { components } from "~/api/openapi.g";
import { Skeleton } from "~/components/shadcn/skeleton";
import { IconButtonLink } from "~/components/common/icon-button-link";
import LogInIcon from "lucide-solid/icons/log-in";
import LogOutIcon from "lucide-solid/icons/log-out";
import { IconBrandGithub } from "~/components/shadcn/icons";

type ScmUser = components["schemas"]["ScmUser"] | null | undefined;

const Account: Component<{
  provider: string;
  icon: Component<{ class: string }>;
  user: ScmUser;
  isLoading: boolean;
}> = (props) => {
  const actionProps = () => {
    if (props.user) {
      return {
        href: `http://localhost:3000/${props.provider.toLowerCase()}/signout`,
        icon: LogOutIcon,
        text: "Sign out of GitHub",
      };
    } else {
      return {
        href: `http://localhost:3000/${props.provider.toLowerCase()}/signin`,
        icon: LogInIcon,
        text: "Sign in to GitHub",
      };
    }
  };

  return (
    <div class="flex w-full items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <props.icon class="size-8" />

        <div class="flex flex-col">
          <div class="font-bold">{props.provider}</div>

          <div class="text-sm">
            {props.isLoading ? (
              <Skeleton height={20} width={100} radius={10} />
            ) : props.user ? (
              <>@{props.user.login}</>
            ) : (
              "Not connected"
            )}
          </div>
        </div>
      </div>

      {props.isLoading ? null : (
        <IconButtonLink
          href={actionProps().href}
          icon={actionProps().icon}
          tooltip={actionProps().text}
        />
      )}
    </div>
  );
};

export const Accounts: Component = () => {
  const meQuery = createMeQuery();

  return (
    <Card class="w-72">
      <CardHeader class="space-y-1">
        <CardTitle>Accounts</CardTitle>
        <CardDescription>Source Control Providers</CardDescription>
      </CardHeader>

      <CardContent class="flex w-full flex-col gap-4">
        <Account
          provider="GitHub"
          icon={IconBrandGithub}
          user={meQuery.data?.data?.github}
          isLoading={meQuery.isLoading}
        />
      </CardContent>
    </Card>
  );
};
