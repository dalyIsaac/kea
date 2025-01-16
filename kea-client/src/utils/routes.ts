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

export interface RepoParams {
  owner: string;
  repo: string;
}

export interface PullRequestDetailsParams extends RepoParams {
  provider: string;
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

/**
 * Parse a string into a base and head sha.
 * A valid form is `base...head`.
 * This is typically used in the URL search parameter for a PR comparison.
 *
 * @param compare The string to parse.
 * @returns An object with the base and head sha.
 */
export const parseCompare = (
  compare: string | undefined,
): {
  base?: string;
  head?: string;
} => {
  if (!compare) {
    return {};
  }

  const [base, head] = compare.split("...");
  if (!base || !head) {
    throw new Error(`Invalid comparison format`);
  }

  return {
    base,
    head,
  };
};

export const createCompare = (base: string, head: string): string => `${base}...${head}`;
