document.addEventListener("DOMContentLoaded", function () {
  /* ===========================
     EMAILJS INITIALIZATION
  ============================ */
  // Initialize EmailJS with your Public Key
  // Get your Public Key from: https://dashboard.emailjs.com/admin/integration
  // IMPORTANT: Replace "YOUR_PUBLIC_KEY" with your actual EmailJS Public Key
  // IMPORTANT: Replace "YOUR_SERVICE_ID" and "YOUR_TEMPLATE_ID" in the form submission handler below
  if (typeof emailjs !== "undefined") {
    emailjs.init("F8CFl6CpvBYwCfrIO"); // Replace with your EmailJS Public Key
  } else {
    console.warn(
      "EmailJS SDK not loaded. Make sure the EmailJS script is included in your HTML.",
    );
  }

  /* ===========================
     NAVBAR HIGHLIGHTING & SCROLL
  ============================ */
  const sections = document.querySelectorAll("section[id], div[id]");
  const navLinks = document.querySelectorAll(".nav-links a");
  const navbar = document.querySelector(".navbar");

  // Set home link as active by default
  const homeLink = document.querySelector('.nav-links a[href="#home"]');
  if (homeLink) homeLink.classList.add("active");

  // Debounced scroll handler
  window.addEventListener(
    "scroll",
    debounce(() => {
      const fromTop = window.scrollY + (navbar ? navbar.offsetHeight : 0) + 20;

      navLinks.forEach((link) => {
        const section = document.querySelector(link.hash);
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          link.classList.toggle(
            "active",
            fromTop >= sectionTop && fromTop <= sectionTop + sectionHeight,
          );
        }
      });
    }, 100),
  );

  // Smooth scroll for nav links
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(link.hash);
      if (!target) return;

      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      const offset = navbar ? navbar.offsetHeight : 0;
      const targetPosition =
        target.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({ top: targetPosition, behavior: "smooth" });
    });
  });

  /* ===========================
     MOBILE MENU
  ============================ */
  const menuButton = document.querySelector(".menu-button");
  const navMenu = document.querySelector(".nav-links");

  if (menuButton && navMenu) {
    menuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      navMenu.classList.toggle("active");
    });

    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => navMenu.classList.remove("active"));
    });

    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !menuButton.contains(e.target)) {
        navMenu.classList.remove("active");
      }
    });
  }

  /* ===========================
     CONTACT FORM VALIDATION
  ============================ */
  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    const formGroups = contactForm.querySelectorAll(".form-group");
    formGroups.forEach((group) => {
      // Only add "required" class if the form group doesn't contain a textarea (message field)
      const textarea = group.querySelector("textarea");
      if (!textarea) {
        group.classList.add("required");
      }
      const errorContainer = document.createElement("span");
      errorContainer.className = "error-message";
      group.appendChild(errorContainer);
    });

    const inputs = contactForm.querySelectorAll("input, textarea");
    inputs.forEach((input) => {
      input.addEventListener("blur", () => {
        input.dataset.touched = "true";
        validateField(input);
      });
      input.addEventListener("input", () => {
        if (input.dataset.touched) validateField(input);
      });
    });

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      let hasError = false;

      inputs.forEach((input) => {
        // Force validation even if fields were never blurred on mobile
        input.dataset.touched = "true";
        // Skip validation for message field (textarea) - make it optional
        const isTextarea =
          input.tagName && input.tagName.toLowerCase() === "textarea";
        if (!isTextarea && !validateField(input)) {
          hasError = true;
        }
      });

      if (hasError) {
        showNotification(
          "Please fill in all required fields correctly",
          "error",
        );
        return;
      }

      const submitButton = contactForm.querySelector(".submit-button");
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.classList.add("loading");
      submitButton.textContent = "Sending...";

      // Collect form data
      const formData = {
        firstName: contactForm
          .querySelector('input[name="firstName"]')
          .value.trim(),
        lastName: contactForm
          .querySelector('input[name="lastName"]')
          .value.trim(),
        email: contactForm.querySelector('input[name="email"]').value.trim(),
        phone: contactForm.querySelector('input[name="phone"]').value.trim(),
        message:
          contactForm.querySelector('textarea[name="message"]').value.trim() ||
          "No message provided",
      };

      try {
        // Send email using EmailJS
        // Replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with your actual IDs from EmailJS dashboard
        if (typeof emailjs !== "undefined") {
          await emailjs.send(
            "service_ibtfy09", // Replace with your EmailJS Service ID
            "template_q2zl9jh", // Replace with your EmailJS Template ID
            {
              to_email: "codingiq369@gmail.com",
              from_name: `${formData.firstName} ${formData.lastName}`,
              from_email: formData.email,
              phone: formData.phone,
              message: formData.message,
              reply_to: formData.email,
            },
          );
        } else {
          throw new Error("EmailJS not loaded");
        }

        submitButton.classList.remove("loading");
        submitButton.classList.add("success");
        submitButton.textContent = "";
        showSuccessModal();

        setTimeout(() => {
          contactForm.reset();
          formGroups.forEach((group) => group.classList.remove("error"));
          submitButton.classList.remove("success");
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }, 1000);
      } catch (error) {
        console.error("EmailJS Error:", error);
        submitButton.classList.remove("loading");
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        showNotification("Failed to send message. Please try again.", "error");
      }
    });
  }

  function validateField(input) {
    const group = input.parentElement;
    const errorEl = group.querySelector(".error-message");
    group.classList.remove("error");
    errorEl.textContent = "";

    const val = input.value.trim();
    const isTextarea =
      input.tagName && input.tagName.toLowerCase() === "textarea";

    // Skip validation for message field (textarea) - make it optional
    if (isTextarea) {
      return true;
    }

    if (!input.dataset.touched && !val) return true;

    let valid = true;
    switch (input.type) {
      case "text":
        valid = validateName(val);
        if (!val) showFieldError(input, "This field is required");
        else if (!valid) showFieldError(input, "Invalid name");
        break;
      case "email":
        valid = validateEmail(val);
        if (!val) showFieldError(input, "Email required");
        else if (!valid) showFieldError(input, "Invalid email");
        break;
      case "tel":
        valid = validatePhone(val);
        if (!val) showFieldError(input, "Phone required");
        else if (!valid) showFieldError(input, "Invalid phone");
        break;
    }
    return valid;
  }

  function showFieldError(input, msg) {
    const group = input.parentElement;
    const errorEl = group.querySelector(".error-message");
    group.classList.add("error");
    errorEl.style.opacity = "0";
    setTimeout(() => {
      errorEl.textContent = msg;
      errorEl.style.opacity = "1";
    }, 200);
  }

  /* ===========================
     FAQ ACCORDION
  ============================ */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const question = item.querySelector(".faq-question");
    const content = item.querySelector(".faq-content");

    question.addEventListener("click", () => {
      const active = item.classList.contains("active");
      document.querySelectorAll(".faq-item").forEach((other) => {
        if (other !== item) {
          other.classList.remove("active");
          other.querySelector(".faq-content").style.maxHeight = "0";
        }
      });
      item.classList.toggle("active");
      content.style.maxHeight = !active ? content.scrollHeight + "px" : "0";
    });
  });

  /* ===========================
     NEWSLETTER SUBSCRIPTION
  ============================ */
  const newsletterForm = document.querySelector(".newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector(".newsletter-input");
      const button = newsletterForm.querySelector(".subscribe-button");
      const email = emailInput.value.trim();

      if (!validateEmail(email)) {
        showModal("Please enter a valid email address", "error");
        return;
      }

      const originalText = button.textContent;
      button.disabled = true;
      button.innerHTML = `<span class="spinner"></span><span>Subscribing...</span>`;

      try {
        await new Promise((res) => setTimeout(res, 1500));
        showModal("Successfully subscribed! 🎉", "success", email);
        emailInput.value = "";
      } catch {
        showModal("Failed to subscribe. Please try again.", "error");
      } finally {
        button.disabled = false;
        button.innerHTML = originalText;
      }
    });
  }

  /* ===========================
     MOUSEMOVE EFFECTS
  ============================ */
  function throttleMouseMove(fn) {
    let waiting = false;
    return (e) => {
      if (!waiting) {
        fn(e);
        waiting = true;
        requestAnimationFrame(() => (waiting = false));
      }
    };
  }

  document.querySelectorAll(".feature-box, .project-card").forEach((card) => {
    card.addEventListener(
      "mousemove",
      throttleMouseMove((e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      }),
    );
  });

  /* ===========================
     COURSE & BATCH CARD INTERACTIONS
  ============================ */
  document.querySelectorAll(".course-card").forEach((card) => {
    // Add spans for vertical borders
    card.insertAdjacentHTML("afterbegin", "<span></span><span></span>");

    card.addEventListener("click", () => {
      const pricing = document.querySelector("#pricing");
      if (pricing) pricing.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ===========================
     MODAL & NOTIFICATION HELPERS
  ============================ */
  function showNotification(msg, type) {
    const notif = document.createElement("div");
    notif.className = `notification ${type}`;
    notif.textContent = msg;
    document.body.appendChild(notif);
    requestAnimationFrame(() => notif.classList.add("show"));
    setTimeout(() => {
      notif.classList.remove("show");
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }

  function showModal(message, type, email = "", isFormSuccess = false) {
    const existing = document.querySelector(".modal-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = `modal-content ${type}`;

    modal.innerHTML = `
      <div class="modal-icon">${
        type === "success"
          ? '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          : '<svg viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01"/><path d="M3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      }</div>
      <h3>${message}</h3>
      ${email ? `<p>We'll send updates to ${email}</p>` : ""}
      <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add("show"));
    setTimeout(() => {
      overlay.classList.remove("show");
      setTimeout(() => overlay.remove(), 300);
    }, 4000);
  }

  function showSuccessModal() {
    const overlay = document.createElement("div");
    overlay.className = "success-modal-overlay";
    const modal = document.createElement("div");
    modal.className = "success-modal";
    modal.innerHTML = `
      <div class="success-icon"><svg viewBox="0 0 24 24"><path class="checkmark-path" d="M20 6L9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <h3>Form Submitted Successfully!</h3>
      <p>Thank you for reaching out. We'll get back to you soon.</p>
    `;
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    requestAnimationFrame(() => {
      overlay.classList.add("show");
      modal.classList.add("show");
    });
    setTimeout(() => {
      overlay.classList.remove("show");
      modal.classList.remove("show");
      setTimeout(() => {
        overlay.remove();
        modal.remove();
      }, 300);
    }, 3000);
  }

  /* ===========================
     VALIDATION HELPERS
  ============================ */
  function validateName(name) {
    return /^[a-zA-Z]{2,}$/.test(name.trim());
  }
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }
  function validatePhone(phone) {
    const sanitized = phone.replace(/\s+/g, "");
    return /^(?:\+91[-\s]?)?[6-9]\d{9}$/.test(sanitized);
  }

  /* ===========================
     UTILITY FUNCTIONS
  ============================ */
  function debounce(fn, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }
});
