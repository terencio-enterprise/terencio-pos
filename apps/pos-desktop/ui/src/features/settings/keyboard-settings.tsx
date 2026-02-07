import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useKeyboardStore } from '@/store/keyboard-store'
import React, { useState } from 'react'

export const KeyboardSettings: React.FC = () => {
  const { shortcuts, updateShortcut, resetShortcuts, getKeyString } = useKeyboardStore()
  const [editingAction, setEditingAction] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyboard Shortcuts</CardTitle>
        <CardDescription>
          Customize keyboard shortcuts for common actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div key={`${shortcut.action}-${shortcut.key}`} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <div className="font-medium">{shortcut.description}</div>
                <div className="text-sm text-muted-foreground">
                  Action: {shortcut.action}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-3 py-1.5 text-sm font-semibold border rounded bg-muted">
                  {getKeyString(shortcut)}
                </kbd>
                {editingAction === shortcut.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingAction(null)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetShortcuts}
          >
            Reset to Defaults
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Available Shortcuts:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>F1 or /: Focus product search</li>
            <li>F2: Create new transaction</li>
            <li>F3: Clear current cart</li>
            <li>F9: Open settings</li>
            <li>F12: Checkout</li>
            <li>ESC: Cancel/Close dialogs</li>
            <li>Arrow keys: Navigate products and users</li>
            <li>Enter: Confirm selection/Add to cart</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
