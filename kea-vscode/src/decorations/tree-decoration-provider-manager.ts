import { CommentDecorationProvider } from "./comment-decoration-provider";
import { TreeDecorationProvider } from "./tree-decoration-provider";

export class TreeDecorationProviderManager {
  #providers: TreeDecorationProvider[] = [];

  constructor() {
    this.#providers.push(new CommentDecorationProvider());
  }

  getAllProviders = (): TreeDecorationProvider[] => this.#providers;
}
