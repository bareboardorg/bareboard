/* BareBoard multilingual switcher.
   External file on purpose: the site CSP is script-src 'self', so no inline
   code is needed and no CSP change is required. Dictionaries live in
   /i18n/<lang>.json (same origin, allowed by default-src 'self').
   Picker UI: frosted-glass panel with live search and keyboard navigation,
   matching the site's own glass nav. Translation engine unchanged. */
(function () {
  "use strict";

  var LANGS = [
    { code: "en", name: "English", en: "English", dir: "ltr" },
    { code: "aa", name: "Afar", en: "Afar", dir: "ltr" },
    { code: "ab", name: "Аҧсуа", en: "Abkhazian", dir: "ltr" },
    { code: "ace", name: "Bahsa Acèh", en: "Acehnese", dir: "ltr" },
    { code: "ach", name: "Acholi", en: "Acoli", dir: "ltr" },
    { code: "af", name: "Afrikaans", en: "Afrikaans", dir: "ltr" },
    { code: "ak", name: "Akan", en: "Akan", dir: "ltr" },
    { code: "alz", name: "Alur", en: "Alur", dir: "ltr" },
    { code: "am", name: "አማርኛ", en: "Amharic", dir: "ltr" },
    { code: "ar", name: "العربية", en: "Arabic", dir: "rtl" },
    { code: "as", name: "অসমীয়া", en: "Assamese", dir: "ltr" },
    { code: "av", name: "Авар", en: "Avaric", dir: "ltr" },
    { code: "awa", name: "अवधी", en: "Awadhi", dir: "ltr" },
    { code: "ay", name: "Aymara", en: "Aymara", dir: "ltr" },
    { code: "az", name: "Azərbaycanca", en: "Azerbaijani", dir: "ltr" },
    { code: "ba", name: "Башҡорт", en: "Bashkir", dir: "ltr" },
    { code: "bal", name: "بلوچی", en: "Balochi", dir: "rtl" },
    { code: "ban", name: "Basa Bali", en: "Balinese", dir: "ltr" },
    { code: "bbc", name: "Batak Toba", en: "Batak Toba", dir: "ltr" },
    { code: "bci", name: "Baoulé", en: "Baoulé", dir: "ltr" },
    { code: "be", name: "Беларуская", en: "Belarusian", dir: "ltr" },
    { code: "bem", name: "Bemba", en: "Bemba", dir: "ltr" },
    { code: "ber", name: "ⵜⴰⵎⴰⵣⵉⵖⵜ", en: "Tamazight", dir: "ltr" },
    { code: "ber-Latn", name: "Tamazight (Latin)", en: "Tamazight (Latin)", dir: "ltr" },
    { code: "bew", name: "Betawi", en: "Betawi", dir: "ltr" },
    { code: "bg", name: "Български", en: "Bulgarian", dir: "ltr" },
    { code: "bho", name: "भोजपुरी", en: "Bhojpuri", dir: "ltr" },
    { code: "bik", name: "Bikol", en: "Bikol", dir: "ltr" },
    { code: "bm", name: "Bamanankan", en: "Bambara", dir: "ltr" },
    { code: "bm-Nkoo", name: "ߒߞߏ", en: "Bambara (Nko)", dir: "rtl" },
    { code: "bn", name: "বাংলা", en: "Bangla", dir: "ltr" },
    { code: "bo", name: "བོད་ཡིག", en: "Tibetan", dir: "ltr" },
    { code: "br", name: "Brezhoneg", en: "Breton", dir: "ltr" },
    { code: "bs", name: "Bosanski", en: "Bosnian", dir: "ltr" },
    { code: "bts", name: "Batak Simalungun", en: "Batak Simalungun", dir: "ltr" },
    { code: "btx", name: "Karo", en: "Karo", dir: "ltr" },
    { code: "bua", name: "Буряад", en: "Buriat", dir: "ltr" },
    { code: "ca", name: "Català", en: "Catalan", dir: "ltr" },
    { code: "ce", name: "Нохчийн", en: "Chechen", dir: "ltr" },
    { code: "ceb", name: "Cebuano", en: "Cebuano", dir: "ltr" },
    { code: "cgg", name: "Kiga", en: "Chiga", dir: "ltr" },
    { code: "ch", name: "Chamoru", en: "Chamorro", dir: "ltr" },
    { code: "chk", name: "Chuukese", en: "Chuukese", dir: "ltr" },
    { code: "chm", name: "Марий", en: "Mari", dir: "ltr" },
    { code: "ckb", name: "کوردیی ناوەندی", en: "Central Kurdish", dir: "rtl" },
    { code: "cnh", name: "Hakha Chin", en: "Hakha Chin", dir: "ltr" },
    { code: "co", name: "Corsu", en: "Corsican", dir: "ltr" },
    { code: "crh", name: "Qırım Tili", en: "Crimean Tatar", dir: "ltr" },
    { code: "crh-Latn", name: "Qırım Tili (Latin)", en: "Crimean Tatar (Latin)", dir: "ltr" },
    { code: "crs", name: "Kreol Seselwa", en: "Seselwa Creole French", dir: "ltr" },
    { code: "cs", name: "Čeština", en: "Czech", dir: "ltr" },
    { code: "cv", name: "Чӑваш", en: "Chuvash", dir: "ltr" },
    { code: "cy", name: "Cymraeg", en: "Welsh", dir: "ltr" },
    { code: "da", name: "Dansk", en: "Danish", dir: "ltr" },
    { code: "de", name: "Deutsch", en: "German", dir: "ltr" },
    { code: "din", name: "Dinka", en: "Dinka", dir: "ltr" },
    { code: "doi", name: "डोगरी", en: "Dogri", dir: "ltr" },
    { code: "dov", name: "Dombe", en: "Dombe", dir: "ltr" },
    { code: "dv", name: "ދިވެހި", en: "Divehi", dir: "rtl" },
    { code: "dyu", name: "Dyula", en: "Dyula", dir: "ltr" },
    { code: "dz", name: "རྫོང་ཁ", en: "Dzongkha", dir: "ltr" },
    { code: "ee", name: "Eʋegbe", en: "Ewe", dir: "ltr" },
    { code: "el", name: "Ελληνικά", en: "Greek", dir: "ltr" },
    { code: "eo", name: "Esperanto", en: "Esperanto", dir: "ltr" },
    { code: "es", name: "Español", en: "Spanish", dir: "ltr" },
    { code: "et", name: "Eesti", en: "Estonian", dir: "ltr" },
    { code: "eu", name: "Euskara", en: "Basque", dir: "ltr" },
    { code: "fa", name: "فارسی", en: "Persian", dir: "rtl" },
    { code: "fa-AF", name: "دری", en: "Dari", dir: "rtl" },
    { code: "ff", name: "Fulani", en: "Fula", dir: "ltr" },
    { code: "fi", name: "Suomi", en: "Finnish", dir: "ltr" },
    { code: "fil", name: "Filipino", en: "Filipino", dir: "ltr" },
    { code: "fj", name: "Vosa Vakaviti", en: "Fijian", dir: "ltr" },
    { code: "fo", name: "Føroyskt", en: "Faroese", dir: "ltr" },
    { code: "fon", name: "Fon", en: "Fon", dir: "ltr" },
    { code: "fr", name: "Français", en: "French", dir: "ltr" },
    { code: "fr-CA", name: "Français (Canada)", en: "French (Canada)", dir: "ltr" },
    { code: "fur", name: "Furlan", en: "Friulian", dir: "ltr" },
    { code: "fy", name: "Frysk", en: "Western Frisian", dir: "ltr" },
    { code: "ga", name: "Gaeilge", en: "Irish", dir: "ltr" },
    { code: "gaa", name: "Ga", en: "Ga", dir: "ltr" },
    { code: "gd", name: "Gàidhlig", en: "Scottish Gaelic", dir: "ltr" },
    { code: "gl", name: "Galego", en: "Galician", dir: "ltr" },
    { code: "gn", name: "Avañeʼẽ", en: "Guarani", dir: "ltr" },
    { code: "gom", name: "कोंकणी", en: "Konkani", dir: "ltr" },
    { code: "gu", name: "ગુજરાતી", en: "Gujarati", dir: "ltr" },
    { code: "gv", name: "Gaelg", en: "Manx", dir: "ltr" },
    { code: "ha", name: "Hausa", en: "Hausa", dir: "ltr" },
    { code: "haw", name: "ʻŌlelo Hawaiʻi", en: "Hawaiian", dir: "ltr" },
    { code: "he", name: "עברית", en: "Hebrew", dir: "rtl" },
    { code: "hi", name: "हिन्दी", en: "Hindi", dir: "ltr" },
    { code: "hil", name: "Hilagaynon", en: "Hiligaynon", dir: "ltr" },
    { code: "hmn", name: "Hmong", en: "Hmong", dir: "ltr" },
    { code: "hr", name: "Hrvatski", en: "Croatian", dir: "ltr" },
    { code: "hrx", name: "Hunsrik", en: "Hunsrik", dir: "ltr" },
    { code: "ht", name: "Kreyòl Ayisyen", en: "Haitian Creole", dir: "ltr" },
    { code: "hu", name: "Magyar", en: "Hungarian", dir: "ltr" },
    { code: "hy", name: "Հայերեն", en: "Armenian", dir: "ltr" },
    { code: "iba", name: "Jaku Iban", en: "Iban", dir: "ltr" },
    { code: "id", name: "Bahasa Indonesia", en: "Indonesian", dir: "ltr" },
    { code: "ig", name: "Igbo", en: "Igbo", dir: "ltr" },
    { code: "ilo", name: "Ilokano", en: "Iloko", dir: "ltr" },
    { code: "is", name: "Íslenska", en: "Icelandic", dir: "ltr" },
    { code: "it", name: "Italiano", en: "Italian", dir: "ltr" },
    { code: "iu", name: "ᐃᓄᒃᑎᑐᑦ", en: "Inuktitut", dir: "ltr" },
    { code: "iu-Latn", name: "Inuktitut (Latin)", en: "Inuktitut (Latin)", dir: "ltr" },
    { code: "ja", name: "日本語", en: "Japanese", dir: "ltr" },
    { code: "jam", name: "Jamaican Patois", en: "Jamaican Creole English", dir: "ltr" },
    { code: "jv", name: "Basa Jawa", en: "Javanese", dir: "ltr" },
    { code: "ka", name: "ქართული", en: "Georgian", dir: "ltr" },
    { code: "kac", name: "Jinghpaw", en: "Kachin", dir: "ltr" },
    { code: "kek", name: "Qʼeqchiʼ", en: "Qʼeqchiʼ", dir: "ltr" },
    { code: "kg", name: "Kikongo", en: "Kongo", dir: "ltr" },
    { code: "kha", name: "Khasi", en: "Khasi", dir: "ltr" },
    { code: "kk", name: "Қазақша", en: "Kazakh", dir: "ltr" },
    { code: "kl", name: "Kalaallisut", en: "Kalaallisut", dir: "ltr" },
    { code: "km", name: "ខ្មែរ", en: "Khmer", dir: "ltr" },
    { code: "kn", name: "ಕನ್ನಡ", en: "Kannada", dir: "ltr" },
    { code: "ko", name: "한국어", en: "Korean", dir: "ltr" },
    { code: "kr", name: "Kanuri", en: "Kanuri", dir: "ltr" },
    { code: "kri", name: "Krio", en: "Krio", dir: "ltr" },
    { code: "ktu", name: "Kituba", en: "Kituba", dir: "ltr" },
    { code: "ku", name: "Kurdî", en: "Kurdish", dir: "ltr" },
    { code: "kv", name: "Коми", en: "Komi", dir: "ltr" },
    { code: "ky", name: "Кыргызча", en: "Kyrgyz", dir: "ltr" },
    { code: "la", name: "Latina", en: "Latin", dir: "ltr" },
    { code: "lb", name: "Lëtzebuergesch", en: "Luxembourgish", dir: "ltr" },
    { code: "lg", name: "Luganda", en: "Ganda", dir: "ltr" },
    { code: "li", name: "Limburgs", en: "Limburgish", dir: "ltr" },
    { code: "lij", name: "Ligurian", en: "Ligurian", dir: "ltr" },
    { code: "lmo", name: "Lombard", en: "Lombard", dir: "ltr" },
    { code: "ln", name: "Lingála", en: "Lingala", dir: "ltr" },
    { code: "lo", name: "ລາວ", en: "Lao", dir: "ltr" },
    { code: "lt", name: "Lietuvių", en: "Lithuanian", dir: "ltr" },
    { code: "ltg", name: "Latgalian", en: "Latgalian", dir: "ltr" },
    { code: "lua", name: "Tshiluba", en: "Luba-Lulua", dir: "ltr" },
    { code: "luo", name: "Dholuo", en: "Dholuo", dir: "ltr" },
    { code: "lus", name: "Mizo ṭawng", en: "Mizo", dir: "ltr" },
    { code: "lv", name: "Latviešu", en: "Latvian", dir: "ltr" },
    { code: "mad", name: "Madhura", en: "Madurese", dir: "ltr" },
    { code: "mai", name: "मैथिली", en: "Maithili", dir: "ltr" },
    { code: "mak", name: "Mangkasara", en: "Makasar", dir: "ltr" },
    { code: "mam", name: "Mam", en: "Mam", dir: "ltr" },
    { code: "mfe", name: "Kreol Morisien", en: "Morisyen", dir: "ltr" },
    { code: "mg", name: "Malagasy", en: "Malagasy", dir: "ltr" },
    { code: "mh", name: "Kajin M̧ajeļ", en: "Marshallese", dir: "ltr" },
    { code: "mhr", name: "Марий", en: "Mari", dir: "ltr" },
    { code: "mi", name: "Te Reo Māori", en: "Māori", dir: "ltr" },
    { code: "min", name: "Minangkabau", en: "Minangkabau", dir: "ltr" },
    { code: "mk", name: "Македонски", en: "Macedonian", dir: "ltr" },
    { code: "ml", name: "മലയാളം", en: "Malayalam", dir: "ltr" },
    { code: "mn", name: "Монгол", en: "Mongolian", dir: "ltr" },
    { code: "mni-Mtei", name: "ꯃꯩꯇꯩ", en: "Manipuri (Meitei Mayek)", dir: "ltr" },
    { code: "mr", name: "मराठी", en: "Marathi", dir: "ltr" },
    { code: "ms", name: "Bahasa Melayu", en: "Malay", dir: "ltr" },
    { code: "ms-Arab", name: "Jawi", en: "Malay (Jawi)", dir: "rtl" },
    { code: "mt", name: "Malti", en: "Maltese", dir: "ltr" },
    { code: "mwr", name: "मारवाडी", en: "Marwari", dir: "ltr" },
    { code: "my", name: "မြန်မာ", en: "Burmese", dir: "ltr" },
    { code: "ndc-ZW", name: "Ndau", en: "Ndau", dir: "ltr" },
    { code: "ne", name: "नेपाली", en: "Nepali", dir: "ltr" },
    { code: "new", name: "Nepalbhasa", en: "Newari", dir: "ltr" },
    { code: "nhe", name: "Nahuatl", en: "Nahuatl", dir: "ltr" },
    { code: "nl", name: "Nederlands", en: "Dutch", dir: "ltr" },
    { code: "no", name: "Norsk", en: "Norwegian", dir: "ltr" },
    { code: "nr", name: "Ndebele", en: "South Ndebele", dir: "ltr" },
    { code: "nso", name: "Sepedi", en: "Northern Sotho", dir: "ltr" },
    { code: "nus", name: "Nuer", en: "Nuer", dir: "ltr" },
    { code: "ny", name: "Chichewa", en: "Nyanja", dir: "ltr" },
    { code: "oc", name: "Occitan", en: "Occitan", dir: "ltr" },
    { code: "om", name: "Afaan Oromoo", en: "Oromo", dir: "ltr" },
    { code: "or", name: "ଓଡ଼ିଆ", en: "Odia", dir: "ltr" },
    { code: "os", name: "Ирон", en: "Ossetic", dir: "ltr" },
    { code: "pa", name: "ਪੰਜਾਬੀ", en: "Punjabi", dir: "ltr" },
    { code: "pa-Arab", name: "پنجابی", en: "Punjabi (Shahmukhi)", dir: "rtl" },
    { code: "pag", name: "Pangasinan", en: "Pangasinan", dir: "ltr" },
    { code: "pam", name: "Kapampangan", en: "Pampanga", dir: "ltr" },
    { code: "pap", name: "Papiamento", en: "Papiamento", dir: "ltr" },
    { code: "pl", name: "Polski", en: "Polish", dir: "ltr" },
    { code: "ps", name: "پښتو", en: "Pashto", dir: "rtl" },
    { code: "pt", name: "Português", en: "Portuguese", dir: "ltr" },
    { code: "pt-PT", name: "Português (Portugal)", en: "Portuguese (Portugal)", dir: "ltr" },
    { code: "qu", name: "Runasimi", en: "Quechua", dir: "ltr" },
    { code: "rn", name: "Kirundi", en: "Rundi", dir: "ltr" },
    { code: "ro", name: "Română", en: "Romanian", dir: "ltr" },
    { code: "rom", name: "Romani", en: "Romany", dir: "ltr" },
    { code: "ru", name: "Русский", en: "Russian", dir: "ltr" },
    { code: "rw", name: "Kinyarwanda", en: "Kinyarwanda", dir: "ltr" },
    { code: "sa", name: "संस्कृतम्", en: "Sanskrit", dir: "ltr" },
    { code: "sah", name: "Саха", en: "Yakut", dir: "ltr" },
    { code: "sat", name: "Santali", en: "Santali", dir: "ltr" },
    { code: "sat-Latn", name: "Santali (Latin)", en: "Santali (Latin)", dir: "ltr" },
    { code: "scn", name: "Sicilianu", en: "Sicilian", dir: "ltr" },
    { code: "sd", name: "سنڌي", en: "Sindhi", dir: "rtl" },
    { code: "se", name: "Davvisámegiella", en: "Northern Sami", dir: "ltr" },
    { code: "sg", name: "Sango", en: "Sango", dir: "ltr" },
    { code: "shn", name: "ရှမ်း", en: "Shan", dir: "ltr" },
    { code: "si", name: "සිංහල", en: "Sinhala", dir: "ltr" },
    { code: "sk", name: "Slovenčina", en: "Slovak", dir: "ltr" },
    { code: "sl", name: "Slovenščina", en: "Slovenian", dir: "ltr" },
    { code: "sm", name: "Gagana Samoa", en: "Samoan", dir: "ltr" },
    { code: "sn", name: "chiShona", en: "Shona", dir: "ltr" },
    { code: "so", name: "Soomaali", en: "Somali", dir: "ltr" },
    { code: "sq", name: "Shqip", en: "Albanian", dir: "ltr" },
    { code: "sr", name: "Српски", en: "Serbian", dir: "ltr" },
    { code: "ss", name: "Siswati", en: "Swati", dir: "ltr" },
    { code: "st", name: "Sesotho", en: "Southern Sotho", dir: "ltr" },
    { code: "su", name: "Basa Sunda", en: "Sundanese", dir: "ltr" },
    { code: "sus", name: "Susu", en: "Susu", dir: "ltr" },
    { code: "sv", name: "Svenska", en: "Swedish", dir: "ltr" },
    { code: "sw", name: "Kiswahili", en: "Swahili", dir: "ltr" },
    { code: "szl", name: "Ślōnski", en: "Silesian", dir: "ltr" },
    { code: "ta", name: "தமிழ்", en: "Tamil", dir: "ltr" },
    { code: "tcy", name: "ತುಳು", en: "Tulu", dir: "ltr" },
    { code: "te", name: "తెలుగు", en: "Telugu", dir: "ltr" },
    { code: "tet", name: "Tetun", en: "Tetum", dir: "ltr" },
    { code: "tg", name: "Тоҷикӣ", en: "Tajik", dir: "ltr" },
    { code: "th", name: "ไทย", en: "Thai", dir: "ltr" },
    { code: "ti", name: "ትግርኛ", en: "Tigrinya", dir: "ltr" },
    { code: "tiv", name: "Tiv", en: "Tiv", dir: "ltr" },
    { code: "tk", name: "Türkmençe", en: "Turkmen", dir: "ltr" },
    { code: "tn", name: "Setswana", en: "Tswana", dir: "ltr" },
    { code: "to", name: "Lea Faka-Tonga", en: "Tongan", dir: "ltr" },
    { code: "tpi", name: "Tok Pisin", en: "Tok Pisin", dir: "ltr" },
    { code: "tr", name: "Türkçe", en: "Turkish", dir: "ltr" },
    { code: "trp", name: "Kokborok", en: "Kokborok", dir: "ltr" },
    { code: "ts", name: "Xitsonga", en: "Tsonga", dir: "ltr" },
    { code: "tt", name: "Татар", en: "Tatar", dir: "ltr" },
    { code: "tum", name: "Tumbuka", en: "Tumbuka", dir: "ltr" },
    { code: "tw", name: "Twi", en: "Akan", dir: "ltr" },
    { code: "ty", name: "Reo Tahiti", en: "Tahitian", dir: "ltr" },
    { code: "tyv", name: "Тыва дыл", en: "Tuvinian", dir: "ltr" },
    { code: "udm", name: "Удмурт", en: "Udmurt", dir: "ltr" },
    { code: "ug", name: "ئۇيغۇرچە", en: "Uyghur", dir: "rtl" },
    { code: "uk", name: "Українська", en: "Ukrainian", dir: "ltr" },
    { code: "ur", name: "اردو", en: "Urdu", dir: "rtl" },
    { code: "uz", name: "Oʻzbekcha", en: "Uzbek", dir: "ltr" },
    { code: "ve", name: "Tshivenda", en: "Venda", dir: "ltr" },
    { code: "vec", name: "Venetan", en: "Venetian", dir: "ltr" },
    { code: "vi", name: "Tiếng Việt", en: "Vietnamese", dir: "ltr" },
    { code: "war", name: "Waray", en: "Waray", dir: "ltr" },
    { code: "wo", name: "Wolof", en: "Wolof", dir: "ltr" },
    { code: "xh", name: "isiXhosa", en: "Xhosa", dir: "ltr" },
    { code: "yi", name: "ייִדיש", en: "Yiddish", dir: "rtl" },
    { code: "yo", name: "Yorùbá", en: "Yoruba", dir: "ltr" },
    { code: "yua", name: "Maaya Tʼaan", en: "Maaya Tʼaan", dir: "ltr" },
    { code: "yue", name: "粵語", en: "Cantonese", dir: "ltr" },
    { code: "zap", name: "Zapoteco", en: "Zapotec", dir: "ltr" },
    { code: "zh", name: "中文", en: "Chinese", dir: "ltr" },
    { code: "zh-TW", name: "繁體中文", en: "Traditional Chinese", dir: "ltr" },
    { code: "zu", name: "isiZulu", en: "Zulu", dir: "ltr" }
  ];
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  var originals = []; // {node, text} or {el, attr, text}
  var current = "en";
  var dict = null;
  var picker = null;

  function norm(s) { return s.replace(/\s+/g, " ").trim(); }

  function remember(node, attr) {
    for (var i = 0; i < originals.length; i++) {
      if (originals[i].node === node && originals[i].attr === attr) return;
    }
    originals.push({ node: node, attr: attr, text: attr ? node.getAttribute(attr) : node.nodeValue });
  }

  function restore() {
    for (var i = 0; i < originals.length; i++) {
      var o = originals[i];
      if (o.attr) { o.node.setAttribute(o.attr, o.text); }
      else { o.node.nodeValue = o.text; }
    }
  }

  function translateTextNode(node) {
    var raw = node.nodeValue;
    if (!raw) return;
    var key = norm(raw);
    if (!key || !dict[key]) return;
    remember(node, null);
    var lead = raw.match(/^\s*/)[0];
    var trail = raw.match(/\s*$/)[0];
    node.nodeValue = lead + dict[key] + trail;
  }

  function applyDict() {
    if (!dict) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentNode;
        while (p && p.nodeType === 1) {
          if (SKIP_TAGS[p.tagName]) return NodeFilter.FILTER_REJECT;
          if (p.classList && p.classList.contains("bb-lang")) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return norm(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(translateTextNode);

    // Attributes: alt / title / aria-label / placeholder
    var attrs = ["alt", "title", "aria-label", "placeholder"];
    var els = document.body.querySelectorAll("[alt],[title],[aria-label],[placeholder]");
    els.forEach(function (el) {
      if (el.closest && el.closest(".bb-lang")) return;
      attrs.forEach(function (a) {
        if (!el.hasAttribute(a)) return;
        var key = norm(el.getAttribute(a) || "");
        if (key && dict[key]) { remember(el, a); el.setAttribute(a, dict[key]); }
      });
    });

    // Page <title>
    var tKey = norm(document.title || "");
    if (tKey && dict[tKey]) document.title = dict[tKey];
  }

  function setLang(code, save) {
    var meta = null;
    LANGS.forEach(function (l) { if (l.code === code) meta = l; });
    if (!meta) { code = "en"; meta = LANGS[0]; }
    current = code;
    if (save) { try { localStorage.setItem("bb-lang", code); } catch (e) {} }
    document.documentElement.setAttribute("lang", code === "zh" ? "zh-CN" : code);
    document.documentElement.setAttribute("dir", meta.dir);
    if (picker) updatePicker();
    restore();
    if (code === "en") { dict = null; return; }
    fetch("/i18n/" + code + ".json", { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (json) { if (current === code) { dict = json; applyDict(); } })
      .catch(function () { /* dictionary missing: page stays in English */ });
  }

  var GLOBE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/></svg>';
  var CHEV = '<svg class="bb-lang-chev" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5"/></svg>';
  var MAG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.6-4.6"/></svg>';
  var CHECK = '<svg class="bb-lang-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12.5 10 18 19.5 6.5"/></svg>';

  function foldStr(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function visibleItems() {
    return picker.items.filter(function (it) { return !it.el.hidden; });
  }

  function setActive(n) {
    var vis = visibleItems();
    picker.items.forEach(function (it) { it.el.classList.remove("active"); });
    if (!vis.length) { picker.activeEl = null; return; }
    var i = ((n % vis.length) + vis.length) % vis.length;
    var el = vis[i].el;
    el.classList.add("active");
    picker.activeEl = el;
    picker.input.setAttribute("aria-activedescendant", el.id);
    try { el.scrollIntoView({ block: "nearest" }); } catch (e) {}
  }

  function filterList() {
    var q = foldStr(picker.input.value.trim());
    var shown = 0;
    picker.items.forEach(function (it) {
      var hit = !q || it.fName.indexOf(q) !== -1 || it.fEn.indexOf(q) !== -1 ||
        it.code.toLowerCase().indexOf(q) === 0;
      it.el.hidden = !hit;
      if (hit) shown++;
    });
    picker.emptyEl.hidden = shown !== 0;
    var vis = visibleItems();
    var ci = vis.findIndex(function (v) { return v.code === current; });
    setActive(ci >= 0 ? ci : 0);
  }

  function openPicker() {
    if (picker.open) return;
    picker.open = true;
    picker.wrap.classList.add("open");
    picker.btn.setAttribute("aria-expanded", "true");
    picker.veil.classList.add("show");
    picker.input.value = "";
    filterList();
    var cur = null;
    picker.items.forEach(function (it) { if (it.code === current) cur = it; });
    if (cur) setTimeout(function () { try { cur.el.scrollIntoView({ block: "center" }); } catch (e) {} }, 70);
    picker.wrap.classList.add("bb-anim");
    setTimeout(function () { picker.wrap.classList.remove("bb-anim"); }, 700);
    try { picker.input.focus({ preventScroll: true }); } catch (e) { picker.input.focus(); }
  }

  function closePicker(refocus) {
    if (!picker || !picker.open) return;
    picker.open = false;
    picker.wrap.classList.remove("open");
    picker.btn.setAttribute("aria-expanded", "false");
    picker.veil.classList.remove("show");
    if (refocus) { try { picker.btn.focus({ preventScroll: true }); } catch (e) {} }
  }

  function updatePicker() {
    var meta = null;
    LANGS.forEach(function (l) { if (l.code === current) meta = l; });
    if (!meta) meta = LANGS[0];
    picker.btnName.textContent = meta.name;
    picker.items.forEach(function (it) {
      var on = it.code === current;
      it.el.classList.toggle("current", on);
      it.el.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function buildSelector() {
    var wrap = document.createElement("div");
    wrap.className = "bb-lang";
    /* Situated the Apple way: language choice lives in the footer, in its
       own end bar, as a quiet text control - never in the top nav. */
    var footerEl = document.querySelector("footer");
    if (footerEl) {
      var bar = document.createElement("div");
      bar.className = "bb-footer-bar";
      wrap.classList.add("bb-foot");
      bar.appendChild(wrap);
      footerEl.appendChild(bar);
    } else {
      var host = document.querySelector(".nav-inner") || document.querySelector("header") || document.body;
      host.appendChild(wrap);
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bb-lang-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Language");
    btn.innerHTML = GLOBE;
    var btnName = document.createElement("span");
    btnName.className = "bb-lang-btn-name";
    btnName.textContent = "English";
    btn.appendChild(btnName);
    var chevWrap = document.createElement("span");
    chevWrap.innerHTML = CHEV;
    btn.appendChild(chevWrap.firstChild);

    var panel = document.createElement("div");
    panel.className = "bb-lang-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Choose a language");

    var search = document.createElement("div");
    search.className = "bb-lang-search";
    search.innerHTML = MAG;
    var input = document.createElement("input");
    input.type = "text";
    input.className = "bb-lang-input";
    input.placeholder = "Search languages";
    input.setAttribute("aria-label", "Search languages");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-expanded", "true");
    input.setAttribute("aria-controls", "bb-lang-list");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("spellcheck", "false");
    search.appendChild(input);
    panel.appendChild(search);

    var list = document.createElement("ul");
    list.className = "bb-lang-list";
    list.id = "bb-lang-list";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Languages");
    panel.appendChild(list);

    var empty = document.createElement("div");
    empty.className = "bb-lang-empty";
    empty.textContent = "No languages found";
    empty.hidden = true;
    panel.appendChild(empty);

    var veil = document.createElement("div");
    veil.className = "bb-lang-veil";
    document.body.appendChild(veil);

    picker = {
      wrap: wrap, btn: btn, btnName: btnName, panel: panel, input: input,
      list: list, emptyEl: empty, veil: veil, items: [], open: false, activeEl: null
    };

    LANGS.forEach(function (l, i) {
      var li = document.createElement("li");
      li.className = "bb-lang-item";
      li.id = "bb-lang-opt-" + l.code;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.setAttribute("data-code", l.code);
      li.style.setProperty("--i", Math.min(i, 14));
      var nm = document.createElement("span");
      nm.className = "bb-lang-name";
      nm.textContent = l.name;
      li.appendChild(nm);
      if (l.en && l.en !== l.name) {
        var en = document.createElement("span");
        en.className = "bb-lang-en";
        en.textContent = l.en;
        li.appendChild(en);
      }
      var ck = document.createElement("span");
      ck.innerHTML = CHECK;
      li.appendChild(ck.firstChild);
      list.appendChild(li);
      picker.items.push({
        code: l.code, el: li,
        fName: foldStr(l.name), fEn: foldStr(l.en || "")
      });
    });

    btn.addEventListener("click", function () {
      if (picker.open) closePicker(false); else openPicker();
    });
    input.addEventListener("input", filterList);
    input.addEventListener("keydown", function (ev) {
      var vis = visibleItems();
      var idx = vis.findIndex(function (v) { return v.el === picker.activeEl; });
      if (ev.key === "ArrowDown") { ev.preventDefault(); setActive(idx + 1); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); setActive(idx - 1); }
      else if (ev.key === "Enter") {
        ev.preventDefault();
        if (picker.activeEl) { setLang(picker.activeEl.getAttribute("data-code"), true); closePicker(true); }
      } else if (ev.key === "Escape") { ev.preventDefault(); closePicker(true); }
    });
    list.addEventListener("click", function (ev) {
      var li = ev.target.closest ? ev.target.closest(".bb-lang-item") : null;
      if (li) { setLang(li.getAttribute("data-code"), true); closePicker(true); }
    });
    list.addEventListener("mousemove", function (ev) {
      var li = ev.target.closest ? ev.target.closest(".bb-lang-item") : null;
      if (li && li !== picker.activeEl && !li.hidden) {
        var vis = visibleItems();
        setActive(vis.findIndex(function (v) { return v.el === li; }));
      }
    });
    veil.addEventListener("click", function () { closePicker(false); });
    document.addEventListener("mousedown", function (ev) {
      if (picker.open && !wrap.contains(ev.target)) closePicker(false);
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && picker.open) closePicker(true);
    });

    wrap.appendChild(btn);
    wrap.appendChild(panel);
    updatePicker();
  }

  function init() {
    buildSelector();
    var saved = null;
    try { saved = localStorage.getItem("bb-lang"); } catch (e) {}
    var rawTag = (navigator.language || "en").toLowerCase();
    var auto = rawTag.split("-")[0];
    // Filipino browsers may report a 3-letter tag; check the full tag first.
    var initial = saved || (LANGS.some(function (l) { return l.code === rawTag; }) ? rawTag : auto) || "en";
    var known = LANGS.some(function (l) { return l.code === initial; });
    setLang(known ? initial : "en", false);
    // Late-inserted content (nav/search scripts) gets a second pass.
    setTimeout(function () { if (dict) applyDict(); }, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
