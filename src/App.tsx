import { useState, useRef, useEffect } from "react";

/* ================================================================
   🔧 НАСТРОЙКИ AI — ВСТАВЬ СВОЙ API КЛЮЧ ЗДЕСЬ
   ================================================================ */
const AI_CONFIG = {
  enabled: false,                // ← поменяй на true чтобы включить AI
  apiKey: "",                    // ← вставь API ключ сюда
  apiUrl: "https://openrouter.ai/api/v1/chat/completions",
  model: "z-ai/glm-4.5-air:free",
  systemPrompt: `Ты — дружелюбный ассистент кофейни "Brew & Bean". Отвечай кратко и по делу. Помогай с вопросами о меню, часах работы, расположении и услугах кофейни. Отвечай на русском языке.`,
  maxTokens: 300,
};

/* ================================================================
   📋 FAQ DATA
   ================================================================ */
const FAQ_DATA = [
  {
    keywords: ["часы", "время", "работа", "открыт", "закрыт", "график", "расписание", "когда"],
    question: "Какие часы работы?",
    answer: "☕ Мы работаем каждый день!\n\n🕐 Пн-Пт: 7:00 — 22:00\n🕐 Сб-Вс: 8:00 — 23:00\n\nПриходите, мы всегда рады вас видеть!",
  },
  {
    keywords: ["адрес", "где", "находи", "расположен", "местоположение", "карта", "как добраться"],
    question: "Где вы находитесь?",
    answer: "📍 Наш адрес: ул. Кофейная, 42\nг. Москва, м. Арбатская\n\n🚇 5 минут пешком от метро\n🅿️ Бесплатная парковка для гостей",
  },
  {
    keywords: ["меню", "кофе", "напиток", "еда", "пить", "есть", "латте", "капучино", "эспрессо", "чай"],
    question: "Что есть в меню?",
    answer: "☕ Наше меню:\n\n🔥 Эспрессо — 150₽\n🥛 Капучино — 250₽\n🍦 Латте — 280₽\n🍫 Мокко — 300₽\n🧊 Айс-кофе — 270₽\n🍵 Чай — 180₽\n🥐 Круассан — 200₽\n🍰 Чизкейк — 350₽",
  },
  {
    keywords: ["wifi", "вайфай", "интернет", "пароль", "wi-fi"],
    question: "Есть ли Wi-Fi?",
    answer: "📶 Да, у нас бесплатный Wi-Fi!\n\n🔑 Сеть: Brew&Bean_Guest\n🔐 Пароль: coffee2024\n\nСкорость до 100 Мбит/с!",
  },
  {
    keywords: ["доставка", "заказ", "онлайн", "привезти", "курьер", "самовывоз"],
    question: "Есть ли доставка?",
    answer: "🚗 Да, мы доставляем!\n\n📱 Заказ через сайт или по телефону\n⏱️ Доставка за 30-45 минут\n🆓 Бесплатно от 1000₽\n📦 Самовывоз — скидка 10%",
  },
  {
    keywords: ["бронь", "столик", "зарезервировать", "бронирование", "резерв"],
    question: "Можно забронировать столик?",
    answer: "🪑 Конечно!\n\n📞 Звоните: +7 (999) 123-45-67\n💬 Или напишите в WhatsApp\n\nБронирование за 1-7 дней. Для компаний от 8 человек — отдельный зал!",
  },
  {
    keywords: ["оплат", "карт", "наличн", "оплачивать", "перевод", "сбп"],
    question: "Какие способы оплаты?",
    answer: "💳 Принимаем всё:\n\n• Наличные\n• Банковские карты\n• Apple Pay / Google Pay\n• СБП (QR-код)\n• Подарочные сертификаты",
  },
  {
    keywords: ["скидк", "акци", "бонус", "программа лояльности", "промо"],
    question: "Есть ли скидки?",
    answer: "🎉 Наши акции:\n\n☕ 6-й кофе в подарок\n🌅 Утренний кофе до 9:00 — скидка 20%\n🎂 В день рождения — бесплатный десерт\n👨‍💻 Студентам — скидка 15%",
  },
  {
    keywords: ["телефон", "звонить", "позвонить", "контакт", "связь", "почта", "email"],
    question: "Как связаться?",
    answer: "📞 Телефон: +7 (999) 123-45-67\n📧 Email: hello@brewandbean.ru\n📷 Instagram: @brewandbean\n💬 Telegram: @brewandbean_bot",
  },
  {
    keywords: ["веган", "растительн", "молок", "безлактозн", "аллерг", "глютен"],
    question: "Есть веганские опции?",
    answer: "🌱 Да!\n\n🥛 Растительное молоко: овсяное, миндальное, кокосовое (+50₽)\n🥗 Веганские сэндвичи и десерты\n🚫 Безглютеновые опции в меню",
  },
];

