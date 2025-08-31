export const DEMO_USER_ID = "demo";

export const isDemoMode = () => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
};
