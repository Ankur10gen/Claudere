import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LinkedInScraperArticle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="claude-container">
      <Head>
        <title>Building a LinkedIn Comment Scraper | Claudere.ai</title>
        <meta name="description" content="Learn how we built a Chrome extension to scrape LinkedIn post comments" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <header className="claude-header">
        <Link href="/" className="logo">
          Claudere
        </Link>
      </header>

      <main className="article-container">
        <h1>Building a LinkedIn Comment Scraper: Our Journey from Idea to Implementation</h1>
        
        <div className="article-content">
          <p>In this article, I'll walk you through our process of creating a Chrome extension to scrape comments from LinkedIn posts. This project emerged from a need to analyze engagement on LinkedIn content more effectively, and while the journey had its challenges, we ultimately developed a functional solution that extracts meaningful data.</p>
          
          <h2>The Initial Challenge</h2>
          
          <p>LinkedIn's dynamic interface doesn't make it easy to extract comments at scale. Whether you're conducting social media analysis, gathering feedback on company announcements, or researching professional discourse, manually copying comments is impractical for posts with dozens or hundreds of responses.</p>
          
          <p>Our goal was to build a browser extension that could:</p>
          <ol>
            <li>Load all comments on a LinkedIn post</li>
            <li>Extract the comment text along with author information</li>
            <li>Save the data in a structured format for analysis</li>
          </ol>
          
          <h2>Setting Up the Chrome Extension</h2>
          
          <p>We started by creating a basic Chrome extension structure with these files:</p>
          <ul>
            <li><code>manifest.json</code> - Configuration file for the extension</li>
            <li><code>popup.html</code> - The user interface for our extension</li>
            <li><code>popup.js</code> - The script that handles user interactions and communicates with the content script</li>
          </ul>
          
          <p>Our manifest.json defined the necessary permissions:</p>
          
          <div className="code-block">
            <pre>
              <code>{`{
  "manifest_version": 3,
  "name": "LinkedIn Comments Scraper",
  "version": "1.0",
  "description": "Extract comments from LinkedIn posts",
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "permissions": [
    "activeTab",
    "scripting",
    "downloads"
  ],
  "host_permissions": [
    "https://*.linkedin.com/*"
  ]
}`}</code>
            </pre>
          </div>
          
          <p>The popup interface was kept simple - a button to trigger the scraping and a checkbox to enable auto-loading of all comments:</p>
          
          <div className="code-block">
            <pre>
              <code>{`<button id="scrapeButton">Scrape Comments</button>
<div class="option">
  <label>
    <input type="checkbox" id="autoLoadComments" checked>
    Auto-load all comments
  </label>
</div>`}</code>
            </pre>
          </div>
          
          <h2>First Roadblock: Injecting the Content Script</h2>
          
          <p>Our first challenge came when we tried to execute the script on the LinkedIn page. We initially used a background script approach, but ran into issues with Manifest V3 limitations. After several attempts, we simplified our approach to directly inject the script from the popup:</p>
          
          <div className="code-block">
            <pre>
              <code>{`const results = await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  func: scrapeLinkedInPost,
  args: [autoLoadComments]
});`}</code>
            </pre>
          </div>
          
          <p>This approach worked better, though we still encountered syntax errors and had to ensure our script was well-formatted.</p>
          
          <h2>Building the Comment Scraper Logic</h2>
          
          <p>The heart of our extension was the <code>scrapeLinkedInPost</code> function. This function had several key components:</p>
          
          <h3>1. Auto-scrolling the Page</h3>
          
          <p>LinkedIn loads comments dynamically as you scroll, so we implemented an auto-scroll function:</p>
          
          <div className="code-block">
            <pre>
              <code>{`async function autoScroll() {
  return new Promise((resolve) => {
    const maxScrolls = 20;
    let scrollCount = 0;
    let lastHeight = document.body.scrollHeight;
    
    const timer = setInterval(() => {
      window.scrollBy(0, 800);
      scrollCount++;
      
      // Check if we've reached the bottom
      setTimeout(() => {
        const newHeight = document.body.scrollHeight;
        if (newHeight === lastHeight && scrollCount > 3) {
          clearInterval(timer);
          resolve();
        }
        lastHeight = newHeight;
      }, 300);
      
      if (scrollCount >= maxScrolls) {
        clearInterval(timer);
        resolve();
      }
    }, 600);
  });
}`}</code>
            </pre>
          </div>
          
          <h3>2. Finding "Load More Comments" Buttons</h3>
          
          <p>We needed to click "Load More Comments" buttons to expand the comment section fully:</p>
          
          <div className="code-block">
            <pre>
              <code>{`// Helper function to find buttons by text content
function findButtonsByText(text) {
  const allButtons = document.querySelectorAll('button');
  return Array.from(allButtons).filter(button => 
    button.textContent && 
    button.textContent.toLowerCase().includes(text.toLowerCase())
  );
}

// Using the function to find comment loading buttons
const textButtons1 = findButtonsByText("Load more comments");
const textButtons2 = findButtonsByText("Show more comments");`}</code>
            </pre>
          </div>
          
          <h3>3. Finding Comment Elements</h3>
          
          <p>LinkedIn's DOM structure is complex and can change, so we used multiple selectors to identify comments:</p>
          
          <div className="code-block">
            <pre>
              <code>{`const commentSelectors = [
  '.comments-comment-item',
  '[data-test-id^="comments-comment-"]',
  '.scaffold-finite-scroll__content > div',
  '.comments-comments-list > div'
];

for (const selector of commentSelectors) {
  try {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      allCommentElements = [...allCommentElements, ...Array.from(elements)];
    }
  } catch (e) {
    console.log('Error with comment selector:', selector, e);
  }
}`}</code>
            </pre>
          </div>
          
          <h2>Major Challenges and Solutions</h2>
          
          <h3>Challenge 1: Invalid CSS Selectors</h3>
          
          <p>We initially used jQuery-style <code>:contains()</code> selectors, which aren't supported in standard DOM APIs:</p>
          
          <div className="code-block">
            <pre>
              <code>{`// This doesn't work in standard JavaScript
'button:contains("Load more comments")'`}</code>
            </pre>
          </div>
          
          <p>Solution: We created a custom function to find elements by their text content:</p>
          
          <div className="code-block">
            <pre>
              <code>{`function findButtonsByText(text) {
  const allButtons = document.querySelectorAll('button');
  return Array.from(allButtons).filter(button => 
    button.textContent && 
    button.textContent.toLowerCase().includes(text.toLowerCase())
  );
}`}</code>
            </pre>
          </div>
          
          <h3>Challenge 2: Duplicate Comments</h3>
          
          <p>Our initial implementation picked up profile elements as comments and created duplicate entries:</p>
          
          <p>Solution: We improved our comment processing logic:</p>
          <ul>
            <li>Added filtering to exclude profile sections</li>
            <li>Created a tracking system using Map to prevent duplicates</li>
            <li>Extracted profile titles into a separate field</li>
          </ul>
          
          <div className="code-block">
            <pre>
              <code>{`// Create a unique key for this comment to avoid duplicates
const commentStart = comment.text.substring(0, 30);
const commentKey = \`\${comment.author}:\${commentStart}\`;

// Check if we've seen this comment before
if (!processedCommentKeys.has(commentKey)) {
  processedCommentKeys.set(commentKey, true);
  processedComments.push(comment);
}`}</code>
            </pre>
          </div>
          
          <h3>Challenge 3: Download Mechanism</h3>
          
          <p>We encountered issues with <code>URL.createObjectURL</code> in the extension context:</p>
          
          <p>Solution: We used a data URI approach instead:</p>
          
          <div className="code-block">
            <pre>
              <code>{`chrome.downloads.download({
  url: 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString),
  filename: \`linkedin_post_\${Date.now()}.json\`,
  saveAs: true
});`}</code>
            </pre>
          </div>
          
          <h2>Final Implementation and Testing</h2>
          
          <p>After resolving these challenges, we had a working extension that successfully scraped LinkedIn post comments. Our process for each scrape was:</p>
          
          <ol>
            <li>User clicks the "Scrape Comments" button in the extension popup</li>
            <li>The script is injected into the current LinkedIn post page</li>
            <li>The page is scrolled and "Load more comments" buttons are clicked</li>
            <li>Comment elements are identified and processed</li>
            <li>A JSON file is generated and downloaded with the post data and comments</li>
          </ol>
          
          <p>The JSON included:</p>
          <ul>
            <li>Post author and content</li>
            <li>Post metadata (timestamp, URL, like count)</li>
            <li>Comments with author name, profile URL, text, and timestamp</li>
          </ul>
          
          <h2>Lessons Learned</h2>
          
          <p>Throughout this project, we learned several important lessons:</p>
          
          <ol>
            <li><strong>Browser Extensions Have Limitations</strong>: Manifest V3 introduces constraints on how scripts can be executed and communicate.</li>
            <li><strong>DOM Traversal Requires Robustness</strong>: LinkedIn's DOM structure can vary, so using multiple selector approaches provides resilience.</li>
            <li><strong>Duplicate Detection is Critical</strong>: When scraping content, implementing proper deduplication logic is essential.</li>
            <li><strong>Error Handling Matters</strong>: Building in extensive error handling and logging helped identify and fix issues quickly.</li>
            <li><strong>Testing in Real Scenarios</strong>: What works in a development environment may fail in the real LinkedIn interface, making thorough testing crucial.</li>
          </ol>
          
          <h2>Conclusion</h2>
          
          <p>While our LinkedIn comment scraper isn't perfect, it successfully extracts valuable data that would be tedious to collect manually. With each iteration, we improved its reliability and accuracy. The extension now provides a solid foundation for analyzing LinkedIn engagement, though like any web scraping tool, it may require updates as LinkedIn's interface evolves.</p>
          
          <p>This project demonstrates that with persistence and problem-solving, it's possible to build effective tools for extracting and analyzing social media data, even from complex platforms like LinkedIn.</p>
        </div>
      </main>

      <footer className="claude-footer">
        <div className="footer-content">
          <p>© 2025 Claudere.ai</p>
        </div>
      </footer>
    </div>
  );
}