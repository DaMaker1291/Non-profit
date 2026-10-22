// ─────────────────────────────────────────────────────────────────────────────
// THE SHARED-DEVICE VOCABULARY, in all fifteen languages.
//
// Six strings, and they exist because "switch learner" is a sentence a child
// reads on a phone someone else was using a minute ago. The hint has to say two
// things at once: this shows a different learner's work, and nothing is mixed.
// The removal warning has to be honest about what is lost — the sign-in on this
// device, not the record — because a learner who removes themselves and cannot
// get back in has lost their history in practice even though the file still
// holds it.
//
// Merged into `DICTS` at module load (lib/i18n.ts), so `t()`, the English
// fallback and the suite's key-parity assertion all see one dictionary.
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceDict = Record<string, string>;

export const DEVICE_STRINGS: Record<string, DeviceDict> = {
  en: {
    "acct.learners": "Learners on this device",
    "acct.learner": "Learner",
    "acct.learnersHint": "Each learner keeps their own record. Switching changes whose work is shown — it never mixes two learners' answers.",
    "acct.active": "Active",
    "acct.switch": "Switch",
    "acct.remove": "Remove",
    "acct.removeHint": "Removing forgets the sign-in on this device. The record stays where it is, but you will need the learner's account or recovery code to open it again.",
  },
  es: {
    "acct.learners": "Estudiantes en este dispositivo",
    "acct.learner": "Estudiante",
    "acct.learnersHint": "Cada estudiante mantiene su propio registro. Cambiar decide de quién se muestra el trabajo; nunca mezcla las respuestas de dos estudiantes.",
    "acct.active": "Activo",
    "acct.switch": "Cambiar",
    "acct.remove": "Quitar",
    "acct.removeHint": "Quitar olvida el inicio de sesión en este dispositivo. El registro sigue donde está, pero necesitarás la cuenta o el código de recuperación para volver a abrirlo.",
  },
  fr: {
    "acct.learners": "Élèves sur cet appareil",
    "acct.learner": "Élève",
    "acct.learnersHint": "Chaque élève garde son propre dossier. Changer décide de qui le travail est affiché ; les réponses de deux élèves ne sont jamais mélangées.",
    "acct.active": "Actif",
    "acct.switch": "Changer",
    "acct.remove": "Retirer",
    "acct.removeHint": "Retirer oublie la connexion sur cet appareil. Le dossier reste où il est, mais il faudra le compte ou le code de récupération de l'élève pour le rouvrir.",
  },
  pt: {
    "acct.learners": "Estudantes neste dispositivo",
    "acct.learner": "Estudante",
    "acct.learnersHint": "Cada estudante mantém o seu próprio registo. Mudar decide de quem é o trabalho mostrado; nunca mistura as respostas de dois estudantes.",
    "acct.active": "Ativo",
    "acct.switch": "Mudar",
    "acct.remove": "Remover",
    "acct.removeHint": "Remover esquece a sessão neste dispositivo. O registo fica onde está, mas vai precisar da conta ou do código de recuperação para o abrir outra vez.",
  },
  ar: {
    "acct.learners": "المتعلمون على هذا الجهاز",
    "acct.learner": "متعلم",
    "acct.learnersHint": "لكل متعلم سجله الخاص. التبديل يحدد سجل من يُعرض؛ ولا يخلط إجابات متعلمين أبدًا.",
    "acct.active": "نشط",
    "acct.switch": "تبديل",
    "acct.remove": "إزالة",
    "acct.removeHint": "الإزالة تنسى تسجيل الدخول على هذا الجهاز. يبقى السجل في مكانه، لكنك ستحتاج حساب المتعلم أو رمز الاسترداد لفتحه مرة أخرى.",
  },
  sw: {
    "acct.learners": "Wanafunzi kwenye kifaa hiki",
    "acct.learner": "Mwanafunzi",
    "acct.learnersHint": "Kila mwanafunzi ana rekodi yake. Kubadilisha huamua kazi ya nani inaonyeshwa; hakuchanganyi majibu ya wanafunzi wawili.",
    "acct.active": "Anayetumia",
    "acct.switch": "Badilisha",
    "acct.remove": "Ondoa",
    "acct.removeHint": "Kuondoa kunasahau kuingia kwenye kifaa hiki. Rekodi inabaki mahali pake, lakini utahitaji akaunti ya mwanafunzi au msimbo wa urejeshaji kuifungua tena.",
  },
  hi: {
    "acct.learners": "इस डिवाइस पर सीखने वाले",
    "acct.learner": "सीखने वाला",
    "acct.learnersHint": "हर सीखने वाले का अपना रिकॉर्ड रहता है। बदलने से तय होता है किसका काम दिखेगा; दो लोगों के उत्तर कभी नहीं मिलते।",
    "acct.active": "सक्रिय",
    "acct.switch": "बदलें",
    "acct.remove": "हटाएँ",
    "acct.removeHint": "हटाने से इस डिवाइस पर साइन-इन भूल जाता है। रिकॉर्ड जहाँ है वहीं रहता है, पर उसे फिर खोलने के लिए खाता या रिकवरी कोड चाहिए होगा।",
  },
  id: {
    "acct.learners": "Pelajar di perangkat ini",
    "acct.learner": "Pelajar",
    "acct.learnersHint": "Setiap pelajar menyimpan catatannya sendiri. Mengganti menentukan pekerjaan siapa yang ditampilkan; jawaban dua pelajar tidak pernah tercampur.",
    "acct.active": "Aktif",
    "acct.switch": "Ganti",
    "acct.remove": "Hapus",
    "acct.removeHint": "Menghapus melupakan sesi di perangkat ini. Catatan tetap di tempatnya, tetapi Anda perlu akun atau kode pemulihan pelajar untuk membukanya lagi.",
  },
  tl: {
    "acct.learners": "Mga mag-aaral sa device na ito",
    "acct.learner": "Mag-aaral",
    "acct.learnersHint": "Bawat mag-aaral ay may sariling talaan. Ang pagpalit ay nagtatakda kung kaninong gawa ang ipapakita; hindi kailanman pinaghahalo ang sagot ng dalawa.",
    "acct.active": "Aktibo",
    "acct.switch": "Palitan",
    "acct.remove": "Alisin",
    "acct.removeHint": "Ang pag-alis ay nakakalimot sa pag-sign in sa device na ito. Nananatili ang talaan, ngunit kakailanganin mo ang account o recovery code ng mag-aaral upang buksan itong muli.",
  },
  de: {
    "acct.learners": "Lernende auf diesem Gerät",
    "acct.learner": "Lernende Person",
    "acct.learnersHint": "Jede lernende Person behält ihren eigenen Datensatz. Wechseln bestimmt, wessen Arbeit gezeigt wird; Antworten zweier Lernender werden nie vermischt.",
    "acct.active": "Aktiv",
    "acct.switch": "Wechseln",
    "acct.remove": "Entfernen",
    "acct.removeHint": "Entfernen vergisst die Anmeldung auf diesem Gerät. Der Datensatz bleibt, wo er ist, aber zum erneuten Öffnen braucht es das Konto oder den Wiederherstellungscode der lernenden Person.",
  },
  ja: {
    "acct.learners": "この端末の学習者",
    "acct.learner": "学習者",
    "acct.learnersHint": "学習者ごとに自分の記録があります。切り替えると表示される記録が変わり、二人の解答が混ざることはありません。",
    "acct.active": "使用中",
    "acct.switch": "切り替え",
    "acct.remove": "削除",
    "acct.removeHint": "削除するとこの端末のサインインを忘れます。記録自体は残りますが、もう一度開くにはアカウントまたは回復コードが必要です。",
  },
  zh: {
    "acct.learners": "此设备上的学习者",
    "acct.learner": "学习者",
    "acct.learnersHint": "每位学习者保留自己的记录。切换会决定显示谁的学习记录；绝不会把两人的答案混在一起。",
    "acct.active": "当前",
    "acct.switch": "切换",
    "acct.remove": "移除",
    "acct.removeHint": "移除会忘记此设备上的登录。记录仍在原处，但再次打开需要该学习者的账户或恢复码。",
  },
  fa: {
    "acct.learners": "یادگیرندگان روی این دستگاه",
    "acct.learner": "یادگیرنده",
    "acct.learnersHint": "هر یادگیرنده سابقهٔ خودش را دارد. جابه‌جایی تعیین می‌کند کار چه کسی نمایش داده شود؛ پاسخ دو نفر هرگز با هم مخلوط نمی‌شود.",
    "acct.active": "فعال",
    "acct.switch": "تغییر",
    "acct.remove": "حذف",
    "acct.removeHint": "حذف کردن، ورود روی این دستگاه را فراموش می‌کند. سابقه سر جای خود می‌ماند، اما برای بازکردن دوباره به حساب یا کد بازیابی یادگیرنده نیاز دارید.",
  },
  ur: {
    "acct.learners": "اس ڈیوائس پر سیکھنے والے",
    "acct.learner": "سیکھنے والا",
    "acct.learnersHint": "ہر سیکھنے والے کا اپنا ریکارڈ ہے۔ تبدیل کرنے سے طے ہوتا ہے کس کا کام دکھایا جائے؛ دو افراد کے جواب کبھی نہیں ملتے۔",
    "acct.active": "فعال",
    "acct.switch": "تبدیل کریں",
    "acct.remove": "ہٹائیں",
    "acct.removeHint": "ہٹانے سے اس ڈیوائس پر سائن اِن بھول جاتا ہے۔ ریکارڈ اپنی جگہ رہتا ہے، مگر دوبارہ کھولنے کے لیے اکاؤنٹ یا ریکوری کوڈ درکار ہوگا۔",
  },
  bn: {
    "acct.learners": "এই ডিভাইসে শিক্ষার্থীরা",
    "acct.learner": "শিক্ষার্থী",
    "acct.learnersHint": "প্রত্যেক শিক্ষার্থীর নিজের রেকর্ড থাকে। বদলালে ঠিক হয় কার কাজ দেখানো হবে; দুইজনের উত্তর কখনো মেশে না।",
    "acct.active": "সক্রিয়",
    "acct.switch": "বদলান",
    "acct.remove": "সরান",
    "acct.removeHint": "সরালে এই ডিভাইসের সাইন-ইন ভুলে যাবে। রেকর্ড যেখানে আছে সেখানেই থাকে, তবে আবার খুলতে শিক্ষার্থীর অ্যাকাউন্ট বা রিকভারি কোড লাগবে।",
  },
};
