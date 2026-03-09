// Infinite Scroll for mobile
(function() {
    'use strict';

    // Only enable infinite scroll on mobile
    if (window.innerWidth > 768) {
        return;
    }

    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) return;

    let currentPage = 1;
    let isLoading = false;
    let hasNextPage = false;
    let totalPages = 1;

    // Get pagination info from current page
    const paginationEl = document.querySelector('.pagination');
    if (paginationEl) {
        const prevPageLink = paginationEl.querySelector('.pagination-prev');
        const nextPageLink = paginationEl.querySelector('.pagination-next');

        // Check if we have a next page (if prev exists, we're not on page 1)
        if (prevPageLink) {
            currentPage = 1;
        }

        hasNextPage = !!nextPageLink;

        const totalPagesEl = paginationEl.querySelector('.pagination-numbers');
        if (totalPagesEl) {
            const pageLinks = totalPagesEl.querySelectorAll('.pagination-link');
            if (pageLinks.length > 0) {
                totalPages = parseInt(pageLinks[pageLinks.length - 1].textContent);
            }
        }
    }

    // If no pagination or only one page, hide loading and end message
    if (!paginationEl || totalPages <= 1) {
        return;
    }

    // Create loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.className = 'infinite-scroll-loading';
    loadingEl.textContent = 'Đang tải...';
    newsGrid.parentNode.appendChild(loadingEl);

    // Create end message
    const endEl = document.createElement('div');
    endEl.className = 'infinite-scroll-end';
    endEl.textContent = 'Đã tải tất cả';
    newsGrid.parentNode.appendChild(endEl);

    // Load next page content
    async function loadNextPage() {
        if (isLoading || !hasNextPage) {
            console.log('Skipping load - isLoading:', isLoading, 'hasNextPage:', hasNextPage);
            return;
        }

        isLoading = true;
        loadingEl.classList.add('active');

        try {
            const nextPageUrl = `/page/${currentPage + 1}/`;
            console.log('Loading page:', nextPageUrl);

            const response = await fetch(nextPageUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newItems = doc.querySelectorAll('.news-grid .news-card');

            if (newItems.length > 0) {
                // Get current card style and ocean class info
                const firstCard = newsGrid.querySelector('.news-card');
                if (firstCard) {
                    const cardClass = firstCard.classList.toString();
                    const styleMatch = cardClass.match(/card-style-([a-z-]+)/);
                    if (styleMatch) {
                        const cardStyle = styleMatch[1];

                        // Apply card style to new items
                        newItems.forEach((item, index) => {
                            // Add card style class
                            item.classList.add(`card-style-${cardStyle}`);

                            // Handle ocean color cycling
                            if (cardStyle === 'ocean') {
                                const currentIndex = newsGrid.children.length;
                                const mod = currentIndex % 3;
                                const oceanClass = mod === 0 ? 'ocean-blue' : mod === 1 ? 'ocean-teal' : 'ocean-orange';
                                item.classList.add(oceanClass);
                            }
                        });
                    }
                }

                newItems.forEach(item => {
                    newsGrid.appendChild(item);
                });

                currentPage++;

                // Check if we've loaded all pages
                const newPaginationEl = doc.querySelector('.pagination');
                if (newPaginationEl) {
                    const newNextPageLink = newPaginationEl.querySelector('.pagination-next');
                    hasNextPage = !!newNextPageLink;

                    if (!hasNextPage) {
                        endEl.classList.add('show');
                        loadingEl.classList.remove('active');
                    }
                } else {
                    hasNextPage = false;
                    endEl.classList.add('show');
                    loadingEl.classList.remove('active');
                }

                console.log('Page loaded. Current page:', currentPage, 'Has next:', hasNextPage);
            } else {
                hasNextPage = false;
                endEl.classList.add('show');
                loadingEl.classList.remove('active');
                console.log('No items found, stopping');
            }
        } catch (error) {
            console.error('Error loading next page:', error);
            loadingEl.classList.remove('active');
            // On error, still allow retry
            isLoading = false;
        }
    }

    // Throttle function
    function throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Handle scroll event
    const handleScroll = throttle(function() {
        if (isLoading || !hasNextPage) return;

        // Load more when approaching bottom (200px before bottom)
        const scrollPosition = window.innerHeight + window.scrollY;
        const pageHeight = document.body.offsetHeight;

        if (scrollPosition >= pageHeight - 200) {
            loadNextPage();
        }
    }, 200);

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check in case content is short
    setTimeout(() => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
            loadNextPage();
        }
    }, 1000);

})();
