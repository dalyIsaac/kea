import { Component } from "solid-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../shadcn/card";
import { FaBrandsGithub } from "solid-icons/fa";
import { IconTypes } from "solid-icons";
import { createMeQuery } from "~/api/api";
import { components } from "~/api/openapi.g";

type ScmUser = components["schemas"]["ScmUser"] | null | undefined;

const Account: Component<{
  provider: string;
  icon: IconTypes;
  user: ScmUser;
  isLoading: boolean;
}> = (props) => {
  return (
    <div class="flex items-center gap-4">
      <props.icon class="size-8" />
      <div class="flex flex-col">
        <div class="font-bold">{props.provider}</div>
        <div class="text-sm">
          {props.user ? <>{props.user.login}</> : "Not connected"}
        </div>
      </div>
    </div>
  );
};

export const Accounts: Component = () => {
  const meQuery = createMeQuery();

  return (
    <Card>
      <CardHeader class="space-y-1">
        <CardTitle>Accounts</CardTitle>
        <CardDescription>Source Control Providers</CardDescription>
      </CardHeader>

      <CardContent class="flex gap-4">
        <div class="flex w-full flex-col gap-6">
          <Account
            provider="GitHub"
            icon={FaBrandsGithub}
            user={meQuery.data?.data?.github}
            isLoading={meQuery.isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};
