"use client"

import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { SUPPORTED_LANGUAGES, RTL_LANGUAGES } from "@/lib/i18n"
import { CountryFlag } from "@/components/country-flag"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Check, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function LanguageSettingsPage() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")

  const currentLanguage = i18n.language

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return SUPPORTED_LANGUAGES
    const q = searchQuery.toLowerCase()
    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode)
    const dir = RTL_LANGUAGES.includes(langCode) ? "rtl" : "ltr"
    document.documentElement.lang = langCode
    document.documentElement.dir = dir
    toast({
      title: t("settings.language.saved"),
    })
  }

  const currentLangInfo = SUPPORTED_LANGUAGES.find(
    (l) => l.code === currentLanguage
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("settings.language.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("settings.language.pageDescription")}
        </p>
      </div>
      <Separator />

      {/* Current language */}
      {currentLangInfo && (
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <CountryFlag countryCode={currentLangInfo.countryCode} size={24} />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {t("settings.language.currentLanguage")}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentLangInfo.name} ({currentLangInfo.nativeName})
            </p>
          </div>
          <Check className="h-5 w-5 text-primary" />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("settings.language.searchLanguages")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Language list */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          {t("settings.language.selectLanguage")}
        </h4>
        <div className="rounded-lg border divide-y">
          {filteredLanguages.map((lang) => {
            const isActive = lang.code === currentLanguage
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50",
                  isActive && "bg-secondary"
                )}
              >
                <CountryFlag countryCode={lang.countryCode} size={20} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{lang.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lang.nativeName}
                  </p>
                </div>
                {isActive && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </button>
            )
          })}
          {filteredLanguages.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("common.noResults")}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
