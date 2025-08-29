import { string, z } from 'zod';

export type Role = "user" | "assistant";
export const chatSchema = z.object({
    message: "string",
    role: "Role",
})

export type messageSchema = {
    message: "string",
    role: "Role",
};