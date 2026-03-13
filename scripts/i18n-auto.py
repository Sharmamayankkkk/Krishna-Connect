#!/usr/bin/env python3
"""
i18n Automation Script for Krishna Connect
==========================================
Scans TSX files for hardcoded English strings and adds i18n support.

Usage:
    python scripts/i18n-auto.py                  # Dry run
    python scripts/i18n-auto.py --apply          # Apply changes
    python scripts/i18n-auto.py --scan-only      # Just list files
"""

import json
import os
import re
import sys
import argparse
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
LOCALES = SRC / "locales"
EN_JSON = LOCALES / "en.json"

# Directories/patterns to skip
SKIP_DIRS = {"/ui/", "/providers/", "/types/", "node_modules"}
SKIP_FILES = {"icons.tsx", "country-flag.tsx", "theme-provider.tsx"}
IGNORE_STRINGS = {
    "Promise", "LIVE", "GIF", "URL", "API", "OTP", "NFT", "AI", "QR",
    "Krishna Connect", "KCS", "KCS Meet", "Supabase", "Google", "GitHub",
    "GET", "POST", "PUT", "DELETE", "PATCH", "Bearer", "Content Type",
    "HG Gauranga Sundar das", "Krishna Consciousness Society",
    "rgb", "px", "em", "rem", "var", "calc", "flex",
}


def flatten(obj, prefix=""):
    r = {}
    for k, v in obj.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            r.update(flatten(v, key))
        else:
            r[key] = v
    return r


def unflatten(flat):
    result = {}
    for key, value in sorted(flat.items()):
        parts = key.split(".")
        current = result
        for p in parts[:-1]:
            current = current.setdefault(p, {})
        current[parts[-1]] = value
    return result


def text_to_camel(text):
    """Convert 'Hello World' to 'helloWorld'."""
    words = re.sub(r'[^a-zA-Z\s]', '', text).strip().split()
    if not words:
        return "text"
    return words[0].lower() + "".join(w.capitalize() for w in words[1:6])


def get_namespace(filepath):
    """Determine namespace from file path."""
    s = str(filepath)
    
    # Map path patterns to namespaces
    mappings = [
        ("/challenges/", "challenges"),
        ("/chat/", "chat"),
        ("/events/", "events"),
        ("/explore/", "explore"),
        ("/feed/", "feed"),
        ("/get-verified/", "getVerified"),
        ("/group/", "chat"),
        ("/groups/", "chat"),
        ("/leela/", "feed"),
        ("/live/", "live"),
        ("/memories/", "feed"),
        ("/news/", "news"),
        ("/notifications/", "notifications"),
        ("/post/", "post"),
        ("/profile/", "profile"),
        ("/settings/", "settings"),
        ("/spaces/", "live"),
        ("/stories/", "story"),
        ("/posts/", "post"),
        ("/calls/", "calls"),
        ("/auth/", "auth"),
        ("/(auth)/", "auth"),
        ("/(legal)/", "legal"),
        ("/(marketing)/", "about"),
        ("/media/", "media"),
        ("/dialogs/", "dialogs"),
    ]
    
    for pattern, ns in mappings:
        if pattern in s:
            return ns
    return "common"


def find_jsx_strings(content):
    """Find hardcoded English strings in JSX."""
    strings = []
    
    # >Text< pattern
    for m in re.finditer(r'>\s*([A-Z][a-zA-Z\s\'\-&,!?.]{1,60})\s*</', content):
        t = m.group(1).strip()
        if t not in IGNORE_STRINGS and len(t) >= 2:
            strings.append((t, m.start(1), m.end(1), "jsx"))
    
    # Attribute patterns: title="Text", placeholder="Text", etc.
    for attr in ["title", "label", "placeholder", "description", "alt", "aria-label"]:
        for m in re.finditer(rf'{attr}="([A-Z][a-zA-Z\s\'\-&,!?.]*?)"', content):
            t = m.group(1).strip()
            if t not in IGNORE_STRINGS and len(t) >= 2:
                strings.append((t, m.start(), m.end(), "attr"))
    
    return strings


