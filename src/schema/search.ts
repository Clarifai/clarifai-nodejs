import { z } from "zod";

/**
 * Initialize the schema for rank and filter.
 * This schema validates:
 * - Rank and filter must be a list
 * - Each item in the list must be a dict
 * - The dict can contain these optional keys:
 *   - 'image_url': Valid URL string
 *   - 'text_raw': Non-empty string
 *   - 'metadata': Dict
 *   - 'image_bytes': Bytes
 *   - 'geo_point': Dict with 'longitude', 'latitude' and 'geo_limit' as float, float and int respectively
 *   - 'concepts': List where each item is a concept dict
 * - Concept dict requires at least one of:
 *   - 'name': Non-empty string with dashes/underscores
 *   - 'id': Non-empty string
 *   - 'language': Non-empty string
 *   - 'value': 0 or 1 integer
 * - 'input_types': List of 'image', 'video', 'text' or 'audio'
 * - 'input_dataset_ids': List of strings
 * - 'input_status_code': Integer
 *
 * @returns The schema for rank and filter, defining the structure and validation rules for each item.
 */
export function getSchema(): z.ZodSchema<
  Array<{
    imageUrl?: string;
    textRaw?: string;
    metadata?: Record<string, unknown>;
    imageBytes?: unknown; // Note: TypeScript doesn't have a dedicated 'bytes' type, so 'unknown' is used
    geoPoint?: {
      longitude: number;
      latitude: number;
      geoLimit: number;
    };
    concepts?: Array<{
      value?: number;
      id?: string;
      language?: string;
      name?: string;
    }>;
    inputTypes?: Array<"image" | "video" | "text" | "audio">;
    inputDatasetIds?: string[];
    inputStatusCode?: number;
  }>
> {
  // Schema for a single concept
  const conceptSchema = z
    .object({
      value: z.number().min(0).max(1).optional(),
      id: z.string().min(1).optional(),
      language: z.string().min(1).optional(),
      name: z
        .string()
        .min(1)
        .regex(/^[0-9A-Za-z]+([-_][0-9A-Za-z]+)*$/) // Non-empty string with dashes/underscores
        .optional(),
    })
    .strict();

  // Schema for a rank or filter item
  const rankFilterItemSchema = z
    .object({
      imageUrl: z.string().url().optional(),
      textRaw: z.string().min(1).optional(),
      metadata: z.record(z.unknown()).optional(),
      imageBytes: z.unknown().optional(),
      geoPoint: z
        .object({
          longitude: z.number(),
          latitude: z.number(),
          geoLimit: z.number().int(),
        })
        .strict()
        .optional(),
      concepts: z.array(conceptSchema).min(1).optional(),

      // input filters
      inputTypes: z
        .array(z.enum(["image", "video", "text", "audio"]))
        .optional(),
      inputDatasetIds: z.array(z.string()).optional(),
      inputStatusCode: z.number().optional(),
    })
    .strict();

  // Schema for rank and filter args
  return z.array(rankFilterItemSchema);
}
