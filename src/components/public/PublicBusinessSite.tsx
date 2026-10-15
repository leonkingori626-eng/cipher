import React, { useState } from 'react';
import { Star, MapPin, Phone, Mail, Clock, Shield, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { BusinessProfile, CatalogueItem, Review } from '../../types';

interface PublicBusinessSiteProps {
  profile: BusinessProfile;
  catalogue: CatalogueItem[];
  reviews: Review[];
  onBackToCommand: () => void;
  onAddEnquiry: (enquiry: any) => void;
  onAddReview: (review: Omit<Review, 'id' | 'date'>) => void;
}

export const PublicBusinessSite: React.FC<PublicBusinessSiteProps> = ({
  profile,
  catalogue,
  reviews,
  onBackToCommand,
  onAddEnquiry,
  onAddReview
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { id: '1', sender: 'assistant', text: `Hello! Welcome to ${profile.name}. How can I help you today regarding our products, hours, or services?` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Enquiry Form State
  const [enqName, setEnqName] = useState('');
  const [enqEmail, setEnqEmail] = useState('');
  const [enqMessage, setEnqMessage] = useState('');
  const [enqSubmitted, setEnqSubmitted] = useState(false);

  // Review Form State
  const [revName, setRevName] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revSubmitted, setRevSubmitted] = useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userText = chatInput.trim();
    setChatInput('');
    const newMsgs = [...messages, { id: Date.now().toString(), sender: 'customer', text: userText }];
    setMessages(newMsgs);
    setSendingChat(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, conversationHistory: newMsgs })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'assistant', text: "Thank you for reaching out! A human team member has been notified." }]);
    } finally {
      setSendingChat(false);
    }
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enqName.trim() || !enqMessage.trim()) return;
    onAddEnquiry({
      customerName: enqName.trim(),
      customerEmail: enqEmail.trim() || 'visitor@example.com',
      businessNeed: enqMessage.trim(),
      source: `Public Site (${profile.name})`
    });
    setEnqSubmitted(true);
    setEnqName('');
    setEnqEmail('');
    setEnqMessage('');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revComment.trim()) return;
    onAddReview({
      customerName: revName.trim(),
      rating: Number(revRating),
      comment: revComment.trim(),
      verifiedInteraction: true,
      status: 'Published'
    });
    setRevSubmitted(true);
    setRevName('');
    setRevComment('');
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0';

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-[#27332B] font-['Inter',sans-serif]">
      {/* Top Bar for switching back to Command */}
      <div className="bg-[#26372D] text-white px-6 py-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#497A58]" />
          <span>CIPHER Sites • Published Website Preview ({profile.name})</span>
        </div>
        <button
          onClick={onBackToCommand}
          className="bg-[#497A58] hover:bg-[#385f44] text-white px-4 py-1.5 rounded-xl font-medium transition-all"
        >
          Return to CIPHER Command
        </button>
      </div>

      {/* Hero Header */}
      <section className="bg-white border-b border-[#DCE2DC] py-20 px-4 text-center space-y-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <span className="bg-[#E5EDE5] text-[#26372D] px-4 py-1.5 rounded-full text-xs font-semibold border border-[#DCE2DC]">
            {profile.type}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#26372D]">{profile.name}</h1>
          {profile.tagline && (
            <p className="text-xl font-medium text-[#497A58]">{profile.tagline}</p>
          )}
          <p className="text-base text-[#66716A] max-w-2xl mx-auto leading-relaxed">{profile.description}</p>
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-[#66716A]">
            {profile.location && (
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#497A58]" /> {profile.location}</span>
            )}
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#497A58]" /> {profile.businessHours}</span>
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-[#497A58]" /> {profile.contactEmail}</span>
            <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-[#497A58]" /> {profile.contactPhone}</span>
          </div>
        </div>
      </section>

      {/* Catalogue Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold text-[#26372D]">Products & Services</h2>
          <p className="text-sm text-[#66716A]">Explore our current offerings and handmade goods.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {catalogue.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-6 border border-[#DCE2DC] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold bg-[#E5EDE5] text-[#497A58] px-2.5 py-1 rounded-full">
                    {item.category}
                  </span>
                  <span className="font-bold text-base text-[#27332B]">${item.price}</span>
                </div>
                <h3 className="font-bold text-lg text-[#26372D]">{item.name}</h3>
                <p className="text-xs text-[#66716A] leading-relaxed">{item.description}</p>
              </div>
              <div className="pt-4 border-t border-[#DCE2DC] flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-medium">{item.availability}</span>
                <button
                  onClick={() => {
                    const el = document.getElementById('enquiry-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#497A58] hover:bg-[#385f44] text-white px-4 py-2 rounded-xl"
                >
                  Request / Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs Section */}
      {profile.faqs && profile.faqs.length > 0 && (
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-[#26372D]">Frequently Asked Questions</h2>
            <p className="text-xs text-[#66716A]">Straightforward information grounded in our verified policies and hours.</p>
          </div>
          <div className="space-y-4">
            {profile.faqs.map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-[#DCE2DC] shadow-sm space-y-2">
                <h3 className="font-bold text-sm text-[#26372D] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#497A58]" />
                  <span>{faq.question}</span>
                </h3>
                <p className="text-xs text-[#66716A] leading-relaxed pl-4">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews & Trust Section */}
      <section className="bg-white py-16 border-t border-[#DCE2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-bold text-lg text-[#27332B]">{avgRating} / 5.0</span>
            </div>
            <h2 className="text-3xl font-bold text-[#26372D]">Customer Reviews ({reviews.length})</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-[#F7F9F6] p-6 rounded-3xl border border-[#DCE2DC] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#27332B]">{rev.customerName}</span>
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-[#27332B]">"{rev.comment}"</p>
                {rev.businessResponse && (
                  <div className="bg-white p-3 rounded-xl text-xs text-[#66716A] border border-[#DCE2DC] mt-2">
                    <strong className="text-[#26372D]">Business Response:</strong> {rev.businessResponse}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Leave a Review Form */}
          <div className="max-w-xl mx-auto bg-[#F7F9F6] p-8 rounded-3xl border border-[#DCE2DC] space-y-6">
            <h3 className="font-bold text-base text-[#26372D]">Leave a Review</h3>
            {revSubmitted ? (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Thank you! Your review has been published successfully.</span>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={revName}
                    onChange={(e) => setRevName(e.target.value)}
                    className="w-full text-sm bg-white border border-[#DCE2DC] rounded-xl px-4 py-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#66716A] mb-1">Rating (1-5)</label>
                    <select
                      value={revRating}
                      onChange={(e) => setRevRating(Number(e.target.value))}
                      className="w-full text-sm bg-white border border-[#DCE2DC] rounded-xl px-3 py-2"
                    >
                      <option value="5">5 Stars - Excellent</option>
                      <option value="4">4 Stars - Very Good</option>
                      <option value="3">3 Stars - Average</option>
                      <option value="2">2 Stars - Fair</option>
                      <option value="1">1 Star - Poor</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Review Comment</label>
                  <textarea
                    required
                    rows={3}
                    value={revComment}
                    onChange={(e) => setRevComment(e.target.value)}
                    className="w-full text-sm bg-white border border-[#DCE2DC] rounded-xl px-4 py-2"
                  />
                </div>
                <button type="submit" className="w-full bg-[#497A58] text-white py-3 rounded-xl font-semibold text-xs">
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Enquiry Section */}
      <section id="enquiry-section" className="py-16 max-w-3xl mx-auto px-4 space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-[#26372D]">Send an Enquiry</h2>
            <p className="text-xs text-[#66716A]">Have questions or want to request a custom order? Drop us a message.</p>
          </div>

          {enqSubmitted ? (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Enquiry sent successfully! Our team will get back to you shortly.</span>
            </div>
          ) : (
            <form onSubmit={handleEnquirySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={enqName}
                    onChange={(e) => setEnqName(e.target.value)}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={enqEmail}
                    onChange={(e) => setEnqEmail(e.target.value)}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Message / Requirements</label>
                <textarea
                  required
                  rows={4}
                  value={enqMessage}
                  onChange={(e) => setEnqMessage(e.target.value)}
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5"
                />
              </div>
              <button type="submit" className="w-full bg-[#497A58] text-white py-3.5 rounded-xl font-semibold text-sm shadow">
                Submit Enquiry
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#26372D] text-white py-12 px-4 text-center space-y-4">
        <p className="text-xs text-emerald-200">© 2026 {profile.name}. All rights reserved.</p>
        <p className="text-[11px] text-emerald-300">Powered by CIPHER Human-Centred Business Ecosystem</p>
      </footer>

      {/* Floating CIPHER Guide Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="bg-[#497A58] hover:bg-[#385f44] text-white p-4 rounded-full shadow-lg flex items-center gap-3 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-medium text-sm">Ask {profile.name} AI Guide</span>
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl w-96 max-w-[92vw] h-[500px] flex flex-col border border-[#DCE2DC] overflow-hidden">
            <div className="bg-[#26372D] text-white p-4 flex items-center justify-between">
              <span className="font-semibold text-sm">CIPHER Guide • {profile.name}</span>
              <button onClick={() => setChatOpen(false)} className="text-emerald-200 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F9F6]">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.sender === 'customer' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                    m.sender === 'customer' ? 'bg-[#497A58] text-white rounded-tr-none' : 'bg-white text-[#27332B] border border-[#DCE2DC] rounded-tl-none shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {sendingChat && <div className="text-xs text-[#66716A] bg-white p-2 rounded-xl w-fit">Guide is checking business catalogue...</div>}
            </div>
            <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-[#DCE2DC] flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about products, hours, pricing..."
                className="flex-1 text-xs bg-[#F0F2EF] rounded-xl px-3 py-2.5 outline-none"
              />
              <button type="submit" disabled={!chatInput.trim()} className="bg-[#497A58] text-white px-4 py-2.5 rounded-xl">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
