"use client"

import * as React from "react"
import { Search, Loader2, User, FileText, Calendar, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { useTranslation } from 'react-i18next';

type SearchResult = {
    type: 'user' | 'post' | 'event'
    id: string
    title: string
    subtitle: string
    url: string
    image: string | null
}

interface GlobalSearchBarProps {
    className?: string
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    autoFocus?: boolean
}

export function GlobalSearchBar({ className, value, onChange, placeholder = "Search...", autoFocus }: GlobalSearchBarProps) {
  const { t } = useTranslation();

    const router = useRouter()
    const [internalQuery, setInternalQuery] = React.useState("")
    const query = value !== undefined ? value : internalQuery
    const setQuery = onChange || setInternalQuery

    const [results, setResults] = React.useState<SearchResult[]>([])
    const [loading, setLoading] = React.useState(false)
    const [open, setOpen] = React.useState(false)
    const wrapperRef = React.useRef<HTMLDivElement>(null)

    // Handle click outside to close
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Debounced search
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length < 2) {
                setResults([])
                setOpen(false)
                return
            }

            setLoading(true)
            const supabase = createClient()

            try {
                const { data, error } = await supabase.rpc('search_global', {
                    search_query: query
                })

                if (error) {
                    console.error("Search error:", error)
                } else {
                    setResults(data || [])
                    setOpen(true)
                }
            } catch (err) {
                console.error("Search exception:", err)
            } finally {
                setLoading(false)
            }
        }, 300) // 300ms debounce

        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (url: string) => {
        setOpen(false)
        setQuery("")
        router.push(url)
    }

    const groupedResults = React.useMemo(() => {
        const groups = {
            user: [] as SearchResult[],
            post: [] as SearchResult[],
            event: [] as SearchResult[]
        }
        results.forEach(r => {
            if (groups[r.type as keyof typeof groups]) {
                groups[r.type as keyof typeof groups].push(r)
            }
        })
        return groups
    }, [results])

    const hasResults = results.length > 0

    return (
        <div ref={wrapperRef} className={cn("relative w-full max-w-sm", className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    autoFocus={autoFocus}
                    placeholder={placeholder}
                    className="pl-9 pr-8 w-full bg-muted/40 border-none rounded-full focus-visible:ring-1 focus-visible:ring-primary shadow-sm h-10 transition-all hover:bg-muted/60"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        if (e.target.value.length === 0) setOpen(false)
                    }}
                    onFocus={() => {
                        if (results.length > 0) setOpen(true)
                    }}
                />
                {loading && (
                    <div className="absolute right-3 top-3">
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>

            {open && (query.length >= 2) && (
                <div className="absolute top-full mt-2 w-full bg-background rounded-md border shadow-lg z-50 max-h-[80vh] overflow-y-auto p-2">
                    {!loading && !hasResults && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No results found for "{query}"
                        </div>
                    )}

                    {groupedResults.user.length > 0 && (
                        <div className="mb-2">
                            <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">{t('explore.people')}</h3>
                            {groupedResults.user.map(item => (
                                <ResultItem key={item.id} item={item} icon={User} onSelect={handleSelect} />
                            ))}
                        </div>
                    )}

                    {groupedResults.event.length > 0 && (
                        <div className="mb-2">
                            <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">{t('events.title')}</h3>
                            {groupedResults.event.map(item => (
                                <ResultItem key={item.id} item={item} icon={Calendar} onSelect={handleSelect} />
                            ))}
                        </div>
                    )}

                    {groupedResults.post.length > 0 && (
                        <div className="mb-2">
                            <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">{t('profile.posts')}</h3>
                            {groupedResults.post.map(item => (
                                <ResultItem key={item.id} item={item} icon={FileText} onSelect={handleSelect} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function ResultItem({ item, icon: Icon, onSelect }: { item: SearchResult, icon: any, onSelect: (url: string) => void }) {
    return (
        <button
            onClick={() => onSelect(item.url)}
            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/80 transition-colors text-left"
        >
            {item.image ? (
                <img src={item.image} alt={item.title} className="h-8 w-8 rounded-full object-cover bg-muted" />
            ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.title}</div>
                <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
            </div>
        </button>
    )
}
