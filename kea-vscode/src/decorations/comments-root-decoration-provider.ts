import * as vscode from "vscode";
import { Logger } from "../core/logger";
import { IRepositoryManager } from "../repository/repository-manager";
import { BaseTreeDecorationProvider } from "./base-tree-decoration-provider";
import { DECORATION_SCHEMES, parseDecorationPayload } from "./decoration-schemes";

export class CommentsRootDecorationProvider extends BaseTreeDecorationProvider {
  #repositoryManager: IRepositoryManager;

  constructor(repositoryManager: IRepositoryManager) {
    super();
    this.#repositoryManager = repositoryManager;
  }

  override provideFileDecoration = (uri: vscode.Uri, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> => {
    return this.#getFileDecoration(uri);
  };

  #getFileDecoration = async (uri: vscode.Uri): Promise<vscode.FileDecoration | null> => {
    const data = parseDecorationPayload(uri);
    if (data instanceof Error) {
      Logger.error("Failed to parse decoration data", data);
      return null;
    }

    if (data.type !== DECORATION_SCHEMES.commentsRoot) {
      return null;
    }

    const {
      payload: { authSessionAccountId, pullId },
    } = data;

    const repository = this.#repositoryManager.getRepositoryById(authSessionAccountId, pullId);
    if (repository instanceof Error) {
      Logger.error("Failed to get repository", repository);
      return null;
    }

    const [reviewComments, issueComments] = await Promise.all([
      repository.getPullRequestReviewComments(pullId),
      repository.getIssueComments(pullId),
    ]);

    let commentCount = 0;
    if (reviewComments instanceof Error) {
      Logger.error("Error fetching pull request review comments", reviewComments);
    } else {
      commentCount += reviewComments.length;
    }

    if (issueComments instanceof Error) {
      Logger.error("Error fetching issue comments", issueComments);
    } else {
      commentCount += issueComments.length;
    }

    return {
      badge: commentCount > 9 ? "9+" : `${commentCount}`,
      tooltip: `Comments (${commentCount})`,
    };
  };
}
