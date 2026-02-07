import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/shared/i18n/translations';
import { useSyncStore } from '@/store/sync-store';
import { AlertCircle, ArrowRight, Building2, CheckCircle2, ChevronRight, Globe, Laptop, Loader2, MapPin, Monitor, Store } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const SyncWizardPage: React.FC = () => {
  const navigate = useNavigate();
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
  } = useSyncStore();
  
  const { t, language, setLanguage } = useTranslation();
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'input' && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [step]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step === 'input') setStep('welcome');
        if (step === 'preview') setStep('input');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, setStep]);

  const handleCreateCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (step === 'welcome') setStep('input');
      else if (step === 'input' && code.length === 6) validateCode();
      else if (step === 'preview') confirmRegistration();
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  // Step Indicator
  const renderStepIndicator = () => {
    const steps = ['welcome', 'input', 'syncing', 'preview', 'success'];
    const currentIdx = steps.indexOf(step);
    const totalSteps = 4; // Excluding welcome
    
    if (step === 'welcome') return null;

    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div 
            key={s} 
            className={`h-2 rounded-full transition-all duration-300 ${
              (step === 'input' && s === 1) || 
              (step === 'syncing' && s === 2) || 
              (step === 'preview' && s === 3) || 
              (step === 'success' && s === 4)
                ? 'w-8 bg-primary' 
                : s < (currentIdx) ? 'w-2 bg-primary/50' : 'w-2 bg-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] Pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      {/* Language Switcher */}
      <div className="absolute top-6 right-6">
        <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="uppercase">{language}</span>
        </Button>
      </div>

      <div className="w-full max-w-[600px] relative z-10 transition-all duration-500 ease-in-out">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-medium tracking-tight text-muted-foreground">Terencio POS</h1>
        </div>
        
        {renderStepIndicator()}

        <Card className="border-muted/40 shadow-xl backdrop-blur-sm bg-card/95">
          {/* STEP 1: WELCOME */}
          {step === 'welcome' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-3xl font-bold tracking-tight">{t('welcome.title')}</CardTitle>
                <CardDescription className="text-lg mt-2">{t('welcome.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6 pt-6">
                <p className="text-muted-foreground">{t('welcome.description')}</p>
                <div className="grid gap-3 max-w-xs mx-auto">
                  <Button size="lg" onClick={() => setStep('input')} className="w-full h-12 text-base font-medium">
                    {t('welcome.startButton')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="justify-center border-t bg-muted/20 py-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  {t('welcome.exit')}
                </Button>
              </CardFooter>
            </div>
          )}

          {/* STEP 2: CODE INPUT */}
          {step === 'input' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl">{t('code.title')}</CardTitle>
                <CardDescription>{t('code.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  <Input
                    ref={codeInputRef}
                    value={code}
                    onChange={handleCreateCode}
                    onKeyPress={handleKeyPress}
                    placeholder={t('code.placeholder')}
                    className="text-center text-4xl h-20 font-mono tracking-[0.5em] uppercase bg-background shadow-inner"
                    maxLength={6}
                    autoFocus
                  />
                  <div className="absolute inset-x-0 -bottom-6 text-center text-xs text-muted-foreground">
                    {t('code.description')}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-6">
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('welcome')}>
                    {t('code.back')}
                  </Button>
                  <Button 
                    size="lg" 
                    className="flex-[2]" 
                    onClick={validateCode}
                    disabled={code.length !== 6 || isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('code.verify')}
                  </Button>
                </div>
              </CardContent>
            </div>
          )}

          {/* STEP 3: LOADING */}
          {step === 'syncing' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 py-12">
              <CardContent className="flex flex-col items-center justify-center space-y-6 text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Laptop className="h-6 w-6 text-muted-foreground animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">{t(loadingStatus || 'loading.validating')}</h3>
                  <p className="text-sm text-muted-foreground">Please wait...</p>
                </div>
              </CardContent>
            </div>
          )}

          {/* STEP 4: PREVIEW */}
          {step === 'preview' && posConfig && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
              <CardHeader className="pb-4">
                <CardTitle>{t('preview.title')}</CardTitle>
                <CardDescription>{t('preview.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/40 p-1">
                  {/* Store Details */}
                  <div className="p-4 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">{t('preview.store')}</p>
                      <p className="font-semibold text-lg">{posConfig.store_name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                         Downtown Branch {/* Mock Location */}
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-1" />

                  {/* POS Details */}
                  <div className="p-4 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Monitor className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">{t('preview.posName')}</p>
                      <p className="font-semibold text-lg">{posConfig.pos_name}</p>
                      <Badge variant="outline" className="mt-1 font-mono text-xs">{posConfig.device_id}</Badge>
                    </div>
                  </div>
                </div>

                {/* Developer TODO placeholders */}
                {process.env.NODE_ENV === 'development' && (
                   <div className="text-xs text-muted-foreground italic border-l-2 pl-2 border-yellow-500/50">
                     DEV: TODO: Bind edit capability & real location data
                   </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between gap-4 pt-2">
                <Button variant="outline" onClick={() => setStep('input')}>
                  {t('preview.back')}
                </Button>
                <Button onClick={confirmRegistration} className="flex-1">
                  {t('preview.confirm')} <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 'success' && posConfig && (
            <div className="animate-in fade-in zoom-in-95 duration-500 py-6 text-center">
              <CardContent className="space-y-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">{t('completion.title')}</h2>
                  <p className="text-muted-foreground text-lg">{t('completion.subtitle')}</p>
                </div>

                <div className="py-4">
                  <Badge variant="secondary" className="px-4 py-2 text-base font-normal">
                    {t('completion.summary')} <span className="font-semibold ml-1">{posConfig.store_name}</span>
                  </Badge>
                </div>

                <div className="grid gap-3 pt-4 max-w-xs mx-auto">
                  <Button size="lg" className="w-full h-12" onClick={() => navigate('/login')}>
                    {t('completion.launch')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                    {t('completion.settings')}
                  </Button>
                </div>
              </CardContent>
            </div>
          )}

          {/* ERROR STATE */}
          {step === 'error' && (
            <div className="animate-in shake duration-300">
               <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="text-xl text-destructive">{t('common.error')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">{error}</p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={reset}>{t('common.cancel')}</Button>
                  <Button onClick={() => setStep('input')}>{t('common.retry')}</Button>
                </div>
              </CardContent>
            </div>
          )}
        </Card>

        {/* Footer info */}
        <div className="text-center mt-8 text-xs text-muted-foreground/50">
          v1.0.0 • {language === 'en' ? 'Secure Desktop Environment' : 'Entorno de Escritorio Seguro'}
        </div>
      </div>
    </div>
  );
};
