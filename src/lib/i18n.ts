'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import de from '@/locales/de.json';
import pt from '@/locales/pt.json';
import ar from '@/locales/ar.json';
import ur from '@/locales/ur.json';
import bn from '@/locales/bn.json';
import zh from '@/locales/zh.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';
import ru from '@/locales/ru.json';
import it from '@/locales/it.json';
import ta from '@/locales/ta.json';
import te from '@/locales/te.json';
import mr from '@/locales/mr.json';
import gu from '@/locales/gu.json';
import kn from '@/locales/kn.json';
import ml from '@/locales/ml.json';
import pa from '@/locales/pa.json';
import or_ from '@/locales/or.json';
import as_ from '@/locales/as.json';

export const RTL_LANGUAGES = ['ar', 'ur'];

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', countryCode: 'GB' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', countryCode: 'IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', countryCode: 'BD' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', countryCode: 'IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', countryCode: 'IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', countryCode: 'IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', countryCode: 'IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', countryCode: 'IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', countryCode: 'IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', countryCode: 'IN' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', countryCode: 'IN' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', countryCode: 'IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', countryCode: 'PK', rtl: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', countryCode: 'ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', countryCode: 'FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', countryCode: 'DE' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', countryCode: 'BR' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', countryCode: 'IT' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', countryCode: 'RU' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', countryCode: 'SA', rtl: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', countryCode: 'CN' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', countryCode: 'JP' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', countryCode: 'KR' },
] as const;

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
  ar: { translation: ar },
  ur: { translation: ur },
  bn: { translation: bn },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  ru: { translation: ru },
  it: { translation: it },
  ta: { translation: ta },
  te: { translation: te },
  mr: { translation: mr },
  gu: { translation: gu },
  kn: { translation: kn },
  ml: { translation: ml },
  pa: { translation: pa },
  or: { translation: or_ },
  as: { translation: as_ },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map(l => l.code),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
