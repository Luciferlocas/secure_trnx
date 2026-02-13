import { z } from "zod";

export const ResponseErrorSchema = z.object({
  message: z.string(),
  error: z.string(),
  statusCode: z.number(),
});

export const ClientResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z
    .object({
      success: z.boolean(),
      error: ResponseErrorSchema.nullable(),
      data: dataSchema.nullable(),
    })
    .refine((obj) =>
      obj.success
        ? obj.data !== null && obj.error == null
        : obj.data == null && obj.error !== null,
    );
