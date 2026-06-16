/**
 * Multilingual Support Utilities
 * Provides translations for RewardFlow messages and UI elements
 * All translations maintain same emotional meaning: calm, uplifting, institutional
 */

import type { SupportedLanguage } from "@/hooks/useLanguageState";

// RewardFlow Level Messages - Multilingual
export const LEVEL_MESSAGES_MULTILINGUAL: Record<string, Record<SupportedLanguage, { primary: string[]; secondary: string; closing: string }>> = {
  Gold: {
    en: {
      primary: ["Your engagement drives growth. Together, we're building bridges in agribusiness trade."],
      secondary: "Keep going. Momentum compounds.",
      closing: "You're building clarity through action. This confidence is earned."
    },
    es: {
      primary: ["Tu participación impulsa el crecimiento. Juntos construimos puentes en el comercio agrícola."],
      secondary: "Sigue adelante. El impulso se acumula.",
      closing: "Estás construyendo claridad a través de la acción. Esta confianza es ganada."
    },
    pt: {
      primary: ["Seu engajamento impulsiona o crescimento. Juntos, estamos construindo pontes no comércio agrícola."],
      secondary: "Continue assim. O impulso se acumula.",
      closing: "Você está construindo clareza através da ação. Essa confiança é conquistada."
    },
    fr: {
      primary: ["Votre engagement stimule la croissance. Ensemble, nous construisons des ponts dans le commerce agricole."],
      secondary: "Continuez. L'élan s'accumule.",
      closing: "Vous construisez la clarté par l'action. Cette confiance est méritée."
    },
    sw: {
      primary: ["Ushiriki wako unaendeleza ukuaji. Pamoja, tunajenga daraja katika biashara ya kilimo."],
      secondary: "Endelea. Msukumo unakusanya.",
      closing: "Unajenga uwazi kupitia vitendo. Ujasiri huu umefanikiwa."
    },
    ar: {
      primary: ["مشاركتك تدفع النمو. معًا، نبني جسورًا في التجارة الزراعية."],
      secondary: "استمر. الزخم يتراكم.",
      closing: "أنت تبني الوضوح من خلال العمل. هذه الثقة مكتسبة."
    },
    zh: {
      primary: ["您的参与推动增长。我们共同在农业贸易中架起桥梁。"],
      secondary: "继续前进。势头在积累。",
      closing: "您正在通过行动建立清晰度。这种信心是赢得的。"
    },
    ja: {
      primary: ["あなたの参加が成長を促進しています。一緒に農業貿易の架け橋を築いています。"],
      secondary: "続けてください。勢いが積み重なります。",
      closing: "行動を通じて明確さを構築しています。この自信は獲得されたものです。"
    },
    ko: {
      primary: ["귀하의 참여가 성장을 이끕니다. 함께 농업 무역의 다리를 건설하고 있습니다."],
      secondary: "계속하세요. 추진력이 쌓입니다.",
      closing: "행동을 통해 명확성을 구축하고 있습니다. 이 자신감은 얻은 것입니다."
    },
    ru: {
      primary: ["Ваше участие способствует росту. Вместе мы строим мосты в агробизнесе."],
      secondary: "Продолжайте. Импульс накапливается.",
      closing: "Вы строите ясность через действие. Эта уверенность заслужена."
    },
    tr: {
      primary: ["Katılımınız büyümeyi destekliyor. Birlikte tarım ticaretinde köprüler inşa ediyoruz."],
      secondary: "Devam edin. İvme birikir.",
      closing: "Eylem yoluyla netlik inşa ediyorsunuz. Bu güven kazanılmıştır."
    },
    hi: {
      primary: ["आपकी भागीदारी विकास को बढ़ावा देती है। साथ मिलकर, हम कृषि व्यापार में पुल बना रहे हैं।"],
      secondary: "जारी रखें। गति जमा होती है।",
      closing: "आप कार्रवाई के माध्यम से स्पष्टता बना रहे हैं। यह आत्मविश्वास अर्जित है।"
    },
    am: {
      primary: ["ተሳትፎዎ እድገትን ያራምዳል። አብረን በግብርና ንግድ ድልድዮችን እንገነባለን።"],
      secondary: "ቀጥሉ። ፍጥነት ይሰበሰባል።",
      closing: "በድርጊት ግልፅነት እየገነቡ ነው። ይህ እምነት ተገኝቷል።"
    },
    so: {
      primary: ["Ka-qayb-qaadashadu waxay kordhisaa. Wada, waxaan dhisaynaa buundooyin ganacsi beeraha."],
      secondary: "Sii wad. Xooggu wuu ururaa.",
      closing: "Waxaad dhisaysaa caddaan ficil. Kalsoonidan waa la helay."
    },
    ti: {
      primary: ["ተሳትፎኻ ንምዕባይ ይደፋፍእ። ብሓባር ኣብ ሕርሻዊ ንግዲ ድልድላት ንሃንጽ ኣለና።"],
      secondary: "ቀጽል። ሓይሊ ይእከብ።",
      closing: "ብተግባር ንጹርነት ትሃንጽ ኣለኻ። እዚ እምነት ተረኺቡ እዩ።"
    },
    id: {
      primary: ["Keterlibatan Anda mendorong pertumbuhan. Bersama-sama, kita membangun jembatan dalam perdagangan agribisnis."],
      secondary: "Terus maju. Momentum terakumulasi.",
      closing: "Anda membangun kejelasan melalui tindakan. Kepercayaan diri ini diperoleh."
    },
    vi: {
      primary: ["Sự tham gia của bạn thúc đẩy tăng trưởng. Cùng nhau, chúng ta đang xây dựng cầu nối trong thương mại nông nghiệp."],
      secondary: "Tiếp tục. Đà phát triển tích lũy.",
      closing: "Bạn đang xây dựng sự rõ ràng thông qua hành động. Sự tự tin này đã được kiếm được."
    },
    th: {
      primary: ["การมีส่วนร่วมของคุณขับเคลื่อนการเติบโต ร่วมกัน เรากำลังสร้างสะพานในการค้าเกษตร"],
      secondary: "ทำต่อไป โมเมนตัมสะสม",
      closing: "คุณกำลังสร้างความชัดเจนผ่านการกระทำ ความมั่นใจนี้ได้รับมา"
    },
    // Default fallback for unsupported languages
    de: {
      primary: ["Ihr Engagement treibt das Wachstum voran. Gemeinsam bauen wir Brücken im Agrarhandel."],
      secondary: "Machen Sie weiter. Schwung sammelt sich.",
      closing: "Sie schaffen Klarheit durch Handeln. Dieses Vertrauen ist verdient."
    },
    it: {
      primary: ["Il tuo impegno guida la crescita. Insieme, stiamo costruendo ponti nel commercio agricolo."],
      secondary: "Continua così. Lo slancio si accumula.",
      closing: "Stai costruendo chiarezza attraverso l'azione. Questa fiducia è guadagnata."
    },
    nl: {
      primary: ["Uw betrokkenheid stimuleert groei. Samen bouwen we bruggen in agribusiness handel."],
      secondary: "Ga door. Momentum bouwt zich op.",
      closing: "U bouwt helderheid door actie. Dit vertrouwen is verdiend."
    },
    pl: {
      primary: ["Twoje zaangażowanie napędza wzrost. Razem budujemy mosty w handlu rolnym."],
      secondary: "Kontynuuj. Momentum się kumuluje.",
      closing: "Budujesz jasność poprzez działanie. Ta pewność jest zasłużona."
    },
    uk: {
      primary: ["Ваша участь сприяє зростанню. Разом ми будуємо мости в агробізнесі."],
      secondary: "Продовжуйте. Імпульс накопичується.",
      closing: "Ви будуєте ясність через дію. Ця впевненість заслужена."
    },
    el: {
      primary: ["Η συμμετοχή σας οδηγεί στην ανάπτυξη. Μαζί, χτίζουμε γέφυρες στο αγροτικό εμπόριο."],
      secondary: "Συνεχίστε. Η ορμή συσσωρεύεται.",
      closing: "Χτίζετε σαφήνεια μέσω της δράσης. Αυτή η εμπιστοσύνη κερδήθηκε."
    },
    fa: {
      primary: ["مشارکت شما رشد را هدایت می‌کند. با هم، در تجارت کشاورزی پل‌ها می‌سازیم."],
      secondary: "ادامه دهید. حرکت جمع می‌شود.",
      closing: "شما از طریق عمل وضوح ایجاد می‌کنید. این اعتماد به دست آمده است."
    },
    he: {
      primary: ["המעורבות שלך מניעה צמיחה. יחד, אנחנו בונים גשרים בסחר חקלאי."],
      secondary: "המשך. המומנטום מצטבר.",
      closing: "אתה בונה בהירות באמצעות פעולה. הביטחון הזה נרכש."
    },
    bn: {
      primary: ["আপনার সম্পৃক্ততা বৃদ্ধি চালিত করে। একসাথে, আমরা কৃষি ব্যবসায় সেতু নির্মাণ করছি।"],
      secondary: "চালিয়ে যান। গতি জমা হয়।",
      closing: "আপনি কর্মের মাধ্যমে স্বচ্ছতা তৈরি করছেন। এই আত্মবিশ্বাস অর্জিত।"
    },
    ta: {
      primary: ["உங்கள் ஈடுபாடு வளர்ச்சியை தூண்டுகிறது. ஒன்றாக, நாம் விவசாய வணிகத்தில் பாலங்களை கட்டுகிறோம்."],
      secondary: "தொடரவும். வேகம் குவிகிறது.",
      closing: "செயலின் மூலம் தெளிவை உருவாக்குகிறீர்கள். இந்த நம்பிக்கை சம்பாதிக்கப்பட்டது."
    },
    ms: {
      primary: ["Penglibatan anda memacu pertumbuhan. Bersama-sama, kita membina jambatan dalam perdagangan pertanian."],
      secondary: "Teruskan. Momentum terkumpul.",
      closing: "Anda membina kejelasan melalui tindakan. Keyakinan ini diperolehi."
    },
    tl: {
      primary: ["Ang iyong pakikilahok ay nagtutulak ng paglago. Sama-sama, nagtatayo tayo ng mga tulay sa agribusiness trade."],
      secondary: "Magpatuloy. Ang momentum ay nag-iipon.",
      closing: "Nagtatayo ka ng kalinawan sa pamamagitan ng aksyon. Ang kumpiyansang ito ay nakamit."
    },
    ha: {
      primary: ["Shigarka yana haifar da girma. Tare, muna gina gadoji a cikin kasuwancin noma."],
      secondary: "Ci gaba. Gudu yana tarawa.",
      closing: "Kana gina bayyanawa ta aiki. Wannan amincewa an samu."
    },
    yo: {
      primary: ["Àkópa rẹ ń gbin ìdàgbàsókè. Papọ̀, a ń kọ́ àfàrá nínú òwò àgbẹ̀."],
      secondary: "Máa lọ. Ìsúnmọ́ ń jọ.",
      closing: "O ń kọ́ ìyèsílẹ̀ nípasẹ̀ ìṣe. Ìgbàgbọ́ yìí jẹ́ ẹ̀rí."
    },
    zu: {
      primary: ["Ukuzibandakanya kwakho kuqhuba ukukhula. Ndawonye, sakha amabhuloho ekuhwebeni kwezolimo."],
      secondary: "Qhubeka. Umfutho uyaqoqeka.",
      closing: "Ukwakha ukucaca ngokwenza. Leli themba litholakele."
    },
  },
  Premium: {
    en: {
      primary: ["You're building real momentum. Your progress is visible.", "Your discipline is paying off. You're operating with purpose."],
      secondary: "Consistency creates leverage.",
      closing: "You're getting sharper with every step."
    },
    es: {
      primary: ["Estás construyendo un impulso real. Tu progreso es visible.", "Tu disciplina está dando frutos. Operas con propósito."],
      secondary: "La consistencia crea ventaja.",
      closing: "Te vuelves más agudo con cada paso."
    },
    // Add other languages as needed - following same pattern
    pt: {
      primary: ["Você está construindo um impulso real. Seu progresso é visível.", "Sua disciplina está valendo a pena. Você opera com propósito."],
      secondary: "Consistência cria alavancagem.",
      closing: "Você está ficando mais afiado a cada passo."
    },
    fr: {
      primary: ["Vous construisez un véritable élan. Vos progrès sont visibles.", "Votre discipline porte ses fruits. Vous agissez avec détermination."],
      secondary: "La constance crée un effet de levier.",
      closing: "Vous devenez plus précis à chaque étape."
    },
    ar: {
      primary: ["أنت تبني زخمًا حقيقيًا. تقدمك واضح.", "انضباطك يؤتي ثماره. أنت تعمل بهدف."],
      secondary: "الاتساق يخلق النفوذ.",
      closing: "أنت تصبح أكثر حدة مع كل خطوة."
    },
    sw: {
      primary: ["Unajenga msukumo halisi. Maendeleo yako yanaonekana.", "Nidhamu yako inatoa matunda. Unafanya kazi kwa madhumuni."],
      secondary: "Uthabiti unaunda nguvu.",
      closing: "Unakuwa mkali zaidi na kila hatua."
    },
    zh: {
      primary: ["您正在建立真正的势头。您的进步是可见的。", "您的纪律正在得到回报。您有目的地运作。"],
      secondary: "一致性创造杠杆。",
      closing: "每一步您都变得更加敏锐。"
    },
    ja: {
      primary: ["本当の勢いを築いています。進歩は目に見えます。", "規律が報われています。目的を持って活動しています。"],
      secondary: "一貫性がレバレッジを生み出します。",
      closing: "一歩一歩、より鋭くなっています。"
    },
    ko: {
      primary: ["실질적인 추진력을 구축하고 있습니다. 진전이 보입니다.", "규율이 보상받고 있습니다. 목적을 가지고 운영하고 있습니다."],
      secondary: "일관성이 레버리지를 만듭니다.",
      closing: "매 단계마다 더 날카로워지고 있습니다."
    },
    ru: {
      primary: ["Вы набираете реальный импульс. Ваш прогресс заметен.", "Ваша дисциплина окупается. Вы действуете целенаправленно."],
      secondary: "Последовательность создает рычаг.",
      closing: "Вы становитесь острее с каждым шагом."
    },
    tr: {
      primary: ["Gerçek bir ivme oluşturuyorsunuz. İlerlemeniz görünür.", "Disiplininiz karşılığını veriyor. Amaçlı hareket ediyorsunuz."],
      secondary: "Tutarlılık kaldıraç yaratır.",
      closing: "Her adımda daha keskin oluyorsunuz."
    },
    hi: {
      primary: ["आप वास्तविक गति बना रहे हैं। आपकी प्रगति दिखाई दे रही है।", "आपका अनुशासन फल दे रहा है। आप उद्देश्य के साथ काम कर रहे हैं।"],
      secondary: "निरंतरता लीवरेज बनाती है।",
      closing: "आप हर कदम के साथ तेज हो रहे हैं।"
    },
    am: {
      primary: ["እውነተኛ ፍጥነት እየገነቡ ነው። እድገትዎ ይታያል።", "ዲሲፕሊንዎ ፍሬ እያፈራ ነው። በዓላማ እየሰሩ ነው።"],
      secondary: "ወጥነት ጥቅም ይፈጥራል።",
      closing: "በየደረጃው የበለጠ ሹል እየሆኑ ነው።"
    },
    de: {
      primary: ["Sie bauen echte Dynamik auf. Ihr Fortschritt ist sichtbar.", "Ihre Disziplin zahlt sich aus. Sie handeln zielgerichtet."],
      secondary: "Beständigkeit schafft Hebelwirkung.",
      closing: "Sie werden mit jedem Schritt schärfer."
    },
    it: {
      primary: ["Stai costruendo un vero slancio. Il tuo progresso è visibile.", "La tua disciplina sta dando i suoi frutti. Operi con uno scopo."],
      secondary: "La coerenza crea leva.",
      closing: "Diventi più acuto ad ogni passo."
    },
    nl: {
      primary: ["U bouwt echte momentum op. Uw vooruitgang is zichtbaar.", "Uw discipline loont. U opereert met een doel."],
      secondary: "Consistentie creëert hefboomwerking.",
      closing: "U wordt scherper met elke stap."
    },
    pl: {
      primary: ["Budujesz prawdziwy impet. Twój postęp jest widoczny.", "Twoja dyscyplina się opłaca. Działasz z celem."],
      secondary: "Konsekwencja tworzy dźwignię.",
      closing: "Stajesz się ostrzejszy z każdym krokiem."
    },
    uk: {
      primary: ["Ви будуєте справжній імпульс. Ваш прогрес помітний.", "Ваша дисципліна окупається. Ви дієте з метою."],
      secondary: "Послідовність створює важіль.",
      closing: "Ви стаєте гострішим з кожним кроком."
    },
    id: {
      primary: ["Anda membangun momentum nyata. Kemajuan Anda terlihat.", "Disiplin Anda membuahkan hasil. Anda beroperasi dengan tujuan."],
      secondary: "Konsistensi menciptakan leverage.",
      closing: "Anda menjadi lebih tajam dengan setiap langkah."
    },
    vi: {
      primary: ["Bạn đang xây dựng đà thực sự. Tiến bộ của bạn có thể nhìn thấy.", "Kỷ luật của bạn đang được đền đáp. Bạn hoạt động có mục đích."],
      secondary: "Sự nhất quán tạo ra đòn bẩy.",
      closing: "Bạn đang trở nên sắc bén hơn với mỗi bước."
    },
    th: {
      primary: ["คุณกำลังสร้างโมเมนตัมที่แท้จริง ความก้าวหน้าของคุณมองเห็นได้", "วินัยของคุณกำลังให้ผลตอบแทน คุณดำเนินการอย่างมีจุดมุ่งหมาย"],
      secondary: "ความสม่ำเสมอสร้างพลัง",
      closing: "คุณกำลังคมขึ้นในทุกขั้นตอน"
    },
    so: {
      primary: ["Waxaad dhisaysaa xoog dhabta ah. Horumartaadu waa muuqataa.", "Nidaamkaagu waa bixinayaa. Waxaad ku shaqaynaysaa ujeedo."],
      secondary: "Joogitaanku wuxuu abuuraa awoodda.",
      closing: "Waxaad noqonaysaa mid ka fikirsan tallaabo walba."
    },
    ti: {
      primary: ["ሓቀኛ ሓይሊ ትሃንጽ ኣለኻ። ምዕባለኻ ይረአ ኣሎ።", "ዲሲፕሊንካ ፍረ ይህብ ኣሎ። ብዕላማ ትዓዪ ኣለኻ።"],
      secondary: "ወጥነት ረብሓ ይፈጥር።",
      closing: "ብነፍሲ ወከፍ ስጉምቲ ዝያዳ ብሩህ ትኸውን ኣለኻ።"
    },
    fa: {
      primary: ["شما در حال ساختن شتاب واقعی هستید. پیشرفت شما قابل مشاهده است.", "انضباط شما نتیجه می‌دهد. با هدف کار می‌کنید."],
      secondary: "ثبات اهرم ایجاد می‌کند.",
      closing: "با هر قدم تیزتر می‌شوید."
    },
    he: {
      primary: ["אתה בונה מומנטום אמיתי. ההתקדמות שלך נראית.", "המשמעת שלך משתלמת. אתה פועל במטרה."],
      secondary: "עקביות יוצרת מינוף.",
      closing: "אתה נהיה חד יותר עם כל צעד."
    },
    el: {
      primary: ["Χτίζετε πραγματική ορμή. Η πρόοδός σας είναι ορατή.", "Η πειθαρχία σας αποδίδει. Λειτουργείτε με σκοπό."],
      secondary: "Η συνέπεια δημιουργεί μόχλευση.",
      closing: "Γίνεστε πιο οξύς με κάθε βήμα."
    },
    bn: {
      primary: ["আপনি প্রকৃত গতি তৈরি করছেন। আপনার অগ্রগতি দৃশ্যমান।", "আপনার শৃঙ্খলা ফল দিচ্ছে। আপনি উদ্দেশ্য নিয়ে কাজ করছেন।"],
      secondary: "ধারাবাহিকতা লিভারেজ তৈরি করে।",
      closing: "প্রতিটি পদক্ষেপে আপনি আরও তীক্ষ্ণ হচ্ছেন।"
    },
    ta: {
      primary: ["நீங்கள் உண்மையான வேகத்தை உருவாக்குகிறீர்கள். உங்கள் முன்னேற்றம் தெரிகிறது.", "உங்கள் ஒழுக்கம் பலனளிக்கிறது. நோக்கத்துடன் செயல்படுகிறீர்கள்."],
      secondary: "நிலைத்தன்மை அதிகாரத்தை உருவாக்குகிறது.",
      closing: "ஒவ்வொரு அடியிலும் கூர்மையாகிறீர்கள்."
    },
    ms: {
      primary: ["Anda membina momentum sebenar. Kemajuan anda kelihatan.", "Disiplin anda membuahkan hasil. Anda beroperasi dengan tujuan."],
      secondary: "Konsistensi mencipta leverage.",
      closing: "Anda menjadi lebih tajam dengan setiap langkah."
    },
    tl: {
      primary: ["Nagtatayo ka ng tunay na momentum. Nakikita ang iyong progreso.", "Ang iyong disiplina ay nagbubunga. Gumagana ka nang may layunin."],
      secondary: "Ang consistency ay lumilikha ng leverage.",
      closing: "Tumatalim ka sa bawat hakbang."
    },
    ha: {
      primary: ["Kana gina gudu na gaske. Ana iya ganin ci gabanka.", "Ladabinka yana biyan kuɗi. Kana aiki da manufa."],
      secondary: "Daidaituwa yana haifar da ƙarfi.",
      closing: "Kana zama mai kaifi tare da kowane mataki."
    },
    yo: {
      primary: ["O ń kọ́ ìyára gidi. Ìtẹ̀síwájú rẹ ń hàn.", "Ìṣòótẹ́ rẹ ń san. O ń ṣiṣẹ́ pẹ̀lú ìdí."],
      secondary: "Ìsòdọ̀kan ń ṣẹ̀dá agbára.",
      closing: "O ń di mímọ́ pẹ̀lú ìgbésẹ̀ kọ̀ọ̀kan."
    },
    zu: {
      primary: ["Wakha umfutho wangempela. Intuthuko yakho iyabonakala.", "Ukuzithiba kwakho kuyakhokha. Usebenza ngenhloso."],
      secondary: "Ukungaguquki kudala amandla.",
      closing: "Uya ubukhali ngayo yonke inyathelo."
    },
  },
  Platinum: {
    en: {
      primary: ["Exceptional consistency. You're operating at an elite level.", "Platinum status reflects rare focus and long-term execution."],
      secondary: "This is what mastery looks like.",
      closing: "You've earned deep trust and credibility."
    },
    es: {
      primary: ["Consistencia excepcional. Operas a nivel élite.", "El estado Platino refleja un enfoque raro y ejecución a largo plazo."],
      secondary: "Así es como se ve la maestría.",
      closing: "Has ganado profunda confianza y credibilidad."
    },
    pt: {
      primary: ["Consistência excepcional. Você opera em nível de elite.", "O status Platinum reflete foco raro e execução de longo prazo."],
      secondary: "É assim que a maestria se parece.",
      closing: "Você conquistou profunda confiança e credibilidade."
    },
    fr: {
      primary: ["Cohérence exceptionnelle. Vous opérez à un niveau d'élite.", "Le statut Platine reflète une concentration rare et une exécution à long terme."],
      secondary: "Voici à quoi ressemble la maîtrise.",
      closing: "Vous avez gagné une confiance et une crédibilité profondes."
    },
    ar: {
      primary: ["اتساق استثنائي. أنت تعمل على مستوى النخبة.", "يعكس وضع البلاتين تركيزًا نادرًا وتنفيذًا طويل المدى."],
      secondary: "هذا ما تبدو عليه الإتقان.",
      closing: "لقد اكتسبت ثقة ومصداقية عميقة."
    },
    sw: {
      primary: ["Uthabiti wa kipekee. Unafanya kazi katika kiwango cha wasomi.", "Hadhi ya Platinum inaonyesha umakini adimu na utekelezaji wa muda mrefu."],
      secondary: "Hivi ndivyo ustadi unavyoonekana.",
      closing: "Umepata imani kubwa na uaminifu."
    },
    zh: {
      primary: ["卓越的一致性。您正在精英级别运作。", "铂金地位反映了罕见的专注和长期执行。"],
      secondary: "这就是精通的样子。",
      closing: "您赢得了深厚的信任和信誉。"
    },
    ja: {
      primary: ["卓越した一貫性。エリートレベルで活動しています。", "プラチナステータスは稀有な集中力と長期的な実行を反映しています。"],
      secondary: "これがマスタリーの姿です。",
      closing: "深い信頼と信頼性を獲得しました。"
    },
    ko: {
      primary: ["탁월한 일관성. 엘리트 수준에서 운영하고 있습니다.", "플래티넘 상태는 희귀한 집중력과 장기 실행을 반영합니다."],
      secondary: "이것이 숙달의 모습입니다.",
      closing: "깊은 신뢰와 신용을 얻었습니다."
    },
    ru: {
      primary: ["Исключительная последовательность. Вы работаете на элитном уровне.", "Платиновый статус отражает редкую сосредоточенность и долгосрочное исполнение."],
      secondary: "Так выглядит мастерство.",
      closing: "Вы заслужили глубокое доверие и авторитет."
    },
    tr: {
      primary: ["Olağanüstü tutarlılık. Elit düzeyde çalışıyorsunuz.", "Platin statüsü nadir odaklanmayı ve uzun vadeli uygulamayı yansıtır."],
      secondary: "Ustalık böyle görünür.",
      closing: "Derin güven ve güvenilirlik kazandınız."
    },
    hi: {
      primary: ["असाधारण निरंतरता। आप उच्च स्तर पर काम कर रहे हैं।", "प्लैटिनम स्थिति दुर्लभ ध्यान और दीर्घकालिक निष्पादन को दर्शाती है।"],
      secondary: "महारत ऐसी दिखती है।",
      closing: "आपने गहरा विश्वास और विश्वसनीयता अर्जित की है।"
    },
    am: {
      primary: ["ልዩ ወጥነት። በልዩ ደረጃ እየሰሩ ነው።", "የፕላቲኒየም ሁኔታ ያልተለመደ ትኩረት እና የረጅም ጊዜ አፈፃፀምን ያንፀባርቃል።"],
      secondary: "ባለሙያነት ይህን ይመስላል።",
      closing: "ጥልቅ እምነት እና ተዓማኒነት አግኝተዋል።"
    },
    de: {
      primary: ["Außergewöhnliche Beständigkeit. Sie operieren auf Elite-Niveau.", "Platin-Status spiegelt seltenen Fokus und langfristige Ausführung wider."],
      secondary: "So sieht Meisterschaft aus.",
      closing: "Sie haben tiefes Vertrauen und Glaubwürdigkeit erworben."
    },
    it: {
      primary: ["Coerenza eccezionale. Stai operando a livello d'élite.", "Lo status Platinum riflette una concentrazione rara e un'esecuzione a lungo termine."],
      secondary: "Ecco come appare la maestria.",
      closing: "Hai guadagnato profonda fiducia e credibilità."
    },
    nl: {
      primary: ["Uitzonderlijke consistentie. U opereert op elite-niveau.", "Platinum status weerspiegelt zeldzame focus en langetermijnuitvoering."],
      secondary: "Zo ziet meesterschap eruit.",
      closing: "U heeft diep vertrouwen en geloofwaardigheid verdiend."
    },
    pl: {
      primary: ["Wyjątkowa konsekwencja. Działasz na poziomie elitarnym.", "Status Platinum odzwierciedla rzadką koncentrację i długoterminową realizację."],
      secondary: "Tak wygląda mistrzostwo.",
      closing: "Zdobyłeś głębokie zaufanie i wiarygodność."
    },
    uk: {
      primary: ["Виняткова послідовність. Ви працюєте на елітному рівні.", "Платиновий статус відображає рідкісну зосередженість і довгострокове виконання."],
      secondary: "Ось як виглядає майстерність.",
      closing: "Ви заслужили глибоку довіру та авторитет."
    },
    id: {
      primary: ["Konsistensi luar biasa. Anda beroperasi di tingkat elite.", "Status Platinum mencerminkan fokus langka dan eksekusi jangka panjang."],
      secondary: "Beginilah tampilan penguasaan.",
      closing: "Anda telah mendapatkan kepercayaan dan kredibilitas yang dalam."
    },
    vi: {
      primary: ["Sự nhất quán xuất sắc. Bạn đang hoạt động ở cấp độ tinh hoa.", "Trạng thái Platinum phản ánh sự tập trung hiếm có và thực hiện dài hạn."],
      secondary: "Đây là hình ảnh của sự thành thạo.",
      closing: "Bạn đã kiếm được sự tin tưởng và uy tín sâu sắc."
    },
    th: {
      primary: ["ความสม่ำเสมอที่โดดเด่น คุณกำลังดำเนินการในระดับชั้นนำ", "สถานะแพลตตินัมสะท้อนถึงการมุ่งเน้นที่หายากและการดำเนินการระยะยาว"],
      secondary: "นี่คือสิ่งที่ความเชี่ยวชาญดูเป็น",
      closing: "คุณได้รับความไว้วางใจและความน่าเชื่อถืออย่างลึกซึ้ง"
    },
    so: {
      primary: ["Joogitaan gaar ah. Waxaad ka shaqaynaysaa heer sare.", "Heerka Platinum wuxuu muujinayaa dareenka naadirka ah iyo fulinta muddo dheer."],
      secondary: "Sidaas ayay u muuqataa xirfadda.",
      closing: "Waxaad heshay kalsoonida qoto dheer iyo aaminsanaanta."
    },
    ti: {
      primary: ["ፍሉይ ወጥነት። ኣብ ልዑል ደረጃ ትዓዪ ኣለኻ።", "ፕላቲነም ደረጃ ዘይልሙድ ኣተኩሮን ናይ ነዊሕ ግዜ ፍጻመን የንፀባርቕ።"],
      secondary: "ክእለት ከምዚ ይመስል።",
      closing: "ዓሚቕ እምነትን ተኣማንነትን ረኺብካ።"
    },
    fa: {
      primary: ["ثبات استثنایی. شما در سطح نخبه فعالیت می‌کنید.", "وضعیت پلاتین تمرکز نادر و اجرای بلندمدت را منعکس می‌کند."],
      secondary: "تسلط اینگونه به نظر می‌رسد.",
      closing: "اعتماد و اعتبار عمیقی کسب کرده‌اید."
    },
    he: {
      primary: ["עקביות יוצאת דופן. אתה פועל ברמת עילית.", "מעמד פלטינום משקף ריכוז נדיר וביצוע לטווח ארוך."],
      secondary: "כך נראית שליטה.",
      closing: "הרווחת אמון ואמינות עמוקים."
    },
    el: {
      primary: ["Εξαιρετική συνέπεια. Λειτουργείτε σε επίπεδο ελίτ.", "Η κατάσταση Platinum αντικατοπτρίζει σπάνια εστίαση και μακροπρόθεσμη εκτέλεση."],
      secondary: "Έτσι φαίνεται η δεξιοτεχνία.",
      closing: "Έχετε κερδίσει βαθιά εμπιστοσύνη και αξιοπιστία."
    },
    bn: {
      primary: ["অসাধারণ ধারাবাহিকতা। আপনি এলিট স্তরে কাজ করছেন।", "প্ল্যাটিনাম স্ট্যাটাস বিরল ফোকাস এবং দীর্ঘমেয়াদী বাস্তবায়ন প্রতিফলিত করে।"],
      secondary: "দক্ষতা এমনই দেখায়।",
      closing: "আপনি গভীর বিশ্বাস এবং বিশ্বাসযোগ্যতা অর্জন করেছেন।"
    },
    ta: {
      primary: ["விதிவிலக்கான நிலைத்தன்மை. நீங்கள் உயர் மட்டத்தில் செயல்படுகிறீர்கள்.", "பிளாட்டினம் நிலை அரிய கவனம் மற்றும் நீண்ட கால செயல்பாட்டை பிரதிபலிக்கிறது."],
      secondary: "தேர்ச்சி இப்படித்தான் தெரிகிறது.",
      closing: "ஆழமான நம்பிக்கை மற்றும் நம்பகத்தன்மையை பெற்றுள்ளீர்கள்."
    },
    ms: {
      primary: ["Konsistensi luar biasa. Anda beroperasi di peringkat elit.", "Status Platinum mencerminkan fokus yang jarang dan pelaksanaan jangka panjang."],
      secondary: "Beginilah rupa penguasaan.",
      closing: "Anda telah memperoleh kepercayaan dan kredibiliti yang mendalam."
    },
    tl: {
      primary: ["Pambihirang consistency. Gumagana ka sa antas ng elite.", "Ang Platinum status ay sumasalamin ng bihirang focus at pangmatagalang execution."],
      secondary: "Ganito ang hitsura ng mastery.",
      closing: "Nakamit mo ang malalim na tiwala at kredibilidad."
    },
    ha: {
      primary: ["Daidaito na musamman. Kana aiki a matakin manyan.", "Matsayin Platinum yana nuna maida hankali mai wuya da aiwatarwa na dogon lokaci."],
      secondary: "Haka gwani yake kama.",
      closing: "Kun sami babban aminci da amincewa."
    },
    yo: {
      primary: ["Ìsòdọ̀kan àrà ọ̀tọ̀. O ń ṣiṣẹ́ ní ìpele àgbàlagbà.", "Ipò Platinum ṣe àfihàn ìdojúkọ tí ó ṣọ̀wọ́n àti ìṣiṣẹ́ ìgbà pípẹ́."],
      secondary: "Èyí ni bí ọ̀gá-ọ̀gá ṣe rí.",
      closing: "O ti gba ìgbàgbọ́ jíjìn àti àìsíṣẹ̀."
    },
    zu: {
      primary: ["Ukungaguquki okumangalisayo. Usebenza ezingeni lobungcweti.", "Isimo sePlatinum sibonisa ukugxila okungavamile nokwenziwa kwesikhathi eside."],
      secondary: "Yilokhu okubonakala ngakho ukwazi.",
      closing: "Uthole ukuthembeka okujulile nokwethembeka."
    },
  },
};

