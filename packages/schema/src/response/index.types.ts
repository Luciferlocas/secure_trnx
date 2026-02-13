import z from "zod";
import { ClientResponseSchema, ResponseErrorSchema } from "./index.js";

export type ResponseError = z.infer<typeof ResponseErrorSchema>;
export type ClientResponse<T> = z.infer<
  ReturnType<typeof ClientResponseSchema<T>>
>
