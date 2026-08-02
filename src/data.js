// ============================================================
//  data.js — all built-in registries (adhkar, duas, names,
//  E-numbers, quiz bank, study articles, daily quotes)
//  Note: Quran surah TEXT itself is never hardcoded — it is
//  fetched live from alquran.cloud. These files only hold
//  du'a / remembrance / reference data.
// ============================================================

// ------------------------------------------------------------
// Daily motivation — rotating quotes & hadith (Arabic + English)
// ------------------------------------------------------------
export const DAILY_QUOTES = [
  { ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", en: "So, truly, with hardship comes ease.", ref: "Quran 94:5" },
  { ar: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", en: "Verily, in the remembrance of Allah do hearts find rest.", ref: "Quran 13:28" },
  { ar: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", en: "And whoever relies upon Allah — then He is sufficient for him.", ref: "Quran 65:3" },
  { ar: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", en: "Allah does not burden a soul beyond that it can bear.", ref: "Quran 2:286" },
  { ar: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ", en: "Say: 'O My servants who have transgressed against themselves, do not despair of the mercy of Allah.'", ref: "Quran 39:53" },
  { ar: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ", en: "So remember Me; I will remember you. And be grateful to Me and do not deny Me.", ref: "Quran 2:152" },
  { ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", en: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the torment of the Fire.", ref: "Quran 2:201" },
  { ar: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ", en: "And that man shall have nothing but what he strives for.", ref: "Quran 53:39" },
  { ar: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", en: "If you are grateful, I will surely increase you [in favour].", ref: "Quran 14:7" },
  { ar: "إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ", en: "Verily, Allah does not look at your appearance and wealth, but He looks at your hearts and your deeds.", ref: "Sahih Muslim" },
  { ar: "أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ", en: "The most beloved of deeds to Allah are those that are most consistent, even if they are small.", ref: "Bukhari & Muslim" },
  { ar: "لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ", en: "The strong one is not the one who overcomes people by wrestling, but the one who controls himself when angry.", ref: "Bukhari & Muslim" },
  { ar: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ", en: "Smiling in your brother's face is an act of charity.", ref: "Tirmidhi" },
  { ar: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ", en: "Whoever believes in Allah and the Last Day, let him speak good or remain silent.", ref: "Bukhari & Muslim" },
  { ar: "الْجَنَّةُ تَحْتَ أَقْدَامِ الْأُمَّهَاتِ", en: "Paradise lies beneath the feet of mothers.", ref: "Ahmad & An-Nasa'i" },
  { ar: "يَسِّرُوا وَلَا تُعَسِّرُوا وَبَشِّرُوا وَلَا تُنَفِّرُوا", en: "Make things easy and do not make them difficult; give glad tidings and do not repel people.", ref: "Bukhari" },
  { ar: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ", en: "Whoever follows a path seeking knowledge, Allah will make easy for him a path to Paradise.", ref: "Muslim"  },
];

export const ADHKAR_MORNING = [
  { id: "m1", t: "Ayat al-Kursi", ar: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ", en: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither slumber nor sleep overtakes Him...", n: 1, ref: "Quran 2:255" },
  { id: "m2", t: "Al-Ikhlas", ar: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", en: "Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent.", n: 3, ref: "Quran 112" },
  { id: "m3", t: "Al-Falaq", ar: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", en: "Say: I seek refuge in the Lord of daybreak, from the evil of what He created...", n: 3, ref: "Quran 113" },
  { id: "m4", t: "An-Nas", ar: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ", en: "Say: I seek refuge in the Lord of mankind, the Sovereign of mankind...", n: 3, ref: "Quran 114" },
  { id: "m5", t: "Morning arrival du'a", ar: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", en: "We have reached the morning and the dominion belongs to Allah. All praise is for Allah. None has the right to be worshipped but Allah alone...", n: 1, ref: "Muslim" },
  { id: "m6", t: "Morning trust du'a", ar: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ", en: "O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.", n: 1, ref: "Tirmidhi" },
  { id: "m7", t: "Protection du'a", ar: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", en: "In the name of Allah, with whose name nothing on earth or in the heavens can cause harm, and He is the All-Hearing, the All-Knowing.", n: 3, ref: "Abu Dawud & Tirmidhi" },
  { id: "m8", t: "Acceptance du'a", ar: "رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا", en: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad ﷺ as my Prophet.", n: 3, ref: "Abu Dawud" },
  { id: "m9", t: "Beneficial knowledge du'a", ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا", en: "O Allah, I ask You for beneficial knowledge, wholesome provision, and accepted deeds.", n: 1, ref: "Ibn Majah" },
  { id: "m10", t: "Tasbih of the morning", ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", en: "Glory and praise be to Allah.", n: 100, ref: "Muslim" },
  { id: "m11", t: "Sufficiency du'a", ar: "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", en: "Allah is sufficient for me — there is no deity except Him. In Him I put my trust, and He is the Lord of the Mighty Throne.", n: 7, ref: "Abu Dawud" },
  { id: "m12", t: "Health du'a", ar: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَٰهَ إِلَّا أَنْتَ", en: "O Allah, grant my body health; O Allah, grant my hearing health; O Allah, grant my sight health. There is no god but You.", n: 3, ref: "Abu Dawud"  },

];

export const ADHKAR_EVENING = [
  { id: "e1", t: "Ayat al-Kursi", ar: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ", en: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence...", n: 1, ref: "Quran 2:255" },
  { id: "e2", t: "Al-Ikhlas · Al-Falaq · An-Nas", ar: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ", en: "Say: He is Allah, the One... Say: I seek refuge in the Lord of daybreak... Say: I seek refuge in the Lord of mankind...", n: 3, ref: "Quran 112–114" },
  { id: "e3", t: "Evening arrival du'a", ar: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", en: "We have reached the evening and the dominion belongs to Allah. All praise is for Allah...", n: 1, ref: "Muslim" },
  { id: "e4", t: "Evening trust du'a", ar: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ", en: "O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final return.", n: 1, ref: "Tirmidhi" },
  { id: "e5", t: "Refuge in Allah's perfect words", ar: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", en: "I seek refuge in the perfect words of Allah from the evil of what He has created.", n: 3, ref: "Muslim" },
  { id: "e6", t: "Protection du'a", ar: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", en: "In the name of Allah, with whose name nothing on earth or in the heavens can cause harm...", n: 3, ref: "Abu Dawud & Tirmidhi" },
  { id: "e7", t: "Protection from punishment", ar: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", en: "O Allah, protect me from Your punishment on the Day You resurrect Your servants.", n: 3, ref: "Muslim" },
  { id: "e8", t: "Acceptance du'a", ar: "رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا", en: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad ﷺ as my Prophet.", n: 3, ref: "Abu Dawud" },
  { id: "e9", t: "Tasbih of the evening", ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", en: "Glory and praise be to Allah.", n: 100, ref: "Muslim" },
  { id: "e10", t: "Witnessing du'a", ar: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ أَنَّكَ أَنْتَ اللَّهُ لَا إِلَٰهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ", en: "O Allah, I have entered the evening calling You to witness, and Your angels and all Your creation — that You are Allah, no god but You alone... and that Muhammad is Your servant and Messenger.", n: 1, ref: "Tirmidhi (abridged)"  },

];

export const SUNNAH_HABITS = [
  { id: "h1", t: "Eat & drink with the right hand", ar: "كُلْ بِيَمِينِكَ", en: "The Prophet ﷺ said: 'O boy, mention the name of Allah and eat with your right hand.'" },
  { id: "h2", t: "Say 'Bismillah' before eating", ar: "بِسْمِ اللَّهِ", en: "And if you forget, say: Bismillahi awwalahu wa akhirahu." },
  { id: "h3", t: "Sit while drinking water", ar: "اشْرَبُوا وَأَنْتُمْ قُعُودٌ", en: "The Prophet ﷺ discouraged drinking while standing; sit and drink in sips." },
  { id: "h4", t: "Eat with three fingers & lick them", ar: "لَعْقُ الْأَصَابِعِ", en: "Eat with the right hand using three fingers, then lick them — blessings lie in the last morsels." },
  { id: "h5", t: "Dust your bed before sleeping", ar: "إِذَا أَوَى أَحَدُكُمْ إِلَى فِرَاشِهِ فَلْيَنْفُضْهُ", en: "Dust the bed with the inside of your garment — you don't know what followed you onto it." },
  { id: "h6", t: "Sleep on your right side", ar: "النَّوْمُ عَلَى الشِّقِّ الْأَيْمَنِ", en: "Face the Qibla and sleep on the right side, like the Prophet ﷺ." },
  { id: "h7", t: "Make wudu before sleeping", ar: "إِذَا أَتَيْتَ مَضْجَعَكَ فَتَوَضَّأْ", en: "Whoever sleeps in a state of purity is like one who worships the whole night." },
  { id: "h8", t: "Recite adhkar before sleeping", ar: "أَذْكَارُ النَّوْمِ", en: "Ayat al-Kursi, Al-Ikhlas/Falaq/Nas (blowing into cupped hands), and the sleeping du'as." },
  { id: "h9", t: "Thank Allah upon waking", ar: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا", en: "Praise Allah who gave us life after death, and to Him is the resurrection." },
  { id: "h10", t: "Use the siwak (miswak)", ar: "السِّوَاكُ مَطْهَرَةٌ لِلْفَمِ", en: "The miswak purifies the mouth and pleases the Lord — use it before prayers." },
  { id: "h11", t: "Smile at your brother", ar: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ", en: "Smiling in your brother's face is charity (Tirmidhi)." },
  { id: "h12", t: "Say Salam when entering home", ar: "السَّلَامُ عَلَيْكُمْ", en: "Enter with salam and mention Allah's name — blessings fill the home." },
  { id: "h13", t: "Enter/leave washroom on correct foot", ar: "بِسْمِ اللَّهِ — أَعُوذُ بِاللَّهِ مِنَ الْخُبُثِ وَالْخَبَائِثِ", en: "Left foot entering, right foot leaving, with the du'a of refuge." },
  { id: "h14", t: "Praise Allah when sneezing", ar: "الْحَمْدُ لِلَّهِ", en: "Say 'Alhamdulillah' after sneezing — it is a right upon every Muslim." },
  { id: "h15", t: "Reply to the sneezer", ar: "يَرْحَمُكَ اللَّهُ", en: "Reply 'Yarhamukallah' — and the sneezer answers 'Yahdikumullah wa yuslihu balakum'." },
  { id: "h16", t: "Take ghusl & groom for Friday", ar: "غُسْلُ يَوْمِ الْجُمُعَةِ", en: "The Prophet ﷺ encouraged ghusl, combing and using fragrance before Jumu'ah."  },

];
export const EMOTION_REMEDIES = {
  anxious: {
    label: "Anxious",
    verse: { ar: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", en: "Verily, in the remembrance of Allah do hearts find rest.", ref: "Quran 13:28" },
    dua: { ar: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ", en: "O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness.", ref: "Bukhari" },
    action: "Take 10 slow breaths. Make wudu and pray 2 rak'ahs of calm. Repeat 'Hasbunallahu wa ni'mal wakeel' 10 times, then write one worry down and hand it to Allah in du'a.",
  },
  sad: {
    label: "Sad",
    verse: { ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا", en: "So truly, with hardship comes ease. Truly, with hardship comes ease.", ref: "Quran 94:5–6" },
    dua: { ar: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", en: "Allah is sufficient for us, and He is the best Disposer of affairs.", ref: "Quran 3:173" },
    action: "Remember that even Prophet Ya'qub wept until his eyes whitened — sadness is human, despair is not. Call a friend, give even small sadaqah, and recite the du'a of Yunus in hardship.",
  },
  angry: {
    label: "Angry",
    verse: { ar: "وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ ۗ وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ", en: "And those who restrain anger and pardon people — and Allah loves the doers of good.", ref: "Quran 3:134" },
    dua: { ar: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", en: "I seek refuge in Allah from the accursed Shaytan.", ref: "Bukhari & Muslim" },
    action: "The Prophet ﷺ said: if angry while standing, sit; if sitting, lie down. Then make wudu — anger is a spark, water extinguishes it. Say 'A'udhu billah' and stay silent.",
  },
  lazy: {
    label: "Lazy",
    verse: { ar: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ", en: "And that man shall have nothing but what he strives for.", ref: "Quran 53:39" },
    dua: { ar: "اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", en: "O Allah, help me to remember You, thank You, and worship You excellently.", ref: "Abu Dawud" },
    action: "Shaytan loves procrastination — win the first 2 minutes only. Start with the smallest task (make wudu, one page of Quran, one chore). Pray Fajr early; the barakah of the morning defeats laziness.",
  },
  ungrateful: {
    label: "Ungrateful",
    verse: { ar: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", en: "If you are grateful, I will surely increase you [in favour].", ref: "Quran 14:7" },
    dua: { ar: "اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", en: "O Allah, help me to remember You, thank You, and worship You excellently.", ref: "Abu Dawud" },
    action: "Gratitude multiplies provision. List 3 blessings you take for granted (eyesight, breathing, Islam) and say 'Alhamdulillah' 33 times. Give one small sadaqah today — thankfulness is shown with the hands too.",
  },
};


// ------------------------------------------------------------
// Digital tasbih — selectable dhikr phrases (Arabic + meaning)
// ------------------------------------------------------------
export const DHIKR_LIST = [
  { id: "subhan", ar: "سُبْحَانَ اللَّهِ", latin: "SubhanAllah", en: "Glory to Allah" },
  { id: "hamd", ar: "الْحَمْدُ لِلَّهِ", latin: "Alhamdulillah", en: "All praise to Allah" },
  { id: "takbir", ar: "اللَّهُ أَكْبَرُ", latin: "Allahu Akbar", en: "Allah is the Greatest" },
  { id: "tahlil", ar: "لَا إِلَٰهَ إِلَّا اللَّهُ", latin: "La ilaha illallah", en: "There is no god but Allah" },
  { id: "istighfar", ar: "أَسْتَغْفِرُ اللَّهَ", latin: "Astaghfirullah", en: "I seek Allah's forgiveness" },
  { id: "subhan-bihamd", ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", latin: "SubhanAllahi wa bihamdih", en: "Glory to Allah and praise Him" },
  { id: "subhan-azim", ar: "سُبْحَانَ اللَّهِ الْعَظِيمِ", latin: "SubhanAllahil-Adheem", en: "Glory to Allah, the Magnificent" },
  { id: "hawqala", ar: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", latin: "La hawla wa la quwwata", en: "No might or power except with Allah" },
  { id: "hasbunallahu", ar: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", latin: "Hasbunallahu wa ni'mal wakeel", en: "Allah is sufficient for us, the best Disposer" },
  { id: "salawat", ar: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", latin: "Allahumma salli 'ala Muhammad", en: "O Allah send blessings on Muhammad ﷺ" },
  { id: "bismillah", ar: "بِسْمِ اللَّهِ", latin: "Bismillah", en: "In the name of Allah" },
  { id: "rabbighfirli", ar: "رَبِّ اغْفِرْ لِي", latin: "Rabbighfirli", en: "My Lord, forgive me" },
  { id: "alhamd-rabb", ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", latin: "Alhamdulillahi Rabbil-'alamin", en: "Praise to Allah, Lord of the worlds" },
  { id: "wahdahu", ar: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ", latin: "La ilaha illallahu wahdahu", en: "No god but Allah alone, with no partner" },
  { id: "mashallah", ar: "مَا شَاءَ اللَّهُ", latin: "MashaAllah", en: "What Allah wills" },
  { id: "two-phrases", ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ", latin: "SubhanAllahi wa bihamdihi · SubhanAllahil-Adheem", en: "Two phrases light on the tongue, heavy on the scales" },
];

export const BABY_NAMES = [
  { n: "Muhammad", ar: "محمد", m: "The Praised One — the name of the Prophet ﷺ", g: "boy" },
  { n: "Ahmad", ar: "أحمد", m: "Most Praiseworthy, another name of the Prophet ﷺ", g: "boy" },
  { n: "Abdullah", ar: "عبد الله", m: "Servant of Allah — the most beloved of names to Allah", g: "boy" },
  { n: "Abdur-Rahman", ar: "عبد الرحمن", m: "Servant of the Most Merciful", g: "boy" },
  { n: "Ibrahim", ar: "إبراهيم", m: "Father of nations — the Prophet and friend of Allah", g: "boy" },
  { n: "Ismail", ar: "إسماعيل", m: "God hears — Prophet, builder of the Kaaba", g: "boy" },
  { n: "Ishaq", ar: "إسحاق", m: "He will laugh — Prophet, son of Ibrahim", g: "boy" },
  { n: "Yaqub", ar: "يعقوب", m: "Supplanter / holder of the heel — Prophet", g: "boy" },
  { n: "Yusuf", ar: "يوسف", m: "God increases — the Prophet of beauty and patience", g: "boy" },
  { n: "Musa", ar: "موسى", m: "Drawn from the water — the Prophet who spoke to Allah", g: "boy" },
  { n: "Harun", ar: "هارون", m: "Exalted / strong — Prophet and brother of Musa", g: "boy" },
  { n: "Isa", ar: "عيسى", m: "God is salvation — the Messiah, son of Maryam", g: "boy" },
  { n: "Dawud", ar: "داود", m: "Beloved — the Prophet, king and psalmodist", g: "boy" },
  { n: "Sulayman", ar: "سليمان", m: "Peaceful — the Prophet who spoke to birds and jinn", g: "boy" },
  { n: "Zakariyya", ar: "زكريا", m: "God remembers — the Prophet and father of Yahya", g: "boy" },
  { n: "Yahya", ar: "يحيى", m: "God is gracious — the Prophet, first to believe in Isa", g: "boy" },
  { n: "Umar", ar: "عمر", m: "Flourishing, long-lived — the second Caliph", g: "boy" },
  { n: "Ali", ar: "علي", m: "Exalted, noble — cousin and son-in-law of the Prophet ﷺ", g: "boy" },
  { n: "Hamza", ar: "حمزة", m: "Lion — the brave uncle of the Prophet ﷺ", g: "boy" },
  { n: "Bilal", ar: "بلال", m: "Moistening — the first muezzin of Islam", g: "boy" },
  { n: "Khalid", ar: "خالد", m: "Eternal, immortal — the Sword of Allah", g: "boy" },
  { n: "Zayd", ar: "زيد", m: "Growth, abundance — the beloved freed companion", g: "boy" },
  { n: "Anas", ar: "أنس", m: "Friendliness — the young servant of the Prophet ﷺ", g: "boy" },
  { n: "Maryam", ar: "مريم", m: "Beloved, pious — the mother of Prophet Isa, the best of women", g: "girl" },
  { n: "Fatimah", ar: "فاطمة", m: "One who weans — the beloved daughter of the Prophet ﷺ", g: "girl" },
  { n: "Khadijah", ar: "خديجة", m: "Trustworthy, early baby — the first believer and first wife", g: "girl" },
  { n: "Aisha", ar: "عائشة", m: "Living, prosperous — the Mother of the Believers", g: "girl" },
  { n: "Zaynab", ar: "زينب", m: "Beauty of the father — daughter of the Prophet ﷺ", g: "girl" },
  { n: "Ruqayyah", ar: "رقية", m: "Rise, ascent — daughter of the Prophet ﷺ", g: "girl" },
  { n: "Umm Kulthum", ar: "أم كلثوم", m: "Mother of Kulthum — daughter of the Prophet ﷺ", g: "girl" },
  { n: "Hafsah", ar: "حفصة", m: "Gathering — the Mother of the Believers, keeper of the first mushaf", g: "girl" },
  { n: "Asma", ar: "أسماء", m: "Supreme, lofty — daughter of Abu Bakr, 'of the two belts'", g: "girl" },
  { n: "Salma", ar: "سلمى", m: "Safe, peaceful", g: "girl" },
  { n: "Layla", ar: "ليلى", m: "Night — beauty of the night", g: "girl" },
  { n: "Noor", ar: "نور", m: "Light — the light of guidance", g: "girl" },
  { n: "Aya", ar: "آية", m: "Sign, miracle — a verse of the Quran", g: "girl" },
  { n: "Huda", ar: "هدى", m: "Guidance — the divine guidance", g: "girl" },
  { n: "Amina", ar: "آمنة", m: "Trustworthy, secure — the mother of the Prophet ﷺ", g: "girl" },
  { n: "Safiyyah", ar: "صفية", m: "Pure, chosen — the Mother of the Believers", g: "girl" },
  { n: "Sumayyah", ar: "سمية", m: "High, exalted — the first martyr of Islam", g: "girl" },
  { n: "Halimah", ar: "حليمة", m: "Gentle, forbearing — the wet-nurse of the Prophet ﷺ", g: "girl" },
  { n: "Nusaybah", ar: "نسيبة", m: "Noble lineage — the warrior companion of Uhud", g: "girl" },
  { n: "Aliyah", ar: "عالية", m: "Sublime, elevated", g: "girl" },
  { n: "Samira", ar: "سميرة", m: "Entertaining companion", g: "girl" },
  { n: "Rania", ar: "رانية", m: "Gazing, contented", g: "girl" },
  { n: "Malak", ar: "ملاك", m: "Angel", g: "girl"  },

];

export const E_NUMBERS = [
  { c: "E100", n: "Curcumin (turmeric)", s: "halal", d: "Natural yellow colour from the turmeric plant root — clearly permissible." },
  { c: "E101", n: "Riboflavin (Vitamin B2)", s: "mushbooh", d: "Usually synthetic, but may be derived from animal or fermentation sources — verify source." },
  { c: "E102", n: "Tartrazine", s: "halal", d: "Synthetic yellow azo dye — no animal ingredients." },
  { c: "E110", n: "Sunset Yellow FCF", s: "halal", d: "Synthetic orange azo dye — no animal ingredients." },
  { c: "E120", n: "Cochineal / Carmine", s: "haram", d: "Red dye extracted from crushed female cochineal insects — most scholars deem it impure and impermissible." },
  { c: "E140", n: "Chlorophyll", s: "halal", d: "Green colour from plant leaves — permissible." },
  { c: "E150", n: "Caramel colour", s: "halal", d: "Produced by heating sugars — permissible." },
  { c: "E153", n: "Vegetable Carbon", s: "halal", d: "Black colour from charred plant material — permissible." },
  { c: "E160", n: "Carotenes", s: "halal", d: "Orange/red colour from carrots and plants — permissible." },
  { c: "E161", n: "Canthaxanthin", s: "halal", d: "Colour from fungi/bacteria or synthetic — permissible." },
  { c: "E162", n: "Beetroot Red / Betanin", s: "halal", d: "Natural red from beetroot — permissible." },
  { c: "E171", n: "Titanium Dioxide", s: "mushbooh", d: "Mineral whitener; banned as a food additive in the EU since 2022 — avoid where possible." },
  { c: "E200", n: "Sorbic acid", s: "halal", d: "Synthetic preservative — permissible." },
  { c: "E210", n: "Benzoic acid", s: "halal", d: "Synthetic preservative — permissible." },
  { c: "E211", n: "Sodium benzoate", s: "halal", d: "Synthetic preservative — permissible." },
  { c: "E220", n: "Sulphur dioxide", s: "halal", d: "Preservative and antioxidant — permissible." },
  { c: "E270", n: "Lactic acid", s: "halal", d: "Usually produced by fermentation of carbohydrates — permissible (verify non-animal source)." },
  { c: "E280", n: "Propionic acid", s: "halal", d: "Synthetic preservative — permissible." },
  { c: "E290", n: "Carbon dioxide", s: "halal", d: "Gas used in carbonated drinks — clearly permissible." },
  { c: "E300", n: "Ascorbic acid (Vitamin C)", s: "halal", d: "Synthetic vitamin — permissible." },
  { c: "E306", n: "Tocopherols (Vitamin E)", s: "mushbooh", d: "Usually from vegetable oil, but can be animal-derived — verify source." },
  { c: "E322", n: "Lecithin", s: "mushbooh", d: "Usually from soya (halal) or egg yolk (halal), but occasionally animal-derived — check label source." },
  { c: "E325", n: "Sodium lactate", s: "halal", d: "Salt of lactic acid — permissible." },
  { c: "E330", n: "Citric acid", s: "halal", d: "From citrus fruit or fermentation — clearly permissible." },
  { c: "E400", n: "Alginic acid", s: "halal", d: "From brown seaweed — permissible." },
  { c: "E406", n: "Agar", s: "halal", d: "Gelling agent from seaweed — permissible." },
  { c: "E407", n: "Carrageenan", s: "halal", d: "Thickener from red seaweed — permissible." },
  { c: "E410", n: "Locust bean gum", s: "halal", d: "From carob seeds — permissible." },
  { c: "E414", n: "Gum arabic", s: "halal", d: "Natural gum from acacia trees — permissible." },
  { c: "E420", n: "Sorbitol", s: "halal", d: "Synthetic sweetener — permissible." },
  { c: "E440", n: "Pectin", s: "halal", d: "From fruit peel — permissible." },
  { c: "E441", n: "Gelatine", s: "haram", d: "Usually from pork or non-halal beef bones — impermissible unless certified halal bovine." },
  { c: "E450", n: "Diphosphates", s: "halal", d: "Mineral raising agents — permissible." },
  { c: "E460", n: "Cellulose", s: "halal", d: "Plant fibre — permissible." },
  { c: "E466", n: "Carboxymethyl cellulose (CMC)", s: "halal", d: "Synthetic thickener from plant cellulose — permissible." },
  { c: "E471", n: "Mono- & diglycerides of fatty acids", s: "mushbooh", d: "Emulsifier whose fat source is not stated — could be animal fat; verify halal certification." },
  { c: "E472", n: "Fatty acid esters", s: "mushbooh", d: "Like E471, derived from fats of unknown origin — check certification." },
  { c: "E473", n: "Sucrose esters of fatty acids", s: "mushbooh", d: "Emulsifier from fatty acids — source unknown; verify." },
  { c: "E476", n: "Polyglycerol polyricinoleate (PGPR)", s: "mushbooh", d: "Emulsifier used in chocolate — fat source unstated; check halal certification." },
  { c: "E481", n: "Sodium stearoyl lactylate", s: "mushbooh", d: "Emulsifier from lactic acid and fatty acids — verify source." },
  { c: "E500", n: "Sodium carbonates", s: "halal", d: "Mineral raising agents — permissible." },
  { c: "E621", n: "Monosodium glutamate (MSG)", s: "halal", d: "Flavour enhancer, usually fermented from starch — permissible." },
  { c: "E627", n: "Disodium guanylate", s: "mushbooh", d: "Flavour enhancer, often derived from fish or meat — verify source." },
  { c: "E631", n: "Disodium inosinate", s: "mushbooh", d: "Flavour enhancer, commonly derived from fish or meat — verify source." },
  { c: "E635", n: "Ribonucleotides", s: "mushbooh", d: "Flavour enhancer that may combine E627/E631 — verify source." },
  { c: "E901", n: "Beeswax", s: "halal", d: "Glazing agent from honey bees — permissible (most scholars)." },
  { c: "E904", n: "Shellac", s: "haram", d: "Glazing agent secreted by the lac insect — impermissible per most scholars." },
  { c: "E920", n: "L-Cysteine", s: "mushbooh", d: "Often derived from human hair or duck feathers — avoid unless certified synthetic/plant source." },
  { c: "E951", n: "Aspartame", s: "halal", d: "Synthetic sweetener — permissible." },
  { c: "E1200", n: "Polydextrose", s: "halal", d: "Synthetic bulking fibre — permissible."  },

];

export const QUIZ_QUESTIONS = [
  { q: "How many pillars of Islam are there?", opts: ["3", "4", "5", "6"], a: 2, info: "The five pillars: Shahadah, Salah, Zakat, Sawm (fasting) and Hajj." },
  { q: "Which angel brought the revelation of the Quran to Prophet Muhammad ﷺ?", opts: ["Mika'il", "Jibril (Gabriel)", "Israfil", "Malik"], a: 1, info: "Angel Jibril brought the first words of the Quran in the cave of Hira." },
  { q: "In which month do Muslims fast?", opts: ["Shawwal", "Muharram", "Ramadan", "Rajab"], a: 2, info: "Fasting in Ramadan is the fourth pillar of Islam." },
  { q: "What do we say before we start eating?", opts: ["Alhamdulillah", "Bismillah", "Assalamu alaykum", "SubhanAllah"], a: 1, info: "We say 'Bismillah' (in the name of Allah) before eating." },
  { q: "How many obligatory prayers are there every day?", opts: ["3", "5", "7", "10"], a: 1, info: "Fajr, Dhuhr, Asr, Maghrib and Isha — five daily prayers." },
  { q: "Which Prophet built the Kaaba together with his son Ismail?", opts: ["Musa", "Ibrahim", "Nuh", "Yusuf"], a: 1, info: "Prophet Ibrahim and his son Ismail raised the foundations of the Kaaba." },
  { q: "Which holy book was revealed to Prophet Musa (Moses)?", opts: ["The Tawrah (Torah)", "The Zabur", "The Injil", "The Quran"], a: 0, info: "The Tawrah was revealed to Prophet Musa, peace be upon him." },
  { q: "Which direction do Muslims face when they pray?", opts: ["The east", "The Qibla — the Kaaba in Makkah", "Jerusalem only", "The nearest mountain"], a: 1, info: "Muslims pray towards the Kaaba in Makkah — the Qibla." },
  { q: "What is the obligatory charity on wealth called?", opts: ["Sadaqah", "Zakat", "Fitrah only", "Riba"], a: 1, info: "Zakat is the third pillar — 2.5% of qualifying wealth given yearly." },
  { q: "Who was known as 'As-Siddiq' (the Truthful)?", opts: ["Umar ibn al-Khattab", "Abu Bakr", "Bilal", "Khalid"], a: 1, info: "Abu Bakr was the first to believe the Prophet ﷺ and was called As-Siddiq." },
  { q: "Which Prophet was thrown into the fire and saved by Allah?", opts: ["Yunus", "Ibrahim", "Ayub", "Shu'ayb"], a: 1, info: "Allah commanded the fire to be cool and safe for Prophet Ibrahim (21:69)." },
  { q: "What is the Night of Power (Laylat al-Qadr) better than?", opts: ["A thousand months", "A hundred days", "Ten years", "One year"], a: 0, info: "'The Night of Decree is better than a thousand months' (97:3)."  },

];

export const STUDIES = [
  {
    id: "f1", cat: "fiqh", title: "Purification & Wudu",
    ar: "الطَّهَارَة", intro: "Purity (taharah) is half of faith. Allah says: 'Indeed, Allah loves those who are constantly repentant and loves those who purify themselves.' (2:222).",
    sections: [
      { h: "Why purity matters", t: ["The Prophet ﷺ said: 'Purity is half of faith' (Muslim). Salah is only accepted in a state of purity, so wudu is the key that opens the door to every prayer. Purification trains the believer to approach Allah with cleanliness of body, clothing, place and intention."] },
      { h: "The steps of wudu", t: ["1. Make the intention in the heart and say 'Bismillah'. 2. Wash the hands three times. 3. Rinse the mouth and sniff water into the nose three times each. 4. Wash the face three times. 5. Wash the arms up to the elbows, right first, three times. 6. Wipe the head and the ears once. 7. Wash the feet up to the ankles, right first, three times.", "After finishing, recite: 'Ash-hadu an la ilaha illallah wahdahu la sharika lah, wa ash-hadu anna Muhammadan 'abduhu wa rasuluh' — the gates of Paradise open for the one who says it (Muslim)."] },
      { h: "What breaks wudu", t: ["Passing urine, stool or wind; deep sleep that overcomes awareness; loss of consciousness; and touching the private parts directly with the bare hand (a scholarly view). Eating camel meat breaks wudu in the Hanbali school; the majority view differs, so follow your madhhab's guidance."] },
      { h: "Tayammum — dry ablution", t: ["When no water is available, or using water would harm the sick, Allah grants an easy substitute: strike clean earth with the hands, wipe the face, then wipe the hands. It is a mercy that keeps the Muslim connected to prayer in any situation."] },
      { h: "Ghusl — the full bath", t: ["Ghusl becomes obligatory after sexual impurity, menses and post-natal bleeding. It is strongly recommended before Friday prayer, the two Eids and when entering ihram for Hajj or Umrah."] },
    ],
  },
  {
    id: "f2", cat: "fiqh", title: "Salah — The Five Daily Prayers",
    ar: "الصَّلَاة", intro: "Salah is the second pillar of Islam and the first deed a servant will be asked about on the Day of Judgement. It was prescribed directly by Allah — a gift given to the Prophet ﷺ during the night journey.",
    sections: [
      { h: "The five prayers", t: ["Fajr (2 rak'ahs, before sunrise), Dhuhr (4, after noon), Asr (4, mid-afternoon), Maghrib (3, after sunset) and Isha (4, after nightfall). Each has a beginning and end time — pray them within their windows to catch the reward."] },
      { h: "Conditions before prayer", t: ["Islam and sanity; reaching the age of discernment; ritual purity; covering the awrah; facing the Qibla; and knowing that the time has entered. If any is missing, the prayer is not valid."] },
      { h: "Pillars of the prayer", t: ["Standing (if physically able), the opening Takbir, reciting Surah Al-Fatihah in every rak'ah, bowing (ruku') with tranquility, rising from it, prostrating (sujud) twice with tranquility, sitting between them, the final tashahhud, and ending with the salam."] },
      { h: "Presence of heart", t: ["The Prophet ﷺ said: 'Worship Allah as if you see Him, for though you do not see Him, He certainly sees you.' Slow the recitation, keep the gaze on the place of sujud, and do not fidget — a humble prayer lifts the soul for the whole day."] },
      { h: "Congregation & Friday", t: ["Praying in congregation is 27 times greater in reward than praying alone. For men, Friday (Jumu'ah) prayer replaces Dhuhr — it is the weekly gathering of the community, preceded by a sermon (khutbah)."] },
    ],
  },
  {
    id: "f3", cat: "fiqh", title: "Fasting & Zakat",
    ar: "الصَّوْم وَالزَّكَاة", intro: "Fasting and Zakat are the third and fourth pillars — one trains the body in obedience, the other purifies wealth and heart.",
    sections: [
      { h: "Fasting in Ramadan", t: ["Allah says: 'O you who believe, fasting has been prescribed for you as it was prescribed for those before you, that you may attain taqwa.' (2:183). Fast from true dawn to sunset with the intention made the night before. Take the pre-dawn meal (suhur) — it is blessed — and break the fast promptly at maghrib."] },
      { h: "Who is exempt", t: ["The traveller and the sick may break the fast and make up the days later. The elderly and the chronically ill pay fidyah (feeding a poor person per day). Pregnant and nursing mothers follow their scholars' guidance. Children are not obliged until puberty, but may practice."] },
      { h: "Zakat on wealth", t: ["Zakat is due on qualifying wealth (cash, gold & silver, trade goods, business inventory, and investments) that reaches the nisab — roughly the value of 85g of gold or 595g of silver — and is held for one lunar year. The rate is 2.5%."] },
      { h: "Who receives zakat", t: ["Allah names eight categories in Surah At-Tawbah (9:60): the poor, the needy, zakat administrators, those whose hearts are to be reconciled, captives and debtors, those in the path of Allah, and the stranded traveller. Zakat purifies the wealth that remains."] },
      { h: "Voluntary fasts", t: ["The Prophet ﷺ fasted Mondays and Thursdays, the three 'white days' of each lunar month (13th, 14th, 15th), the day of Arafah, the day of Ashura, and encouraged six days of Shawwal after Ramadan."] },
    ],
  },
  {
    id: "s1", cat: "seerah", title: "The Early Life of the Prophet ﷺ",
    ar: "السِّيرَة", intro: "Muhammad ibn Abdullah ﷺ was born in Makkah in the Year of the Elephant (about 570 CE) — the same year the army of Abraha was destroyed by Allah's miracle.",
    sections: [
      { h: "An orphan raised by Allah", t: ["His father Abdullah died before his birth; his mother Aminah died when he was six; his grandfather Abdul-Muttalib cared for him, and after his death, his uncle Abu Talib. From boyhood he shepherded sheep — work that taught him patience and solitude."] },
      { h: "Al-Amin — the trustworthy", t: ["Even before prophethood, the Makkans called him 'Al-Amin' (the trustworthy). He traded with the caravans for the noble widow Khadijah, whose honesty and character led her to propose marriage. He was 25; she was 40. She became his wife, his comfort and the first believer in his message."] },
      { h: "The cave of Hira", t: ["At forty, he withdrew to the cave of Hira for reflection. There, angel Jibril seized him and commanded: 'Iqra — Recite!' The first verses of Surah Al-Alaq descended (96:1-5). Trembling, he ran home: 'Cover me, cover me!' Khadijah reassured him: 'By Allah, Allah will never disgrace you — you join ties of kinship, carry the burden of the weak and help the needy.'"] },
      { h: "The first believers", t: ["Khadijah believed first, then his freed slave Zayd, his young cousin Ali, and his closest friend Abu Bakr. For three years the call remained secret among those closest to him — the seeds of the greatest movement in history."] },
    ],
  },
  {
    id: "s2", cat: "seerah", title: "The Makkan Period (13 Years of Patience)",
    ar: "فَتْرَةُ مَكَّة", intro: "For thirteen years in Makkah the Prophet ﷺ endured persecution with mercy, never once cursing his people — and never once abandoning the call to tawheed.",
    sections: [
      { h: "From secret to open call", t: ["After three years of quiet invitation, Allah commanded: 'And warn your nearest kindred' (26:214). The Prophet ﷺ climbed Mount Safa and called the Quraysh — the open invitation to Islam began. The poor and the weak believed: Bilal, Ammar, Khabbab and Sumayyah, the first martyr of Islam."] },
      { h: "Persecution & the migration to Abyssinia", t: ["The Quraysh tortured the weak believers under the burning sun, pressing stones on their chests. The Prophet ﷺ sent two groups of companions to Abyssinia, the land of the just Christian king Negus, who protected them against Quraysh intrigue."] },
      { h: "The boycott of Banu Hashim", t: ["The Quraysh signed a written pact to socially and economically boycott the Prophet's clan for three years in the mountain valley of Shi'b Abi Talib. They ate leaves to survive, yet the Prophet ﷺ never wavered. Then came the 'Year of Sorrow': Khadijah and his protector Abu Talib both died."] },
      { h: "The night journey & ascension", t: ["In this darkest hour Allah honoured him: the Isra — travelling by night from Makkah to Jerusalem in one journey — and the Mi'raj, ascending through the heavens where the five daily prayers were prescribed and he met the earlier prophets. It was a gift of comfort and the final pillar of the Makkan period."] },
      { h: "The pledge of Aqabah", t: ["At the annual fairs, the Prophet ﷺ presented Islam to the pilgrims. Men from Yathrib (Madinah) believed, took the pledge of Aqabah, and invited him to their city — the door to the Hijrah opened."] },
    ],
  },
  {
    id: "s3", cat: "seerah", title: "The Madinan Period & the Farewell",
    ar: "فَتْرَةُ الْمَدِينَة", intro: "In 622 CE the Prophet ﷺ migrated to Madinah — the Hijrah — and the Islamic calendar began. From a persecuted minority grew a society governed by the Quran.",
    sections: [
      { h: "Building the first community", t: ["The Prophet ﷺ built the Masjid an-Nabawi, paired every Muhajir (migrant) with an Ansari (helper) brother in a bond of brotherhood, and wrote the Constitution of Madinah — uniting Muslims, Jews and tribes in one state under justice."] },
      { h: "The great battles", t: ["At Badr (2 AH) 313 ill-equipped believers defeated a force three times their size. At Uhud (3 AH) the Muslims suffered a painful setback when archers left their post. At the Trench (5 AH) Madinah survived a month-long siege. Each battle taught lessons of unity, obedience and reliance on Allah."] },
      { h: "Treaty of Hudaybiyyah & the conquest", t: ["The Treaty of Hudaybiyyah (6 AH) seemed a loss but Allah called it a 'clear victory' — it opened ten peaceful years of da'wah. Letters went to the kings of Persia, Rome and Abyssinia. In 8 AH Makkah was opened without a battle; the Prophet ﷺ asked: 'What do you expect me to do with you?' — 'You are our noble brother,' they said. 'Go, for you are free.'"] },
      { h: "The farewell sermon", t: ["In his final Hajj (10 AH) at Arafat he addressed over 100,000 pilgrims: 'All mankind is from Adam — an Arab has no superiority over a non-Arab, nor a white over a black, except by taqwa. I leave among you two things — the Book of Allah and my Sunnah — you will never go astray if you hold fast to them.' He ﷺ passed away in Madinah in 11 AH at the age of 63, having completed the religion."] },
    ],
  },
  {
    id: "a1", cat: "aqeedah", title: "Tawheed — The Oneness of Allah",
    ar: "التَّوْحِيد", intro: "Tawheed — singling out Allah alone in worship — is the very reason we exist. Allah says: 'I did not create the jinn and mankind except to worship Me.' (51:56).",
    sections: [
      { h: "The heart of the faith", t: ["The testimony of faith — 'La ilaha illallah' (there is no god but Allah) — is the first pillar of Islam and the essence of every prophet's message from Adam to Muhammad ﷺ: worship Allah alone and avoid false gods."] },
      { h: "Tawheed ar-Rububiyyah — His Lordship", t: ["To affirm that Allah alone creates, provides, gives life and death, and manages all affairs. He is the Lord of the worlds with no partner in His dominion."] },
      { h: "Tawheed al-Uluhiyyah — His Worship", t: ["To direct all acts of worship — prayer, du'a, sacrifice, hope, fear and love — to Allah alone. This is the core of 'La ilaha illallah'. Allah does not forgive shirk (associating partners with Him) unless one repents (4:48)."] },
      { h: "Tawheed al-Asma' wa Sifat — His Names & Attributes", t: ["To affirm the beautiful names and perfect attributes Allah describes Himself with, without distorting them, denying them, asking 'how', or comparing them to creation: 'There is nothing like unto Him, and He is the All-Hearing, the All-Seeing.' (42:11)"] },
      { h: "Protecting tawheed", t: ["Learn the names of Allah and call upon Him by them. Avoid all forms of shirk — big (worshipping other than Allah) and small (riya': showing off deeds for people). Sincerity (ikhlas) in every action is the fruit of tawheed."] },
    ],
  },
  {
    id: "a2", cat: "aqeedah", title: "Belief in Angels & the Books",
    ar: "الْمَلَائِكَة وَالْكُتُب", intro: "Belief in the angels and the revealed books are two of the six pillars of iman: 'The Messenger believes in what was revealed to him from his Lord, and so do the believers — each believes in Allah, His angels, His books and His messengers.' (2:285)",
    sections: [
      { h: "The angels", t: ["Angels are honoured creation made of light. They never disobey Allah and carry out His commands tirelessly. We believe in them as real beings, even though we cannot see them."] },
      { h: "Known angels & their duties", t: ["Jibril — brings revelation to the prophets; Mika'il — in charge of provision and rain; Israfil — will blow the Trumpet on the Day of Judgement; Malak al-Mawt — takes the souls; Munkar and Nakir — question in the grave; Kiraman Katibin — the noble recorders who write every deed; Ridwan — keeper of Paradise; Malik — keeper of Hell."] },
      { h: "The revealed books", t: ["The Tawrah (Torah) to Musa, the Zabur (Psalms) to Dawud, the Injil (Gospel) to Isa, and the Quran to Muhammad ﷺ. We believe in the originals as revelation from Allah; the previous scriptures have been altered over time, while the Quran — revealed over 23 years — remains perfectly preserved by Allah's promise: 'Indeed, We sent down the Reminder, and indeed We will preserve it.' (15:9)"] },
      { h: "The Quran — the final book", t: ["The Quran is the speech of Allah, not created. It abrogates and confirms what came before it, and it is the final guidance until the end of time. Reciting it is worship; acting upon it is the way of the believers."] },
    ],
  },
  {
    id: "a3", cat: "aqeedah", title: "Prophets & The Last Day",
    ar: "الرُّسُل وَالْيَوْمُ الْآخِر", intro: "We believe in all the prophets and messengers of Allah, and in the Last Day — when every soul will be recompensed for what it earned. These are two pillars of the six pillars of iman.",
    sections: [
      { h: "The prophets", t: ["Allah sent a prophet to every nation; twenty-five are named in the Quran, beginning with Adam and ending with Muhammad ﷺ, the seal of the prophets. Their message was one: worship Allah alone. We do not distinguish between them in belief, and we send salutations upon them all."] },
      { h: "The greatest messengers", t: ["The five 'Ulul-Azm' (messengers of firm resolve): Nuh, Ibrahim, Musa, Isa and Muhammad ﷺ. Between Musa and Isa, Allah sent many prophets to the Children of Israel. Every prophet was protected from major sin and confirmed by miracles — the Quran is the greatest miracle, a living proof until the Hour."] },
      { h: "Death & the grave", t: ["Death is certain and its time is written. In the grave (barzakh) the soul is questioned by Munkar and Nakir about its Lord, religion and prophet. The believer answers with firmness and light; the denier faces darkness and constriction."] },
      { h: "The signs of the Hour", t: ["Minor signs have appeared — the sending of the Prophet ﷺ is itself the first sign, along with the spread of ignorance, time passing quickly, and widespread afflictions. Major signs include the Dajjal, the descent of Isa, the appearance of Gog and Magog, the rising of the sun from the west, and the final Trumpet."] },
      { h: "Resurrection & recompense", t: ["Allah will resurrect all of creation, gather them on one plain, and set up the scales (mizan) and the bridge (sirat). Every deed — even a mustard seed's weight — will be weighed. The believers cross to Paradise, the gardens of eternal bliss; the disbelievers are driven to the Fire. The greatest gift is seeing Allah's Face — the joy that no eye has seen, no ear has heard, and no heart has imagined."] },
    ],
  },
    {
    id: "f4", cat: "fiqh", title: "Hajj & Umrah — The Pilgrimage",
    ar: "الْحَجُّ وَالْعُمْرَة", intro: "Hajj is the fifth pillar of Islam — a once-in-a-lifetime journey to the House of Allah in Makkah, obligatory upon every able Muslim. It is the greatest gathering of the Ummah on earth.",
    sections: [
      { h: "The obligation", t: ["Allah says: 'And [due] to Allah from the people is a pilgrimage to the House — for whoever is able to find a way to it' (3:97). Hajj is due once in a lifetime for the adult Muslim of sound mind who has the physical ability and lawful means to travel. It wipes away sins: 'Whoever performs Hajj and does not commit obscenity nor wickedness shall return like the day his mother bore him' (Bukhari)."] },
      { h: "The state of ihram", t: ["Before entering Makkah the pilgrim enters ihram at the appointed stations (miqat): two white seamless cloths for men, modest clothing for women, with the intention and the talbiyah: 'Labbaik Allahumma labbaik, labbaika la sharika laka labbaik; innal-hamda wan-ni'mata laka wal-mulk, la sharika lak.' In ihram, hunting, cutting hair and nails, wearing perfume, and marital relations are forbidden."] },
      { h: "The rites of Hajj", t: ["On the 8th of Dhul-Hijjah the pilgrim heads to Mina; on the 9th, the Day of Arafah — the greatest day of the year — standing in du'a until sunset; then to Muzdalifah for the night; then to Mina for the stoning of the Jamarat, the sacrifice (hady), and the shaving/trimming of hair; then tawaf al-Ifadah around the Kaaba, sa'i between Safa and Marwah, and the farewell tawaf before leaving."] },
      { h: "Umrah & its rewards", t: ["Umrah is the lesser pilgrimage, performed at any time of the year. Its rites are ihram, tawaf, sa'i, and shaving/trimming. The Prophet ﷺ said: 'One Umrah expiates the sins between it and the next' (Bukhari & Muslim). Between Hajj and Umrah, the believer fills the year with visits to the Sacred House."] },
      { h: "Lessons of the pilgrimage", t: ["Hajj is a living image of the Day of Judgment: millions in identical white, no distinction of race or rank — all standing before Allah. It humbles the soul, renews tawheed, and returns the pilgrim home forgiven and reborn. 'And proclaim the pilgrimage among the people — they will come to you on foot and on every lean camel' (22:27)."] },
    ],
  },
  {
    id: "s4", cat: "seerah", title: "The Hijrah — Migration to Madinah",
    ar: "الْهِجْرَة", intro: "The Hijrah — the Prophet's ﷺ migration from Makkah to Madinah — is the turning point of Islamic history, the event from which the Islamic calendar begins. It transformed a persecuted community into the foundation of a state.",
    sections: [
      { h: "Why they left", t: ["For thirteen years the Muslims of Makkah endured boycott, persecution and the loss of their beloved ones. After the death of his uncle Abu Talib and his wife Khadijah — the 'year of sorrow' — the Prophet ﷺ sought a new home. People of Yathrib (Madinah) embraced Islam and invited him, pledging to protect him as their own."] },
      { h: "The cave of Thawr", t: ["The Quraysh plotted to kill the Prophet ﷺ on the night of his departure, but Ali slept in his bed as a decoy while the Prophet ﷺ and Abu Bakr hid in the Cave of Thawr for three days. Their pursuers stood at the cave's mouth; Abu Bakr feared for his companion, and the Prophet ﷺ comforted him: 'Do not grieve — indeed Allah is with us' (9:40). A spider's web and a bird's nest concealed them, and Allah protected them."] },
      { h: "Arrival in Madinah", t: ["After a journey of about ten days, the Prophet ﷺ arrived in Quba, where he built the first mosque of Islam, then entered Madinah. Every clan wanted the honour of hosting him; he let his she-camel Qaswa choose, and she knelt at the land of the Banu Najjar, where the Prophet's Mosque was built. The people of Madinah sang: 'The full moon has risen upon us…' — a greeting of joy that still echoes today."] },
      { h: "Brotherhood & the new society", t: ["The Prophet ﷺ paired every Muhajir (migrant) with an Ansari (helper) in bonds of brotherhood, sharing homes and wealth. He made the adhan a call to prayer, established the mosque as the centre of worship and community, and drew up the Constitution of Madinah uniting Muslims and Jews in one society. The Masjid an-Nabawi became the heart of the new state."] },
      { h: "Lessons of the Hijrah", t: ["The Hijrah teaches sacrifice for faith, complete trust in Allah, and the strength of community. Umar, may Allah be pleased with him, began the Islamic calendar with this event — a reminder that migration is not defeat but a beginning: when one door closes, Allah opens another."] },
    ],
  },
];



// ------------------------------------------------------------
// Duas library — 30 authentic supplications for daily life
// cat: morning / evening / sleep / waking / eating / home /
//      mosque / travel / hardship / forgiveness / general
// ------------------------------------------------------------
export const DUAS_LIBRARY = [
  { id: "d1", cat: "morning", title: "Morning arrival du'a", ar: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ", latin: "Asbahna wa asbahal-mulku lillah", en: "We have reached the morning and the dominion belongs to Allah.", src: "Muslim" },
  { id: "d2", cat: "morning", title: "Morning trust du'a", ar: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ", latin: "Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan-nushur", en: "O Allah, by You we reach the morning and by You we reach the evening; by You we live and by You we die, and to You is the resurrection.", src: "Tirmidhi" },
  { id: "d3", cat: "morning", title: "Health & well-being du'a", ar: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي", latin: "Allahumma 'afini fi badani, Allahumma 'afini fi sam'i, Allahumma 'afini fi basari", en: "O Allah, grant my body health; O Allah, grant my hearing health; O Allah, grant my sight health.", src: "Abu Dawud" },
  { id: "d4", cat: "evening", title: "Evening arrival du'a", ar: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ", latin: "Amsayna wa amsal-mulku lillah", en: "We have reached the evening and the dominion belongs to Allah.", src: "Muslim" },
  { id: "d5", cat: "evening", title: "Refuge in Allah's perfect words", ar: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", latin: "A'udhu bikalimatillahit-tammati min sharri ma khalaq", en: "I seek refuge in the perfect words of Allah from the evil of what He has created.", src: "Muslim" },
  { id: "d6", cat: "evening", title: "Protection from punishment", ar: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", latin: "Allahumma qini 'adhabaka yawma tab'athu 'ibadak", en: "O Allah, protect me from Your punishment on the Day You resurrect Your servants.", src: "Muslim" },
  { id: "d7", cat: "sleep", title: "Du'a before sleeping", ar: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", latin: "Bismika Allahumma amutu wa ahya", en: "In Your name, O Allah, I die and I live.", src: "Bukhari" },
  { id: "d8", cat: "sleep", title: "Protection of faith at night", ar: "اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ وَفَوَّضْتُ أَمْرِي إِلَيْكَ وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ", latin: "Allahumma aslamtu nafsi ilayka wa fawwadtu amri ilayka wa alja'tu dhahri ilayka", en: "O Allah, I submit my soul to You, entrust my affair to You, and lean my back upon You.", src: "Bukhari & Muslim" },
  { id: "d9", cat: "waking", title: "Du'a upon waking", ar: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", latin: "Alhamdulillahilladhi ahyana ba'da ma amatana wa ilayhin-nushur", en: "Praise be to Allah who gave us life after death, and to Him is the resurrection.", src: "Bukhari" },
  { id: "d10", cat: "eating", title: "Du'a before eating", ar: "بِسْمِ اللَّهِ", latin: "Bismillah", en: "In the name of Allah. If you forget, say: Bismillahi awwalahu wa akhirahu.", src: "Bukhari & Muslim" },
  { id: "d11", cat: "eating", title: "Du'a after eating", ar: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ", latin: "Alhamdulillahilladhi at'amana wa saqana wa ja'alana muslimin", en: "Praise be to Allah who fed us, gave us drink, and made us Muslims.", src: "Abu Dawud & Tirmidhi" },
  { id: "d12", cat: "home", title: "Du'a when leaving home", ar: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", latin: "Bismillahi tawakkaltu 'alallah wa la hawla wa la quwwata illa billah", en: "In the name of Allah I place my trust in Allah; there is no might nor power except with Allah.", src: "Abu Dawud & Tirmidhi" },
  { id: "d13", cat: "home", title: "Du'a when entering home", ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا", latin: "Allahumma inni as'aluka khayral-mawliji wa khayral-makhraji; bismillahi walajna wa bismillahi kharajna", en: "O Allah, I ask You for the best of entering and the best of leaving; in Allah's name we enter and in His name we leave.", src: "Abu Dawud" },
  { id: "d14", cat: "home", title: "Du'a when entering the toilet", ar: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ", latin: "Allahumma inni a'udhu bika minal-khubuthi wal-khaba'ith", en: "O Allah, I seek refuge in You from male and female evil spirits.", src: "Bukhari & Muslim" },
  { id: "d15", cat: "mosque", title: "Du'a when entering the mosque", ar: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", latin: "Allahummaftah li abwaba rahmatik", en: "O Allah, open for me the gates of Your mercy.", src: "Muslim" },
  { id: "d16", cat: "mosque", title: "Du'a when leaving the mosque", ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", latin: "Allahumma inni as'aluka min fadlik", en: "O Allah, I ask You of Your bounty.", src: "Muslim" },
  { id: "d17", cat: "travel", title: "Du'a for travel", ar: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ", latin: "Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin wa inna ila Rabbina lamunqalibun", en: "Glory to Him who has subjected this to us, though we were unable to do it ourselves, and to our Lord we shall return.", src: "Muslim" },
  { id: "d18", cat: "travel", title: "Du'a of the traveller", ar: "اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ", latin: "Allahumma hawwin 'alayna safarana hadha watwi 'anna bu'dah", en: "O Allah, make this journey easy for us and fold up its distance for us.", src: "Muslim" },
  { id: "d19", cat: "hardship", title: "Sufficiency in hardship", ar: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", latin: "Hasbunallahu wa ni'mal-wakeel", en: "Allah is sufficient for us, and He is the best Disposer of affairs.", src: "Quran 3:173" },
  { id: "d20", cat: "hardship", title: "The du'a of Yunus (in distress)", ar: "لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", latin: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin", en: "There is no god but You; glory be to You; indeed I was of the wrongdoers.", src: "Quran 21:87" },
  { id: "d21", cat: "hardship", title: "Refuge from anxiety & sorrow", ar: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ", latin: "Allahumma inni a'udhu bika minal-hammi wal-hazan wal-'ajzi wal-kasal", en: "O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness.", src: "Bukhari" },
  { id: "d22", cat: "forgiveness", title: "Sayyid al-Istighfar (master supplication)", ar: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ", latin: "Allahumma anta Rabbi la ilaha illa anta khalaqtani wa ana 'abduka wa ana 'ala 'ahdika wa wa'dika mastata't", en: "O Allah, You are my Lord; there is no god but You; You created me and I am Your servant, and I abide by Your covenant as much as I am able.", src: "Bukhari" },
  { id: "d23", cat: "forgiveness", title: "Seeking forgiveness", ar: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ", latin: "Rabbighfir li wa tub 'alayya innaka antat-tawwabur-rahim", en: "My Lord, forgive me and accept my repentance; indeed You are the Acceptor of Repentance, the Most Merciful.", src: "Abu Dawud & Tirmidhi" },
  { id: "d24", cat: "forgiveness", title: "Du'a of Adam (first sin & repentance)", ar: "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ", latin: "Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khasirin", en: "Our Lord, we have wronged ourselves; if You do not forgive us and have mercy upon us, we will surely be among the losers.", src: "Quran 7:23" },
  { id: "d25", cat: "general", title: "Du'a for parents", ar: "رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا", latin: "Rabbirhamhuma kama rabbayani saghira", en: "My Lord, have mercy upon them as they brought me up when I was small.", src: "Quran 17:24" },
  { id: "d26", cat: "general", title: "Good in this world & the Hereafter", ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", latin: "Rabbana atina fid-dunya hasanah wa fil-akhirati hasanah wa qina 'adhaban-nar", en: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.", src: "Quran 2:201" },
  { id: "d27", cat: "general", title: "Du'a for knowledge", ar: "رَبِّ زِدْنِي عِلْمًا", latin: "Rabbi zidni 'ilma", en: "My Lord, increase me in knowledge.", src: "Quran 20:114" },
  { id: "d28", cat: "general", title: "Du'a for remembrance & gratitude", ar: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", latin: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik", en: "O Allah, help me to remember You, thank You, and worship You in the best manner.", src: "Abu Dawud" },
  { id: "d29", cat: "general", title: "Du'a for guidance (Istikhara)", ar: "اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ", latin: "Allahumma inni astakhiruka bi 'ilmika wa astaqdiruka bi qudratik", en: "O Allah, I seek Your guidance through Your knowledge and seek Your power through Your ability.", src: "Bukhari" },
  { id: "d30", cat: "general", title: "Du'a for well-being", ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ", latin: "Allahumma inni as'alukal-'afiyah fid-dunya wal-akhirah", en: "O Allah, I ask You for well-being in this world and the Hereafter.", src: "Abu Dawud" },
];
