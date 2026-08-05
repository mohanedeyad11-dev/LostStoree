import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquarePlus, Send, CheckCircle2, AlertCircle, LogIn, Mail } from 'lucide-react';
import { db, collection, addDoc, Timestamp } from '../firebase';

interface AskForGameProps {
  lang: 'ar' | 'en';
  userId?: string;
  userEmail?: string | null;
  onLoginClick: () => void;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export const AskForGame = ({ lang, userId, userEmail, onLoginClick }: AskForGameProps) => {
  const [gameTitle, setGameTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = {
    title: lang === 'ar' ? 'اسأل عن لعبة ؟' : 'Ask for a Game?',
    subtitle: lang === 'ar' 
      ? 'ما لقيت اللعبة اللي تدور عليها؟ اطلبها الآن وسنوفرها لك بأسرع وقت وبأفضل سعر!' 
      : "Didn't find the game you are looking for? Request it now and we will secure it for you at the best price!",
    gameTitleLabel: lang === 'ar' ? 'اسم اللعبة المطلوبة' : 'Requested Game Name / Title',
    gameTitlePlaceholder: lang === 'ar' ? 'مثال: GTA VI, FIFA 26...' : 'e.g. GTA VI, FIFA 26...',
    submitBtn: lang === 'ar' ? 'إرسال الطلب' : 'Send Request',
    sending: lang === 'ar' ? 'جاري الإرسال...' : 'Sending...',
    successTitle: lang === 'ar' ? 'تم استلام طلبك بنجاح!' : 'Request Received Successfully!',
    successDesc: lang === 'ar' 
      ? 'شكراً لك! سنقوم بمراجعة طلبك والتواصل معك فور توفير اللعبة.' 
      : 'Thank you! We will review your request and contact you as soon as the game is available.',
    requestAnother: lang === 'ar' ? 'اطلب لعبة أخرى' : 'Request another game',
    errorRequired: lang === 'ar' ? 'يرجى إدخال اسم اللعبة.' : 'Please enter the game name.',
    errorGeneric: lang === 'ar' ? 'عذراً، حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.' : 'Sorry, an error occurred while sending your request. Please try again.',
    loginMessage: lang === 'ar' ? 'يرجى تسجيل الدخول لتتمكن من إرسال طلب توفير لعبة.' : 'Please log in to request a game.',
    loginBtn: lang === 'ar' ? 'تسجيل الدخول باستخدام Google' : 'Sign In with Google',
    registeredEmailLabel: lang === 'ar' ? 'سيتم التواصل معك عبر بريدك الإلكتروني المسجل:' : 'You will be contacted via your registered email:'
  };

  const handleFirestoreError = (err: unknown, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: err instanceof Error ? err.message : String(err),
      operationType,
      path,
      userId
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    return new Error(JSON.stringify(errInfo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId || !userEmail) {
      setError(t.loginMessage);
      return;
    }

    if (!gameTitle.trim()) {
      setError(t.errorRequired);
      return;
    }

    setIsSubmitting(true);

    try {
      const path = 'game_requests';
      const payload: any = {
        userId: userId,
        gameTitle: gameTitle.trim(),
        contactInfo: userEmail,
        status: 'pending',
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, path), payload);

      setIsSuccess(true);
      setGameTitle('');
    } catch (err) {
      const loggedError = handleFirestoreError(err, OperationType.CREATE, 'game_requests');
      setError(t.errorGeneric);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="ask-for-game-container" className="mt-16 max-w-2xl mx-auto w-full">
      <div className="bg-white/[0.03] border border-white/5 p-8 sm:p-12 rounded-[40px] shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Glow decorative elements */}
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {!isSuccess ? (
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-violet-600/15 rounded-2xl flex items-center justify-center text-violet-400 border border-violet-500/10 shadow-lg">
                <MessageSquarePlus size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black italic text-white uppercase tracking-tight">
                  {t.title}
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {t.subtitle}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!userId ? (
              <div className="text-center py-8 px-6 bg-white/[0.01] border border-white/5 rounded-3xl flex flex-col items-center justify-center space-y-5">
                <p className="text-sm font-bold text-slate-400">
                  {t.loginMessage}
                </p>
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="px-8 py-4 bg-violet-600 text-white font-black uppercase tracking-wider text-xs rounded-2xl transition-all shadow-xl hover:bg-violet-500 hover:shadow-violet-600/20 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2"
                >
                  <LogIn size={16} />
                  <span>{t.loginBtn}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-violet-400 mb-2">
                      {t.gameTitleLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={gameTitle}
                      onChange={(e) => setGameTitle(e.target.value)}
                      placeholder={t.gameTitlePlaceholder}
                      required
                      className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white placeholder:text-slate-600 focus:border-violet-500/30 outline-none transition-all"
                    />
                  </div>

                  {userEmail && (
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center gap-3 text-slate-400 text-xs font-bold">
                      <Mail size={16} className="text-violet-400 shrink-0" />
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span>{t.registeredEmailLabel}</span>
                        <span className="text-violet-400 font-mono text-sm tracking-normal">{userEmail}</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-5 font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 ${
                    isSubmitting 
                      ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                      : 'bg-violet-600 text-white hover:bg-violet-500 hover:shadow-violet-600/20 hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>{t.sending}</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>{t.submitBtn}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 flex flex-col items-center justify-center relative z-10"
          >
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-6 shadow-2xl shadow-emerald-500/5">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black italic text-white mb-2 uppercase">
              {t.successTitle}
            </h3>
            <p className="text-sm font-semibold text-slate-400 max-w-md leading-relaxed mb-8">
              {t.successDesc}
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-wider text-xs rounded-2xl transition-all"
            >
              {t.requestAnother}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
