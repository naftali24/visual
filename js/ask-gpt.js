(() => {
  const link = document.getElementById("ask-gpt");
  if (!link) return;
  const languages = {
    en:"English", he:"Hebrew", ar:"Arabic", es:"Spanish", fr:"French",
    de:"German", ru:"Russian", it:"Italian", pt:"Portuguese"
  };
  let language = new URLSearchParams(location.search).get("lang");
  if (!language) {
    try { language = localStorage.getItem("visualLanguage"); } catch {}
  }
  if (!Object.hasOwn(languages, language)) language = "he";
  if (language === "he") link.setAttribute("aria-label", "שאל את ChatGPT");

  function updateLink() {
    const organ = document.querySelector('[aria-pressed="true"] [lang="en"]')?.textContent.trim();
    let prompt;
    if (link.dataset.category === "history") {
      prompt = language === "he"
        ? ["אני לומד מתוך ספר ויזואלי של נפתלי.",
           "הסבר בעברית פשוטה על " + link.dataset.topicHe + ". הצג את תפקיד נשיא המדינה ואת ההקשר ההיסטורי.",
           organ ? "הנשיא שבחרתי, שהכפתור שלו מואר: " + organ + ". התמקד גם בביוגרפיה שלו, בשנות כהונתו, בפועלו ובאירועים מרכזיים בתקופתו." : "",
           "הוסף 4–6 עובדות מעניינות, מפתיעות או פיקנטיות שאפשר לאמת. בדוק מקורות אמינים ועדכניים, צרף קישורים, ציין תאריך והבחן בין עובדות לפרשנות. אל תמציא פרטים חסרים."].filter(Boolean).join("\n\n")
        : ["I am studying with Naftali’s Visual Book. Answer in " + languages[language] + " in plain language.",
           "Explain " + link.dataset.topicEn + ", the role of Israel’s president and the historical context.",
           organ ? "Selected president, whose button is highlighted: " + organ + ". Also focus on this person's biography, term of office, public work and key events during the presidency." : "",
           "Include 4–6 verified interesting or surprising facts. Check reliable current sources, link to them, state the date and distinguish facts from interpretation. Do not invent missing details."].filter(Boolean).join("\n\n");
    } else if (link.dataset.category === "family") {
      prompt = language === "he"
        ? ["אני לומד מתוך ספר ויזואלי של נפתלי על משפחת דוידוביץ.",
           organ ? "בחרתי בבן או בת המשפחה: " + organ + ". הסבר את הקשר המשפחתי רק אם המידע ידוע ומאומת." : "הסבר את הקשרים המשפחתיים על סמך המידע שסופק בלבד.",
           "הצג רק מידע משפחתי שכבר סופק ואומת. אל תמציא שמות, קרבה, מקצוע, גיל או ביוגרפיה. כשאין מספיק מידע, ציין מה חסר ושאל שאלה ממוקדת אחת.",
           "אין להתייחס לנושא כאל אנטומיה או בעל חיים. כבד פרטיות של בני משפחה."] .join("\n\n")
        : ["Answer in " + languages[language] + ". This topic is the Davidovitz family, not animal anatomy.",
           organ ? "Selected family member: " + organ + "." : "Explain known family relationships.",
           "Use only verified family information provided by the user. Never invent relationships, ages or biographies. Respect privacy and identify missing information."] .join("\n\n");
    } else if (link.dataset.category === "comparative-anatomy") {
      prompt = language === "he"
        ? ["אני לומד אנטומיה של גורילה מתוך ספר ויזואלי של נפתלי.",
           organ ? "האיבר שנבחר: " + organ + ". הסבר את תפקידו והשווה במפורש את המבנה והתפקוד לאדם." : "הסבר את מערכות הגוף של הגורילה והשווה אותן למערכות המקבילות באדם.",
           "הצג דמיון והבדלים מבוססים בשלד, בשרירים, בתנועה, במוח, בידיים ובמערכת העיכול. הבחן בין עובדות מבוססות להערכות. הוסף 4–6 עובדות מעניינות עם מקורות אמינים."] .join("\n\n")
        : ["Answer in " + languages[language] + ". Explain gorilla anatomy compared with human anatomy.",
           organ ? "Selected organ or structure: " + organ + ". Explain its function and compare it specifically with humans." : "Compare the gorilla's main body systems with humans.",
           "Distinguish established findings from estimates. Include 4–6 verified interesting facts and reliable sources."] .join("\n\n");
    } else if (link.dataset.category === "football") {
      prompt = language === "he"
        ? ["אני לומד על שחקני מכבי חיפה בכדורגל בעונת 2026/27.",
           organ ? "השחקן שבחרתי: " + organ + "." : "הצג סקירה קצרה על שחקני הקבוצה.",
           "הסבר בעברית פשוטה על תפקיד השחקן, הקריירה שלו ופועלו במכבי חיפה. הוסף 4–6 עובדות מעניינות ומאומתות עם מקורות אמינים.",
           "בדוק נתונים עדכניים וציין תאריך. הבחן בין הופעות בליגה להופעות בכל המסגרות ובין משחקים לפתיחות בהרכב. כותרות סגל ראשון וסגל שני בספר הן חלוקה לימודית לפי הופעות, ולא הרכבים רשמיים. אל תמציא נתונים חסרים."].filter(Boolean).join("\n\n")
        : ["Answer in " + languages[language] + ". I am learning about Maccabi Haifa football players in the 2026/27 season.",
           organ ? "Selected player: " + organ + "." : "Give a brief overview of the players.",
           "Explain the player's position, career and Maccabi Haifa contribution. Include 4–6 verified interesting facts and reliable sources. Check current data and state its date. Distinguish league from all-competition appearances, and appearances from starts. Squad 1 and Squad 2 are educational groups ranked by appearances, not official lineups. Do not invent missing information."].filter(Boolean).join("\n\n");
    } else if (link.dataset.category === "technology") {
      prompt = language === "he"
        ? ["הסבר בעברית פשוטה על המכונית המעופפת של אילון מאסק וטסלה רודסטר: המערכות העיקריות, הנעה חשמלית ודחף בגז דחוס.",
           organ ? "התייחס גם לפריט שבחרתי: " + organ + "." : "",
           "בדוק מקורות עדכניים והבחן בין מה שהודגם בפועל, טענות היצרן ותוכניות עתידיות. האם הודגמה טיסה ממושכת? מה מצב הייצור והאישורים? אל תמציא מפרט או מיקום של רכיבים פנימיים מתוך ההמחשה.",
           "ספר גם בקצרה על מאסק ועל שיתוף הפעולה בין טסלה ל-SpaceX. הבא 4–6 עובדות מעניינות ומאומתות וקישורים למקורות אמינים."].filter(Boolean).join("\n\n")
        : ["Answer in " + languages[language] + ". Explain Elon Musk's Tesla Roadster flying-car concept, electric propulsion and cold-gas thrust.",
           organ ? "Also explain the selected feature: " + organ + "." : "",
           "Check current reliable sources. Distinguish demonstrated maneuvers from manufacturer claims and future plans. Explain sustained-flight evidence, production and approval status. Do not infer internal component positions from the conceptual illustration. Include brief background on Musk and Tesla/SpaceX cooperation, plus 4–6 verified surprising facts with sources."].filter(Boolean).join("\n\n");
    } else if (link.dataset.category === "geography") {
      prompt = language === "he"
        ? ["הסבר בעברית פשוטה על " + link.dataset.topicHe + ". הבחן בין המדינות לטריטוריות ובין הבירה הלאומית לערי הבירה המקומיות.",
           organ ? "כלול גם את המקום שבחרתי במפה: " + organ + "." : "",
           "ספר גם על אוסטרליה עצמה והבא 4–6 עובדות גאוגרפיות או היסטוריות מעניינות ומפתיעות, עם קישורים למקורות אמינים."].filter(Boolean).join("\n\n")
        : ["Answer in " + languages[language] + ". Explain " + link.dataset.topicEn + ", distinguishing states from territories and the national capital from regional capitals.",
           organ ? "Include the place I selected on the map: " + organ + "." : "",
           "Also describe Australia and give 4–6 verified surprising facts about its cities, geography or history, with reliable source links."].filter(Boolean).join("\n\n");
    } else if (language === "he") {
      prompt = [
        "אני לומד מתוך ספר ויזואלי של נפתלי.",
        "הסבר בעברית פשוטה על " + link.dataset.topicHe + ". מה תפקידם של האיברים או המבנים העיקריים, ואיך הם פועלים יחד?",
        organ ? "התייחס גם לפריט שבחרתי באיור: " + organ + "." : "",
        "אחר כך ספר על " + link.dataset.subjectHe + " עצמו. תאר את המאפיינים המיוחדים לו, ובמידת הצורך את סביבת החיים, התזונה וההתנהגות שלו.",
        "תן 4–6 עובדות מעניינות, מפתיעות או פיקנטיות על האנטומיה ועל בעל החיים עצמו. כלול רק עובדות שאפשר לאמת, צרף קישורים למקורות אמינים והבחן בין ממצאים להשערות."
      ].filter(Boolean).join("\n\n");
    } else {
      prompt = [
        "I am studying with Naftali’s Visual Book. Answer in " + languages[language] + " in plain language.",
        "Explain " + link.dataset.topicEn + ", including how the main organs or structures work together.",
        organ ? "Also explain the structure I selected: " + organ + "." : "",
        "Then tell me about " + link.dataset.subjectEn + " itself, including distinctive features, habitat, feeding and behavior as applicable.",
        "Include 4–6 verified, surprising or curious facts about the anatomy and the animal itself. Link to reliable sources and distinguish established facts from hypotheses."
      ].filter(Boolean).join("\n\n");
    }
    const url = new URL("https://chatgpt.com/");
    url.searchParams.set("q", prompt);
    link.href = url.href;
  }

  link.addEventListener("click", updateLink);
  updateLink();
})();
