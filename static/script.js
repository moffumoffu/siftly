let allPosts = [];
let currentFilter = 'All';
let currentSort = 'default';

window.addEventListener('load', () => {
    const cached = sessionStorage.getItem('siftly_posts');
    if (cached) {
        allPosts = JSON.parse(cached);
        document.getElementById("status").textContent = `${allPosts.length} posts loaded.`;
        document.getElementById("btn-text").textContent = "Refresh";
        renderPosts();
    }
});

async function loadPosts() {
    const status = document.getElementById("status");
    const postsEl = document.getElementById("posts");
    const btn = document.getElementById("refresh-btn");
    const btnText = document.getElementById("btn-text");

    btn.disabled = true;
    btnText.textContent = "Loading...";
    status.textContent = "Fetching and analyzing posts — this takes ~30 seconds...";
    postsEl.innerHTML = "";
    allPosts = [];

    try {
        const res = await fetch("/api/posts");
        const data = await res.json();
        allPosts = data;
        sessionStorage.setItem('siftly_posts', JSON.stringify(data));
        status.textContent = `${data.length} posts loaded.`;
        renderPosts();
    } catch (err) {
        status.textContent = "Something went wrong. Check your terminal.";
        console.error(err);
    }

    btn.disabled = false;
    btnText.textContent = "Refresh";
}

function setFilter(f) {
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === f);
    });
    renderPosts();
}

function setSort(s) {
    currentSort = s;
    renderPosts();
}

function renderPosts() {
    const postsEl = document.getElementById("posts");
    let filtered = allPosts.filter(p =>
        currentFilter === 'All' || p.analysis.verdict === currentFilter
    );

    if (currentSort === 'upvotes') {
        filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (currentSort === 'quality') {
        filtered.sort((a, b) => (b.analysis.score || 0) - (a.analysis.score || 0));
    }

    postsEl.innerHTML = "";

    if (filtered.length === 0) {
        postsEl.innerHTML = `<p style="color:#555; font-size:0.85rem;">No posts match this filter.</p>`;
        return;
    }

    filtered.forEach(post => {
        const verdict = post.analysis.verdict || "Unknown";
        const quality = post.analysis.score || 0;
        const summary = post.analysis.summary || "";
        const hnUrl = `https://news.ycombinator.com/item?id=${post.id}`;

        const card = document.createElement("div");
        card.className = `card ${verdict}`;
        card.innerHTML = `
            <div class="card-top">
                <div class="card-title">
                    <a href="${post.url || hnUrl}" target="_blank">${post.title}</a>
                </div>
                <span class="badge ${verdict}">${verdict}</span>
            </div>
            <div class="card-meta">
                <span>↑ ${post.score}</span>
                <span>by ${post.by}</span>
                <a href="${hnUrl}" target="_blank">HN thread ↗</a>
                <div class="quality-bar-wrap">
                    <div class="quality-bar">
                        <div class="quality-fill" style="width: ${quality * 10}%"></div>
                    </div>
                    <span class="quality-label">${quality}/10</span>
                </div>
            </div>
            <div class="card-summary">${summary}</div>
        `;
        postsEl.appendChild(card);
    });
}