import { z } from "zod";

export const User = z.object({
  pk: z.custom<`USER#${string}`>((val) => /^USER#.+$/.test(val as string)),
  sk: z.literal(" "),
});

export const Book = z.object({
  pk: z.string().length(10),
  sk: z.literal("BOOK"),
  title: z.string().optional(),
});
