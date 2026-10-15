import React, { useState } from 'react';
import { Shield, UserCircle, KeyRound, Mail, Lock, User, Building2, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, X } from 'lucide-react';
import { User as UserType, Workspace, WorkspaceRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  currentRole: WorkspaceRole;
  onLoginSuccess: (data: { user: UserType; token: string; workspaces: Workspace[]; currentWorkspace: Workspace; role: WorkspaceRole }) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentRole,
  onLoginSuccess,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'login' | 'register' | 'forgot'>('demo');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('E-Commerce & Handcrafted Goods');

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'DemoPassword123!' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      onLoginSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with demo account');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid credentials');
      onLoginSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Name, email, and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, businessName, businessType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      onLoginSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please enter your account email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setResetStep(2);
        setSuccessMsg('Reset token generated. Enter a new password to finalize recovery.');
      } else {
        setSuccessMsg(data.message || 'Reset instructions sent.');
      }
    } catch (err: any) {
      setError(err.message || 'Password reset request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      setError('Token and new password are required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setSuccessMsg(data.message);
      setTimeout(() => {
        setActiveTab('login');
        setResetStep(1);
        setSuccessMsg('Password updated! You can now log in.');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#DCE2DC] animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#26372D] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#497A58] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">CIPHER Identity & Access</h3>
              <p className="text-xs text-emerald-200">Role-Based Multi-Tenant Authentication</p>
            </div>
          </div>

          {/* Current User Pill */}
          {currentUser && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-300">Signed in as:</span>
                <span className="font-semibold text-white">{currentUser.name}</span>
                <span className="bg-[#497A58] text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  {currentRole}
                </span>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="text-red-300 hover:text-red-100 font-medium underline"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#DCE2DC] bg-[#F7F9F6] text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('demo'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'demo' ? 'border-[#497A58] text-[#26372D] bg-white' : 'border-transparent text-[#66716A] hover:text-[#26372D]'
            }`}
          >
            Demo Accounts
          </button>
          <button
            onClick={() => { setActiveTab('login'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'login' ? 'border-[#497A58] text-[#26372D] bg-white' : 'border-transparent text-[#66716A] hover:text-[#26372D]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'register' ? 'border-[#497A58] text-[#26372D] bg-white' : 'border-transparent text-[#66716A] hover:text-[#26372D]'
            }`}
          >
            Register Business
          </button>
          <button
            onClick={() => { setActiveTab('forgot'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'forgot' ? 'border-[#497A58] text-[#26372D] bg-white' : 'border-transparent text-[#66716A] hover:text-[#26372D]'
            }`}
          >
            Recovery
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: DEMO ACCOUNTS */}
          {activeTab === 'demo' && (
            <div className="space-y-3">
              <p className="text-xs text-[#66716A] mb-3">
                Switch instantly between pre-configured ecosystem roles to test authorization, workspace scoping, and permission tiers:
              </p>

              {/* Sarah Jenkins - Owner */}
              <button
                disabled={loading}
                onClick={() => handleDemoLogin('sarah.jenkins@mapleandmossgoods.com')}
                className="w-full text-left p-3.5 rounded-2xl border border-[#DCE2DC] hover:border-[#497A58] hover:bg-[#F7F9F6] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E5EDE5] text-[#497A58] flex items-center justify-center font-bold text-sm">
                    SJ
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#26372D]">Sarah Jenkins</span>
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Owner</span>
                    </div>
                    <span className="text-[11px] text-[#66716A]">Full admin rights, settings & workspace governance</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#66716A] group-hover:text-[#497A58] group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* David Kim - Operator */}
              <button
                disabled={loading}
                onClick={() => handleDemoLogin('david.kim@mapleandmossgoods.com')}
                className="w-full text-left p-3.5 rounded-2xl border border-[#DCE2DC] hover:border-[#497A58] hover:bg-[#F7F9F6] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                    DK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#26372D]">David Kim</span>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Operator</span>
                    </div>
                    <span className="text-[11px] text-[#66716A]">Support desk, enquiries, customer chats & catalogue</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#66716A] group-hover:text-[#497A58] group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Marcus Vance - Client */}
              <button
                disabled={loading}
                onClick={() => handleDemoLogin('marcus.vance@designstudio.co')}
                className="w-full text-left p-3.5 rounded-2xl border border-[#DCE2DC] hover:border-[#497A58] hover:bg-[#F7F9F6] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                    MV
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#26372D]">Marcus Vance</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Client</span>
                    </div>
                    <span className="text-[11px] text-[#66716A]">Client portal, project status, task tracking & reviews</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#66716A] group-hover:text-[#497A58] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          )}

          {/* TAB 2: REGULAR SIGN IN */}
          {activeTab === 'login' && (
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#26372D] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#66716A] absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#DCE2DC] focus:outline-none focus:border-[#497A58]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#26372D]">Password</label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-[11px] text-[#497A58] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#66716A] absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#DCE2DC] focus:outline-none focus:border-[#497A58]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#497A58] hover:bg-[#385f44] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Sign In to Workspace</span>
              </button>
            </form>
          )}

          {/* TAB 3: REGISTER NEW BUSINESS */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#26372D] mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#66716A] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DCE2DC] focus:outline-none focus:border-[#497A58]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#26372D] mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#66716A] absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@morganstudio.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DCE2DC] focus:outline-none focus:border-[#497A58]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#26372D] mb-1">Password (min 8 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#66716A] absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DCE2DC] focus:outline-none focus:border-[#497A58]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#26372D] mb-1">Business Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#66716A] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Morgan Studio & Workshop"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DCE2DC] focus:outline-none focus:border-[#497A58]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#497A58] hover:bg-[#385f44] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Create Account & Launch Workspace</span>
              </button>
            </form>
          )}

          {/* TAB 4: PASSWORD RECOVERY */}
          {activeTab === 'forgot' && (
            <div>
              {resetStep === 1 ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <p className="text-xs text-[#66716A]">
                    Enter your registered email address to receive password reset authorization:
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-[#26372D] mb-1">Account Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#66716A] absolute left-3 top-3" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#DCE2DC] focus:outline-none focus:border-[#497A58]"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#497A58] hover:bg-[#385f44] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Request Recovery Token</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompleteReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#26372D] mb-1">Reset Token</label>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Enter verification token"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE2DC] focus:outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#26372D] mb-1">New Password (min 8 chars)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={8}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE2DC] focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#497A58] hover:bg-[#385f44] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Update Password & Log In</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
