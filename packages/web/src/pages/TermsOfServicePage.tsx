import React from "react";

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Effective date: March 3, 2026</p>

      <p className="text-gray-700 mb-6">
        These Terms of Service ("Terms") govern your access to and use of the
        League Genius website and mobile application (collectively, the "Service"),
        operated by Benjamin Dally ("we", "us", or "our"). By using the Service,
        you agree to be bound by these Terms.
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Use of the Service</h2>
        <p className="text-gray-700 mb-3">
          League Genius provides tools for managing recreational leagues, including
          team registration, match scheduling, score submission, and standings
          tracking. You may use the Service only for lawful purposes and in
          accordance with these Terms.
        </p>
        <p className="text-gray-700">
          You must be at least 13 years old to create an account. By creating an
          account, you represent that you meet this requirement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Accounts</h2>
        <p className="text-gray-700 mb-3">
          You are responsible for maintaining the confidentiality of your account
          credentials and for all activity that occurs under your account. Notify
          us immediately at{" "}
          <a
            href="mailto:contact@leaguegenius.app"
            className="text-primary hover:underline"
          >
            contact@leaguegenius.app
          </a>{" "}
          if you suspect unauthorized use of your account.
        </p>
        <p className="text-gray-700">
          We reserve the right to suspend or terminate accounts that violate these
          Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Acceptable Use</h2>
        <p className="text-gray-700 mb-3">You agree not to:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
          <li>Use the Service for any unlawful purpose</li>
          <li>Submit false, misleading, or fraudulent match results</li>
          <li>
            Attempt to access admin features or another user's account without
            authorization
          </li>
          <li>Interfere with or disrupt the Service or its infrastructure</li>
          <li>
            Use automated scripts or bots to access or scrape the Service without
            permission
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Content</h2>
        <p className="text-gray-700">
          You retain ownership of any content you submit to the Service (such as
          match scores and team information). By submitting content, you grant us a
          non-exclusive, worldwide, royalty-free license to use, store, and display
          that content as necessary to operate the Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Disclaimer of Warranties</h2>
        <p className="text-gray-700">
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF
          ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
          UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
        <p className="text-gray-700">
          TO THE FULLEST EXTENT PERMITTED BY LAW, BENJAMIN DALLY SHALL NOT BE
          LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF
          ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY TO YOU
          FOR ANY CLAIMS ARISING UNDER THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU
          PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM (OR $10 IF YOU HAVE NOT
          PAID).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Changes to the Service</h2>
        <p className="text-gray-700">
          We may modify or discontinue the Service (or any part of it) at any time,
          with or without notice. We are not liable to you or any third party for
          any modification, suspension, or discontinuation of the Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to These Terms</h2>
        <p className="text-gray-700">
          We may update these Terms from time to time. We will post the updated
          Terms on this page with a revised effective date. Your continued use of
          the Service after changes constitutes your acceptance of the updated
          Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Governing Law</h2>
        <p className="text-gray-700">
          These Terms are governed by and construed in accordance with the laws of
          the State of California, without regard to its conflict of law provisions.
          Any disputes arising under these Terms shall be resolved in the courts
          located in California.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact</h2>
        <p className="text-gray-700">
          If you have questions about these Terms, please contact us:
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

export default TermsOfServicePage;
