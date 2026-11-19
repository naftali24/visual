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
    if (link.dataset.category === "technology") {
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
