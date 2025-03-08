import { AuthenticationSession } from "vscode";

export interface IProvider {
  session: AuthenticationSession;
}
