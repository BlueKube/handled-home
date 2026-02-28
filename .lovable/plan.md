

## Plan: Replace header logo with cropped version

1. Copy `user-uploads://handled-home-logo_No_Roof.png` to `src/assets/handled-home-logo-no-roof.png`
2. Update `src/components/AppHeader.tsx` to import and use the new logo image instead of the original

The original logo remains on the login page (AuthPage) — only the header bar changes.

