// instagram-feed.js

document.addEventListener('DOMContentLoaded', () => {
    try {
        const feedContainerHTML = `
            <section id="instagram-feed-section" style="padding: 60px 20px; background: #0f172a; border-top: 1px solid rgba(14, 165, 233, 0.2);">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <h2 style="text-align: center; color: #0ea5e9; font-size: 2.5rem; margin-bottom: 40px;">📸 Latest from Instagram</h2>
                    <div id="instafeed-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        <!-- Cards go here -->
                    </div>
                    <div style="text-align: center; margin-top: 40px;">
                        <a href="https://www.instagram.com/startupwithVikash" target="_blank" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #0ea5e9, #7c3aed); color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; transition: transform 0.3s ease;">
                            View More on Instagram
                        </a>
                    </div>
                </div>
            </section>
        `;

        // Inject before footer or at the bottom
        const footer = document.querySelector('footer') || document.body;
        if (footer === document.body) {
            document.body.insertAdjacentHTML('beforeend', feedContainerHTML);
        } else {
            footer.insertAdjacentHTML('beforebegin', feedContainerHTML);
        }

        const grid = document.getElementById('instafeed-grid');

        // Function to create placeholder
        const createPlaceholder = (index) => `
            <div class="insta-card" style="position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 1; background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(124, 58, 237, 0.1)); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: transform 0.3s ease;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255,255,255,0.3); font-size: 48px;">
                    <i class="fab fa-instagram"></i>
                </div>
                <div class="insta-overlay" style="position: absolute; inset: 0; background: rgba(15, 23, 42, 0.8); opacity: 0; transition: opacity 0.3s ease; display: flex; align-items: center; justify-content: center; padding: 20px; text-align: center;">
                    <p style="color: #fff; font-size: 14px; margin: 0;">Building the future of tech. Follow @startupwithVikash for updates. #${index}</p>
                </div>
            </div>
        `;

        // Load CSS for hover effects
        const style = document.createElement('style');
        style.innerHTML = `
            .insta-card:hover { transform: scale(1.05); z-index: 10; }
            .insta-card:hover .insta-overlay { opacity: 1; }
        `;
        document.head.appendChild(style);

        async function fetchFeed() {
            try {
                // Try rss2json bridge
                const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.instagram.com/startupwithVikash/rss/');
                if (!res.ok) throw new Error("RSS bridge failed");
                const data = await res.json();
                
                if (data && data.items && data.items.length > 0) {
                    const items = data.items.slice(0, 6);
                    grid.innerHTML = items.map(item => {
                        const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
                        const imgSrc = imgMatch ? imgMatch[1] : '';
                        const desc = item.title.substring(0, 80) + '...';
                        return `
                            <a href="${item.link}" target="_blank" class="insta-card" style="display: block; position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 1; border: 1px solid rgba(255,255,255,0.1); transition: transform 0.3s ease; background: #1e293b;">
                                ${imgSrc ? `<img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;" alt="Instagram post">` : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><i class="fab fa-instagram" style="font-size:48px; color:#0ea5e9;"></i></div>`}
                                <div class="insta-overlay" style="position: absolute; inset: 0; background: rgba(15, 23, 42, 0.85); opacity: 0; transition: opacity 0.3s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center;">
                                    <p style="color: #fff; font-size: 14px; margin: 0;">${desc}</p>
                                </div>
                            </a>
                        `;
                    }).join('');
                } else {
                    throw new Error("No items");
                }
            } catch (err) {
                console.log("Using Instagram placeholders", err);
                grid.innerHTML = Array(6).fill(0).map((_, i) => createPlaceholder(i+1)).join('');
            }
        }

        fetchFeed();

    } catch (e) {
        console.error("Feature 35: Instagram Feed Error", e);
    }
});
