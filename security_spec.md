# Security Specification - GoalTime

## Data Invariants
1. Matches and Leagues are publically readable but only updateable by Admins.
2. User profiles contain potentially sensitive information (email) and are strictly isolated (Owner or Admin access only).
3. FCM tokens are owned by the user and used for notifications; only owners can manage their tokens.
4. Admins are defined in a separate `admins` collection; users cannot make themselves admins.
5. All IDs must follow a strict format to prevent injection attacks.
6. Timestamps must be server-validated.

## "The Dirty Dozen" Payloads (Anti-Tests)
1. **Identity Spoofing**: User A trying to create a profile with User B's UID.
2. **Privilege Escalation**: User A trying to create a profile with `isAdmin: true`.
3. **Ghost Field Injection**: Adding `systemAccess: true` to a Match document.
4. **ID Poisoning**: Creating a match with a 1MB string as the ID.
5. **Unauthorized Match Update**: Non-admin user trying to change a score.
6. **Token Hijacking**: User A trying to delete User B's FCM token.
7. **Bypassing Verification**: User trying to write without `email_verified == true`.
8. **PII Leak**: Non-admin user trying to list all emails from the `/users` collection.
9. **Stale Timestamp**: User providing a `createdAt` date from 1990 manually.
10. **Resource Exhaustion**: Sending a `homeTeam` name that is 100KB long.
11. **Shadow Admin**: Creating a document in `/admins` collection as a non-admin.
12. **Orphaned Token**: Creating an FCM token for a non-existent user.

## Test Runner
Testing will be performed via `firestore.rules.test.ts`.
