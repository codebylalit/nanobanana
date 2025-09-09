import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ldiwitjpdmekzwxwxklk.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkaXdpdGpwZG1la3p3eHd4a2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMjI2MjYsImV4cCI6MjA3Mjg5ODYyNn0.ObaL7HjNvMxEEAdj405BdK1YIE5TT8gVOnVLCdv-NFs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
