export const validatePrId = (prId: string): number => {
  if (!/^[0-9]+$/.test(prId)) {
    throw new Error("Invalid PR ID");
  }

  return Number(prId);
};

const VALID_PROVIDERS = ["gh"];
export const validateProvider = (provider: string): string => {
  if (!VALID_PROVIDERS.includes(provider)) {
    throw new Error("Invalid provider");
  }

  return provider;
};

export interface PullRequestDetailsParams {
  provider: string;
  owner: string;
  repo: string;
  prId: number;
}

export const validatePullRequestRoute = (
  params: Record<keyof PullRequestDetailsParams, string>,
): PullRequestDetailsParams => ({
  provider: validateProvider(params.provider),
  owner: params.owner,
  repo: params.repo,
  prId: validatePrId(params.prId),
});
