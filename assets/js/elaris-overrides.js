(() => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  if (window.location.hash) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }

  const ensureTopOnLoad = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  const setupHeroMedia = () => {
    const hero = document.querySelector('.section-hero.elaris-hero');
    const heroMedia = hero?.querySelector('.hero-image');
    const heroVideo = heroMedia?.querySelector('video');
    const heroImage = heroMedia?.querySelector('img');
    const heroVisual = heroMedia?.querySelector('video, img');

    if (!hero || !heroMedia || !heroVisual) {
      return;
    }

    const revealMedia = () => {
      heroMedia.classList.add('is-ready');
    };

    if (heroVideo) {
      if (heroVideo.readyState >= 2) {
        revealMedia();
      }

      heroVideo.addEventListener('loadeddata', revealMedia, { once: true });
      heroVideo.addEventListener('canplay', revealMedia, { once: true });
      heroVideo.addEventListener('error', revealMedia, { once: true });
    } else if (heroImage) {
      if (heroImage.complete) {
        revealMedia();
      } else {
        heroImage.addEventListener('load', revealMedia, { once: true });
        heroImage.addEventListener('error', revealMedia, { once: true });
      }
    } else {
      revealMedia();
    }

    let ticking = false;

    const updateHeroMediaOffset = () => {
      ticking = false;

      const heroRect = hero.getBoundingClientRect();
      const offset = Math.max(-heroRect.top, 0);
      heroVisual.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const requestUpdate = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateHeroMediaOffset);
    };

    updateHeroMediaOffset();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
  };

  const setupHeroTyping = () => {
    const heroTypedCopy = document.querySelector('.elaris-hero-copy-typing');
    const typedTextNode = heroTypedCopy?.querySelector('.elaris-typed-text');

    if (!heroTypedCopy || !typedTextNode) {
      return;
    }

    const fullText = heroTypedCopy.dataset.typingText ?? '';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!fullText) {
      return;
    }

    if (prefersReducedMotion) {
      typedTextNode.textContent = fullText;
      return;
    }

    let currentIndex = 0;
    let typingStarted = false;

    const randomBetween = (min, max) => {
      return Math.round(min + Math.random() * (max - min));
    };

    const getTypingDelay = (character) => {
      if (character === ' ') {
        return randomBetween(28, 62);
      }

      if (character === ',' || character === ';') {
        return randomBetween(210, 320);
      }

      if (character === '.' || character === '!' || character === '?') {
        return randomBetween(380, 560);
      }

      if (character === '—' || character === '-') {
        return randomBetween(240, 340);
      }

      return randomBetween(22, 54);
    };

    const typeNextCharacter = () => {
      if (currentIndex >= fullText.length) {
        heroTypedCopy.classList.add('is-typed');
        return;
      }

      const nextCharacter = fullText[currentIndex];
      typedTextNode.textContent += nextCharacter;
      currentIndex += 1;

      window.setTimeout(typeNextCharacter, getTypingDelay(nextCharacter));
    };

    const startTyping = () => {
      if (typingStarted) {
        return;
      }

      typingStarted = true;
      typedTextNode.textContent = '';
      window.setTimeout(typeNextCharacter, 540);
    };

    const heroCopyObserver = new IntersectionObserver((entries, observer) => {
      const entry = entries[0];

      if (!entry?.isIntersecting) {
        return;
      }

      observer.disconnect();
      startTyping();
    }, {
      threshold: 0.45,
    });

    heroCopyObserver.observe(heroTypedCopy);
  };

  const setupDashboardPreview = () => {
    const previewModal = document.querySelector('[data-dashboard-preview-modal]');
    const previewOpenButtons = document.querySelectorAll('[data-dashboard-preview-open]');
    const previewCloseButtons = previewModal?.querySelectorAll('[data-dashboard-preview-close]');
    const previewCloseButton = previewModal?.querySelector('.elaris-preview-close');

    if (!previewModal || previewOpenButtons.length === 0 || !previewCloseButtons?.length) {
      return;
    }

    let lastTrigger = null;

    const closePreview = () => {
      previewModal.hidden = true;
      document.body.classList.remove('elaris-preview-open');

      if (lastTrigger instanceof HTMLElement) {
        lastTrigger.focus();
      }
    };

    const openPreview = (trigger) => {
      lastTrigger = trigger instanceof HTMLElement ? trigger : null;
      previewModal.hidden = false;
      document.body.classList.add('elaris-preview-open');
      previewCloseButton?.focus();
    };

    previewOpenButtons.forEach((button) => {
      button.addEventListener('click', () => {
        openPreview(button);
      });
    });

    previewCloseButtons.forEach((button) => {
      button.addEventListener('click', closePreview);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !previewModal.hidden) {
        closePreview();
      }
    });
  };

  const setupSoftReveal = () => {
    const revealNodes = document.querySelectorAll('.elaris-soft-reveal');

    if (revealNodes.length === 0) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      revealNodes.forEach((node) => {
        node.classList.add('is-visible');
      });
      return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const node = entry.target;
        const delay = Number(node.getAttribute('data-reveal-delay') ?? 0);

        window.setTimeout(() => {
          window.requestAnimationFrame(() => {
            node.classList.add('is-visible');
          });
        }, Math.max(delay, 40));

        observer.unobserve(node);
      });
    }, {
      threshold: 0.01,
      rootMargin: '0px 0px 4% 0px',
    });

    revealNodes.forEach((node) => {
      revealObserver.observe(node);
    });
  };

  const setupPricingToggle = () => {
    const pricingToggle = document.querySelector('#elarisPricingMode');
    const pricingModeCaption = document.querySelector('[data-pricing-mode-caption]');
    const pricingPanels = document.querySelectorAll('.elaris-plan-pricing[data-pricing-mode]');

    if (!pricingToggle || pricingPanels.length === 0) {
      return;
    }

    const updatePricingMode = () => {
      const activeMode = pricingToggle.checked ? 'economy' : 'flex';

      if (pricingModeCaption) {
        pricingModeCaption.textContent = pricingToggle.checked ? 'Экономно' : 'Гибко';
      }

      pricingPanels.forEach((panel) => {
        panel.hidden = panel.dataset.pricingMode !== activeMode;
      });
    };

    pricingToggle.addEventListener('change', updatePricingMode);
    updatePricingMode();
  };

  window.addEventListener('load', ensureTopOnLoad);
  window.addEventListener('pageshow', ensureTopOnLoad);

  setupHeroMedia();
  setupHeroTyping();
  setupDashboardPreview();
  setupSoftReveal();
  setupPricingToggle();
})();
