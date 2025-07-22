import { IKeaDisposable, KeaDisposable } from "../core/kea-disposable";
import { ILocalGitRepository } from "../git/local-git-repository";
import { IRemoteRepository } from "./remote-repository";

export interface IRepository extends IKeaDisposable {
  remoteRepository: IRemoteRepository;
  localRepository: ILocalGitRepository;
}

export class Repository extends KeaDisposable implements IRepository {
  remoteRepository: IRemoteRepository;
  localRepository: ILocalGitRepository;

  constructor(remoteRepository: IRemoteRepository, localRepository: ILocalGitRepository) {
    super();
    this.remoteRepository = this._registerDisposable(remoteRepository);
    this.localRepository = localRepository;
  }
}
