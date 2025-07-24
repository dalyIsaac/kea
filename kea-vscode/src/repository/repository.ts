import { IKeaDisposable, KeaDisposable } from "../core/kea-disposable";
import { ILocalGitRepository } from "../git/local-git-repository";
import { RepoId } from "../types/kea";
import { IRemoteRepository } from "./remote-repository";

export interface IRepository extends IKeaDisposable {
  repoId: RepoId;
  remoteRepository: IRemoteRepository;
  localRepository: ILocalGitRepository;
}

export class Repository extends KeaDisposable implements IRepository {
  repoId: RepoId;
  remoteRepository: IRemoteRepository;
  localRepository: ILocalGitRepository;

  constructor(repoId: RepoId, remoteRepository: IRemoteRepository, localRepository: ILocalGitRepository) {
    super();
    this.repoId = repoId;
    this.remoteRepository = this._registerDisposable(remoteRepository);
    this.localRepository = localRepository;
  }
}
