export const panic = (error?: Error): never => {
  throw error ?? new Error("Panic!");
};
