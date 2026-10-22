// ─────────────────────────────────────────────────────────────────────────────
// THE RECOVERY VOCABULARY, in all fifteen languages.
//
// WHY IT IS ITS OWN MODULE rather than fifteen insertions into lib/i18n.ts: the
// strings belong to ONE feature and one review — a translator reading them together
// can see that `rec.lead` and `rec.saved` are a single promise, and a reviewer can
// diff the whole vocabulary in one place. `lib/i18n.ts` merges them at module load,
// so `t()`, the fallback to English and the suite's key-parity assertion all see one
// dictionary exactly as before. A key missing here fails `npm run verify` for the
// language it is missing from, which is the rule the rest of the product keeps.
//
// THE SENTENCES ARE SHORT ON PURPOSE. They are read on a shared phone, often by a
// learner who is already worried about losing their work. The lead line carries the
// one fact that matters — there is no email reset — because a recovery screen that
// implies a mailbox exists sends the learner looking for one they do not have.
// ─────────────────────────────────────────────────────────────────────────────

/** The subset this module owns. Deliberately a plain record: the merge into
 *  `DICTS` is what makes it part of the one dictionary, and importing `Dict` back
 *  from lib/i18n.ts would close a cycle for no benefit. */
export type RecoveryDict = Record<string, string>;

