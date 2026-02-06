import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSettingsStore } from '@/store/settings-store'
import { ArrowLeft, Save } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { settings, updateSettings, theme, updateTheme } = useSettingsStore()
  
  const [businessName, setBusinessName] = useState(settings.business.name)
  const [primaryColor, setPrimaryColor] = useState(theme.colors.primary)

  const handleSave = () => {
    updateSettings({
      business: {
        ...settings.business,
        name: businessName,
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

        <Tabs defaultValue="business" className="space-y-6">
          <TabsList>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="receipt">Receipt</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Update your business details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    defaultValue={settings.business.address}
                    placeholder="Enter business address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      defaultValue={settings.business.phone}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id ="email"
                      type="email"
                      defaultValue={settings.business.email}
                      placeholder="Enter email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    defaultValue={settings.business.taxId}
                    placeholder="Enter tax ID"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                  Configure receipt appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receiptHeader">Header Text</Label>
                  <Input
                    id="receiptHeader"
                    defaultValue={settings.receipt.header}
                    placeholder="Thank you for your purchase!"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="receiptFooter">Footer Text</Label>
                  <Input
                    id="receiptFooter"
                    defaultValue={settings.receipt.footer}
                    placeholder="Please come again"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tax Rate</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      defaultValue={settings.tax.rate * 100}
                      placeholder="10"
                      className="w-24"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      defaultValue={settings.currency.code}
                      placeholder="USD"
                    />
                    <Input
                      defaultValue={settings.currency.symbol}
                      placeholder="$"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
