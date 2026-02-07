import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useLogin, type DotState } from '@/features/auth/hooks/use-login'
import { useTranslation } from '@/shared/i18n/translations'
import { Delete, Loader2, Lock, Store, User, X } from 'lucide-react'
import React from 'react'

export const LoginPage: React.FC = () => {
  const { t } = useTranslation()
  const {
    username,
    setUsername,
    pin,
    setIsPinFocused,
    errorState,
    isLoading,
    usernameRef,
    pinContainerRef,
    handlePinInput,
    handleKeyDown,
    clearError,
    getDotState,
  } = useLogin()

  const getDotClasses = (state: DotState) => {
    switch (state) {
      case 'error':
        return 'w-4 h-4 bg-[var(--destructive)] border-2 border-[var(--destructive)] shadow-sm scale-110'
      case 'filled':
        return 'w-4 h-4 bg-[var(--primary)] border-2 border-[var(--primary)] shadow-sm scale-110'
      case 'active':
        return 'w-3 h-3 border-2 border-[var(--primary)/60] bg-[var(--primary)/20]'
      case 'empty':
      default:
        return 'w-3 h-3 border-2 border-[var(--foreground)/30] bg-transparent'
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .animate-error-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

      <div className="w-full max-w-[400px] relative z-10 flex flex-col gap-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--primary)]/10 mb-2 border border-[var(--primary)]/20">
            <Store className="h-7 w-7 text-[var(--primary)]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('login.brand')}</h1>
          <p className="text-muted-foreground text-sm font-medium">{t('login.subtitle')}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/70 group-focus-within:text-[var(--primary)] transition-colors" />
              <Input
                ref={usernameRef}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  clearError()
                }}
                onKeyDown={handleKeyDown}
                placeholder={t('login.usernamePlaceholder')}
                className="pl-12 h-14 text-lg bg-transparent border-0 border-b-2 rounded-none border-input focus-visible:ring-0 focus-visible:border-[var(--primary)] transition-colors placeholder:text-muted-foreground/80 text-foreground font-medium"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="relative py-2">
            <Separator className="bg-border/80" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs font-bold text-[var(--foreground)/80] uppercase tracking-wider">
              <Lock className="h-3 w-3 inline mr-1" />
              {t('login.pinLabel')}
            </div>
          </div>

          <div className={`space-y-6 transition-opacity duration-500 ${!username ? 'opacity-40 pointer-events-none blur-[1px]' : 'opacity-100'}`}>
            <div
              ref={pinContainerRef}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsPinFocused(true)}
              onBlur={() => setIsPinFocused(false)}
              className={`
                outline-none transition-all duration-300
                ${errorState ? 'animate-error-shake' : ''}
              `}
              onClick={() => pinContainerRef.current?.focus()}
            >
              <div className="flex justify-center gap-4">
                {[...Array(6)].map((_, i) => {
                  const state = getDotState(i)
                  return (
                    <div key={i} className="relative flex items-center justify-center w-5 h-5 ">
                      <div className={`rounded-full transition-all duration-300 ${getDotClasses(state)}`} />
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-4 min-h-[20px]" />
            </div>

            <div className="grid grid-cols-3 gap-4 px-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <Button
                  key={digit}
                  variant="ghost"
                  className="h-16 text-2xl font-normal bg-[var(--secondary)]/20 hover:bg-[var(--secondary)]/40 text-[var(--foreground)] rounded-2xl transition-all active:scale-95 border border-transparent hover:border-[var(--border)]/50"
                  onClick={() => {
                    pinContainerRef.current?.focus()
                    handlePinInput(digit.toString())
                  }}
                  disabled={isLoading || errorState}
                  tabIndex={-1}
                >
                  {digit}
                </Button>
              ))}
              
              <Button
                variant="ghost"
                className="h-16 rounded-2xl bg-[var(--secondary)]/20 hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)] transition-all active:scale-95 border border-transparent hover:border-[var(--destructive)]/20"
                onClick={() => handlePinInput('Clear')}
                disabled={isLoading || pin.length === 0}
                tabIndex={-1}
              >
                <X className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                className="h-16 text-2xl font-normal bg-[var(--secondary)]/20 hover:bg-[var(--secondary)]/40 text-[var(--foreground)] rounded-2xl transition-all active:scale-95 border border-transparent hover:border-[var(--border)]/50"
                onClick={() => {
                  pinContainerRef.current?.focus()
                  handlePinInput('0')
                }}
                disabled={isLoading || errorState}
                tabIndex={-1}
              >
                0
              </Button>
              
              <Button
                variant="ghost"
                className="h-16 rounded-2xl bg-[var(--secondary)]/20 hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-all active:scale-95 border border-transparent hover:border-[var(--border)]/50"
                onClick={() => handlePinInput('Backspace')}
                disabled={isLoading || pin.length === 0}
                tabIndex={-1}
              >
                <Delete className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {isLoading && (
            <div className="absolute inset-0 bg-[var(--background)]/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
                <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
            </div>
        )}
      </div>
    </div>
  )
}
