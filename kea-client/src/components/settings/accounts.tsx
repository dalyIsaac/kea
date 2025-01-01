import { Component } from "solid-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/card";
import { FaBrandsGithub } from "solid-icons/fa";
import { IconTypes } from "solid-icons";
import { createMeQuery } from "~/api/api";
import { components } from "~/api/openapi.g";
import { Skeleton } from "~/components/shadcn/skeleton";
import { VsSignIn, VsSignOut } from "solid-icons/vs";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/shadcn/tooltip";
import { Link } from "@kobalte/core/link";

type ScmUser = components["schemas"]["ScmUser"] | null | undefined;

const Account: Component<{
  provider: string;
  icon: IconTypes;
  user: ScmUser;
  isLoading: boolean;
}> = (props) => {
  const actionProps = () => {
    if (props.user) {
      return {
        href: `http://localhost:3000/${props.provider.toLowerCase()}/signout`,
        icon: <VsSignOut class="size-5" />,
        text: "Sign out of GitHub",
      };
    } else {
      return {
        href: `http://localhost:3000/${props.provider.toLowerCase()}/signin`,
        icon: <VsSignIn class="size-5" />,
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
        <Tooltip>
          <TooltipTrigger as={Link} variant="ghost" href={actionProps().href}>
            {actionProps().icon}
          </TooltipTrigger>

          <TooltipContent>
            <div>{actionProps().text}</div>
          </TooltipContent>
        </Tooltip>
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
          icon={FaBrandsGithub}
          user={meQuery.data?.data?.github}
          isLoading={meQuery.isLoading}
        />
      </CardContent>
    </Card>
  );
};
