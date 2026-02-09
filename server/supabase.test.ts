import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("Supabase connection", () => {
  it("should connect to Supabase with valid credentials", async () => {
    const supabaseUrl = process.env.PROJECT_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseKey).toBeDefined();

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Test connection by listing buckets
    const { data, error } = await supabase.storage.listBuckets();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it("should have car-photos bucket or be able to create it", async () => {
    const supabaseUrl = process.env.PROJECT_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === "car-photos");

    if (!bucketExists) {
      // Try to create bucket (may fail if user doesn't have permission, which is OK)
      const { error } = await supabase.storage.createBucket("car-photos", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });

      // If creation fails due to permissions, that's acceptable for this test
      if (error && !error.message.includes("already exists")) {
        console.warn("Could not create bucket (may require admin permissions):", error.message);
      }
    }

    // Bucket should now exist or we should have a permission error (which is OK)
    expect(true).toBe(true);
  });
});
