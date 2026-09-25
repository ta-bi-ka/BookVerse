(() => {
  const quotes = [
    {
      text: "There is no frigate like a book",
      author: "Emily Dickinson",
    },
    {
      text: "I cannot live without books.",
      author: "Thomas Jefferson",
    },
    {
      text: "A good book is the precious life-blood of a master spirit",
      author: "John Milton",
    },
  ];

  const quoteElement = document.getElementById("reading-quote");
  const authorElement = document.getElementById("quote-author");

  if (!quoteElement || !authorElement) return;

  let currentIndex = 0;

  function showQuote() {
    const quote = quotes[currentIndex];

    quoteElement.textContent = `“${quote.text}”`;
    authorElement.textContent = `— ${quote.author}`;

    currentIndex = (currentIndex + 1) % quotes.length;
  }

  showQuote();

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.setInterval(showQuote, 3000);
  }
})();