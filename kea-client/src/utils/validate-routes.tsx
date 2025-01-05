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
