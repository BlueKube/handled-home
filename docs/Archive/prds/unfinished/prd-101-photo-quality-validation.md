# PRD 101: Photo Quality Validation

> **Status:** PARTIALLY COMPLETE
> **Priority:** P0 Critical
> **Effort:** Medium (3–5 days)

## What Exists Today

A `validate-photo-quality` edge function is deployed and operational. It performs the following checks on provider-uploaded photos for each job:

- **File size validation:** Rejects photos smaller than 50KB (likely corrupted or placeholder) and larger than 20MB (excessive for proof-of-work).
- **Format validation:** Confirms the uploaded file is a recognized image format by checking the MIME type.
- **Basic duplicate detection:** Uses a file-size-based hash to flag photos within the same job that have identical file sizes as possible duplicates.
- **Notification on failure:** When any photo fails validation, the system sends an in-app notification to the provider with a direct link to the job's photo upload screen, prompting them to retake.

Validation results are stored per photo with a pass/fail status, individual check outcomes, and failure reasons. The function processes all photos for a job in a single invocation.

## What's Missing

1. **Sharpness / blur detection** -- The system cannot detect blurry photos. A provider can upload an out-of-focus image that passes all current checks (correct size, correct format, unique file size) but is useless as proof of work. Customers see a blurry "before" photo and lose trust.

2. **Brightness validation** -- Photos that are too dark (taken in poor lighting or with a covered lens) or too bright (overexposed, washed out) pass all current checks. These photos fail to show the actual work performed.

3. **Perceptual hashing for near-duplicate detection** -- The current duplicate check uses file size as a proxy, which is extremely crude. Two different photos taken seconds apart will have different file sizes but may be visually near-identical (same angle, same subject, minor differences). Conversely, two completely different photos could coincidentally have the same file size and be falsely flagged. Perceptual hashing would detect visually similar images regardless of file size, compression, or minor edits.

4. **EXIF orientation handling** -- Photos uploaded from mobile devices often contain EXIF orientation metadata that determines how the image should be displayed. If this metadata is not read and applied, photos may appear rotated 90 or 180 degrees on the customer's receipt, creating a confusing and unprofessional experience.

5. **Real-time upload feedback** -- Currently, validation runs after all photos are uploaded for a job. The provider does not learn about quality issues until they receive a notification, which may be minutes later. Validating each photo at upload time and showing immediate feedback would let providers retake on the spot.

## Why This Matters

### For the Business
- **Dispute prevention:** Photo proof is the primary evidence in customer-provider disputes. A blurry or dark photo is as good as no photo -- it cannot prove work was done. Catching bad photos at upload time eliminates the #1 source of unresolvable disputes.
- **Brand perception:** The Handled Receipt is the core value delivery moment. When a customer opens their receipt and sees a rotated, blurry, or nearly black photo, it undermines the "premium home care" brand promise regardless of how good the actual service was.
- **Provider accountability:** Clear, high-quality photos create an objective record. Providers who consistently upload poor photos can be identified and coached. Without quality checks, the system cannot distinguish between providers who do great work with bad photography and providers who do poor work and obscure it with bad photography.
- **Operational efficiency:** Support agents currently spend time manually reviewing disputed photos. Automated quality gates reduce the volume of photos that need human review.

### For the User
- **Customers** receive clear, properly oriented before-and-after photos that genuinely show what was done in their home. This is the proof that justifies their subscription cost.
- **Providers** get immediate, actionable feedback ("This photo is too dark -- try again with better lighting") rather than a delayed notification that requires them to return to the property or explain the poor quality.
- **Both parties** benefit from a reliable evidence trail that makes dispute resolution faster and fairer.

## User Flow

### Provider Upload Flow (Enhanced)

1. Provider completes a service task and taps the camera icon to upload a proof photo.
2. Provider takes or selects a photo from their device.
3. **Immediately upon selection** (before final upload), the app runs client-side quality pre-checks:
   - Blur detection: Analyzes the image and shows a warning if the photo appears out of focus.
   - Brightness check: Flags if the image is significantly underexposed or overexposed.
   - Orientation: Reads EXIF data and auto-corrects the display orientation.
