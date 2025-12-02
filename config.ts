
const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

export const config = {
  supabase: {
    url: 'https://lqeqhblqqjvcbwltcwya.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZXFoYmxxcWp2Y2J3bHRjd3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTMyODgsImV4cCI6MjA4MDE4OTI4OH0.jSMxXsJ5KakUBbrVZGVbVpU_egGiBOLTtQJgQAEzyyw',
  },
  gemini: {
    // Reads from the system environment variable safely
    apiKey: getApiKey(),
  },
};