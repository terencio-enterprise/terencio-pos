import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KeyboardSettings } from '@/features/settings/keyboard-settings'
import { useSettingsStore } from '@/store/settings-store'
import { ArrowLeft, Save } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { settings, updateSettings, theme, updateTheme } = useSettingsStore()
  
  const [primaryColor, setPrimaryColor] = useState(theme.colors.primary)
  const [receiptHeader, setReceiptHeader] = useState(settings.receipt.header)
  const [receiptFooter, setReceiptFooter] = useState(settings.receipt.footer)

  const handleSave = () => {
    updateSettings({
      ...settings,
      receipt: {
        ...settings.receipt,
        header: receiptHeader,
        footer: receiptFooter,
      },
    })
    
    updateTheme({
      ...theme,
      colors: {
        ...theme.colors,
        primary: primaryColor,
      },
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/pos')}
            title="Back to POS (ESC)"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Configure your POS system
            </p>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="theme" className="space-y-6">
          <TabsList>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="receipt">Receipt</TabsTrigger>
            <TabsTrigger value="keyboard">Keyboard</TabsTrigger>
            <TabsTrigger value="hardware">Hardware</TabsTrigger>
          </TabsList>

          <TabsContent value="theme" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme Customization</CardTitle>
                <CardDescription>
                  Customize the look and feel of your POS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color (HSL)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="221.2 83.2% 53.3%"
                    />
                    <div
                      className="h-10 w-20 rounded-md border"
                      style={{ backgroundColor: `hsl(${primaryColor})` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format: hue saturation% lightness% (e.g., "221.2 83.2% 53.3%")
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receipt Settings</CardTitle>
                <CardDescription>
                  Configure receipt appearance (local overrides)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receiptHeader">Header Text</Label>
                  <Input
                    id="receiptHeader"
                    value={receiptHeader}
                    onChange={(e) => setReceiptHeader(e.target.value)}
                    placeholder="Thank you for your purchase!"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="receiptFooter">Footer Text</Label>
                  <Input
                    id="receiptFooter"
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder="Please come again"
                  />
                </div>

                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-semibold mb-2">Note:</p>
                  <p className="text-muted-foreground">
                    Business information, tax rates, and currency settings are managed by the core backend
                    and will be synced automatically. Only receipt text can be customized locally.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keyboard" className="space-y-4">
            <KeyboardSettings />
          </TabsContent>

          <TabsContent value="hardware" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hardware Configuration</CardTitle>
                <CardDescription>
                  Configure and test connected hardware devices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border-2 border-dashed p-8 text-center">
                  <p className="text-muted-foreground">
                    Hardware configuration features coming soon
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This section will allow you to configure and test:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Receipt printers</li>
                    <li>• Barcode scanners</li>
                    <li>• Cash drawers</li>
                    <li>• Customer displays</li>
                    <li>• Payment terminals</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