export const RECOVERY_STRINGS: Record<string, RecoveryDict> = {
  en: {
    "rec.title": "Your recovery code",
    "rec.lead": "Write this code down and keep it safe. If you forget your password, this is the only way back into your record — there is no email reset.",
    "rec.print": "Print this code",
    "rec.saved": "I have saved it",
    "rec.forgot": "Forgotten your password?",
    "rec.use": "Use a recovery code",
    "rec.err": "That code does not match this account.",
    "rec.new": "Your new recovery code",
    "rec.grantLead": "Read this to the learner. It works once, for 15 minutes.",
    "rec.emailHint": "Email (leave empty if you are using a code from your teacher)",
  },
  es: {
    "rec.title": "Tu código de recuperación",
    "rec.lead": "Apunta este código y guárdalo. Si olvidas tu contraseña, es la única forma de volver a tu historial: no hay restablecimiento por correo.",
    "rec.print": "Imprimir este código",
    "rec.saved": "Lo he guardado",
    "rec.forgot": "¿Olvidaste tu contraseña?",
    "rec.use": "Usar un código de recuperación",
    "rec.err": "Ese código no coincide con esta cuenta.",
    "rec.new": "Tu nuevo código de recuperación",
    "rec.grantLead": "Léeselo al estudiante. Funciona una sola vez, durante 15 minutos.",
    "rec.emailHint": "Correo (déjalo vacío si usas un código de tu profesor)",
  },
  fr: {
    "rec.title": "Ton code de récupération",
    "rec.lead": "Note ce code et garde-le. Si tu oublies ton mot de passe, c'est le seul moyen de retrouver ton dossier : il n'y a pas de réinitialisation par e-mail.",
    "rec.print": "Imprimer ce code",
    "rec.saved": "Je l'ai noté",
    "rec.forgot": "Mot de passe oublié ?",
    "rec.use": "Utiliser un code de récupération",
    "rec.err": "Ce code ne correspond pas à ce compte.",
    "rec.new": "Ton nouveau code de récupération",
    "rec.grantLead": "Lis-le à l'élève. Il fonctionne une seule fois, pendant 15 minutes.",
    "rec.emailHint": "E-mail (laisse vide si tu utilises un code de ton professeur)",
  },
  pt: {
    "rec.title": "O teu código de recuperação",
    "rec.lead": "Escreve este código e guarda-o. Se te esqueceres da palavra-passe, é a única forma de voltar ao teu registo: não há reposição por email.",
    "rec.print": "Imprimir este código",
    "rec.saved": "Já guardei",
    "rec.forgot": "Esqueceste-te da palavra-passe?",
    "rec.use": "Usar um código de recuperação",
    "rec.err": "Esse código não corresponde a esta conta.",
    "rec.new": "O teu novo código de recuperação",
    "rec.grantLead": "Lê isto ao aluno. Funciona uma vez, durante 15 minutos.",
    "rec.emailHint": "Email (deixa vazio se estiveres a usar um código do teu professor)",
  },
  ar: {
    "rec.title": "رمز الاستعادة الخاص بك",
    "rec.lead": "اكتب هذا الرمز واحفظه. إذا نسيت كلمة المرور، فهذه هي الطريقة الوحيدة للعودة إلى سجلك — لا توجد إعادة تعيين بالبريد الإلكتروني.",
    "rec.print": "اطبع هذا الرمز",
    "rec.saved": "لقد حفظته",
    "rec.forgot": "هل نسيت كلمة المرور؟",
    "rec.use": "استخدام رمز استعادة",
    "rec.err": "هذا الرمز لا يطابق هذا الحساب.",
    "rec.new": "رمز الاستعادة الجديد الخاص بك",
    "rec.grantLead": "اقرأ هذا على المتعلم. يعمل مرة واحدة فقط، لمدة 15 دقيقة.",
    "rec.emailHint": "البريد الإلكتروني (اتركه فارغًا إذا كنت تستخدم رمزًا من معلمك)",
  },
  sw: {
    "rec.title": "Msimbo wako wa kurejesha",
    "rec.lead": "Andika msimbo huu na uuhifadhi. Ukisahau nenosiri lako, hii ndiyo njia pekee ya kurudi kwenye rekodi yako — hakuna urejeshaji kwa barua pepe.",
    "rec.print": "Chapisha msimbo huu",
    "rec.saved": "Nimeuhifadhi",
    "rec.forgot": "Umesahau nenosiri lako?",
    "rec.use": "Tumia msimbo wa kurejesha",
    "rec.err": "Msimbo huo hauwiani na akaunti hii.",
    "rec.new": "Msimbo wako mpya wa kurejesha",
    "rec.grantLead": "Msomee mwanafunzi. Unafanya kazi mara moja, kwa dakika 15.",
    "rec.emailHint": "Barua pepe (acha wazi ikiwa unatumia msimbo kutoka kwa mwalimu wako)",
  },
  hi: {
    "rec.title": "आपका रिकवरी कोड",
    "rec.lead": "यह कोड लिखकर सुरक्षित रखें। अगर आप अपना पासवर्ड भूल जाएँ, तो यही आपके रिकॉर्ड तक वापस जाने का एकमात्र रास्ता है — ईमेल से रीसेट नहीं होता।",
    "rec.print": "यह कोड प्रिंट करें",
    "rec.saved": "मैंने इसे सहेज लिया है",
    "rec.forgot": "पासवर्ड भूल गए?",
    "rec.use": "रिकवरी कोड का उपयोग करें",
    "rec.err": "यह कोड इस खाते से मेल नहीं खाता।",
    "rec.new": "आपका नया रिकवरी कोड",
    "rec.grantLead": "यह शिक्षार्थी को पढ़कर सुनाएँ। यह एक बार, 15 मिनट के लिए काम करता है।",
    "rec.emailHint": "ईमेल (अगर आप अपने शिक्षक का कोड इस्तेमाल कर रहे हैं तो खाली छोड़ें)",
  },
  id: {
    "rec.title": "Kode pemulihanmu",
    "rec.lead": "Tulis kode ini dan simpan. Jika kamu lupa kata sandi, ini satu-satunya jalan kembali ke catatanmu — tidak ada pengaturan ulang lewat email.",
    "rec.print": "Cetak kode ini",
    "rec.saved": "Sudah kusimpan",
    "rec.forgot": "Lupa kata sandi?",
    "rec.use": "Pakai kode pemulihan",
    "rec.err": "Kode itu tidak cocok dengan akun ini.",
    "rec.new": "Kode pemulihan barumu",
    "rec.grantLead": "Bacakan ini kepada siswa. Kode berlaku sekali, selama 15 menit.",
    "rec.emailHint": "Email (biarkan kosong jika memakai kode dari gurumu)",
  },
  tl: {
    "rec.title": "Ang iyong recovery code",
    "rec.lead": "Isulat ang code na ito at itago. Kung makalimutan mo ang password, ito lang ang paraan pabalik sa iyong rekord — walang reset sa email.",
    "rec.print": "I-print ang code na ito",
    "rec.saved": "Naitago ko na",
    "rec.forgot": "Nakalimutan mo ang password?",
    "rec.use": "Gumamit ng recovery code",
    "rec.err": "Hindi tumutugma ang code na iyon sa account na ito.",
    "rec.new": "Ang bago mong recovery code",
    "rec.grantLead": "Basahin ito sa mag-aaral. Gumagana ito nang isang beses, sa loob ng 15 minuto.",
    "rec.emailHint": "Email (iwanang blangko kung gumagamit ka ng code mula sa guro mo)",
  },
  de: {
    "rec.title": "Dein Wiederherstellungscode",
    "rec.lead": "Schreib diesen Code auf und bewahre ihn auf. Wenn du dein Passwort vergisst, ist er der einzige Weg zurück zu deinem Datensatz — eine Zurücksetzung per E-Mail gibt es nicht.",
    "rec.print": "Diesen Code drucken",
    "rec.saved": "Ich habe ihn gespeichert",
    "rec.forgot": "Passwort vergessen?",
    "rec.use": "Wiederherstellungscode verwenden",
    "rec.err": "Dieser Code passt nicht zu diesem Konto.",
    "rec.new": "Dein neuer Wiederherstellungscode",
    "rec.grantLead": "Lies das der Lernenden vor. Er gilt einmal, für 15 Minuten.",
    "rec.emailHint": "E-Mail (leer lassen, wenn du einen Code von deiner Lehrkraft verwendest)",
  },
  ja: {
    "rec.title": "リカバリーコード",
    "rec.lead": "このコードを書き留めて保管してください。パスワードを忘れた場合、記録に戻る唯一の方法です。メールでの再設定はありません。",
    "rec.print": "このコードを印刷",
    "rec.saved": "保存しました",
    "rec.forgot": "パスワードをお忘れですか？",
    "rec.use": "リカバリーコードを使う",
    "rec.err": "このコードはこのアカウントと一致しません。",
    "rec.new": "新しいリカバリーコード",
    "rec.grantLead": "学習者に読み上げてください。15分間、1回だけ有効です。",
    "rec.emailHint": "メール（先生からもらったコードを使う場合は空欄）",
  },
  zh: {
    "rec.title": "你的恢复码",
    "rec.lead": "请把这个码抄下来并保管好。如果你忘了密码，这是回到你的记录的唯一方式——没有邮件重置。",
    "rec.print": "打印此码",
    "rec.saved": "我已保存",
    "rec.forgot": "忘记密码？",
    "rec.use": "使用恢复码",
    "rec.err": "该恢复码与此账户不匹配。",
    "rec.new": "你的新恢复码",
    "rec.grantLead": "请读给这名学生听。它只能使用一次，15 分钟内有效。",
    "rec.emailHint": "邮箱（如果使用老师给你的码，请留空）",
  },
  fa: {
    "rec.title": "کد بازیابی شما",
    "rec.lead": "این کد را بنویسید و نگه دارید. اگر رمز عبور را فراموش کنید، تنها راه بازگشت به سابقهٔ شما همین است — بازنشانی با ایمیل وجود ندارد.",
    "rec.print": "چاپ این کد",
    "rec.saved": "آن را ذخیره کردم",
    "rec.forgot": "رمز عبور را فراموش کرده‌اید؟",
    "rec.use": "استفاده از کد بازیابی",
    "rec.err": "این کد با این حساب مطابقت ندارد.",
    "rec.new": "کد بازیابی جدید شما",
    "rec.grantLead": "این را برای دانش‌آموز بخوانید. یک بار و برای ۱۵ دقیقه کار می‌کند.",
    "rec.emailHint": "ایمیل (اگر از کد معلم خود استفاده می‌کنید خالی بگذارید)",
  },
  ur: {
    "rec.title": "آپ کا ریکوری کوڈ",
    "rec.lead": "یہ کوڈ لکھ لیں اور محفوظ رکھیں۔ اگر آپ اپنا پاس ورڈ بھول جائیں تو یہی آپ کے ریکارڈ تک واپس جانے کا واحد راستہ ہے — ای میل سے ری سیٹ نہیں ہوتا۔",
    "rec.print": "یہ کوڈ پرنٹ کریں",
    "rec.saved": "میں نے محفوظ کر لیا",
    "rec.forgot": "پاس ورڈ بھول گئے؟",
    "rec.use": "ریکوری کوڈ استعمال کریں",
    "rec.err": "یہ کوڈ اس اکاؤنٹ سے مطابقت نہیں رکھتا۔",
    "rec.new": "آپ کا نیا ریکوری کوڈ",
    "rec.grantLead": "یہ سیکھنے والے کو پڑھ کر سنائیں۔ یہ ایک بار، 15 منٹ کے لیے کام کرتا ہے۔",
    "rec.emailHint": "ای میل (اگر آپ اپنے استاد کا کوڈ استعمال کر رہے ہیں تو خالی چھوڑ دیں)",
  },
  bn: {
    "rec.title": "আপনার রিকভারি কোড",
    "rec.lead": "এই কোডটি লিখে রেখে নিরাপদে রাখুন। পাসওয়ার্ড ভুলে গেলে আপনার রেকর্ডে ফেরার এটিই একমাত্র উপায় — ইমেইলে রিসেট হয় না।",
    "rec.print": "এই কোডটি প্রিন্ট করুন",
    "rec.saved": "আমি এটি সংরক্ষণ করেছি",
    "rec.forgot": "পাসওয়ার্ড ভুলে গেছেন?",
    "rec.use": "রিকভারি কোড ব্যবহার করুন",
    "rec.err": "এই কোডটি এই অ্যাকাউন্টের সাথে মেলে না।",
    "rec.new": "আপনার নতুন রিকভারি কোড",
    "rec.grantLead": "শিক্ষার্থীকে এটি পড়ে শোনান। এটি একবারই কাজ করে, ১৫ মিনিটের জন্য।",
    "rec.emailHint": "ইমেইল (শিক্ষকের দেওয়া কোড ব্যবহার করলে খালি রাখুন)",
  },
};

/**
 * The ACTION label, injected rather than pasted into fifteen dictionaries.
 *
 * It is separate from the block above because it is a verb, not a sentence: the
 * account screen's button that mints a replacement code. Keeping it as a map next
 * to the vocabulary — and merging it into the SAME dictionaries at module load —
 * means a language cannot ship the screen with a raw key, while the translator
 * still reads one file.
 */
const RECOVERY_ACTION: Record<string, string> = {
  en: "Get a new code",
  es: "Obtener un código nuevo",
  fr: "Obtenir un nouveau code",
  pt: "Obter um código novo",
  ar: "الحصول على رمز جديد",
  sw: "Pata msimbo mpya",
  hi: "नया कोड लें",
  id: "Dapatkan kode baru",
  tl: "Kumuha ng bagong code",
  de: "Neuen Code erzeugen",
  ja: "新しいコードを作成",
  zh: "生成新码",
  fa: "ساخت کد جدید",
  ur: "نیا کوڈ بنائیں",
  bn: "নতুন কোড তৈরি করুন",
};

for (const [code, label] of Object.entries(RECOVERY_ACTION)) {
  const dict = RECOVERY_STRINGS[code];
  if (dict) dict["rec.make"] = label;
}