// AI Unlock Messages - Multilingual
export const AI_UNLOCK_MESSAGES_MULTILINGUAL: Record<string, Record<SupportedLanguage, string>> = {
  Gold: {
    en: "🌟 Gold Status Unlocked — 100 RewardFlow points. Click your badge anytime to review your RewardFlow.",
    es: "🌟 Estado Oro Desbloqueado — 100 puntos RewardFlow. Haz clic en tu insignia para revisar tu RewardFlow.",
    pt: "🌟 Status Ouro Desbloqueado — 100 pontos RewardFlow. Clique no seu emblema para revisar seu RewardFlow.",
    fr: "🌟 Statut Or Débloqué — 100 points RewardFlow. Cliquez sur votre badge pour consulter votre RewardFlow.",
    ar: "🌟 تم فتح الحالة الذهبية — 100 نقطة RewardFlow. انقر على شارتك لمراجعة RewardFlow الخاص بك.",
    sw: "🌟 Hadhi ya Dhahabu Imefunguliwa — pointi 100 za RewardFlow. Bofya beji yako kuangalia RewardFlow yako.",
    zh: "🌟 黄金状态解锁 — 100 RewardFlow 积分。点击您的徽章查看您的 RewardFlow。",
    ja: "🌟 ゴールドステータス解除 — 100 RewardFlowポイント。バッジをクリックしてRewardFlowを確認してください。",
    ko: "🌟 골드 상태 잠금 해제 — 100 RewardFlow 포인트. 배지를 클릭하여 RewardFlow를 확인하세요.",
    ru: "🌟 Золотой статус разблокирован — 100 очков RewardFlow. Нажмите на значок, чтобы просмотреть RewardFlow.",
    tr: "🌟 Altın Statüsü Açıldı — 100 RewardFlow puanı. RewardFlow'unuzu incelemek için rozetinize tıklayın.",
    hi: "🌟 गोल्ड स्थिति अनलॉक — 100 RewardFlow अंक। अपने RewardFlow की समीक्षा के लिए अपने बैज पर क्लिक करें।",
    am: "🌟 የወርቅ ሁኔታ ተከፍቷል — 100 RewardFlow ነጥቦች። RewardFlow ያንተን ለመመልከት ባጅህን ጠቅ አድርግ።",
    de: "🌟 Gold-Status freigeschaltet — 100 RewardFlow-Punkte. Klicken Sie auf Ihr Abzeichen, um Ihren RewardFlow zu überprüfen.",
    it: "🌟 Stato Oro Sbloccato — 100 punti RewardFlow. Clicca sul tuo badge per rivedere il tuo RewardFlow.",
    nl: "🌟 Goud Status Ontgrendeld — 100 RewardFlow punten. Klik op uw badge om uw RewardFlow te bekijken.",
    pl: "🌟 Status Złoty Odblokowany — 100 punktów RewardFlow. Kliknij swoją odznakę, aby przejrzeć RewardFlow.",
    uk: "🌟 Золотий статус розблоковано — 100 балів RewardFlow. Натисніть на значок, щоб переглянути RewardFlow.",
    id: "🌟 Status Emas Terbuka — 100 poin RewardFlow. Klik lencana Anda untuk meninjau RewardFlow Anda.",
    vi: "🌟 Trạng thái Vàng đã mở khóa — 100 điểm RewardFlow. Nhấp vào huy hiệu để xem RewardFlow của bạn.",
    th: "🌟 สถานะทองปลดล็อค — 100 คะแนน RewardFlow คลิกป้ายของคุณเพื่อตรวจสอบ RewardFlow",
    so: "🌟 Heerka Dahabka Waa La Furay — 100 dhibcood RewardFlow. Guji baajigaaga si aad u eegto RewardFlow-kaaga.",
    ti: "🌟 ናይ ወርቂ ደረጃ ተኸፊቱ — 100 ነጥቢ RewardFlow። RewardFlow ንምርኣይ ባጅካ ጠውቕ።",
    fa: "🌟 وضعیت طلایی باز شد — 100 امتیاز RewardFlow. برای بررسی RewardFlow خود روی نشان خود کلیک کنید.",
    he: "🌟 מעמד זהב נפתח — 100 נקודות RewardFlow. לחץ על התג שלך כדי לבדוק את RewardFlow שלך.",
    el: "🌟 Χρυσή Κατάσταση Ξεκλειδώθηκε — 100 πόντοι RewardFlow. Κάντε κλικ στο σήμα σας για να δείτε το RewardFlow σας.",
    bn: "🌟 গোল্ড স্ট্যাটাস আনলক — 100 RewardFlow পয়েন্ট। আপনার RewardFlow পর্যালোচনা করতে আপনার ব্যাজে ক্লিক করুন।",
    ta: "🌟 தங்க நிலை திறக்கப்பட்டது — 100 RewardFlow புள்ளிகள். உங்கள் RewardFlow ஐப் பார்க்க உங்கள் பேட்ஜை கிளிக் செய்யவும்.",
    ms: "🌟 Status Emas Dibuka — 100 mata RewardFlow. Klik lencana anda untuk menyemak RewardFlow anda.",
    tl: "🌟 Gold Status Unlocked — 100 RewardFlow points. I-click ang iyong badge upang suriin ang iyong RewardFlow.",
    ha: "🌟 Matsayin Zinare An Buɗe — maki 100 na RewardFlow. Danna alamar ku don duba RewardFlow ɗinku.",
    yo: "🌟 Ipò Gólídì Ti Ṣí — àwọn ojú 100 RewardFlow. Tẹ àmì rẹ láti ṣàtúnyẹ̀wò RewardFlow rẹ.",
    zu: "🌟 Isimo Segolide Sivuliwe — amaphuzu angu-100 e-RewardFlow. Chofoza ibheji yakho ukuze ubuyekeze i-RewardFlow yakho.",
  },
  Premium: {
    en: "✨ Premium Status Unlocked — 200 RewardFlow points. Click your badge to view your progress and next targets.",
    es: "✨ Estado Premium Desbloqueado — 200 puntos RewardFlow. Haz clic en tu insignia para ver tu progreso y próximos objetivos.",
    pt: "✨ Status Premium Desbloqueado — 200 pontos RewardFlow. Clique no seu emblema para ver seu progresso e próximas metas.",
    fr: "✨ Statut Premium Débloqué — 200 points RewardFlow. Cliquez sur votre badge pour voir vos progrès et prochains objectifs.",
    ar: "✨ تم فتح الحالة المميزة — 200 نقطة RewardFlow. انقر على شارتك لعرض تقدمك والأهداف التالية.",
    sw: "✨ Hadhi ya Premium Imefunguliwa — pointi 200 za RewardFlow. Bofya beji yako kuona maendeleo yako na malengo yajayo.",
    zh: "✨ 高级状态解锁 — 200 RewardFlow 积分。点击您的徽章查看您的进度和下一个目标。",
    ja: "✨ プレミアムステータス解除 — 200 RewardFlowポイント。バッジをクリックして進捗と次の目標を確認してください。",
    ko: "✨ 프리미엄 상태 잠금 해제 — 200 RewardFlow 포인트. 배지를 클릭하여 진행 상황과 다음 목표를 확인하세요.",
    ru: "✨ Премиум статус разблокирован — 200 очков RewardFlow. Нажмите на значок, чтобы увидеть прогресс и следующие цели.",
    tr: "✨ Premium Statüsü Açıldı — 200 RewardFlow puanı. İlerlemenizi ve sonraki hedeflerinizi görmek için rozetinize tıklayın.",
    hi: "✨ प्रीमियम स्थिति अनलॉक — 200 RewardFlow अंक। अपनी प्रगति और अगले लक्ष्य देखने के लिए अपने बैज पर क्लिक करें।",
    am: "✨ የፕሪሚየም ሁኔታ ተከፍቷል — 200 RewardFlow ነጥቦች። እድገትዎን እና ቀጣይ ግቦችን ለማየት ባጅህን ጠቅ አድርግ።",
    de: "✨ Premium-Status freigeschaltet — 200 RewardFlow-Punkte. Klicken Sie auf Ihr Abzeichen, um Ihren Fortschritt und nächste Ziele zu sehen.",
    it: "✨ Stato Premium Sbloccato — 200 punti RewardFlow. Clicca sul tuo badge per vedere i tuoi progressi e prossimi obiettivi.",
    nl: "✨ Premium Status Ontgrendeld — 200 RewardFlow punten. Klik op uw badge om uw voortgang en volgende doelen te bekijken.",
    pl: "✨ Status Premium Odblokowany — 200 punktów RewardFlow. Kliknij swoją odznakę, aby zobaczyć postępy i następne cele.",
    uk: "✨ Преміум статус розблоковано — 200 балів RewardFlow. Натисніть на значок, щоб переглянути прогрес і наступні цілі.",
    id: "✨ Status Premium Terbuka — 200 poin RewardFlow. Klik lencana Anda untuk melihat kemajuan dan target berikutnya.",
    vi: "✨ Trạng thái Premium đã mở khóa — 200 điểm RewardFlow. Nhấp vào huy hiệu để xem tiến trình và mục tiêu tiếp theo.",
    th: "✨ สถานะพรีเมียมปลดล็อค — 200 คะแนน RewardFlow คลิกป้ายของคุณเพื่อดูความคืบหน้าและเป้าหมายถัดไป",
    so: "✨ Heerka Premium Waa La Furay — 200 dhibcood RewardFlow. Guji baajigaaga si aad u aragto horumartaada iyo bartilmaameedyada xiga.",
    ti: "✨ ናይ ፕሪሚየም ደረጃ ተኸፊቱ — 200 ነጥቢ RewardFlow። ምዕባለኻን ዝቕጽሉ ዕላማታትን ንምርኣይ ባጅካ ጠውቕ።",
    fa: "✨ وضعیت پرمیوم باز شد — 200 امتیاز RewardFlow. برای دیدن پیشرفت و اهداف بعدی روی نشان خود کلیک کنید.",
    he: "✨ מעמד פרמיום נפתח — 200 נקודות RewardFlow. לחץ על התג שלך כדי לראות את ההתקדמות והיעדים הבאים.",
    el: "✨ Premium Κατάσταση Ξεκλειδώθηκε — 200 πόντοι RewardFlow. Κάντε κλικ στο σήμα σας για να δείτε την πρόοδο και τους επόμενους στόχους.",
    bn: "✨ প্রিমিয়াম স্ট্যাটাস আনলক — 200 RewardFlow পয়েন্ট। আপনার অগ্রগতি এবং পরবর্তী লক্ষ্য দেখতে আপনার ব্যাজে ক্লিক করুন।",
    ta: "✨ பிரீமியம் நிலை திறக்கப்பட்டது — 200 RewardFlow புள்ளிகள். உங்கள் முன்னேற்றம் மற்றும் அடுத்த இலக்குகளைப் பார்க்க உங்கள் பேட்ஜை கிளிக் செய்யவும்.",
    ms: "✨ Status Premium Dibuka — 200 mata RewardFlow. Klik lencana anda untuk melihat kemajuan dan sasaran seterusnya.",
    tl: "✨ Premium Status Unlocked — 200 RewardFlow points. I-click ang iyong badge upang makita ang iyong progreso at susunod na mga target.",
    ha: "✨ Matsayin Premium An Buɗe — maki 200 na RewardFlow. Danna alamar ku don ganin ci gaban ku da manufofin na gaba.",
    yo: "✨ Ipò Premium Ti Ṣí — àwọn ojú 200 RewardFlow. Tẹ àmì rẹ láti wo ìtẹ̀síwájú rẹ àti àwọn àfojúsùn tó kàn.",
    zu: "✨ Isimo sePremium Sivuliwe — amaphuzu angu-200 e-RewardFlow. Chofoza ibheji yakho ukuze ubone inqubekela phambili yakho nezinjongo ezilandelayo.",
  },
  Platinum: {
    en: "💎 Platinum Status Unlocked — 5000 RewardFlow points. This reflects elite consistency. Click your badge to view your RewardFlow.",
    es: "💎 Estado Platino Desbloqueado — 5000 puntos RewardFlow. Esto refleja consistencia de élite. Haz clic en tu insignia para ver tu RewardFlow.",
    pt: "💎 Status Platina Desbloqueado — 5000 pontos RewardFlow. Isso reflete consistência de elite. Clique no seu emblema para ver seu RewardFlow.",
    fr: "💎 Statut Platine Débloqué — 5000 points RewardFlow. Cela reflète une cohérence d'élite. Cliquez sur votre badge pour voir votre RewardFlow.",
    ar: "💎 تم فتح الحالة البلاتينية — 5000 نقطة RewardFlow. هذا يعكس اتساقًا نخبويًا. انقر على شارتك لعرض RewardFlow الخاص بك.",
    sw: "💎 Hadhi ya Platinum Imefunguliwa — pointi 5000 za RewardFlow. Hii inaonyesha uthabiti wa wasomi. Bofya beji yako kuona RewardFlow yako.",
    zh: "💎 铂金状态解锁 — 5000 RewardFlow 积分。这反映了精英级的一致性。点击您的徽章查看您的 RewardFlow。",
    ja: "💎 プラチナステータス解除 — 5000 RewardFlowポイント。これはエリートの一貫性を反映しています。バッジをクリックしてRewardFlowを確認してください。",
    ko: "💎 플래티넘 상태 잠금 해제 — 5000 RewardFlow 포인트. 이는 엘리트 일관성을 반영합니다. 배지를 클릭하여 RewardFlow를 확인하세요.",
    ru: "💎 Платиновый статус разблокирован — 5000 очков RewardFlow. Это отражает элитную последовательность. Нажмите на значок, чтобы просмотреть RewardFlow.",
    tr: "💎 Platin Statüsü Açıldı — 5000 RewardFlow puanı. Bu elit tutarlılığı yansıtır. RewardFlow'unuzu görmek için rozetinize tıklayın.",
    hi: "💎 प्लैटिनम स्थिति अनलॉक — 5000 RewardFlow अंक। यह उच्च स्तर की निरंतरता को दर्शाता है। अपना RewardFlow देखने के लिए अपने बैज पर क्लिक करें।",
    am: "💎 የፕላቲኒየም ሁኔታ ተከፍቷል — 5000 RewardFlow ነጥቦች። ይህ ልዩ ወጥነትን ያሳያል። RewardFlow ያንተን ለማየት ባጅህን ጠቅ አድርግ።",
    de: "💎 Platin-Status freigeschaltet — 5000 RewardFlow-Punkte. Dies spiegelt Elite-Beständigkeit wider. Klicken Sie auf Ihr Abzeichen, um Ihren RewardFlow zu sehen.",
    it: "💎 Stato Platino Sbloccato — 5000 punti RewardFlow. Questo riflette coerenza d'élite. Clicca sul tuo badge per vedere il tuo RewardFlow.",
    nl: "💎 Platinum Status Ontgrendeld — 5000 RewardFlow punten. Dit weerspiegelt elite consistentie. Klik op uw badge om uw RewardFlow te bekijken.",
    pl: "💎 Status Platynowy Odblokowany — 5000 punktów RewardFlow. To odzwierciedla elitarną konsekwencję. Kliknij swoją odznakę, aby zobaczyć RewardFlow.",
    uk: "💎 Платиновий статус розблоковано — 5000 балів RewardFlow. Це відображає елітну послідовність. Натисніть на значок, щоб переглянути RewardFlow.",
    id: "💎 Status Platinum Terbuka — 5000 poin RewardFlow. Ini mencerminkan konsistensi elite. Klik lencana Anda untuk melihat RewardFlow Anda.",
    vi: "💎 Trạng thái Platinum đã mở khóa — 5000 điểm RewardFlow. Điều này phản ánh sự nhất quán ở cấp độ tinh hoa. Nhấp vào huy hiệu để xem RewardFlow của bạn.",
    th: "💎 สถานะแพลตตินัมปลดล็อค — 5000 คะแนน RewardFlow สิ่งนี้สะท้อนถึงความสม่ำเสมอระดับชั้นนำ คลิกป้ายของคุณเพื่อดู RewardFlow",
    so: "💎 Heerka Platinum Waa La Furay — 5000 dhibcood RewardFlow. Tani waxay muujineysaa joogitaanka heerka sare. Guji baajigaaga si aad u aragto RewardFlow-kaaga.",
    ti: "💎 ናይ ፕላቲነም ደረጃ ተኸፊቱ — 5000 ነጥቢ RewardFlow። እዚ ልዑል ወጥነት የንጸባርቕ። RewardFlow ንምርኣይ ባጅካ ጠውቕ።",
    fa: "💎 وضعیت پلاتین باز شد — 5000 امتیاز RewardFlow. این نشان دهنده ثبات نخبگان است. برای مشاهده RewardFlow خود روی نشان خود کلیک کنید.",
    he: "💎 מעמד פלטינום נפתח — 5000 נקודות RewardFlow. זה משקף עקביות עילית. לחץ על התג שלך כדי לראות את RewardFlow שלך.",
    el: "💎 Platinum Κατάσταση Ξεκλειδώθηκε — 5000 πόντοι RewardFlow. Αυτό αντικατοπτρίζει ελίτ συνέπεια. Κάντε κλικ στο σήμα σας για να δείτε το RewardFlow σας.",
    bn: "💎 প্ল্যাটিনাম স্ট্যাটাস আনলক — 5000 RewardFlow পয়েন্ট। এটি এলিট ধারাবাহিকতা প্রতিফলিত করে। আপনার RewardFlow দেখতে আপনার ব্যাজে ক্লিক করুন।",
    ta: "💎 பிளாட்டினம் நிலை திறக்கப்பட்டது — 5000 RewardFlow புள்ளிகள். இது உயர் நிலை நிலைத்தன்மையை பிரதிபலிக்கிறது. உங்கள் RewardFlow ஐப் பார்க்க உங்கள் பேட்ஜை கிளிக் செய்யவும்.",
    ms: "💎 Status Platinum Dibuka — 5000 mata RewardFlow. Ini mencerminkan konsistensi elit. Klik lencana anda untuk melihat RewardFlow anda.",
    tl: "💎 Platinum Status Unlocked — 5000 RewardFlow points. Ito ay nagpapakita ng elite consistency. I-click ang iyong badge upang makita ang iyong RewardFlow.",
    ha: "💎 Matsayin Platinum An Buɗe — maki 5000 na RewardFlow. Wannan yana nuna daidaituwa na manyan. Danna alamar ku don ganin RewardFlow ɗinku.",
    yo: "💎 Ipò Platinum Ti Ṣí — àwọn ojú 5000 RewardFlow. Èyí ń ṣàfihàn ìsòdọ̀kan àgbàlagbà. Tẹ àmì rẹ láti wo RewardFlow rẹ.",
    zu: "💎 Isimo sePlatinum Sivuliwe — amaphuzu angu-5000 e-RewardFlow. Lokhu kubonisa ukungaguquki kwabantu abakhethekileyo. Chofoza ibheji yakho ukuze ubone i-RewardFlow yakho.",
  },
};

