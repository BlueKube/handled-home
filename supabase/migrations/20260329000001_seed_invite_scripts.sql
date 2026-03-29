-- Seed SMS invite scripts for the BYOC Founding Partner Program
-- These appear on the provider's BYOC Center for copy-paste into SMS/messaging

INSERT INTO public.invite_scripts (tone, body, sort_order, is_active) VALUES
(
  'Casual',
  'Hey! I started using an app called Handled Home to manage my service routes and scheduling. It makes everything easier for both of us — you''ll get proof photos after each visit and can manage your plan from your phone. I''d love to keep working with you through it. Here''s your invite link: {{link}}',
  1,
  true
),
(
  'Professional',
  'Hi {{customer_name}}, I wanted to let you know I''ve partnered with Handled Home to give my customers a better experience — you''ll get scheduled visits, proof photos, and easy plan management all in one app. I''d like to invite you to join so we can keep working together. Sign up here: {{link}}',
  2,
  true
),
(
  'Brief',
  'I''m now on Handled Home — it''ll make scheduling and service tracking way easier for you. Join here and we''ll stay connected: {{link}}',
  3,
  true
)
ON CONFLICT DO NOTHING;
