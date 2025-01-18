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

export interface FileParams {
  sha: string;
  leftLine?: number;
  rightLine?: number;
}

const parseFileLine = (line: string | undefined): number | undefined => {
  const l = line ? parseInt(line, 10) : undefined;
  if (l !== undefined && isNaN(l)) {
    throw new Error("Invalid line number");
  }
  return l;
};

/**
 * Parse a string into a file sha and line number.
 * @param file The string to parse.
 * @returns An object with the sha and line number.
 */
export const parseFile = (file: string | undefined): FileParams | undefined => {
  if (!file) {
    return undefined;
  }

  const [sha, leftLine] = file.split("L");
  const [, rightLine] = file.split("R");

  if (!sha) {
    throw new Error("Invalid file format");
  }

  return {
    sha,
    leftLine: parseFileLine(leftLine),
    rightLine: parseFileLine(rightLine),
  };
};

export const createCompare = (base: string, head: string): string => `${base}...${head}`;
