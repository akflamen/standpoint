"use client";

import { useState, FormEvent } from 'react';

export default function ForgotPasswordPage() {
  // Step tracker state
  const [step, setStep] = useState<'username' | 'phrase' | 'newPassword'>('username');
  
  // Input fields state
  const [username, setUsername] = useState('');
  const [phrase, setPhrase] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Step 1: Handle Username submission
  const handleUsernameSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    // Transition to security phrase phase
    setStep('phrase');
  };

  // Step 2: Handle Decentralized Security Phrase verification
  const handlePhraseSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!phrase.trim()) return;

    // TODO: Add client-side cryptographic verification using your lib/crypto.ts
    setStep('newPassword');
  };

  // Step 3: Handle Password Reset execution
  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;

    // TODO: Submit network request to rewrite credentials
    console.log("Credentials securely updated for user:", username);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md p-6 bg-slate-900 rounded-lg border border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-center">Account Recovery</h2>

        {/* Step 1: Ask for username */}
        {step === 'username' && (
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-400">Username</label>
              <input 
                type="text"
                placeholder="Enter your username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-md transition-colors">
              Continue
            </button>
          </form>
        )}

        {/* Step 2: Ask for security phrase */}
        {step === 'phrase' && (
          <form onSubmit={handlePhraseSubmit} className="space-y-4">
            <p className="text-sm text-slate-400">
              Enter the zero-knowledge security phrase you saved during registration to prove ownership.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-400">Security Phrase</label>
              <input 
                type="password"
                placeholder="Your security phrase" 
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-md transition-colors">
              Verify Phrase
            </button>
          </form>
        )}

        {/* Step 3: Set new password */}
        {step === 'newPassword' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-400">New Password</label>
              <input 
                type="password"
                placeholder="Enter new password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2 rounded-md transition-colors">
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}