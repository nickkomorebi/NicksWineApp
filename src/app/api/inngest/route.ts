import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { visionExtract, audioProcess, enrichExpectedProfile } from "@/inngest/index";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [visionExtract, audioProcess, enrichExpectedProfile],
});
