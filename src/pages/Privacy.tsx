import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
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
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: April 1, 2026</p>
          </div>
        </div>

        <div className="prose prose-sm prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold">1. Introduction</h2>
            <p className="text-sm text-muted-foreground">
              Handled Home ("we," "our," or "us") operates the Handled Home mobile application (the "App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App and related services. By using the App, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Information We Collect</h2>

            <h3 className="text-base font-medium mt-4">2.1 Information You Provide</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Account information:</strong> name, email address, and password when you create an account</li>
              <li><strong>Property information:</strong> home address, property details (lot size, number of stories, yard size), access notes, gate codes, and pet information</li>
              <li><strong>Payment information:</strong> payment method details processed securely through Stripe (we do not store your full card number)</li>
              <li><strong>Service preferences:</strong> selected services, scheduling preferences, and routine configurations</li>
              <li><strong>Communications:</strong> messages, support tickets, and feedback you submit through the App</li>
            </ul>

            <h3 className="text-base font-medium mt-4">2.2 Information Collected Automatically</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Device information:</strong> device type, operating system, unique device identifiers, and push notification tokens</li>
              <li><strong>Location data:</strong> approximate location based on your property address for zone coverage and service routing (we do not track real-time GPS location)</li>
              <li><strong>Usage data:</strong> pages viewed, features used, and interaction patterns within the App</li>
              <li><strong>Photos:</strong> service proof photos taken by providers during job completion (before/after images of completed work)</li>
            </ul>

            <h3 className="text-base font-medium mt-4">2.3 Information from Third Parties</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Payment processor:</strong> Stripe provides transaction status and payment confirmation</li>
              <li><strong>Mapping services:</strong> Mapbox provides geographic data for service area visualization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. How We Use Your Information</h2>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Provide, maintain, and improve the App and our services</li>
              <li>Match you with qualified service providers in your area</li>
              <li>Process payments and manage your subscription</li>
              <li>Schedule and coordinate home maintenance services</li>
              <li>Send service confirmations, reminders, and updates</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Ensure quality through service proof verification (photos and checklists)</li>
              <li>Generate anonymized analytics to improve our service offerings</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. How We Share Your Information</h2>
            <p className="text-sm text-muted-foreground">We do not sell your personal information. We share information only as follows:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside mt-2">
              <li><strong>Service providers:</strong> your name, property address, access notes, and service requirements are shared with assigned providers to perform scheduled services</li>
              <li><strong>Payment processing:</strong> Stripe processes your payment information under their own privacy policy</li>
              <li><strong>Legal requirements:</strong> we may disclose information when required by law, court order, or to protect our rights</li>
              <li><strong>Business transfers:</strong> in the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Data Retention</h2>
            <p className="text-sm text-muted-foreground">
              We retain your personal information for as long as your account is active or as needed to provide you services. Service proof photos are retained for 12 months after the service date. After account deletion, we anonymize your personal data within 30 days while retaining anonymized service records necessary for provider payment history and regulatory compliance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Your Rights and Choices</h2>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Access:</strong> you can access your personal information through your account settings</li>
              <li><strong>Update:</strong> you can update your profile, property, and preference information at any time</li>
              <li><strong>Delete:</strong> you can delete your account from the Settings page in the App, which will anonymize your personal data</li>
              <li><strong>Notifications:</strong> you can manage notification preferences in the App settings</li>
              <li><strong>Data portability:</strong> you may request a copy of your data by contacting us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Data Security</h2>
            <p className="text-sm text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your information, including encryption in transit (TLS), secure authentication, row-level security on our database, and secure payment processing through Stripe. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Children's Privacy</h2>
            <p className="text-sm text-muted-foreground">
              The App is not intended for use by children under 18. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Changes to This Policy</h2>
            <p className="text-sm text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the App and updating the "Last updated" date. Continued use of the App after changes constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Contact Us</h2>
            <p className="text-sm text-muted-foreground">
              If you have questions about this Privacy Policy or your data, please contact us at privacy@handledhome.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
