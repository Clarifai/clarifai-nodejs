import { UserError } from "../errors";

/**
 * Get a value from a dictionary or an environment variable.
 */
export function getFromDictOrEnv(
  key: string,
  envKey: string,
  data: { [key: string]: string },
): string {
  if (data?.[key]) {
    return data[key];
  } else {
    return getFromEnv(key, envKey);
  }
}

/**
 * Get a value from an environment variable.
 */
function getFromEnv(key: string, envKey: string): string {
  if (process.env?.[envKey]) {
    return process.env[envKey]!;
  } else {
    throw new UserError(
      `Did not find \`${key}\`, please add an environment variable \`${envKey}\` which contains it, or pass \`${key}\` as a named parameter.`,
    );
  }
}
