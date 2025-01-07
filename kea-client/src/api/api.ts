import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import { paths } from "./openapi.g";

const fetchClient = createFetchClient<paths>({
  baseUrl: "http://localhost:3000",
  credentials: "include",
});

export const $api = createClient(fetchClient);
