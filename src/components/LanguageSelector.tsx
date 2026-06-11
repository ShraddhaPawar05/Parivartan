import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'hi', label: 'हि', name: 'हिंदी' },
  { code: 'mr', label: 'म', name: 'मराठी' },
];

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className="relative flex items-center">
      <select
        value={i18n.language?.split('-')[0] || 'en'}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="appearance-none bg-transparent border border-gray-300 text-gray-700 text-sm font-medium rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer hover:border-emerald-400 transition-colors"
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label} {lang.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 text-gray-500 text-xs">▾</span>
    </div>
  );
};

export default LanguageSelector;
