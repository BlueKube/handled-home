# Module 01: Authentication & Roles

## Scope
Email/password auth, role-based access control, profile creation, protected routing.

## Tables
- `profiles` — user_id, full_name, phone, avatar_url, created_at, updated_at
- `user_roles` — user_id, role (app_role enum: customer/provider/admin)

## Functions
- `has_role(user_id, role)` — security definer for RLS
- Auto-create profile trigger on signup

## Key User Stories
- As a user, I can sign up with email/password and select my initial role
- As a user, I can log in and be routed to my role's dashboard
- As an admin, I can assign/revoke roles
- As the system, I enforce route protection by role

## Dependencies
None — this is the foundation module.

## Acceptance Criteria
- [ ] Signup creates auth user + profile + role
- [ ] Login redirects to correct app based on role
- [ ] Unauthorized routes redirect to login
- [ ] Wrong-role routes redirect to correct dashboard
- [ ] RLS prevents cross-user profile access
