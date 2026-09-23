-- Existing demo users must accept a subscription through the customer page.
UPDATE "LeadSubscription"
SET "active" = false
WHERE "id" = 'demo_all_leads_subscription';
