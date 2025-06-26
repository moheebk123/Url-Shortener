import { z, ZodError } from "zod";

// const ageSchema = z.number().min(18).max(100).int();
// const userAge = 18

// const parse = ageSchema.safeParse(userAge)
// try {
//   const parseUserAge = ageSchema.parse(userAge)
//   console.log(parseUserAge)
// } catch (error) {
//   if (error instanceof ZodError) {
//     console.log(error.issues[0].message)
//   } else {
//     console.log("Unexpected error: ", error)
//   }
// }

const portSchema = z.coerce.number().min(1).max(65535).default(3000)
export const PORT = portSchema.parse(process.env.PORT)

// export const PORT
