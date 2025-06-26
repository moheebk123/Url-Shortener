import z from "zod";

export const loginUserSchema = z.object({
  email: z
    .string()
    .trim()
    .max(100, { message: "Email must be not have more than 100 characters." })
    .email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(100, {
      message: "Password does not have more than 100 characters.",
    }),
});

export const registerUserSchema = loginUserSchema.extend({
  name: z
    .string()
    .trim()
    .min(3, { message: "Name must me at least 3 characters long." })
    .max(100, { message: "Name does not have more than 100 characters." }),
});
