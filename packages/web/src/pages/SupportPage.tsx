import React, { useState } from "react";
import { Mail, Send, MessageCircle } from "lucide-react";

const SupportPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  // Honeypot fields - bots will fill these in, real users won't see them
  const [honeypot, setHoneypot] = useState("");
  const [honeypotCheck, setHoneypotCheck] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If honeypot fields are filled, silently "succeed"
    if (honeypot || honeypotCheck) {
      setSubmitted(true);
      return;
    }

    const mailtoSubject = encodeURIComponent(
      formData.subject || "Support Request"
    );
    const mailtoBody = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    );

    window.location.href = `mailto:contact@leaguegenius.app?subject=${mailtoSubject}&body=${mailtoBody}`;
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Support</h1>
      <p className="text-gray-600 mb-8">
        Have a question, issue, or suggestion? We'd love to hear from you.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <a
          href="mailto:contact@leaguegenius.app"
          className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-md transition-all"
        >
          <Mail className="h-6 w-6 text-primary flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Email Us</p>
            <p className="text-gray-500 text-sm">contact@leaguegenius.app</p>
          </div>
        </a>

        <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg p-4">
          <MessageCircle className="h-6 w-6 text-primary flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Response Time</p>
            <p className="text-gray-500 text-sm">Within 24 hours</p>
          </div>
        </div>
      </div>

      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            Message Sent!
          </h2>
          <p className="text-green-700">
            Thanks for reaching out. We'll get back to you as soon as possible.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({ name: "", email: "", subject: "", message: "" });
            }}
            className="mt-4 text-primary hover:underline font-medium"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Send us a message
          </h2>

          {/* Honeypot field 1 - hidden text input */}
          <div className="absolute opacity-0 top-0 left-0 h-0 w-0 -z-10" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Honeypot field 2 - hidden checkbox */}
          <div className="absolute opacity-0 top-0 left-0 h-0 w-0 -z-10" aria-hidden="true">
            <label htmlFor="confirm_terms">Confirm Terms</label>
            <input
              type="checkbox"
              id="confirm_terms"
              name="confirm_terms"
              tabIndex={-1}
              checked={honeypotCheck}
              onChange={(e) => setHoneypotCheck(e.target.checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                placeholder="Your name"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors bg-white"
            >
              <option value="">Select a topic</option>
              <option value="General Question">General Question</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Account Issue">Account Issue</option>
              <option value="League Management">League Management</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              value={formData.message}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors resize-vertical"
              placeholder="How can we help?"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center space-x-2 bg-primary hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <Send className="h-4 w-4" />
            <span>Send Message</span>
          </button>
        </form>
      )}
    </div>
  );
};

export default SupportPage;
