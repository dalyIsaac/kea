import { Link } from "@tanstack/react-router";
import { $api } from "~/api/api";
import logo from "~/assets/logo-light.gif";
import { Avatar, AvatarFallback, AvatarImage } from "~/shadcn/ui/avatar";
import { Button } from "~/shadcn/ui/button";
import { AppCrumbs } from "./app-crumbs/app-crumbs";

export function AppHeader() {
  const { isLoading, data } = $api.useQuery("get", "/me");

  return (
    <div className="border-b">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <img
              src={logo}
              alt="Kea Logo"
              className="h-8"
              style={{ imageRendering: "pixelated" }}
            />
          </Link>
          <AppCrumbs />
        </div>

        <div className="flex items-center">
          {!isLoading &&
            (data?.github ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={data.github.avatar_url} alt={data.github.login} />
                <AvatarFallback>{data.github.login[0]}</AvatarFallback>
              </Avatar>
            ) : (
              <Button asChild variant="outline">
                <a href="http://localhost:3000/github/signin">Sign In</a>
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
}
