let menuItems = [];

// ===== Fetch Menu Data =====
async function loadMenuData() {
  try {
    const response = await fetch("data/menu.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    menuItems = await response.json();
  } catch (error) {
    console.error("Failed to load menu data:", error);
    menuItems = [];
  }
}


// ===== Globals =====
const specialsContainer = document.getElementById("specials-cards");
const menuContainer = document.getElementById("menu-cards") || document.getElementById("menu-container");
const cartCount = document.getElementById("cart-count");
const cartSidebar = document.getElementById("cart-sidebar");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total") || document.getElementById("total-price");
const checkoutBtn = document.getElementById("checkout-btn");

let cart = [];

function formatPrice(price) {
  return `₹${price}`;
}

// ===== Render Functions =====

function createCard(item) {
  const card = document.createElement("article");
  card.className = "card";
  card.tabIndex = 0;
  card.setAttribute("aria-label", `${item.name} - ${item.description}. Price: ${formatPrice(item.price)}.`);

  card.innerHTML = `
    <img src="${item.image}" alt="${item.name}" loading="lazy" />
    <div class="card-content">
      <h3>${item.name}</h3>
      <p>${item.description}</p>
    </div>
    <div class="card-footer">
      <span class="price">${formatPrice(item.price)}</span>
      <button class="add-btn" aria-label="Add ${item.name} to cart">Add</button>
    </div>
  `;

  const addBtn = card.querySelector(".add-btn");
  addBtn.addEventListener("click", () => addToCart(item.id));

  return card;
}

function renderSpecials() {
  if (!specialsContainer) return;
  // Pick top 3 items as specials
  const specials = menuItems.slice(0, 3);
  specialsContainer.innerHTML = "";
  specials.forEach(item => {
    specialsContainer.appendChild(createCard(item));
  });
}

function renderMenu(filter = "All") {
  if (!menuContainer) return;
  menuContainer.innerHTML = "";
  let filteredItems = menuItems;
  if (filter !== "All") {
    filteredItems = menuItems.filter(item => item.category === filter);
  }
  filteredItems.forEach(item => {
    menuContainer.appendChild(createCard(item));
  });
}

function renderCart() {
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = "";
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p>Your cart is empty.</p>`;
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (cartTotal) cartTotal.textContent = "Total: ₹0";
    return;
  }

  cart.forEach(({ item, quantity }) => {
    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.tabIndex = 0;
    cartItem.setAttribute("aria-label", `${item.name}, quantity ${quantity}, price ${formatPrice(item.price * quantity)}`);

    cartItem.innerHTML = `
      <span>${item.name} × ${quantity}</span>
      <span>${formatPrice(item.price * quantity)}</span>
      <button aria-label="Remove one ${item.name}" class="remove-item-btn">−</button>
    `;

    const removeBtn = cartItem.querySelector(".remove-item-btn");
    removeBtn.addEventListener("click", () => removeFromCart(item.id));

    cartItemsContainer.appendChild(cartItem);
  });

  // Update total
  const total = cart.reduce((sum, cartItem) => sum + cartItem.item.price * cartItem.quantity, 0);
  if (cartTotal) cartTotal.textContent = `Total: ${formatPrice(total)}`;
  if (checkoutBtn) checkoutBtn.disabled = false;
}

function updateCartCount() {
  if (cartCount) {
    const totalCount = cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
    cartCount.textContent = totalCount;
  }
}

// ===== Global Window Handlers for Multi-page support =====

window.filterCategory = function(category) {
  renderMenu(category);
  const buttons = document.querySelectorAll(".filter button");
  buttons.forEach(btn => {
    const filterText = btn.getAttribute("onclick") ? btn.getAttribute("onclick").match(/'([^']+)'/)[1] : "";
    if (filterText === category || btn.textContent.trim() === category) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
};

window.checkout = function() {
  alert("Thank you for your order! Your delicious chaat is on the way.");
  cart = [];
  updateCartCount();
  renderCart();
};

// ===== Cart Operations =====

function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;

  const cartItem = cart.find(ci => ci.item.id === id);
  if (cartItem) {
    cartItem.quantity++;
  } else {
    cart.push({ item, quantity: 1 });
  }
  updateCartCount();
  renderCart();
}

function removeFromCart(id) {
  const cartIndex = cart.findIndex(ci => ci.item.id === id);
  if (cartIndex === -1) return;

  if (cart[cartIndex].quantity > 1) {
    cart[cartIndex].quantity--;
  } else {
    cart.splice(cartIndex, 1);
  }
  updateCartCount();
  renderCart();
}

// ===== Event Listeners =====

function setupFilterButtons() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      renderMenu(btn.dataset.filter);
    });
  });
}

function setupCartToggle() {
  const cartOpenBtn = document.getElementById("cart-open-btn");
  const cartCloseBtn = document.getElementById("cart-close");
  if (!cartOpenBtn || !cartCloseBtn || !cartSidebar) return;

  cartOpenBtn.addEventListener("click", (e) => {
    e.preventDefault();
    cartSidebar.setAttribute("aria-hidden", "false");
    cartSidebar.style.transform = "translateX(0)";
  });

  cartCloseBtn.addEventListener("click", () => {
    cartSidebar.setAttribute("aria-hidden", "true");
    cartSidebar.style.transform = "translateX(100%)";
  });

  // Close cart on Escape key when open
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cartSidebar.getAttribute("aria-hidden") === "false") {
      cartSidebar.setAttribute("aria-hidden", "true");
      cartSidebar.style.transform = "translateX(100%)";
    }
  });
}

function setupOrderNowScroll() {
  const orderNowBtn = document.getElementById("order-now-btn");
  const menuSection = document.getElementById("menu");
  if (!orderNowBtn || !menuSection) return;

  orderNowBtn.addEventListener("click", () => {
    menuSection.scrollIntoView({ behavior: "smooth" });
  });
}

function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  if (!searchInput || !searchBtn) return;

  function searchMenu() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      // Show all
      renderMenu("All");
      return;
    }
    const filtered = menuItems.filter(item => item.name.toLowerCase().includes(query) || (item.description && item.description.toLowerCase().includes(query)));
    menuContainer.innerHTML = "";
    filtered.forEach(item => {
      menuContainer.appendChild(createCard(item));
    });
  }

  searchBtn.addEventListener("click", searchMenu);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      searchMenu();
    }
  });
}

function setupContactForm() {
  const form = document.getElementById("contact-form");
  const formSuccess = document.getElementById("form-success");
  if (!form || !formSuccess) return;

  const nameInput    = form.querySelector("#name");
  const emailInput   = form.querySelector("#email");
  const messageInput = form.querySelector("#message");

  const errorName    = form.querySelector("#error-name");
  const errorEmail   = form.querySelector("#error-email");
  const errorMessage = form.querySelector("#error-message");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Clear previous errors and hide any success banner
    errorName.textContent    = "";
    errorEmail.textContent   = "";
    errorMessage.textContent = "";
    formSuccess.style.display = "none";

    const nameVal    = nameInput.value.trim();
    const emailVal   = emailInput.value.trim();
    const messageVal = messageInput.value.trim();

    let valid = true;

    // Validate Name — empty check first, then length
    if (nameVal === "") {
      errorName.textContent = "Name is required.";
      valid = false;
    } else if (nameVal.length < 2) {
      errorName.textContent = "Name must be at least 2 characters.";
      valid = false;
    }

    // Validate Email — empty check first, then format
    if (emailVal === "") {
      errorEmail.textContent = "Email is required.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      errorEmail.textContent = "Please enter a valid email address.";
      valid = false;
    }

    // Validate Message — empty check first, then length
    if (messageVal === "") {
      errorMessage.textContent = "Message is required.";
      valid = false;
    } else if (messageVal.length < 10) {
      errorMessage.textContent = "Message must be at least 10 characters.";
      valid = false;
    }

    if (!valid) return;

    // Show inline success banner and reset form after 3 s
    formSuccess.style.display = "block";
    setTimeout(() => {
      form.reset();
      formSuccess.style.display = "none";
    }, 3000);
  });
}

function setupNewsletterForm() {
  const newsletterForm = document.getElementById("newsletter-form");
  if (!newsletterForm) return;
  const emailInput = newsletterForm.querySelector("#newsletter-email");

  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const emailVal = emailInput.value.trim();
    if (!emailVal || !/\S+@\S+\.\S+/.test(emailVal)) {
      alert("Please enter a valid email address.");
      return;
    }

    alert("Thank you for subscribing!");

    newsletterForm.reset();
  });
}

// ===== Initialization =====

async function init() {
  await loadMenuData();

  renderSpecials();
  renderMenu("All");
  updateCartCount();
  renderCart();

  setupFilterButtons();
  setupCartToggle();
  setupOrderNowScroll();
  setupSearch();
  setupContactForm();
  setupNewsletterForm();

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      alert("Thank you for your order! Your delicious chaat is on the way.");
      cart = [];
      updateCartCount();
      renderCart();
    });
  }
}

document.addEventListener("DOMContentLoaded", init);