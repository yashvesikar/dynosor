import { z } from "zod";

export const User = z.object({
  pk: z.custom<`USER#${string}`>((val) => /^USER#.+$/.test(val as string)),
  sk: z.literal(" "),
});
