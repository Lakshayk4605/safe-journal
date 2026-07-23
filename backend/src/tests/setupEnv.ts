process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/safe_journal_test?schema=public';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_that_is_at_least_32_chars';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_that_is_at_least_32_chars';
process.env.COOKIE_SECRET = 'test_cookie_secret_that_is_at_least_32_chars';
process.env.AI_PROVIDER = 'mock';
process.env.RESEND_API_KEY = '';
