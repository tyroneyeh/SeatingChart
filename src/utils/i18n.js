import { ref } from 'vue';
import { translations } from '../data/translations';

const browserLang = navigator.language || navigator.userLanguage || 'en';
export const currentLanguage = ref(browserLang);

export function translate(key) {
    const dict = translations[currentLanguage.value];
    return dict && dict[key] ? dict[key] : key;
}
