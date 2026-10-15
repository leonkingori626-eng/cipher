import React, { useState } from 'react';
import { Star, CheckCircle2, MessageSquare, Trash2, ShieldAlert } from 'lucide-react';
import { Review } from '../../types';

interface ReviewsTabProps {
  reviews: Review[];
  onUpdateReviewStatus: (id: string, status: Review['status']) => void;
  onAddResponse: (id: string, response: string) => void;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({ reviews, onUpdateReviewStatus, onAddResponse }) => {
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#26372D]">CIPHER Trust — Customer Reviews & Ratings</h2>
        <p className="text-xs text-[#66716A]">Moderate customer feedback, review ratings, and publish business responses.</p>
      </div>

      <div className="space-y-4">
        {reviews.map((rev) => (
          <div key={rev.id} className="bg-white rounded-3xl p-6 border border-[#DCE2DC] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < rev.rating ? 'fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="font-bold text-sm text-[#27332B]">{rev.customerName}</span>
                {rev.verifiedInteraction && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-medium">
                    Verified Interaction
                  </span>
                )}
              </div>
              <span className="text-xs text-[#66716A]">{rev.date}</span>
            </div>

            <p className="text-xs text-[#27332B] bg-[#F7F9F6] p-4 rounded-2xl border border-[#DCE2DC]">
              "{rev.comment}"
            </p>

            {rev.businessResponse && (
              <div className="bg-[#E5EDE5] p-3 rounded-xl text-xs text-[#26372D] space-y-1 ml-6 border border-[#DCE2DC]">
                <p className="font-semibold">Business Response:</p>
                <p>{rev.businessResponse}</p>
              </div>
            )}

            {!rev.businessResponse && (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Write business response..."
                  value={replyText[rev.id] || ''}
                  onChange={(e) => setReplyText({ ...replyText, [rev.id]: e.target.value })}
                  className="flex-1 text-xs bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-[#497A58]"
                />
                <button
                  onClick={() => {
                    if (replyText[rev.id]) {
                      onAddResponse(rev.id, replyText[rev.id]);
                      setReplyText({ ...replyText, [rev.id]: '' });
                    }
                  }}
                  className="bg-[#497A58] text-white text-xs px-4 py-2 rounded-xl hover:bg-[#385f44]"
                >
                  Publish Reply
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
