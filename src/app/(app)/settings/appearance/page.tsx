"use client"

import { useTheme } from "next-themes"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAppContext } from "@/providers/app-provider"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Check, Plus, Image as ImageIcon } from "lucide-react"
import { cn, getContrastingTextColor } from "@/lib/utils"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const BUBBLE_COLORS = [
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#f97316", // Orange
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#eab308", // Yellow
  "#1e293b", // Slate
  "#ffffff", // White
];

const WALLPAPERS = [
  "/chat-bg/dark.png",
  "/chat-bg/light.png",
  "/chat-bg/BG_3.svg",
  "/chat-bg/BG_4.png",
];

const ChatPreview = ({ themeSettings }: { themeSettings: any }) => {
  return (
    <div className="rounded-xl border overflow-hidden relative h-[200px] w-full">
      <img
        src={themeSettings.chatWallpaper || '/chat-bg.png'}
        alt="Chat Wallpaper"
        className="absolute inset-0 z-0 h-full w-full object-cover"
        style={{ filter: `brightness(${themeSettings.wallpaperBrightness / 100})` }}
      />
      <div className="absolute inset-0 z-10 p-4 flex flex-col justify-end space-y-3">
        {/* Incoming Message */}
        <div className="flex w-full items-end gap-2">
          <div className="h-6 w-6 rounded-full bg-muted flex-shrink-0" />
          <div
            className="max-w-[70%] rounded-2xl rounded-bl-none px-3 py-2 text-sm shadow-sm"
            style={{
              backgroundColor: themeSettings.incomingBubbleColor,
              color: getContrastingTextColor(themeSettings.incomingBubbleColor)
            }}
          >
            <p className="font-medium text-xs mb-0.5" style={{ color: themeSettings.usernameColor }}>Krishna</p>
            Hare Krishna! How are you?
          </div>
        </div>

        {/* Outgoing Message */}
        <div className="flex w-full items-end justify-end gap-2">
          <div
            className="max-w-[70%] rounded-2xl rounded-br-none px-3 py-2 text-sm shadow-sm"
            style={{
              backgroundColor: themeSettings.outgoingBubbleColor,
              color: getContrastingTextColor(themeSettings.outgoingBubbleColor)
            }}
          >
            I am doing well! The new update looks amazing.
          </div>
        </div>
      </div>
    </div >
  )
}

const ColorSwatch = ({ color, selected, onClick }: { color: string, selected: boolean, onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "h-8 w-8 rounded-full border shadow-sm flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      selected && "ring-2 ring-ring ring-offset-2"
    )}
    style={{ backgroundColor: color }}
  >
    {selected && <Check className={cn("h-4 w-4", getContrastingTextColor(color) === 'black' ? "text-black" : "text-white")} />}
  </button>
)