4. If the photo fails any pre-check, the provider sees an inline warning card below the photo preview:
   - For blur: "This photo looks blurry. Tap to retake for a clearer image."
   - For brightness: "This photo is too dark / too bright. Try adjusting your angle or lighting."
   - The provider can choose to retake (recommended) or proceed anyway (the warning is advisory on the client side).
5. The photo is uploaded to storage.
6. The server-side edge function runs the full validation suite (file size, format, blur score, brightness score, perceptual hash duplicate check, orientation correction).
7. If the server-side check fails, the provider receives an immediate in-app notification with specific guidance on what to fix, along with a deep link back to the photo upload screen for that job.
8. If all checks pass, the photo is marked as validated and becomes available for the customer's Handled Receipt.

### Near-Duplicate Detection Flow

1. Provider uploads a "before" photo of the front yard.
2. Provider uploads an "after" photo that is visually almost identical to the "before" (same angle, same scene, no visible work difference).
3. The perceptual hash check detects the high visual similarity between the two photos.
4. The provider sees a warning: "These photos look very similar. Before and after photos should show visible differences. Would you like to retake the after photo?"
5. The provider can retake or acknowledge and proceed (in case the work performed was subtle, like fertilizer application).

### Customer Experience

1. Customer receives their Handled Receipt notification.
2. All photos on the receipt are properly oriented, clearly lit, and visually distinct (before genuinely looks different from after).
3. If a provider's photos were flagged and retaken, the customer only ever sees the final validated versions.

## UI/UX Design Recommendations

- **Live camera overlay hints:** When the provider opens the camera, show subtle guide lines and a brightness indicator (similar to document scanning apps). A small icon in the corner turns green when lighting conditions are good, amber when marginal, and red when poor.
- **Inline photo quality feedback:** After a photo is selected, show the preview with a quality badge overlay in the corner -- a green checkmark for "looks good," an amber warning triangle for "could be better," or a red X for "please retake." Tapping the badge reveals the specific issue.
- **Retake-first design:** When a quality issue is detected, make "Retake" the primary (filled) button and "Use Anyway" the secondary (outline) button. This nudges providers toward better photos without blocking them.
- **Before/after similarity warning:** When near-duplicate detection fires, show the two photos side by side in a comparison view with highlighted regions of similarity. This makes it visually obvious why the system is concerned.
- **Orientation auto-correction:** Apply EXIF orientation silently -- the provider and customer should always see the photo right-side-up without any manual intervention. Show corrected orientation in all previews and on the receipt.
- **Provider quality score integration:** Surface a "Photo Quality" metric in the provider's dashboard showing their validation pass rate over the last 30 days. Providers who consistently hit 95%+ could earn a "Quality Photographer" badge. This gamifies improvement.
- **Graceful degradation:** If the client-side quality checks cannot run (older device, limited processing power), fall back to server-side-only validation with the delayed notification flow. Never block the upload entirely due to client-side processing limitations.

## Acceptance Criteria

- Blur detection identifies and flags photos below a defined sharpness threshold with an accuracy rate that minimizes false positives on legitimately clear photos
- Brightness validation flags photos that are significantly underexposed (too dark) or overexposed (too bright) based on histogram analysis or equivalent technique
- Perceptual hashing detects visually similar photos within the same job, replacing the current file-size-based duplicate check
- Perceptual hash duplicate detection correctly distinguishes between before/after photos of the same area (expected similarity with visible differences) and true near-duplicates (no meaningful visual difference)
- EXIF orientation metadata is read and applied so that all photos display in correct orientation across all surfaces (provider upload, customer receipt, admin review)
- Providers receive immediate, specific, actionable feedback when a photo fails quality checks (not just "photo failed" but "photo is too blurry -- try holding your phone steady")
- The retake flow allows providers to replace a flagged photo without re-uploading all photos for the job
- Photos that fail server-side validation trigger an in-app notification to the provider with a deep link to the upload screen
- All validation results (pass/fail per check, scores, failure reasons) are stored per photo for audit and analytics
- Photo validation does not block job completion but flags quality issues visibly for both provider and ops review
- Client-side pre-checks provide instant feedback during the upload flow without requiring a round trip to the server
- The system gracefully handles cases where client-side checks are unavailable, falling back to server-side validation only