def add_i18n_to_file(filepath, content, reverse_map, new_keys, namespace):
    """Add i18n imports, hook, and replace strings."""
    original = content
    
    # 1. Ensure 'use client'
    if '"use client"' not in content and "'use client'" not in content:
        content = '"use client";\n\n' + content
    
    # 2. Add import
    if "useTranslation" not in content:
        import_line = "import { useTranslation } from 'react-i18next';\n"
        # Find last import
        last_import = -1
        for m in re.finditer(r'^import\s+.*?(?:;|from\s+[\'"].*?[\'"];?)\s*$', content, re.MULTILINE):
            last_import = m.end()
        if last_import > 0:
            content = content[:last_import] + "\n" + import_line + content[last_import:]
        else:
            # After 'use client'
            idx = content.find("\n", content.find("use client")) + 1
            content = content[:idx] + "\n" + import_line + content[idx:]
    
    # 3. Add hook
    if "const { t }" not in content and "const {t}" not in content:
        hook = "  const { t } = useTranslation();\n"
        # Find component function body
        patterns = [
            r'(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*(?::\s*[\w<>\[\]|]+)?\s*\{)',
            r'((?:export\s+)?const\s+\w+\s*(?::\s*\w+)?\s*=\s*(?:\([^)]*\)|[^=]*?)\s*=>\s*\{)',
        ]
        inserted = False
        for pat in patterns:
            m = re.search(pat, content)
            if m:
                pos = m.end()
                content = content[:pos] + "\n" + hook + content[pos:]
                inserted = True
                break
    
    # 4. Replace strings
    replacements = []
    strings = find_jsx_strings(content)
    
    # Process in reverse order to maintain positions
    for text, start, end, kind in reversed(strings):
        lookup = text.strip()
        
        if lookup in reverse_map:
            key = reverse_map[lookup]
        else:
            key = f"{namespace}.{text_to_camel(lookup)}"
            base = key
            i = 1
            while key in new_keys and new_keys[key] != lookup:
                key = f"{base}{i}"
                i += 1
            new_keys[key] = lookup
            reverse_map[lookup] = key
        
        replacements.append({"text": text, "key": key})
    
    # Now do text replacements (using string replace for safety)
    for r in replacements:
        text = r["text"]
        key = r["key"]
        escaped = re.escape(text)
        
        # Replace >Text</ with >{t('key')}</
        content = re.sub(
            rf'(>)\s*{escaped}\s*(</)',
            rf"\1{{t('{key}')}}\2",
            content
        )
        
        # Replace attr="Text" with attr={t('key')}
        for attr in ["title", "label", "placeholder", "description", "alt", "aria-label"]:
            content = content.replace(f'{attr}="{text}"', f"{attr}={{t('{key}')}}")
    
    return content, replacements


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--scan-only", action="store_true")
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()
    
    print("🕉️  Krishna Connect i18n Automation Script")
    print("=" * 50)
    
    # Load translations
    with open(EN_JSON) as f:
        en_data = json.load(f)
    
    flat = flatten(en_data)
    reverse_map = {}
    for k, v in flat.items():
        if isinstance(v, str) and "{{" not in v:
            reverse_map[v.strip()] = k
    
    print(f"📚 {len(reverse_map)} existing translation mappings")
    
    # Find files needing updates
    files_to_process = []
    for f in sorted(SRC.rglob("*.tsx")):
        if any(s in str(f) for s in SKIP_DIRS):
            continue
        if f.name in SKIP_FILES:
            continue
        try:
            c = f.read_text()
        except:
            continue
        if "useTranslation" in c:
            continue
        if "return (" not in c and "return(" not in c:
            continue
        strings = find_jsx_strings(c)
        if strings:
            files_to_process.append(f)
    
    print(f"📋 {len(files_to_process)} files need i18n updates\n")
    
    if args.scan_only:
        for f in files_to_process:
            print(f"  📄 {f.relative_to(ROOT)}")
        return
    
    # Process files
    new_keys = {}
    updated = 0
    total_strings = 0
    
    for filepath in files_to_process:
        content = filepath.read_text()
        ns = get_namespace(filepath)
        
        new_content, replacements = add_i18n_to_file(
            filepath, content, reverse_map, new_keys, ns
        )
        
        if new_content != content:
            updated += 1
            total_strings += len(replacements)
            
            status = "✅" if args.apply else "🔍"
            print(f"  {status} {filepath.relative_to(ROOT)} ({len(replacements)} strings → {ns}.*)")
            
            if args.verbose:
                for r in replacements[:5]:
                    print(f"     \"{r['text']}\" → t('{r['key']}')")
            
            if args.apply:
                filepath.write_text(new_content)
    
    # Update locale files
    if new_keys and args.apply:
        print(f"\n📝 Adding {len(new_keys)} new keys to locale files...")
        
        # Update en.json
        for key, value in new_keys.items():
            flat[key] = value
        en_nested = unflatten(flat)
        with open(EN_JSON, "w") as f:
            json.dump(en_nested, f, ensure_ascii=False, indent=2)
            f.write("\n")
        
        # Update all locale files
        for locale_file in sorted(LOCALES.glob("*.json")):
            if locale_file.name == "en.json":
                continue
            try:
                locale_data = json.loads(locale_file.read_text())
                locale_flat = flatten(locale_data)
                for key, value in new_keys.items():
                    if key not in locale_flat:
                        locale_flat[key] = value  # English fallback
                locale_nested = unflatten(locale_flat)
                with open(locale_file, "w") as f:
                    json.dump(locale_nested, f, ensure_ascii=False, indent=2)
                    f.write("\n")
            except Exception as e:
                print(f"  ⚠ Error updating {locale_file.name}: {e}")
        
        print(f"  ✅ Updated {len(list(LOCALES.glob('*.json')))} locale files")
    
    # Summary
    print(f"\n{'=' * 50}")
    print(f"📊 Summary:")
    print(f"   Files {'updated' if args.apply else 'to update'}: {updated}")
    print(f"   Strings {'replaced' if args.apply else 'to replace'}: {total_strings}")
    print(f"   New translation keys: {len(new_keys)}")
    
    if not args.apply:
        print(f"\n💡 Run with --apply to write changes:")
        print(f"   python scripts/i18n-auto.py --apply")


if __name__ == "__main__":
    main()
