// Converts markdown to HTML, processing various markdown elements
function markdownToHTML(md) {
    return md
        .replace(/```([^\n`]+)```/gim, '<mark>$1</mark>') // Inline code
        // Headers (h1 - h6)
        .replace(/^###### (.*)$/gm, '<h6>$1</h6>')
        .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
        .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        // Bold and italic text
        .replace(/\*\*([^*]+)\*\*/gm, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/gm, '<em>$1</em>')
        // Images with descriptions
        .replace(/!([^]+)]([^)]+)/gm, (_, alt, src) => (
            `<div class="content" style="text-align: center;">
                <img src="${src}" alt="${alt}">
                <span class="image-description">${alt}</span>
            </div>`
        ))
        // Links
        .replace(/([^]+)]([^)]+)/gm, '<a href="$2">$1</a>')
        // Lists (ordered and unordered)
        .replace(/^\d+\.\s(.*)$/gm, '<li>$1</li>')
        .replace(/^- (.*)$/gm, '<li>$1</li>')
        .replace(/(?:<li>.*<\/li>\s*)+/gm, match => `<ul>${match}</ul>`) // Wrap unordered lists
        .replace(/<ul>(<li>\d+\..*<\/li>)<\/ul>/gm, '<ol>$1</ol>') // Replace ul with ol for ordered lists
        // Custom cards
        .replace(/```(IMPORTANT|NOTE|TIP|WARN|CARD)([\s\S]+?)```/gm, (_, type, content) => {
            const cardStyles = {
                IMPORTANT: { bg: '#f9f2f4', border: '#e31a1c', color: '#e31a1c' },
                NOTE: { bg: '#e7f3fe', border: '#2196f3', color: '#2196f3' },
                TIP: { bg: '#e2f9e2', border: '#28a745', color: '#28a745' },
                WARN: { bg: '#fff3cd', border: '#ffc107', color: '#ffc107' },
                CARD: { bg: '#ffffff', border: '#ddd', color: '#000' },
            };
            const { bg, border, color } = cardStyles[type];
            return `
                <div class="quote-card" style="background-color: ${bg}; border-left: 5px solid ${border}; padding: 15px; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px;">
                    <h3 style="color: ${color};">${type}</h3>
                    <p>${content.trim()}</p>
                </div>`;
        })
        // Code blocks
        .replace(/```([\s\S]+?)```/gm, (_, code) => `
            <div class="code-block">
                <button class="copy-button">Copy</button>
                <pre><code>${code.trim()}</code></pre>
            </div>`)
        // Line breaks
        .replace(/\n/g, '<br>');
}

// Fetches and loads a markdown post
function loadPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const fileName = urlParams.get('post');
    if (!fileName) return redirectTo404();

    fetch(`./posts/${fileName}.md`)
        .then(response => {
            if (!response.ok) throw new Error("File not found.");
            return response.text();
        })
        .then(md => {
            const authorInfo = extractAuthorInfo(md);
            const postHTML = markdownToHTML(md.replace(/Info {[^}]+}/, ''));
            const postContainer = document.getElementById('post-content');
            const postDate = new Date().toLocaleDateString();

            postContainer.innerHTML = `
                <article>
                    <h1>${formatTitle(fileName)}</h1>
                    ${generateAuthorHTML(authorInfo)}
                    <p class="post-meta">Published on ${postDate}</p>
                    <div>${postHTML}</div>
                </article>`;
            addCopyButtonListeners();
        })
        .catch(() => redirectTo404());
}

// Redirects to a 404 page
function redirectTo404() {
    window.location.href = "404.html";
}

// Generates the author's HTML
function generateAuthorHTML({ name, profileUrl, photo }) {
    if (name === 'Unknown') return '';
    return `
        <div class="author-info">
            <img src="${photo}" alt="${name}">
            <span>By <a href="${profileUrl}">${name}</a></span>
        </div>`;
}

// Extracts author information
function extractAuthorInfo(md) {
    const match = md.match(/Info {AuthorName: (.+); AuthorUrlProfile: (.+); AuthorPhoto: (.+)}/);
    return match ? {
        name: match[1].trim(),
        profileUrl: match[2].trim(),
        photo: match[3].trim()
    } : { name: 'Unknown', profileUrl: '#', photo: '' };
}

// Formats the title
function formatTitle(fileName) {
    return fileName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

// Adds copy functionality to code blocks
function addCopyButtonListeners() {
    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', () => {
            const code = button.nextElementSibling.textContent;
            navigator.clipboard.writeText(code).then(() => {
                button.textContent = 'Copied!';
                setTimeout(() => (button.textContent = 'Copy'), 1500);
            }).catch(() => alert('Error copying code'));
        });
    });
}

// Initialize post loading
document.addEventListener('DOMContentLoaded', loadPost);
