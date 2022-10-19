import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import translation_en from './en'
import translation_zh from './zh'

const resources = {
  en: {
    translation: translation_en
  },
  zh: {
    translation: translation_zh
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng:
    localStorage.getItem('localLanguage') == null || localStorage.getItem('localLanguage') == 'zh'
      ? 'zh'
      : 'en',
  interpolation: {
    escapeValue: false
  }
})
export default i18n
