export interface IAccountKey {
  providerId: string;
  accountId: string;
}

export interface IAccount {
  accountKey: IAccountKey;
  isRepoForAccount: (repoUrl: string) => boolean;
}

export const isEqualAccountKey = (a: IAccountKey, b: IAccountKey): boolean => a.providerId === b.providerId && a.accountId === b.accountId;
