import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: April 1, 2026</p>
          </div>
        </div>

        <div className="prose prose-sm prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground">
              By downloading, installing, or using the Handled Home application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App. Handled Home ("we," "our," or "us") reserves the right to modify these Terms at any time. Continued use of the App following changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Description of Service</h2>
            <p className="text-sm text-muted-foreground">
              Handled Home is a managed home maintenance platform that connects homeowners ("Customers") with qualified service providers ("Providers") for recurring home services. We coordinate service scheduling, quality verification, and billing through a subscription-based model. We are a technology platform — we do not directly perform home maintenance services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Account Registration</h2>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>You must be at least 18 years old to create an account</li>
              <li>You must provide accurate, current, and complete information during registration</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Subscription Plans and Billing</h2>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Subscriptions are billed on a 28-day cycle ("billing cycle")</li>
              <li>Each plan includes a monthly allocation of service handles, which represent units of service value</li>
              <li>Unused handles do not roll over to the next billing cycle unless otherwise specified by your plan</li>
              <li>You may upgrade, downgrade, or cancel your plan at any time — changes take effect at the start of your next billing cycle</li>
              <li>Subscription fees are non-refundable for the current billing cycle, except as required by applicable law</li>
              <li>We reserve the right to change pricing with 28 days' advance notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Service Delivery</h2>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Services are scheduled based on your selected routine, service day assignment, and provider availability</li>
              <li>We assign qualified Providers to fulfill your services but do not guarantee a specific Provider</li>
              <li>Service quality is verified through proof photos, checklists, and customer feedback</li>
              <li>Weather, provider availability, or access issues may occasionally require rescheduling</li>
              <li>We will notify you promptly of any changes to your scheduled services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Customer Responsibilities</h2>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Provide accurate property information including access instructions, gate codes, and pet details</li>
              <li>Ensure the service area is reasonably accessible on your assigned service day</li>
              <li>Report service quality issues promptly through the App's structured issue reporting</li>
              <li>Maintain a valid payment method on file</li>
              <li>Comply with community standards and treat Providers with respect</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Provider Relationship</h2>
            <p className="text-sm text-muted-foreground">
              Providers on the Handled Home platform are independent service professionals, not employees of Handled Home. While we vet Providers for qualifications, insurance, and quality standards, we do not control the manner in which services are performed. Providers are responsible for their own tools, equipment, licensing, and insurance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Disputes and Resolutions</h2>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Service quality issues should be reported through the App's issue reporting system</li>
              <li>We use structured resolution processes including service credits, redo visits, and refunds where appropriate</li>
              <li>Resolution offers are generated based on our policy engine, which considers evidence, severity, and customer history</li>
              <li>We aim to resolve all disputes within 48 hours of submission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Account Suspension and Termination</h2>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>We may suspend or terminate your account for violation of these Terms</li>
              <li>Accounts with persistent payment failures may be suspended after our dunning process</li>
              <li>You may delete your account at any time through the App's Settings page</li>
              <li>Upon deletion, your personal data will be anonymized within 30 days</li>
              <li>Active subscriptions will be cancelled upon account deletion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground">
              To the maximum extent permitted by law, Handled Home shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the App or services coordinated through the platform. Our total liability for any claim arising from these Terms or the services shall not exceed the subscription fees paid by you in the 12 months preceding the claim. This limitation does not apply to liability that cannot be excluded by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">11. Intellectual Property</h2>
            <p className="text-sm text-muted-foreground">
              The App, its content, features, and functionality are owned by Handled Home and are protected by copyright, trademark, and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the App for personal, non-commercial purposes in accordance with these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">12. Governing Law</h2>
            <p className="text-sm text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts located in Travis County, Texas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">13. Contact Us</h2>
            <p className="text-sm text-muted-foreground">
              If you have questions about these Terms of Service, please contact us at legal@handledhome.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
