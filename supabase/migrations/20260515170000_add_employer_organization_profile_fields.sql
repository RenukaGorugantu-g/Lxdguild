ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS organization_about TEXT,
ADD COLUMN IF NOT EXISTS hiring_requirements TEXT,
ADD COLUMN IF NOT EXISTS industry_domain TEXT;

CREATE INDEX IF NOT EXISTS profiles_company_website_idx
ON profiles (company_website);

CREATE INDEX IF NOT EXISTS profiles_industry_domain_idx
ON profiles (industry_domain);
