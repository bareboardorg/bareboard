/* Multilingual switcher — runtime translation edition.
 *
 * No dictionary files ship with the site. When a visitor picks a
 * language, the page's own strings are translated live in their
 * browser — requests go to the public translate.googleapis.com
 * endpoint, allowed by the pages' CSP connect-src — and the results
 * are cached in their localStorage. New or edited content translates
 * itself; nothing on the server needs updating. If translation is
 * unreachable, the page stays in English.
 *
 * The picker is a frosted-glass panel with live search and keyboard
 * navigation, matching the site's own glass nav. Language is chosen by
 * the visitor (browser setting plus manual menu), never by IP or
 * location. Placed low and quiet: language choice lives in the footer,
 * in its own end bar, as a quiet text control — never in the top nav.
 */
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
  var ATTRIBUTE_TARGETS = ["alt", "title", "aria-label", "placeholder"];

  /* The page's English, remembered node by node. Translations are
     always computed from the remembered English, never from text that
     is already translated — that is what makes switching languages
     twice, or back to English, exact. */
  var englishMemory = new WeakMap(); // node -> Map(attrName|null -> original text)
  var currentLang = "en";
  var pageTitleEnglish = null;
  var picker = null;

  function squashed(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function memorize(node, attr) {
    var perNode = englishMemory.get(node);
    if (!perNode) {
      perNode = new Map();
      englishMemory.set(node, perNode);
    }
    if (perNode.has(attr)) return;
    perNode.set(attr, attr ? node.getAttribute(attr) : node.nodeValue);
  }

  function englishOf(node, attr) {
    var perNode = englishMemory.get(node);
    if (perNode && perNode.has(attr)) return perNode.get(attr);
    return attr ? node.getAttribute(attr) : node.nodeValue;
  }

  function restoreEnglish() {
    /* WeakMap contents cannot be enumerated, so the restorable set is
       tracked separately as translation proceeds. */
    for (var i = 0; i < memorized.length; i++) {
      var entry = memorized[i];
      if (entry.attr) entry.node.setAttribute(entry.attr, entry.text);
      else entry.node.nodeValue = entry.text;
    }
  }
  var memorized = []; // {node, attr, text} — every node ever translated

  function rememberForRestore(node, attr) {
    memorize(node, attr);
    for (var i = 0; i < memorized.length; i++) {
      if (memorized[i].node === node && memorized[i].attr === attr) return;
    }
    memorized.push({ node: node, attr: attr, text: englishOf(node, attr) });
  }

  /* ---- The translation engine ----
     Strings are gathered from the live page (text nodes plus the four
     translated attributes), deduplicated, served from the visitor's
     localStorage cache when possible, and otherwise fetched in batches
     from the translation endpoint. Results land as each batch returns
     and are written back to the cache. */
  /* External interface name: this endpoint host and path must stay
     exactly as-is — translation requests go nowhere else. */
  var ENDPOINT = window.BB_TRANSLATE_ENDPOINT ||
    "https://translate.googleapis.com/translate_a/single";
  var translationCache = {}; // squashed English -> translation, for cacheLang
  var cacheLang = null;
  var runId = 0; // bumped on every setLang; stale batches check it
  var savePending = null;

  function loadCache(code) {
    translationCache = {};
    cacheLang = code;
    try {
      var raw = localStorage.getItem("bb-tcache-v1-" + code);
      if (raw) translationCache = JSON.parse(raw) || {};
    } catch (e) { /* no stored cache: start empty */ }
  }

  function saveCacheSoon() {
    if (!cacheLang || savePending) return;
    savePending = setTimeout(function () {
      savePending = null;
      try {
        var raw = JSON.stringify(translationCache);
        if (raw.length < 4500000) {
          localStorage.setItem("bb-tcache-v1-" + cacheLang, raw);
        }
      } catch (e) { /* quota or privacy mode: the in-memory cache still works */ }
    }, 400);
  }

  function underSkippedAncestor(node) {
    var parent = node.parentNode;
    while (parent && parent.nodeType === 1) {
      if (SKIP_TAGS[parent.tagName]) return true;
      if (parent.classList && parent.classList.contains("bb-lang")) return true;
      parent = parent.parentNode;
    }
    return false;
  }

  function gatherTargets() {
    var targets = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (underSkippedAncestor(node)) return NodeFilter.FILTER_REJECT;
        return squashed(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var textNode;
    while ((textNode = walker.nextNode())) {
      targets.push({
        kind: "text", node: textNode,
        key: squashed(englishOf(textNode, null))
      });
    }
    var elements = document.body.querySelectorAll("[alt],[title],[aria-label],[placeholder]");
    elements.forEach(function (el) {
      if (el.closest && el.closest(".bb-lang")) return;
      ATTRIBUTE_TARGETS.forEach(function (attr) {
        if (!el.hasAttribute(attr)) return;
        var key = squashed(englishOf(el, attr));
        if (key) targets.push({ kind: "attr", el: el, attr: attr, key: key });
      });
    });
    if (pageTitleEnglish === null) pageTitleEnglish = document.title || "";
    var titleKey = squashed(pageTitleEnglish);
    if (titleKey) targets.push({ kind: "title", key: titleKey });
    return targets;
  }

  function putTranslation(target, translated) {
    if (target.kind === "text") {
      var raw = target.node.nodeValue;
      var leading = raw.match(/^\s*/)[0];
      var trailing = raw.match(/\s*$/)[0];
      rememberForRestore(target.node, null);
      target.node.nodeValue = leading + translated + trailing;
    } else if (target.kind === "attr") {
      rememberForRestore(target.el, target.attr);
      target.el.setAttribute(target.attr, translated);
    } else if (target.kind === "title") {
      document.title = translated;
    }
  }

  /* The endpoint answers in segments split at sentence and line
     boundaries; the segment sources concatenate back into exactly the
     text that was sent. Walking the segments and matching their sources
     against each input line recovers every line's translation even when
     a translation itself contains line breaks. A line that cannot be
     matched is reported as failed and retried on its own. */
  function matchSegments(segments, lines) {
    var matched = {};
    var line = 0;
    var src = "";
    var tr = "";
    var diverged = false;
    for (var s = 0; s < segments.length && line < lines.length && !diverged; s++) {
      src += segments[s][1];
      tr += segments[s][0];
      var keepGoing = true;
      while (keepGoing && line < lines.length) {
        var last = line === lines.length - 1;
        var want = lines[line] + (last ? "" : "\n");
        if (src === want) {
          matched[line] = last ? tr : tr.replace(/\n$/, "");
          src = "";
          tr = "";
          line++;
        } else if (want.indexOf(src) === 0) {
          keepGoing = false; // the line has not fully arrived yet
        } else {
          diverged = true; // sources no longer line up: nothing more can match
          keepGoing = false;
        }
      }
    }
    var failed = [];
    for (var i = line; i < lines.length; i++) failed.push(i);
    return { parts: matched, failed: failed };
  }

  function requestBatch(lines, code) {
    /* Query keys and values are the endpoint's required interface:
       client, source/target languages, result type, query text. */
    var url = ENDPOINT + "?client=gtx&sl=en&tl=" + encodeURIComponent(code) +
      "&dt=t&q=" + encodeURIComponent(lines.join("\n"));
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    }).then(function (data) {
      var segments = [];
      (data[0] || []).forEach(function (segment) {
        if (segment && segment[0] != null && segment[1] != null) {
          segments.push([segment[0], segment[1]]);
        }
      });
      if (segments.length === 0 && lines.length) throw new Error("empty response");
      return matchSegments(segments, lines);
    });
  }

  function requestSingle(key, code) {
    return requestBatch([key], code).then(function (result) {
      if (result.parts[0]) {
        translationCache[key] = result.parts[0];
        saveCacheSoon();
      }
    }).catch(function () { /* unreachable: the string stays English */ });
  }

  function flushCached(waiting) {
    Object.keys(waiting).forEach(function (key) {
      if (!translationCache[key]) return;
      waiting[key].forEach(function (target) { putTranslation(target, translationCache[key]); });
      delete waiting[key];
    });
  }

  function fetchMissing(keys, code, run, waiting) {
    /* Batches stay small enough for a URL: at most 40 strings and
       about 4000 characters each. */
    var batches = [];
    var batch = [];
    var batchLen = 0;
    keys.forEach(function (key) {
      if (batch.length && (batch.length >= 40 || batchLen + key.length > 4000)) {
        batches.push(batch);
        batch = [];
        batchLen = 0;
      }
      batch.push(key);
      batchLen += key.length + 1;
    });
    if (batch.length) batches.push(batch);

    var chain = Promise.resolve();
    batches.forEach(function (lines) {
      chain = chain.then(function () {
        if (run !== runId) return;
        return requestBatch(lines, code).then(function (result) {
          Object.keys(result.parts).forEach(function (i) {
            if (result.parts[i]) translationCache[lines[i]] = result.parts[i];
          });
          saveCacheSoon();
          var retries = Promise.resolve();
          result.failed.forEach(function (i) {
            retries = retries.then(function () {
              if (run !== runId) return;
              return requestSingle(lines[i], code);
            });
          });
          return retries;
        }).catch(function () {
          /* The whole batch failed: retry each string alone so one bad
             string cannot sink the rest. */
          var retries = Promise.resolve();
          lines.forEach(function (key) {
            retries = retries.then(function () {
              if (run !== runId) return;
              return requestSingle(key, code);
            });
          });
          return retries;
        }).then(function () {
          if (run === runId && currentLang === code) flushCached(waiting);
        });
      });
    });
    return chain;
  }

  function translatePage(code, run) {
    var targets = gatherTargets();
    var waiting = {};
    targets.forEach(function (target) {
      if (!target.key) return;
      if (translationCache[target.key]) putTranslation(target, translationCache[target.key]);
      else (waiting[target.key] = waiting[target.key] || []).push(target);
    });
    var missing = Object.keys(waiting);
    if (missing.length === 0) return;
    fetchMissing(missing, code, run, waiting);
  }

  function retranslate() {
    if (currentLang !== "en") translatePage(currentLang, runId);
  }

  function findLang(code) {
    for (var i = 0; i < LANGS.length; i++) {
      if (LANGS[i].code === code) return LANGS[i];
    }
    return null;
  }

  function setLang(code, save) {
    var meta = findLang(code);
    if (!meta) {
      code = "en";
      meta = LANGS[0];
    }
    currentLang = code;
    runId++;
    if (save) {
      try { localStorage.setItem("bb-lang", code); } catch (e) {}
    }
    document.documentElement.setAttribute("lang", code === "zh" ? "zh-CN" : code);
    document.documentElement.setAttribute("dir", meta.dir);
    if (picker) refreshPicker();
    restoreEnglish();
    if (pageTitleEnglish !== null) document.title = pageTitleEnglish;
    if (code === "en") {
      translationCache = {};
      cacheLang = null;
      return;
    }
    loadCache(code);
    translatePage(code, runId);
  }

  var GLOBE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/></svg>';
  var CHEV = '<svg class="bb-lang-chev" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5"/></svg>';
  var MAG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.6-4.6"/></svg>';
  var CHECK = '<svg class="bb-lang-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12.5 10 18 19.5 6.5"/></svg>';

  function foldForSearch(text) {
    return (text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function shownItems() {
    return picker.items.filter(function (item) { return !item.el.hidden; });
  }

  function highlight(n) {
    var visible = shownItems();
    picker.items.forEach(function (item) { item.el.classList.remove("active"); });
    if (visible.length === 0) {
      picker.activeEl = null;
      return;
    }
    var at = ((n % visible.length) + visible.length) % visible.length;
    var el = visible[at].el;
    el.classList.add("active");
    picker.activeEl = el;
    picker.input.setAttribute("aria-activedescendant", el.id);
    try { el.scrollIntoView({ block: "nearest" }); } catch (e) {}
  }

  function applyFilter() {
    var query = foldForSearch(picker.input.value.trim());
    var shown = 0;
    picker.items.forEach(function (item) {
      var hit = !query ||
        item.fName.indexOf(query) !== -1 ||
        item.fEn.indexOf(query) !== -1 ||
        item.code.toLowerCase().indexOf(query) === 0;
      item.el.hidden = !hit;
      if (hit) shown++;
    });
    picker.emptyEl.hidden = shown !== 0;
    var visible = shownItems();
    var currentAt = -1;
    for (var i = 0; i < visible.length; i++) {
      if (visible[i].code === currentLang) {
        currentAt = i;
        break;
      }
    }
    highlight(currentAt >= 0 ? currentAt : 0);
  }

  function openPicker() {
    if (picker.open) return;
    picker.open = true;
    picker.wrap.classList.add("open");
    picker.btn.setAttribute("aria-expanded", "true");
    picker.veil.classList.add("show");
    picker.input.value = "";
    applyFilter();
    var currentItem = null;
    picker.items.forEach(function (item) {
      if (item.code === currentLang) currentItem = item;
    });
    if (currentItem) {
      setTimeout(function () {
        try { currentItem.el.scrollIntoView({ block: "center" }); } catch (e) {}
      }, 70);
    }
    picker.wrap.classList.add("bb-anim");
    setTimeout(function () { picker.wrap.classList.remove("bb-anim"); }, 700);
    try {
      picker.input.focus({ preventScroll: true });
    } catch (e) {
      picker.input.focus();
    }
  }

  function closePicker(refocusButton) {
    if (!picker || !picker.open) return;
    picker.open = false;
    picker.wrap.classList.remove("open");
    picker.btn.setAttribute("aria-expanded", "false");
    picker.veil.classList.remove("show");
    if (refocusButton) {
      try { picker.btn.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  function refreshPicker() {
    var meta = findLang(currentLang) || LANGS[0];
    picker.btnName.textContent = meta.name;
    picker.items.forEach(function (item) {
      var on = item.code === currentLang;
      item.el.classList.toggle("current", on);
      item.el.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function buildPicker() {
    var wrap = document.createElement("div");
    wrap.className = "bb-lang";
    var footer = document.querySelector("footer");
    if (footer) {
      var bar = document.createElement("div");
      bar.className = "bb-footer-bar";
      wrap.classList.add("bb-foot");
      bar.appendChild(wrap);
      footer.appendChild(bar);
    } else {
      var host = document.querySelector(".nav-inner") ||
        document.querySelector("header") || document.body;
      host.appendChild(wrap);
    }

    var button = document.createElement("button");
    button.type = "button";
    button.className = "bb-lang-btn";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Language");
    button.innerHTML = GLOBE;
    var buttonName = document.createElement("span");
    buttonName.className = "bb-lang-btn-name";
    buttonName.textContent = "English";
    button.appendChild(buttonName);
    var chevronHolder = document.createElement("span");
    chevronHolder.innerHTML = CHEV;
    button.appendChild(chevronHolder.firstChild);

    var panel = document.createElement("div");
    panel.className = "bb-lang-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Choose a language");

    var searchRow = document.createElement("div");
    searchRow.className = "bb-lang-search";
    searchRow.innerHTML = MAG;
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
    searchRow.appendChild(input);
    panel.appendChild(searchRow);

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
      wrap: wrap, btn: button, btnName: buttonName, panel: panel,
      input: input, list: list, emptyEl: empty, veil: veil,
      items: [], open: false, activeEl: null
    };

    LANGS.forEach(function (lang, i) {
      var row = document.createElement("li");
      row.className = "bb-lang-item";
      row.id = "bb-lang-opt-" + lang.code;
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", "false");
      row.setAttribute("data-code", lang.code);
      row.style.setProperty("--i", Math.min(i, 14));
      var native = document.createElement("span");
      native.className = "bb-lang-name";
      native.textContent = lang.name;
      row.appendChild(native);
      if (lang.en && lang.en !== lang.name) {
        var english = document.createElement("span");
        english.className = "bb-lang-en";
        english.textContent = lang.en;
        row.appendChild(english);
      }
      var checkHolder = document.createElement("span");
      checkHolder.innerHTML = CHECK;
      row.appendChild(checkHolder.firstChild);
      list.appendChild(row);
      picker.items.push({
        code: lang.code, el: row,
        fName: foldForSearch(lang.name), fEn: foldForSearch(lang.en || "")
      });
    });

    button.addEventListener("click", function () {
      if (picker.open) closePicker(false);
      else openPicker();
    });
    input.addEventListener("input", applyFilter);
    input.addEventListener("keydown", function (event) {
      var visible = shownItems();
      var at = -1;
      for (var i = 0; i < visible.length; i++) {
        if (visible[i].el === picker.activeEl) {
          at = i;
          break;
        }
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        highlight(at + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        highlight(at - 1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (picker.activeEl) {
          setLang(picker.activeEl.getAttribute("data-code"), true);
          closePicker(true);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        closePicker(true);
      }
    });
    list.addEventListener("click", function (event) {
      var row = event.target.closest ? event.target.closest(".bb-lang-item") : null;
      if (row) {
        setLang(row.getAttribute("data-code"), true);
        closePicker(true);
      }
    });
    list.addEventListener("mousemove", function (event) {
      var row = event.target.closest ? event.target.closest(".bb-lang-item") : null;
      if (row && row !== picker.activeEl && !row.hidden) {
        var visible = shownItems();
        var at = -1;
        for (var i = 0; i < visible.length; i++) {
          if (visible[i].el === row) {
            at = i;
            break;
          }
        }
        highlight(at);
      }
    });
    veil.addEventListener("click", function () { closePicker(false); });
    document.addEventListener("mousedown", function (event) {
      if (picker.open && !wrap.contains(event.target)) closePicker(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && picker.open) closePicker(true);
    });

    wrap.appendChild(button);
    wrap.appendChild(panel);
    refreshPicker();
  }

  function init() {
    buildPicker();
    var saved = null;
    try { saved = localStorage.getItem("bb-lang"); } catch (e) {}
    var browserTag = (navigator.language || "en").toLowerCase();
    var primary = browserTag.split("-")[0];
    /* Browsers may report a 3-letter tag (e.g. Filipino); the full tag
       is checked first, then the primary part. */
    var initial = saved ||
      (findLang(browserTag) ? browserTag : primary) || "en";
    setLang(findLang(initial) ? initial : "en", false);
    /* Late-inserted content (nav/search scripts) gets a second pass. */
    setTimeout(function () { retranslate(); }, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
