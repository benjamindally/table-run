import React from "react";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Effective date: March 3, 2026</p>

      <p className="text-gray-700 mb-6">
        League Genius ("we", "us", or "our") is operated by Benjamin Dally. This
        Privacy Policy explains how we collect, use, and protect your information
        when you use the League Genius website and mobile application
        (collectively, the "Service").
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
        <p className="text-gray-700 mb-3">
          We collect information you provide directly when you create an account or
          use the Service:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
          <li>First and last name</li>
          <li>Email address</li>
          <li>Phone number (optional)</li>
          <li>Skill level (optional)</li>
          <li>League, team, and match activity generated through your use of the Service</li>
        </ul>
        <p className="text-gray-700 mt-3">
          We also collect limited usage data automatically when you interact with
          the Service, such as pages visited and features used, to help us improve
          the product.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
        <p className="text-gray-700 mb-3">We use the information we collect to:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
          <li>Create and manage your account</li>
          <li>Operate league, team, and match functionality</li>
          <li>Display standings, schedules, and player statistics</li>
          <li>Respond to support requests</li>
          <li>Improve and develop the Service</li>
        </ul>
        <p className="text-gray-700 mt-3">
          We do not sell your personal information to third parties.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Third-Party Services</h2>
        <p className="text-gray-700 mb-3">
          We use the following third-party services to operate the Service:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
          <li>
            <strong>Supabase</strong> — database and authentication infrastructure.
            Your account data is stored on Supabase servers.
          </li>
          <li>
            <strong>PostHog</strong> — product analytics. We use PostHog to
            understand how the Service is used. No personally identifiable
            information is intentionally sent to PostHog.
          </li>
          <li>
            <strong>Apple App Store / Google Play Store</strong> — the mobile
            application is distributed through Apple and Google platforms, which
            have their own privacy practices.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Retention</h2>
        <p className="text-gray-700">
          We retain your account information for as long as your account is active
          or as needed to provide the Service. You may request deletion of your
          account and associated data at any time by contacting us at the address
          below.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
        <p className="text-gray-700 mb-3">You have the right to:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your account and data</li>
          <li>Opt out of analytics tracking</li>
        </ul>
        <p className="text-gray-700 mt-3">
          To exercise any of these rights, please contact us at{" "}
          <a
            href="mailto:contact@leaguegenius.app"
            className="text-primary hover:underline"
          >
            contact@leaguegenius.app
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Children's Privacy</h2>
        <p className="text-gray-700">
          The Service is not directed to children under the age of 13. We do not
          knowingly collect personal information from children under 13. If you
          believe a child has provided us with personal information, please contact
          us and we will delete it.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Changes to This Policy</h2>
        <p className="text-gray-700">
          We may update this Privacy Policy from time to time. We will post the
          updated policy on this page with a revised effective date. Continued use
          of the Service after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h2>
        <p className="text-gray-700">
          If you have questions about this Privacy Policy, please contact us:
        </p>
        <div className="mt-2 text-gray-700">
          <p>Benjamin Dally, operating as League Genius</p>
          <p>
            <a
              href="mailto:contact@leaguegenius.app"
              className="text-primary hover:underline"
            >
              contact@leaguegenius.app
            </a>
          </p>
          <p>leaguegenius.app</p>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;