const CustomColorPicker = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => (
  <div className="relative group">
    <Input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer opacity-0 absolute inset-0 z-10"
    />
    <div className="h-8 w-8 rounded-full border shadow-sm flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <Plus className="h-4 w-4 text-white" />
    </div>
  </div>
)

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()
  const { updateSettings, themeSettings, setThemeSettings } = useAppContext()
  const [customWallpaper, setCustomWallpaper] = useState("")

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    updateSettings({ theme: newTheme as any })
  }

  const handleChatSettingChange = (key: keyof typeof themeSettings, value: any) => {
    setThemeSettings({ [key]: value })
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize how the application looks and feels.
        </p>
      </div>

      {/* App Theme */}
      <div className="space-y-4">
        <Label className="text-base">App Theme</Label>
        <RadioGroup
          defaultValue={theme}
          onValueChange={handleThemeChange}
          className="grid max-w-md grid-cols-3 gap-8"
        >
          {/* ... Theme Options (Light/Dark/System) reused ... */}
          <div className="text-center">
            <RadioGroupItem value="light" id="light" className="sr-only" />
            <Label htmlFor="light" className="cursor-pointer">
              <div className={cn("items-center rounded-md border-2 border-muted p-1 hover:border-accent", theme === 'light' && "border-primary")}>
                <div className="space-y-2 rounded-sm bg-[#ecedef] p-2 pointer-events-none">
                  <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                    <div className="h-2 w-[40%] rounded-lg bg-[#ecedef]" />
                    <div className="h-2 w-[60%] rounded-lg bg-[#ecedef]" />
                  </div>
                  <div className="flex items-center space-x-2 rounded-md bg-white p-1 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                    <div className="h-2 w-[40px] rounded-lg bg-[#ecedef]" />
                  </div>
                </div>
              </div>
              <span className="block w-full p-2 text-center text-sm font-medium">Light</span>
            </Label>
          </div>
          <div className="text-center">
            <RadioGroupItem value="dark" id="dark" className="sr-only" />
            <Label htmlFor="dark" className="cursor-pointer">
              <div className={cn("items-center rounded-md border-2 border-muted p-1 hover:border-accent bg-popover", theme === 'dark' && "border-primary")}>
                <div className="space-y-2 rounded-sm bg-slate-950 p-2 pointer-events-none">
                  <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                    <div className="h-2 w-[40%] rounded-lg bg-slate-600" />
                    <div className="h-2 w-[60%] rounded-lg bg-slate-600" />
                  </div>
                  <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-1 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-slate-600" />
                    <div className="h-2 w-[40px] rounded-lg bg-slate-600" />
                  </div>
                </div>
              </div>
              <span className="block w-full p-2 text-center text-sm font-medium">Dark</span>
            </Label>
          </div>
          <div className="text-center">
            <RadioGroupItem value="system" id="system" className="sr-only" />
            <Label htmlFor="system" className="cursor-pointer">
              <div className={cn("items-center rounded-md border-2 border-muted p-1 hover:border-accent bg-popover", theme === 'system' && "border-primary")}>
                <div className="space-y-2 rounded-sm bg-slate-950 p-2 pointer-events-none">
                  <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                    <div className="h-2 w-[40%] rounded-lg bg-slate-600" />
                    <div className="h-2 w-[60%] rounded-lg bg-slate-600" />
                  </div>
                  <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-1 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-slate-600" />
                    <div className="h-2 w-[40px] rounded-lg bg-slate-600" />
                  </div>
                </div>
              </div>
              <span className="block w-full p-2 text-center text-sm font-medium">System</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Chat Appearance</h3>
          <p className="text-sm text-muted-foreground">
            Preview and customize your chat experience.
          </p>
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <ChatPreview themeSettings={themeSettings} />
        </div>

        {/* Bubble Colors */}
        <div className="space-y-4">
          <Label>Bubble Color</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-16">Outgoing</span>
              <div className="flex flex-wrap gap-2">
                {BUBBLE_COLORS.map(color => (
                  <ColorSwatch
                    key={`out-${color}`}
                    color={color}
                    selected={themeSettings.outgoingBubbleColor === color}
                    onClick={() => handleChatSettingChange('outgoingBubbleColor', color)}
                  />
                ))}
                <CustomColorPicker
                  value={themeSettings.outgoingBubbleColor}
                  onChange={(val) => handleChatSettingChange('outgoingBubbleColor', val)}
                  label="Custom"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-16">Incoming</span>
              <div className="flex flex-wrap gap-2">
                {BUBBLE_COLORS.map(color => (
                  <ColorSwatch
                    key={`in-${color}`}
                    color={color}
                    selected={themeSettings.incomingBubbleColor === color}
                    onClick={() => handleChatSettingChange('incomingBubbleColor', color)}
                  />
                ))}
                <CustomColorPicker
                  value={themeSettings.incomingBubbleColor}
                  onChange={(val) => handleChatSettingChange('incomingBubbleColor', val)}
                  label="Custom"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Username Color */}
        <div className="space-y-2">
          <Label>Username Color</Label>
          <div className="flex flex-wrap gap-2">
            {BUBBLE_COLORS.map(color => (
              <ColorSwatch
                key={`user-${color}`}
                color={color}
                selected={themeSettings.usernameColor === color}
                onClick={() => handleChatSettingChange('usernameColor', color)}
              />
            ))}
            <CustomColorPicker
              value={themeSettings.usernameColor}
              onChange={(val) => handleChatSettingChange('usernameColor', val)}
              label="Custom"
            />
          </div>
        </div>

        {/* Chat Wallpaper */}
        <div className="space-y-2">
          <Label>Chat Wallpaper</Label>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {WALLPAPERS.map(bg => (
              <button
                key={bg}
                onClick={() => handleChatSettingChange('chatWallpaper', bg)}
                className={cn(
                  "aspect-square rounded-md overflow-hidden relative border-2 hover:opacity-90 transition-all",
                  themeSettings.chatWallpaper === bg ? "border-primary" : "border-transparent"
                )}
              >
                <img
                  src={bg}
                  alt="Wallpaper"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </button>
            ))}

            {/* Custom URL Input */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
                  <ImageIcon className="h-6 w-6 mb-1" />
                  <span className="text-[10px]">Custom</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Custom Wallpaper</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      placeholder="https://example.com/image.png"
                      value={customWallpaper}
                      onChange={(e) => setCustomWallpaper(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => {
                    if (customWallpaper) {
                      handleChatSettingChange('chatWallpaper', customWallpaper);
                      setCustomWallpaper('');
                    }
                  }}>
                    Set Wallpaper
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Brightness */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <Label>Wallpaper Brightness</Label>
            <span className="text-sm text-muted-foreground">{themeSettings.wallpaperBrightness}%</span>
          </div>
          <Slider
            value={[themeSettings.wallpaperBrightness]}
            min={0}
            max={100}
            step={1}
            onValueChange={(vals) => handleChatSettingChange('wallpaperBrightness', vals[0])}
          />
        </div>

      </div>
    </div>
  )
}