/* ================================================================
   HELPERS
   ================================================================ */
function findFAQ(text: string) {
  const lower = text.toLowerCase().trim();
  let best = null;
  let bestScore = 0;
  for (const faq of FAQ_DATA) {
    let score = 0;
    for (const kw of faq.keywords) {
      if (lower.includes(kw.toLowerCase())) score++;
    }
    if (score > bestScore) { bestScore = score; best = faq; }
  }
  return bestScore > 0 ? best : null;
}

async function callAI(messages: { role: string; content: string }[]) {
  if (!AI_CONFIG.enabled || !AI_CONFIG.apiKey) {
    return "🤖 AI-режим не настроен. Добавьте API ключ в src/App.tsx (AI_CONFIG)";
  }
  try {
    const res = await fetch(AI_CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${AI_CONFIG.apiKey}` },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [{ role: "system", content: AI_CONFIG.systemPrompt }, ...messages],
        max_tokens: AI_CONFIG.maxTokens,
      }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Извините, не удалось получить ответ.";
  } catch {
    return "⚠️ Не удалось связаться с AI. Попробуйте позже.";
  }
}

function timeNow() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/* ================================================================
   MENU DATA
   ================================================================ */
const CATEGORIES = ["Все", "Кофе", "Чай", "Десерты", "Завтраки"];

const MENU_ITEMS = [
  { name: "Эспрессо", desc: "Классический крепкий кофе", price: 150, cat: "Кофе", emoji: "☕", hit: false },
  { name: "Капучино", desc: "Эспрессо с нежной молочной пенкой", price: 250, cat: "Кофе", emoji: "🥛", hit: true },
  { name: "Латте", desc: "Мягкий кофе с большим количеством молока", price: 280, cat: "Кофе", emoji: "🍦", hit: true },
  { name: "Флэт Уайт", desc: "Двойной эспрессо с бархатным молоком", price: 290, cat: "Кофе", emoji: "✨", hit: false },
  { name: "Мокко", desc: "Кофе с шоколадом и взбитыми сливками", price: 300, cat: "Кофе", emoji: "🍫", hit: false },
  { name: "Раф кофе", desc: "Кофе со сливками и ванильным сахаром", price: 320, cat: "Кофе", emoji: "🧁", hit: true },
  { name: "Айс-кофе", desc: "Холодный кофе со льдом", price: 270, cat: "Кофе", emoji: "🧊", hit: false },
  { name: "Зелёный чай", desc: "Отборный японский сенча", price: 180, cat: "Чай", emoji: "🍵", hit: false },
  { name: "Иван-чай", desc: "Ферментированный с ягодами", price: 200, cat: "Чай", emoji: "🌿", hit: false },
  { name: "Матча-латте", desc: "Японский чай матча с молоком", price: 300, cat: "Чай", emoji: "🍃", hit: true },
  { name: "Чизкейк", desc: "Нью-Йоркский со сливочным кремом", price: 350, cat: "Десерты", emoji: "🍰", hit: true },
  { name: "Тирамису", desc: "Классический итальянский десерт", price: 380, cat: "Десерты", emoji: "🍮", hit: false },
  { name: "Круассан", desc: "Маслянистый, воздушный, хрустящий", price: 200, cat: "Десерты", emoji: "🥐", hit: false },
  { name: "Маффин", desc: "Шоколадный с жидкой начинкой", price: 220, cat: "Десерты", emoji: "🧁", hit: false },
  { name: "Авокадо-тост", desc: "С яйцом пашот и микрозеленью", price: 420, cat: "Завтраки", emoji: "🥑", hit: true },
  { name: "Сырники", desc: "Со сметаной и ягодным соусом", price: 350, cat: "Завтраки", emoji: "🥞", hit: false },
  { name: "Боул с асаи", desc: "Гранола, фрукты и мёд", price: 450, cat: "Завтраки", emoji: "🫐", hit: false },
  { name: "Яйца Бенедикт", desc: "С голландским соусом на бриоши", price: 480, cat: "Завтраки", emoji: "🍳", hit: false },
];

const REVIEWS = [
  { name: "Анна К.", text: "Лучший кофе в городе! Капучино просто идеальный — нежная пенка и насыщенный вкус. Атмосфера невероятно уютная.", rating: 5, avatar: "🧑‍🎨", date: "2 дня назад" },
  { name: "Михаил Д.", text: "Хожу сюда каждое утро уже год. Бариста знают меня по имени и готовят кофе так, как я люблю.", rating: 5, avatar: "👨‍💻", date: "1 неделю назад" },
  { name: "Елена С.", text: "Потрясающие завтраки! Авокадо-тост с яйцом пашот — шедевр. Плюс Wi-Fi отличный — удобно работать.", rating: 5, avatar: "👩‍🏫", date: "2 недели назад" },
  { name: "Дмитрий В.", text: "Проводил здесь встречу с клиентами — все в восторге. Отдельный зал, вежливый персонал. Рекомендую!", rating: 4, avatar: "🧑‍💼", date: "3 недели назад" },
  { name: "Ольга П.", text: "Чизкейк — лучший из всех, что я пробовала! А матча-латте просто космос. Обязательно вернусь.", rating: 5, avatar: "👩‍🍳", date: "1 месяц назад" },
  { name: "Артём Г.", text: "Раф кофе — мой фаворит. Классная обжарка, видно что ребята разбираются. Очень приятное место!", rating: 5, avatar: "🧔", date: "1 месяц назад" },
];

/* ================================================================
   MAIN APP COMPONENT
   ================================================================ */
export function App() {
  // Mobile menu
  const [mobileOpen, setMobileOpen] = useState(false);
  // Menu filter
  const [activeCat, setActiveCat] = useState("Все");
  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{id: string; role: "bot"|"user"; text: string; time: string}[]>([
    { id: "g", role: "bot", text: "Привет! 👋 Я — виртуальный помощник кофейни Brew & Bean. Задайте вопрос или выберите тему ниже!", time: timeNow() },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFaq, setShowFaq] = useState(true);
  const [unread, setUnread] = useState(0);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (chatOpen) { setUnread(0); setTimeout(() => chatInputRef.current?.focus(), 300); }
  }, [chatOpen]);

  const addMsg = (role: "bot" | "user", text: string) => {
    const msg = { id: Date.now().toString() + Math.random(), role, text, time: timeNow() };
    setMessages(prev => [...prev, msg]);
    if (!chatOpen && role === "bot") setUnread(prev => prev + 1);
  };

  const handleSend = async (text?: string) => {
    const t = (text || chatInput).trim();
    if (!t || loading) return;
    setChatInput("");
    setShowFaq(false);
    addMsg("user", t);

    const faq = findFAQ(t);
    if (faq) {
      setLoading(true);
      await new Promise(r => setTimeout(r, 600));
      addMsg("bot", faq.answer);
      setLoading(false);
      return;
    }
    if (AI_CONFIG.enabled && AI_CONFIG.apiKey) {
      setLoading(true);
      const history = messages.filter(m => m.id !== "g").map(m => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text }));
      history.push({ role: "user", content: t });
      const answer = await callAI(history);
      addMsg("bot", answer);
      setLoading(false);
    } else {
      setLoading(true);
      await new Promise(r => setTimeout(r, 500));
      addMsg("bot", "🤔 Не нашёл ответа в FAQ.\n\nПопробуйте переформулировать или выберите тему из списка ниже!");
      setLoading(false);
      setShowFaq(true);
    }
  };

  const filtered = activeCat === "Все" ? MENU_ITEMS : MENU_ITEMS.filter(i => i.cat === activeCat);

  return (
    <>
      {/* ==================== HEADER ==================== */}
      <header className="header">
        <div className="header-inner">
          <a href="#" className="logo">
            <div className="logo-icon">☕</div>
            Brew <span>&</span> Bean
          </a>
          <nav className="nav">
            <a href="#hero">Главная</a>
            <a href="#about">О нас</a>
            <a href="#menu">Меню</a>
            <a href="#reviews">Отзывы</a>
            <a href="#contact">Контакты</a>
          </nav>
          <a href="#contact" className="header-cta">Забронировать</a>
          <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
        <nav className={`mobile-nav ${mobileOpen ? "open" : ""}`}>
          {["Главная|#hero","О нас|#about","Меню|#menu","Отзывы|#reviews","Контакты|#contact"].map(l => {
            const [label, href] = l.split("|");
            return <a key={href} href={href} onClick={() => setMobileOpen(false)}>{label}</a>;
          })}
        </nav>
      </header>

      {/* ==================== HERO ==================== */}
      <section id="hero" className="hero">
        <div className="hero-orb1" />
        <div className="hero-orb2" />
        <div className="hero-content">
          <div>
            <div className="hero-badge">⭐ Лучший кофе в городе</div>
            <h1>Каждая чашка —<br /><em>маленькая история</em></h1>
            <p className="hero-text">
              Свежая обжарка, уютная атмосфера и бариста, влюблённые в своё дело.
              Приходите за вдохновением и лучшим кофе.
            </p>
            <div className="hero-buttons">
              <a href="#menu" className="btn-primary">Наше меню ↓</a>
              <a href="#about" className="btn-outline">Узнать больше</a>
            </div>
            <div className="hero-stats">
              <div><h3>10+</h3><p>Лет опыта</p></div>
              <div><h3>50k+</h3><p>Чашек в месяц</p></div>
              <div><h3>4.9</h3><p>Рейтинг</p></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-circles">
              <div className="hero-circles-mid">
                <div className="hero-circles-inner">☕</div>
              </div>
              <div className="hero-float f1">🔥 Свежая обжарка</div>
              <div className="hero-float f2">🌿 100% арабика</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== ABOUT ==================== */}
      <section id="about" className="section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-badge">О нас</div>
            <h2 className="section-title">Больше чем просто кофе</h2>
            <p className="section-desc">
              Brew & Bean — место, где каждая чашка кофе рассказывает свою историю.
              Мы верим, что кофе объединяет людей и вдохновляет.
            </p>
          </div>

          <div className="features-grid">
            {[
              { icon: "❤️", title: "С любовью", desc: "Каждый напиток готовится с душой и вниманием к деталям", color: "red" },
              { icon: "🌿", title: "Натурально", desc: "Только отборные зёрна из лучших плантаций мира", color: "green" },
              { icon: "🏆", title: "Качество", desc: "Призёры национальных чемпионатов бариста", color: "amber" },
              { icon: "👥", title: "Сообщество", desc: "Место, где встречаются идеи и рождается вдохновение", color: "blue" },
            ].map(f => (
              <div className="feature-card" key={f.title}>
                <div className={`feature-icon ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="story-grid">
            <div className="story-image">
              <div className="emoji">🏠</div>
              <p>Уютное пространство</p>
              <small>120 м² комфорта</small>
              <div className="story-year">
                <h3>С 2014</h3>
                <p>года</p>
              </div>
            </div>
            <div className="story-text">
              <h3>Наша история началась с мечты</h3>
              <p>В 2014 году два друга, объединённых страстью к кофе, открыли маленькую кофейню. Они мечтали создать место, где каждый сможет найти свой идеальный напиток.</p>
              <p>Сегодня Brew & Bean — это команда из 15 профессионалов, собственная обжарка и тысячи довольных гостей каждый месяц.</p>
              <div className="story-nums">
                <div className="story-num"><h4>15</h4><p>бариста</p></div>
                <div className="story-num"><h4>8</h4><p>сортов зёрен</p></div>
                <div className="story-num"><h4>3</h4><p>награды</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== MENU ==================== */}
      <section id="menu" className="section gray">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-badge">Меню</div>
            <h2 className="section-title">Выберите свой вкус</h2>
            <p className="section-desc">От классического эспрессо до авторских напитков — у нас найдётся что-то для каждого.</p>
          </div>

          <div className="menu-tabs">
            {CATEGORIES.map(c => (
              <button key={c} className={`menu-tab ${activeCat === c ? "active" : ""}`} onClick={() => setActiveCat(c)}>{c}</button>
            ))}
          </div>

          <div className="menu-grid">
            {filtered.map(item => (
              <div className="menu-item" key={item.name}>
                {item.hit && <div className="hit">🔥 Хит</div>}
                <div className="emoji">{item.emoji}</div>
                <h4>{item.name}</h4>
                <p className="desc">{item.desc}</p>
                <div className="bottom">
                  <span className="price">{item.price}₽</span>
                  <span className="cat">{item.cat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== REVIEWS ==================== */}
      <section id="reviews" className="section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-badge">Отзывы</div>
            <h2 className="section-title">Что говорят гости</h2>
            <p className="section-desc">Более 2000 отзывов с рейтингом 4.9 — мы гордимся каждым.</p>
          </div>
          <div className="reviews-grid">
            {REVIEWS.map(r => (
              <div className="review-card" key={r.name}>
                <div className="quote">❝</div>
                <p className="text">{r.text}</p>
                <div className="review-footer">
                  <div className="review-author">
                    <span className="review-avatar">{r.avatar}</span>
                    <div>
                      <div className="review-name">{r.name}</div>
                      <div className="review-date">{r.date}</div>
                    </div>
                  </div>
                  <div className="review-stars">
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CONTACT ==================== */}
      <section id="contact" className="section gray">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-badge">Контакты</div>
            <h2 className="section-title">Приходите в гости</h2>
            <p className="section-desc">Мы всегда рады видеть вас. Свяжитесь с нами любым удобным способом.</p>
          </div>
          <div className="contact-grid">
            <div className="contact-cards">
              {[
                { icon: "📍", title: "Адрес", lines: ["ул. Кофейная, 42", "г. Москва, м. Арбатская"], color: "red" },
                { icon: "📞", title: "Телефон", lines: ["+7 (999) 123-45-67", "Звоните с 7:00 до 23:00"], color: "green" },
                { icon: "📧", title: "Email", lines: ["hello@brewandbean.ru", "Ответим в течение часа"], color: "blue" },
                { icon: "🕐", title: "Часы работы", lines: ["Пн-Пт: 7:00 – 22:00", "Сб-Вс: 8:00 – 23:00"], color: "amber" },
              ].map(c => (
                <div className="contact-card" key={c.title}>
                  <div className={`contact-icon ${c.color}`}>{c.icon}</div>
                  <div>
                    <h4>{c.title}</h4>
                    {c.lines.map(l => <p key={l}>{l}</p>)}
                  </div>
                </div>
              ))}
              <div className="social-links">
                <button className="social-btn">📷 Instagram</button>
                <button className="social-btn">💬 Telegram</button>
              </div>
            </div>
            <div className="contact-form">
              <h3>Забронировать столик</h3>
              <p className="subtitle">Заполните форму и мы свяжемся с вами для подтверждения.</p>
              <form onSubmit={(e) => { e.preventDefault(); alert("Спасибо! Мы свяжемся с вами в ближайшее время. ☕"); }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Имя</label>
                    <input type="text" placeholder="Ваше имя" />
                  </div>
                  <div className="form-group">
                    <label>Телефон</label>
                    <input type="tel" placeholder="+7 (___) ___-__-__" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Дата</label>
                    <input type="date" />
                  </div>
                  <div className="form-group">
                    <label>Кол-во гостей</label>
                    <select>
                      <option>1-2 гостя</option>
                      <option>3-4 гостя</option>
                      <option>5-6 гостей</option>
                      <option>7+ гостей</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Комментарий</label>
                  <textarea rows={3} placeholder="Особые пожелания..." />
                </div>
                <button type="submit" className="form-submit">Забронировать</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <div className="icon">☕</div>
                <div className="name">Brew <span>&</span> Bean</div>
              </div>
              <p className="desc">Кофейня с душой в самом сердце города. Свежая обжарка, уютная атмосфера и лучшие бариста.</p>
            </div>
            <div>
              <h4>Меню</h4>
              <ul>
                {["Кофе","Чай","Десерты","Завтраки","Сезонные напитки"].map(i => <li key={i}><a href="#menu">{i}</a></li>)}
              </ul>
            </div>
            <div>
              <h4>Компания</h4>
              <ul>
                {["О нас","Наша команда","Карьера","Блог","Партнёрам"].map(i => <li key={i}><a href="#about">{i}</a></li>)}
              </ul>
            </div>
            <div>
              <h4>Контакты</h4>
              <ul>
                <li>ул. Кофейная, 42</li>
                <li>г. Москва</li>
                <li>+7 (999) 123-45-67</li>
                <li>hello@brewandbean.ru</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Brew & Bean. Все права защищены.</p>
            <p>Сделано с ❤️ и ☕</p>
          </div>
        </div>
      </footer>

      {/* ==================== CHATBOT ==================== */}
      <button className="chat-toggle" onClick={() => setChatOpen(!chatOpen)}>
        {chatOpen ? "✕" : "💬"}
        {!chatOpen && unread > 0 && <span className="badge">{unread}</span>}
      </button>

      <div className={`chat-window ${chatOpen ? "open" : ""}`}>
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-icon">☕</div>
          <div className="chat-header-info">
            <h3>Brew & Bean</h3>
            <div className="chat-header-status">
              <span className="dot" />
              Онлайн • Готов помочь
            </div>
          </div>
          {AI_CONFIG.enabled && AI_CONFIG.apiKey && (
            <div className="chat-ai-badge">✨ AI</div>
          )}
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`msg ${msg.role}`}>
              <div className="msg-avatar">{msg.role === "bot" ? "🤖" : "👤"}</div>
              <div className="msg-bubble">
                {msg.text}
                <div className="msg-time">{msg.time}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="typing">
              <div className="msg-avatar">🤖</div>
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* FAQ chips */}
        {showFaq && (
          <div className="chat-faq">
            <div className="chat-faq-header">
              <span>Популярные вопросы:</span>
              <button onClick={() => setShowFaq(false)} style={{ cursor: "pointer", background: "none", border: "none", color: "#888", fontSize: 14 }}>▾</button>
            </div>
            <div className="chat-faq-list">
              {FAQ_DATA.slice(0, 6).map((f, i) => (
                <button key={i} className="faq-chip" onClick={() => handleSend(f.question)}>{f.question}</button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="chat-input-area">
          <form className="chat-input-form" onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <button type="button" className="chat-faq-toggle" onClick={() => setShowFaq(p => !p)} title="Показать FAQ">✨</button>
            <input
              ref={chatInputRef}
              type="text"
              className="chat-input"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Введите сообщение..."
              disabled={loading}
            />
            <button type="submit" className={`chat-send ${chatInput.trim() && !loading ? "active" : ""}`} disabled={!chatInput.trim() || loading}>
              ➤
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
