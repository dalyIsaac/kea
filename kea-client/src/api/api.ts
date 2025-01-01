import createClient from "openapi-fetch";
import type { paths } from "./openapi.g";
import { createQuery } from "@tanstack/solid-query";

const client = createClient<paths>({
  baseUrl: "http://localhost:3000",
  credentials: "include",
});

export const createMeQuery = () =>
  createQuery(() => ({
    queryKey: ["me"],
    queryFn: () => client.GET("/me"),
  }));
