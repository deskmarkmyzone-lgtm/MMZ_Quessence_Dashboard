export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};
