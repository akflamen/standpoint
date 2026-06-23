// app/auth/forgot-password/page.tsx
const [step, setStep] = useState<'username' | 'phrase' | 'newPassword'>('username')

// Step 1: Ask for username
{step === 'username' && (
  <form onSubmit={handleUsernameSubmit}>
    <input placeholder="Enter your username" />
    <button>Continue</button>
  </form>
)}

// Step 2: Ask for security phrase ✅
{step === 'phrase' && (
  <form onSubmit={handlePhraseSubmit}>
    <p>Enter the security phrase you set during signup</p>
    <input placeholder="Your security phrase" />
    <button>Verify Phrase</button>
  </form>
)}

// Step 3: Set new password
{step === 'newPassword' && (
  <form onSubmit={handlePasswordReset}>
    <input placeholder="New password" />
    <input placeholder="Confirm new password" />
    <button>Reset Password</button>
  </form>
)}