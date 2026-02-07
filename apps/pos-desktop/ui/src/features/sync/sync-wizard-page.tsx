import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useTranslation } from '@/shared/i18n/translations'
import { useSyncStore } from '@/store/sync-store'
import {
    AlertCircle,
    ArrowRight,
    Building2,
    CheckCircle2,
    ChevronRight,
    Globe,
    Laptop,
    Loader2,
    MapPin,
    Monitor,
    Store
} from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export const SyncWizardPage: React.FC = () => {
  const navigate = useNavigate()
  const { 
    step, 
    code, 
    error, 
    posConfig, 
    isLoading, 
    loadingStatus, 
    setStep, 
    setCode, 
    validateCode, 
    confirmRegistration, 
    clearError, 
    reset 
  } = useSyncStore()
  
  const { t, language, setLanguage } = useTranslation()
  const codeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'input' && codeInputRef.current) {
      codeInputRef.current.focus()
    }
  }, [step])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step === 'input') setStep('welcome')
        if (step === 'preview') setStep('input')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [step, setStep])

  const handleCreateCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setCode(value)
    if (error) clearError()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (step === 'welcome') setStep('input')
      else if (step === 'input' && code.length === 6) validateCode()
      else if (step === 'preview') confirmRegistration()
    }
  }

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en')
  }

  // Simplified Step Indicator
  const renderStepIndicator = () => {
    if (step === 'welcome' || step === 'success') return null

    const steps = ['welcome', 'input', 'syncing', 'preview', 'success']
    const currentIdx = steps.indexOf(step)
    
    return (
      <div className="flex items-center justify-center gap-2 mb-8 animate-in fade-in duration-500">
        {[1, 2, 3].map((s) => (
          <div 
            key={s} 
            className={`h-1.5 rounded-full transition-all duration-500 ${
              s < currentIdx ? 'w-3 bg-primary/40' : 
              s === currentIdx ? 'w-8 bg-primary' : 
              'w-2 bg-muted-foreground/20'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden font-sans">
      {/* Background Ambience matched to LoginPage */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleLanguage} 
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-primary/5"
        >
          <Globe className="h-4 w-4" />
          <span className="uppercase text-xs font-semibold">{language}</span>
        </Button>
      </div>

      <div className="w-full max-w-[480px] relative z-10 flex flex-col gap-6 transition-all duration-500 ease-in-out">
        
        {/* Header - Always visible but adapts */}
        <div className={`text-center transition-all duration-500 ${step === 'welcome' ? 'mb-4' : 'mb-0'}`}>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4 border border-primary/20 shadow-sm">
            <Store className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Terencio POS</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            {step === 'welcome' ? t('welcome.subtitle') : t('login.subtitle')}
          </p>
        </div>

        {renderStepIndicator()}

        {/* Main Content Area - Clean, no card borders */}
        <div className="relative min-h-[300px]">
          
          {/* STEP 1: WELCOME */}
          {step === 'welcome' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('welcome.title')}</h2>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto">
                  {t('welcome.description')}
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <Button 
                  size="lg" 
                  onClick={() => setStep('input')} 
                  className="w-full h-14 text-lg font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  {t('welcome.startButton')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                {/* Optional Exit Button if needed */}
                {/* <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  {t('welcome.exit')}
                </Button> */}
              </div>
            </div>
          )}

          {/* STEP 2: CODE INPUT */}
          {step === 'input' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300 space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-foreground">{t('code.title')}</h2>
                <p className="text-muted-foreground text-sm">{t('code.subtitle')}</p>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <Laptop className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input
                    ref={codeInputRef}
                    value={code}
                    onChange={handleCreateCode}
                    onKeyPress={handleKeyPress}
                    placeholder={t('code.placeholder')}
                    className="pl-12 h-16 text-3xl font-mono tracking-[0.5em] uppercase bg-transparent border-0 border-b-2 rounded-none border-input focus-visible:ring-0 focus-visible:border-primary transition-all placeholder:text-muted-foreground/30 text-foreground font-bold text-center"
                    maxLength={6}
                    autoComplete="off"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                
                <div className="text-center text-xs text-muted-foreground/70 uppercase tracking-widest font-medium">
                  {t('code.description')}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <Button variant="ghost" size="lg" className="h-14 rounded-xl" onClick={() => setStep('welcome')}>
                  {t('code.back')}
                </Button>
                <Button 
                  size="lg" 
                  className="col-span-2 h-14 text-lg rounded-xl shadow-md" 
                  onClick={validateCode}
                  disabled={code.length !== 6 || isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : t('code.verify')}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: LOADING */}
          {step === 'syncing' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Laptop className="h-8 w-8 text-primary/60 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold text-foreground">{t(loadingStatus || 'loading.validating')}</h3>
                <p className="text-sm text-muted-foreground">Connecting to secure server...</p>
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW */}
          {step === 'preview' && posConfig && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">{t('preview.title')}</h2>
                <p className="text-muted-foreground text-sm">{t('preview.subtitle')}</p>
              </div>

              <div className="rounded-2xl border border-border/50 bg-secondary/20 p-6 space-y-6">
                {/* Store Details */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-background border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('preview.store')}</p>
                    <p className="font-bold text-xl text-foreground">{posConfig.store_name}</p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      Downtown Branch
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/60" />

                {/* POS Details */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-background border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
                    <Monitor className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('preview.posName')}</p>
                    <p className="font-bold text-xl text-foreground">{posConfig.pos_name}</p>
                    <Badge variant="outline" className="mt-1 font-mono text-xs bg-background/50">{posConfig.device_id}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <Button variant="ghost" size="lg" className="h-14 rounded-xl" onClick={() => setStep('input')}>
                  {t('preview.back')}
                </Button>
                <Button size="lg" onClick={confirmRegistration} className="col-span-2 h-14 text-lg rounded-xl shadow-md">
                  {t('preview.confirm')} <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 'success' && posConfig && (
            <div className="animate-in fade-in zoom-in-95 duration-500 py-6 text-center space-y-8">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-green-500/5">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('completion.title')}</h2>
                <p className="text-muted-foreground text-lg">{t('completion.subtitle')}</p>
              </div>

              <div className="py-2">
                <Badge variant="secondary" className="px-4 py-2 text-base font-normal bg-secondary/40 text-foreground border-0">
                  {t('completion.summary')} <span className="font-bold ml-1.5">{posConfig.store_name}</span>
                </Badge>
              </div>

              <div className="space-y-3 pt-4 max-w-xs mx-auto">
                <Button size="lg" className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/20" onClick={() => navigate('/login')}>
                  {t('completion.launch')}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate('/settings')}>
                  {t('completion.settings')}
                </Button>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {step === 'error' && (
            <div className="animate-in shake duration-300 text-center py-8 space-y-6">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-destructive">{t('common.error')}</h3>
                <p className="text-muted-foreground max-w-[280px] mx-auto">{error}</p>
              </div>

              <div className="flex justify-center gap-4 pt-2">
                <Button variant="outline" className="h-12 px-6 rounded-xl border-border/60" onClick={reset}>
                  {t('common.cancel')}
                </Button>
                <Button className="h-12 px-6 rounded-xl" onClick={() => setStep('input')}>
                  {t('common.retry')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-auto pt-8 pb-4 text-xs text-muted-foreground/40 font-medium">
          v1.0.0 • {language === 'en' ? 'Secure Desktop Environment' : 'Entorno de Escritorio Seguro'}
        </div>
      </div>
    </div>
  )
}