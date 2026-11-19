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
    if (language === "he") {
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
