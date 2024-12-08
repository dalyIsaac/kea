import { Octokit } from "@octokit/rest";
import { GetResponseDataTypeFromEndpointMethod } from "@octokit/types";

export type File = GetResponseDataTypeFromEndpointMethod<
  Octokit["rest"]["pulls"]["listFiles"]
>[0];

export type Content = GetResponseDataTypeFromEndpointMethod<
  Octokit["rest"]["repos"]["getContent"]
>;

export type Fn<T> = () => T;