// RewardFlow Reminder Messages - Multilingual
export const REWARDFLOW_REMINDER_MULTILINGUAL: Record<SupportedLanguage, string> = {
  en: "Don't forget to check your RewardFlow so far.",
  es: "No olvides revisar tu RewardFlow hasta ahora.",
  pt: "Não esqueça de verificar seu RewardFlow até agora.",
  fr: "N'oubliez pas de vérifier votre RewardFlow jusqu'ici.",
  ar: "لا تنس التحقق من RewardFlow الخاص بك حتى الآن.",
  sw: "Usisahau kuangalia RewardFlow yako hadi sasa.",
  zh: "别忘了查看您迄今为止的 RewardFlow。",
  ja: "これまでのRewardFlowを確認することを忘れないでください。",
  ko: "지금까지의 RewardFlow를 확인하는 것을 잊지 마세요.",
  ru: "Не забудьте проверить свой RewardFlow на данный момент.",
  tr: "Şu ana kadar RewardFlow'unuzu kontrol etmeyi unutmayın.",
  hi: "अब तक के अपने RewardFlow की जांच करना न भूलें।",
  am: "እስካሁን ያለውን RewardFlow እርስዎን መፈተሽ አትርሳ።",
  de: "Vergessen Sie nicht, Ihren bisherigen RewardFlow zu überprüfen.",
  it: "Non dimenticare di controllare il tuo RewardFlow finora.",
  nl: "Vergeet niet om uw RewardFlow tot nu toe te bekijken.",
  pl: "Nie zapomnij sprawdzić swojego RewardFlow do tej pory.",
  uk: "Не забудьте перевірити ваш RewardFlow на даний момент.",
  id: "Jangan lupa untuk memeriksa RewardFlow Anda sejauh ini.",
  vi: "Đừng quên kiểm tra RewardFlow của bạn cho đến nay.",
  th: "อย่าลืมตรวจสอบ RewardFlow ของคุณจนถึงตอนนี้",
  so: "Ha ilaawin inaad hubiso RewardFlow-kaaga illaa hadda.",
  ti: "ክሳብ ሕጂ RewardFlow ኻ ምፍታሽ ኣይትረስዕ።",
  fa: "فراموش نکنید RewardFlow خود را تا کنون بررسی کنید.",
  he: "אל תשכח לבדוק את RewardFlow שלך עד כה.",
  el: "Μην ξεχάσετε να ελέγξετε το RewardFlow σας μέχρι τώρα.",
  bn: "এখন পর্যন্ত আপনার RewardFlow চেক করতে ভুলবেন না।",
  ta: "இதுவரை உங்கள் RewardFlow ஐ சரிபார்க்க மறக்காதீர்கள்.",
  ms: "Jangan lupa untuk menyemak RewardFlow anda setakat ini.",
  tl: "Huwag kalimutang tingnan ang iyong RewardFlow hanggang ngayon.",
  ha: "Kada ku manta ku duba RewardFlow ɗinku har zuwa yanzu.",
  yo: "Má gbàgbé láti ṣàyẹ̀wò RewardFlow rẹ títí di ìsinsin yìí.",
  zu: "Ungakhohlwa ukuhlola i-RewardFlow yakho kuze kube manje.",
};

// Get level messages for a specific language (with fallback to English)
export function getLevelMessages(level: string, language: SupportedLanguage) {
  const levelData = LEVEL_MESSAGES_MULTILINGUAL[level];
  if (!levelData) return null;
  
  // Try exact language, fallback to English
  return levelData[language] || levelData.en;
}

// Get AI unlock message for a specific language (with fallback to English)
export function getAIUnlockMessage(level: string, language: SupportedLanguage): string {
  const levelData = AI_UNLOCK_MESSAGES_MULTILINGUAL[level];
  if (!levelData) return "";
  
  return levelData[language] || levelData.en;
}

// Get RewardFlow reminder for a specific language (with fallback to English)
export function getRewardFlowReminder(language: SupportedLanguage): string {
  return REWARDFLOW_REMINDER_MULTILINGUAL[language] || REWARDFLOW_REMINDER_MULTILINGUAL.en;
}
