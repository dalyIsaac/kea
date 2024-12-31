import { Component } from "solid-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../shadcn/card";
import { Button } from "~/components/shadcn/button";
import { FaBrandsGithub } from "solid-icons/fa";
import { IconTypes } from "solid-icons";
import { createMeQuery } from "~/api/api";

const Account: Component<{
  provider: string;
  icon: IconTypes;
  onClick: () => void;
}> = (props) => {
  return (
    <Button variant="outline" onClick={props.onClick}>
      <props.icon class="mr-2 size-4" />
      {props.provider}
    </Button>
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
          <Account provider="GitHub" icon={FaBrandsGithub} onClick={() => {}} />
        </div>
      </CardContent>
    </Card>
  );
};
