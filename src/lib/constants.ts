const getBackApi = process.env.NEXT_PUBLIC_BACK_API || "http://localhost:4000";
export const BACK_API = `${getBackApi}/api`