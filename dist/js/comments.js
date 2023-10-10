(function () {
  'use strict';

  const COMMENT_FORM = document.getElementById('comment-form');
  const FORM_SCRIPT = document.getElementById('form-script');
  const FORM_RESTORE = document.getElementById('form-restore');
  const REPLY_BUTTONS = document.querySelectorAll('[data-parent-id]');
  const ACTIVE_CLASS = 'is-active';
  const REPLYING_CLASS = 'is-replying';
  const HAS_REPLY_FORM_CLASS = 'has-reply-form';
  const rootMargin = '200px';
  function isObserver(element, fn, options) {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          fn();
          observer.unobserve(entry.target);
        }
      });
    }, {
      ...options
    });
    observer.observe(element);
  }
  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  function loadRelayScript(textarea) {
    if (!textarea) return;
    const src = textarea.value.replace(/<script.*?src='(.*?)'.*?><\/script>/, '$1');
    textarea.remove();
    loadScript(src)
    // eslint-disable-next-line no-undef
    .then(() => BLOG_CMT_createIframe('https://www.blogger.com/rpc_relay.html')).catch(err => console.error(err));
  }
  function createIframe(template, newSrc) {
    if (!template) return;
    const regex = /<iframe[^>]*\s+src="([^"]*)"/i;
    const match = template.match(regex);
    const originalSrc = match[1];
    const form = newSrc ? template.replace(originalSrc, newSrc) : template;
    return {
      originalSrc,
      form
    };
  }
  const replyComments = buttons => {
    // Load relay script
    isObserver(FORM_SCRIPT, () => {
      loadRelayScript(FORM_SCRIPT);
    }, {
      rootMargin
    });
    if (!buttons) {
      return;
    }
    const template = COMMENT_FORM.innerHTML;
    const {
      originalSrc,
      form: originalForm
    } = createIframe(template);
    const replyContainer = document.createElement('div');
    replyContainer.id = 'reply-form';
    let currentActiveButton;
    buttons.forEach(button => {
      button.onclick = () => {
        const parent = button.dataset.parentId;
        const container = document.querySelector(`#c${parent} .comments-replies`);
        const currentReply = document.getElementById('reply-form');
        if (currentActiveButton === button) {
          return;
        }
        if (currentReply) {
          currentReply.parentElement.classList.remove(HAS_REPLY_FORM_CLASS);
          currentReply.remove();
        } else {
          COMMENT_FORM.innerHTML = '';
          FORM_RESTORE.classList.add(REPLYING_CLASS);
        }
        if (currentActiveButton) {
          currentActiveButton.classList.remove(ACTIVE_CLASS);
        }
        const newSrc = `${originalSrc}&parentID=${parent}`;
        const {
          form: newForm
        } = createIframe(template, newSrc);
        button.classList.add(ACTIVE_CLASS);
        currentActiveButton = button;
        replyContainer.innerHTML = newForm;
        container.classList.add(HAS_REPLY_FORM_CLASS);
        container.insertAdjacentElement('afterbegin', replyContainer);
      };
    });
    if (!FORM_RESTORE) {
      return;
    }
    FORM_RESTORE.onclick = () => {
      if (currentActiveButton) {
        const currentReply = document.getElementById('reply-form');
        FORM_RESTORE.classList.remove(REPLYING_CLASS);
        COMMENT_FORM.innerHTML = originalForm;
        currentActiveButton.classList.remove(ACTIVE_CLASS);
        currentActiveButton = null;
        currentReply.parentElement.classList.remove(HAS_REPLY_FORM_CLASS);
        currentReply.remove();
      }
    };
  };
  replyComments(REPLY_BUTTONS);

})();
