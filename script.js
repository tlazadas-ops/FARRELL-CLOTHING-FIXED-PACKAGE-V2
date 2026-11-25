// ===============================
// SUPABASE CLIENT INITIALIZATION
// ===============================
const SUPABASE_URL = "https://fncmvimsrdawvaapspyt.supabase.co";
const SUPABASE_KEY = "sb_publishable_8IVztGk6akNofrqgnci04g_HekLzPZ3";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===============================
// BUILT-IN PRODUCTS CATALOG
// ===============================
let products = [
    // --- SHIRTS (5 products) ---
    { id: 1, name: "CYBERCYCLISM TEE", price: 499, oldPrice: 799, category: "Shirts", rating: 4.8, stock: 12, image: "images/item1.png" },
    { id: 2, name: "ZERUEL OVERSIZED TEE", price: 499, oldPrice: 799, category: "Shirts", rating: 4.7, stock: 8, image: "images/item2.png" },
    { id: 5, name: "SCARFACE BIGLOGO TEE", price: 449, oldPrice: 549, category: "Shirts", rating: 4.7, stock: 15, image: "images/item3.png" },
    { id: 15, name: "Y2K SHARK TEE", price: 429, oldPrice: 529, category: "Shirts", rating: 4.6, stock: 13, image: "images/item4.png" },
    { id: 17, name: "ALWAYS ON GOD TEE", price: 499, oldPrice: 699, category: "Shirts", rating: 4.8, stock: 11, image: "images/item5.png" },

    // --- JACKETS (3 products) ---
    { id: 4, name: "BE YOU COLORED JACKET", price: 999, oldPrice: 1199, category: "Jackets", rating: 4.6, stock: 7, image: "images/jacket1.png" },
    { id: 6, name: "GRAY VINTAGE JACKET", price: 1199, oldPrice: 1499, category: "Jackets", rating: 4.8, stock: 6, image: "images/jacket2.png" },
    { id: 14, name: "PLAID SHOTTAS JACKET", price: 899, oldPrice: 1099, category: "Jackets", rating: 4.9, stock: 10, image: "images/jacket3.png" },

    // --- SHORTS (3 products) ---
    { id: 12, name: "BLACK JORTS MAONG", price: 399, oldPrice: 449, category: "Shorts", rating: 4.7, stock: 16, image: "images/short1.png" },
    { id: 13, name: "BLUE JORTS MAONG", price: 349, oldPrice: 449, category: "Shorts", rating: 4.5, stock: 22, image: "images/short2.png" },
    { id: 18, name: "RAW WASH CARGO SHORTS", price: 429, oldPrice: 499, category: "Shorts", rating: 4.8, stock: 14, image: "images/short3.png" },

    // --- ACCESSORIES (4 products: Bags, Caps, Beanies) ---
    { id: 7, name: "STRETCH KEYHOLDER", price: 599, oldPrice: 699, category: "Accessories", rating: 4.6, stock: 9, image: "images/acce4.png" },
    { id: 8, name: "RUBBWE PATCH BEANIE", price: 349, oldPrice: 449, category: "Accessories", rating: 4.7, stock: 20, image: "images/acce1.png" },
    { id: 9, name: "PUPPER SLINGBAG", price: 299, oldPrice: 399, category: "Accessories", rating: 4.5, stock: 18, image: "images/acce2.png" },
    { id: 10, name: "STAINLESS STEEL OVAL BELT", price: 279, oldPrice: 349, category: "Accessories", rating: 4.8, stock: 25, image: "images/acce3.png" },

    // --- PANTS (3 products) ---
    { id: 19, name: "COZIEST SCRIPT PANTS", price: 899, oldPrice: 1199, category: "Pants", rating: 4.9, stock: 10, image: "images/pants1.png" },
    { id: 20, name: "UNDRAFTED 1600", price: 949, oldPrice: 1249, category: "Pants", rating: 4.8, stock: 12, image: "images/pants2.png" },
    { id: 21, name: "FLAME PINK PANTS", price: 879, oldPrice: 1149, category: "Pants", rating: 4.7, stock: 8, image: "images/pants3.png" }
];

// ===============================
// CART STATE
// ===============================
let cart = [];
let selectedCategory = "All";
let selectedProduct = null;

function getCurrentUsername() {
    return localStorage.getItem("currentUser");
}

// ===============================
// CART - LOAD & SAVE
// ===============================
async function loadUserCart() {
    const username = getCurrentUsername();
    if (!username) {
        // Bug 1: Restore guest cart on refresh or navigation
        try {
            const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
            cart = Array.isArray(guestCart) ? guestCart : [];
        } catch (e) {
            cart = [];
        }
        return;
    }

    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            const allCarts = JSON.parse(localStorage.getItem("userCarts")) || {};
            cart = allCarts[username] || [];
        } else {
            const { data, error } = await supabaseClient
                .from("cart_items")
                .select("*")
                .eq("user_id", user.id);

            if (error) {
                console.error("LOAD CART ERROR:", error);
                const allCarts = JSON.parse(localStorage.getItem("userCarts")) || {};
                cart = allCarts[username] || [];
            } else {
                cart = (data || []).map(item => {
                    const product = products.find(p => Number(p.id) === Number(item.product_id));
                    return {
                        id: Number(item.product_id),
                        name: product?.name || "Unknown Product",
                        price: Number(product?.price || 0),
                        quantity: Number(item.quantity),
                        size: item.size || "N/A",
                        customDesignId: item.custom_design_id || null
                    };
                });
            }
        }

        // Bug 1: Safe guest-to-authenticated cart merging
        const guestData = localStorage.getItem("guestCart");
        if (guestData) {
            try {
                const guestItems = JSON.parse(guestData) || [];
                if (Array.isArray(guestItems) && guestItems.length > 0) {
                    guestItems.forEach(gItem => {
                        const existing = cart.find(item =>
                            Number(item.id) === Number(gItem.id) &&
                            (item.size || "N/A") === (gItem.size || "N/A") &&
                            (item.customDesignId || null) === (gItem.customDesignId || null)
                        );
                        if (existing) {
                            existing.quantity += Number(gItem.quantity || 1);
                        } else {
                            cart.push(gItem);
                        }
                    });
                    localStorage.removeItem("guestCart");
                    await saveUserCart();
                }
            } catch (err) {
                console.warn("Guest cart merge error:", err);
            }
        }

        const allCarts = JSON.parse(localStorage.getItem("userCarts")) || {};
        allCarts[username] = cart;
        localStorage.setItem("userCarts", JSON.stringify(allCarts));
    } catch (error) {
        console.error("LOAD CART EXCEPTION:", error);
        const allCarts = JSON.parse(localStorage.getItem("userCarts")) || {};
        cart = allCarts[username] || [];
    }
}

async function saveUserCart() {
    const username = getCurrentUsername();
    if (!username) {
        // Bug 1: Save guest cart items to localStorage so they persist across reloads
        localStorage.setItem("guestCart", JSON.stringify(cart));
        return true;
    }

    // Save local backup immediately
    const allCarts = JSON.parse(localStorage.getItem("userCarts")) || {};
    allCarts[username] = cart;
    localStorage.setItem("userCarts", JSON.stringify(allCarts));

    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) return false;

        const { data: existingItems, error: fetchError } = await supabaseClient
            .from("cart_items")
            .select("id, product_id, size, custom_design_id")
            .eq("user_id", user.id);

        if (fetchError) {
            console.warn("CART FETCH ERROR:", fetchError);
            return false;
        }

        // Delete removed items
        for (const existing of existingItems || []) {
            const stillExists = cart.some(item =>
                Number(item.id) === Number(existing.product_id) &&
                (item.size || "N/A") === (existing.size || "N/A") &&
                (item.customDesignId || null) === (existing.custom_design_id || null)
            );

            if (!stillExists) {
                await supabaseClient.from("cart_items").delete().eq("id", existing.id);
            }
        }

        // Bug 2: Distinguish plain products from customized products.
        // Avoid overwriting separate custom designs sharing the same product ID and size.
        // Update matching rows by primary ID; insert new rows for unique combinations.
        for (const item of cart) {
            const matching = (existingItems || []).find(ex =>
                Number(ex.product_id) === Number(item.id) &&
                (ex.size || "N/A") === (item.size || "N/A") &&
                (ex.custom_design_id || null) === (item.customDesignId || null)
            );

            if (matching) {
                await supabaseClient
                    .from("cart_items")
                    .update({ quantity: Number(item.quantity) })
                    .eq("id", matching.id);
            } else {
                await supabaseClient
                    .from("cart_items")
                    .insert({
                        user_id: user.id,
                        product_id: item.id,
                        quantity: Number(item.quantity),
                        size: item.size || "N/A",
                        custom_design_id: item.customDesignId || null
                    });
            }
        }

        return true;
    } catch (error) {
        console.warn("SAVE CART EXCEPTION:", error);
        return false;
    }
}

// ===============================
// DISPLAY PRODUCTS
// ===============================
let productsLoadState = "idle"; // "idle" | "loading" | "loaded" | "error"
let productsLoadPromise = null;
let productsLoadSeq = 0;

function displayProducts(productList) {
    const productContainer = document.getElementById("products");
    if (!productContainer) return;

    productContainer.innerHTML = "";

    if (!productList || productList.length === 0) {
        if (productsLoadState === "loading") {
            productContainer.innerHTML = `<p class="no-results">Loading products...</p>`;
        } else if (productsLoadState === "error") {
            productContainer.innerHTML = `<p class="no-results">Unable to load products right now. Please refresh or try again.</p>`;
        } else {
            productContainer.innerHTML = `<p class="no-results">No products found.</p>`;
        }
        return;
    }

    productList.forEach(product => {
        productContainer.innerHTML += `
            <div class="product" onclick="openProductDetails(${product.id})">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='images/item1.png'">
                <span class="product-category">${product.category}</span>
                <h3>${product.name}</h3>
                <div class="product-rating">⭐ ${product.rating}</div>
                <div class="product-price">
                    <span class="old-price">₱${product.oldPrice}</span>
                    <span class="price">₱${product.price}</span>
                </div>
                <span class="sale-badge">🔥 SALE</span>
                <p class="stock">📦 ${product.stock} left</p>
                <button type="button" onclick="event.stopPropagation(); addToCart(${product.id})">
                    🛒 Add to Cart
                </button>
            </div>
        `;
    });
}

// ===============================
// SEARCH & CATEGORY FILTER
// ===============================
function filterProducts() {
    const searchInput = document.getElementById("search-input");
    const search = searchInput ? String(searchInput.value || "").toLowerCase().trim() : "";
    const normalizedSelected = String(selectedCategory || "All").trim().toUpperCase();

    const sourceProducts = Array.isArray(products) ? products : [];
    const filteredProducts = sourceProducts.filter(product => {
        const productName = String(product?.name || "").toLowerCase();
        const productCategory = String(product?.category || "").trim().toUpperCase();
        const matchesSearch = !search || productName.includes(search);
        const matchesCategory = normalizedSelected === "ALL" || productCategory === normalizedSelected;
        return matchesSearch && matchesCategory;
    });

    displayProducts(filteredProducts);
}

function setCategory(category) {
    selectedCategory = String(category || "All").trim() || "All";
    const normalizedSelected = selectedCategory.toUpperCase();

    document.querySelectorAll(".category").forEach(button => {
        button.classList.remove("active");
        if (button.textContent.trim().toUpperCase() === normalizedSelected) {
            button.classList.add("active");
        }
    });

    filterProducts();
}

function addToCart(productId) {
    openProductDetails(productId);
}

// ===============================
// UPDATE CART UI & QUANTITY CONTROLS
// (Fixed: index-based to eliminate duplicate-ID bugs across sizes/designs)
// ===============================
function updateCart() {
    const cartItems = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");
    const cartCountMini = document.getElementById("cart-count-mini");
    const cartTotal = document.getElementById("cart-total");

    if (!cartItems) return;

    cartItems.innerHTML = "";
    let total = 0;
    let count = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = "<p>Your cart is empty.</p>";
    }

    cart.forEach((item, index) => {
        total += Number(item.price) * Number(item.quantity);
        count += Number(item.quantity);

        cartItems.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    <p>Size: ${item.size || "N/A"}</p>
                    ${item.customDesignId ? `<p style="color:#00e5ff;font-size:12px;">✦ Custom design saved</p>` : ""}
                    <p>₱${item.price}</p>
                </div>
                <div class="quantity">
                    <button type="button" onclick="decreaseQuantity(${index})">−</button>
                    <span>${item.quantity}</span>
                    <button type="button" onclick="increaseQuantity(${index})">+</button>
                </div>
                <button type="button" class="remove-button" onclick="removeFromCart(${index})">
                    Remove
                </button>
            </div>
        `;
    });

    if (cartCount) cartCount.textContent = count;
    if (cartCountMini) cartCountMini.textContent = count;
    if (cartTotal) cartTotal.textContent = total.toLocaleString();
}

async function increaseQuantity(index) {
    if (index < 0 || index >= cart.length) return;
    cart[index].quantity++;
    updateCart();
    await saveUserCart();
}

async function decreaseQuantity(index) {
    if (index < 0 || index >= cart.length) return;
    cart[index].quantity--;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCart();
    await saveUserCart();
}

async function removeFromCart(index) {
    if (index < 0 || index >= cart.length) return;
    cart.splice(index, 1);
    updateCart();
    await saveUserCart();
}

function openCart() {
    const modal = document.getElementById("cart-modal");
    if (modal) modal.style.display = "block";
    updateCart();
}

function closeCart() {
    const modal = document.getElementById("cart-modal");
    if (modal) modal.style.display = "none";
}

// ===============================
// PRODUCT DETAILS MODAL
// ===============================
function openProductDetails(productId) {
    selectedProduct = products.find(product => Number(product.id) === Number(productId));
    if (!selectedProduct) return;

    const detailImage = document.getElementById("detail-image");
    const detailName = document.getElementById("detail-name");
    const detailPrice = document.getElementById("detail-price");
    const detailDescription = document.getElementById("detail-description");
    const detailRating = document.getElementById("detail-rating");
    const detailStock = document.getElementById("detail-stock");
    const detailQuantity = document.getElementById("detail-quantity");
    const sizeSelect = document.getElementById("detail-size");
    const addToCartButton = document.querySelector("#product-modal button[onclick*='addDetailedProductToCart']");

    if (detailImage) detailImage.src = selectedProduct.image;
    if (detailName) detailName.textContent = selectedProduct.name;
    if (detailPrice) {
        detailPrice.innerHTML = `
            <span class="old-price">₱${selectedProduct.oldPrice}</span>
            <span class="detail-sale-price">₱${selectedProduct.price}</span>
            <span class="sale-badge">🔥 SALE</span>
        `;
    }
    if (detailDescription) detailDescription.textContent = "Comfortable and stylish clothing perfect for everyday wear.";
    if (detailRating) detailRating.textContent = "⭐ " + selectedProduct.rating;

    // Bug 3: Stock validation and visual indicator
    const currentStock = Number(selectedProduct.stock || 0);
    if (detailStock) {
        if (currentStock <= 0) {
            detailStock.innerHTML = '<span style="color:#ff3366;font-weight:bold;">⚠️ Out of Stock</span>';
        } else {
            detailStock.textContent = "📦 " + currentStock + " items left";
        }
    }
    if (detailQuantity) {
        detailQuantity.value = 1;
        detailQuantity.max = currentStock > 0 ? currentStock : 1;
        detailQuantity.disabled = currentStock <= 0;
    }
    if (addToCartButton) {
        if (currentStock <= 0) {
            addToCartButton.disabled = true;
            addToCartButton.textContent = "Out of Stock";
            addToCartButton.style.opacity = "0.5";
            addToCartButton.style.cursor = "not-allowed";
        } else {
            addToCartButton.disabled = false;
            addToCartButton.textContent = "🛒 Add to Cart";
            addToCartButton.style.opacity = "1";
            addToCartButton.style.cursor = "pointer";
        }
    }

    // Bug 4: Correct size options for Accessories vs Apparel
    if (sizeSelect) {
        if (selectedProduct.category === "Accessories") {
            sizeSelect.innerHTML = '<option value="One Size (OS)">One Size (OS)</option>';
        } else {
            sizeSelect.innerHTML = `
                <option value="S">Small (S)</option>
                <option value="M">Medium (M)</option>
                <option value="L">Large (L)</option>
                <option value="XL">Extra Large (XL)</option>
            `;
        }
    }

    const customizeButton = document.getElementById("customize-product-button");
    if (customizeButton) {
        customizeButton.style.display = selectedProduct.category === "Shirts" ? "block" : "none";
    }

    loadReviews(selectedProduct.id);
    updateReviewEligibility(selectedProduct.id);

    const modal = document.getElementById("product-modal");
    if (modal) modal.style.display = "block";
}

function openProductCustomizer() {
    if (!selectedProduct || selectedProduct.category !== "Shirts") return;
    window.location.href = `customize.html?productId=${encodeURIComponent(selectedProduct.id)}`;
}

function closeProductDetails() {
    const modal = document.getElementById("product-modal");
    if (modal) modal.style.display = "none";
}

async function addDetailedProductToCart() {
    if (!selectedProduct) {
        alert("Please select a product.");
        return;
    }

    // Bug 3: Prevent adding products with zero stock
    const currentStock = Number(selectedProduct.stock || 0);
    if (currentStock <= 0) {
        alert(`"${selectedProduct.name}" is currently out of stock.`);
        return;
    }

    const sizeElement = document.getElementById("detail-size");
    const quantityElement = document.getElementById("detail-quantity");

    if (!sizeElement || !quantityElement) return;

    const size = sizeElement.value;
    const quantity = parseInt(quantityElement.value, 10);

    if (!size) {
        alert("Please select a size.");
        return;
    }

    if (isNaN(quantity) || quantity < 1) {
        alert("Please enter a valid quantity.");
        return;
    }

    // Bug 3: Prevent adding quantities exceeding available inventory (including existing cart quantity)
    const currentQtyInCart = cart
        .filter(item => Number(item.id) === Number(selectedProduct.id))
        .reduce((sum, item) => sum + Number(item.quantity), 0);

    if (currentQtyInCart + quantity > currentStock) {
        const availableToAdd = currentStock - currentQtyInCart;
        if (availableToAdd <= 0) {
            alert(`You already have all available items (${currentStock}) for "${selectedProduct.name}" in your cart.`);
        } else {
            alert(`Cannot add ${quantity} more. Only ${availableToAdd} items left in stock (you already have ${currentQtyInCart} in your cart).`);
        }
        return;
    }

    // Match only non-custom items with identical ID and size
    const existingItem = cart.find(item =>
        Number(item.id) === Number(selectedProduct.id) &&
        (item.size || "N/A") === size &&
        !item.customDesignId
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            quantity: quantity,
            size: size
        });
    }

    updateCart();
    await saveUserCart();
    closeProductDetails();
    showCartAdded();
    playNotificationSound();
}

// ===============================
// CHECKOUT & ORDERS
// ===============================
async function openCheckout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const currentUsername = localStorage.getItem("currentUser");
    if (!currentUsername) {
        alert("Please login before checkout.");
        openAccount();
        return;
    }

    closeCart();

    const customerName = document.getElementById("customer-name");
    const contact = document.getElementById("contact");
    const address = document.getElementById("address");
    const payment = document.getElementById("payment");

    const profiles = JSON.parse(localStorage.getItem("profiles")) || {};
    const localProfile = profiles[currentUsername] || {};

    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    const checkoutTotal = document.getElementById("checkout-total");

    let subscriberDiscount = 0;
    let savedName = localProfile.name || "";
    let savedContact = localProfile.contact || localStorage.getItem("profileContact_" + currentUsername) || "";
    let savedAddress = localProfile.address || localStorage.getItem("profileAddress_" + currentUsername) || "";
    let savedPayment = localProfile.payment || localStorage.getItem("profilePayment_" + currentUsername) || "";

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            const [vipRes, profileRes, latestOrderRes] = await Promise.all([
                supabaseClient
                    .from("subscriptions")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("status", "approved")
                    .limit(1),
                supabaseClient
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .maybeSingle(),
                supabaseClient
                    .from("orders")
                    .select("name, contact, address, payment")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle()
            ]);

            if (vipRes?.data?.length) {
                subscriberDiscount = total * 0.10;
            }

            const dbProfile = (!profileRes?.error && profileRes?.data) ? profileRes.data : {};
            const latestOrder = (!latestOrderRes?.error && latestOrderRes?.data) ? latestOrderRes.data : {};
            const meta = user.user_metadata || {};

            // Pre-fill from saved profile first, then account metadata / most recent order
            if (!savedName) {
                savedName = dbProfile.full_name || dbProfile.name || meta.name || latestOrder.name || dbProfile.username || "";
            }
            if (!savedContact) {
                savedContact = dbProfile.contact || dbProfile.phone || meta.contact || meta.phone || latestOrder.contact || "";
            }
            if (!savedAddress) {
                savedAddress = dbProfile.address || meta.address || latestOrder.address || "";
            }
            if (!savedPayment) {
                savedPayment = dbProfile.payment || dbProfile.preferred_payment || latestOrder.payment || "";
            }
        }
    } catch (error) {
        console.warn("Could not load saved checkout details:", error.message);
    }

    if (customerName) customerName.value = savedName;
    if (contact) contact.value = savedContact;
    if (address) address.value = savedAddress;
    if (payment) payment.value = savedPayment;

    const displayedTotal = total - subscriberDiscount;
    if (checkoutTotal) checkoutTotal.textContent = displayedTotal.toLocaleString("en-PH", { maximumFractionDigits: 2 });

    let discountNote = document.getElementById("checkout-discount-note");
    if (!discountNote && checkoutTotal) {
        discountNote = document.createElement("small");
        discountNote.id = "checkout-discount-note";
        checkoutTotal.parentElement.appendChild(discountNote);
    }
    if (discountNote) {
        discountNote.textContent = subscriberDiscount > 0 ? "VIP approved: 10% discount applied." : "";
    }

    const checkoutItems = document.getElementById("checkout-items");
    if (checkoutItems) {
        checkoutItems.innerHTML = "";
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            checkoutItems.innerHTML += `
                <div class="checkout-item">
                    <strong>${item.name}</strong>
                    <p>Size: ${item.size || "N/A"}</p>
                    <p>Quantity: ${item.quantity}</p>
                    <p>₱${itemTotal.toLocaleString()}</p>
                </div>
            `;
        });
    }

    const checkoutModal = document.getElementById("checkout-modal");
    if (checkoutModal) checkoutModal.style.display = "block";
}

function closeCheckout() {
    const modal = document.getElementById("checkout-modal");
    if (modal) modal.style.display = "none";
}

document.addEventListener("DOMContentLoaded", function() {
    const checkoutForm = document.getElementById("checkout-form");
    if (!checkoutForm) return;

    checkoutForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        event.stopPropagation();

        const nameElement = document.getElementById("customer-name");
        const contactElement = document.getElementById("contact");
        const addressElement = document.getElementById("address");
        const paymentElement = document.getElementById("payment");
        const totalElement = document.getElementById("checkout-total");

        if (!nameElement || !contactElement || !addressElement || !paymentElement || !totalElement) {
            alert("Checkout information is incomplete.");
            return;
        }

        const name = nameElement.value.trim();
        const contact = contactElement.value.trim();
        const address = addressElement.value.trim();
        const payment = paymentElement.value;
        const total = Number(totalElement.textContent.replace(/,/g, "").trim());

        if (!name || !contact || !address || !payment) {
            alert("Please fill in all checkout fields.");
            return;
        }

        if (!Number.isFinite(total) || total <= 0) {
            alert("Invalid order total.");
            return;
        }

        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        const currentUsername = localStorage.getItem("currentUser");
        if (!currentUsername) {
            alert("Please login before placing an order.");
            openAccount();
            return;
        }

        const submitButton = checkoutForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Processing Order...";
        }

        const orderItems = cart.map(item => ({
            id: item.id,
            name: item.name,
            size: item.size || "N/A",
            quantity: Number(item.quantity),
            price: Number(item.price),
            customDesignId: item.customDesignId || null
        }));

        try {
            // Bug 3: Revalidate stock inventory before order submission
            const productIds = [...new Set(cart.map(item => Number(item.id)))];
            const { data: dbProducts, error: stockCheckError } = await supabaseClient
                .from("products")
                .select("id, name, stock")
                .in("id", productIds);

            if (!stockCheckError && dbProducts) {
                for (const item of cart) {
                    const dbProd = dbProducts.find(p => Number(p.id) === Number(item.id));
                    if (dbProd) {
                        const totalRequested = cart
                            .filter(i => Number(i.id) === Number(item.id))
                            .reduce((sum, i) => sum + Number(i.quantity), 0);
                        if (dbProd.stock <= 0) {
                            alert(`Sorry, "${dbProd.name}" is now out of stock.`);
                            return;
                        }
                        if (totalRequested > dbProd.stock) {
                            alert(`Sorry, "${dbProd.name}" only has ${dbProd.stock} available in stock, but you have ${totalRequested} in your order.`);
                            return;
                        }
                    }
                }
            }

            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                throw new Error("Please login before placing an order.");
            }

            const { data: placedOrder, error: placeError } = await supabaseClient.rpc("place_farrell_order", {
                p_name: name,
                p_contact: contact,
                p_address: address,
                p_payment: payment,
                p_items: orderItems.map(item => ({
                    product_id: Number(item.id),
                    quantity: Number(item.quantity),
                    size: item.size || "N/A",
                    custom_design_id: item.customDesignId || null
                }))
            });

            if (placeError) throw placeError;

            const insertedOrder = placedOrder;
            const orderID = insertedOrder.order_id;
            const finalTotal = Number(insertedOrder.total);

            const backendOrder = {
                orderID: insertedOrder.order_id,
                username: currentUsername,
                name: name,
                contact: contact,
                address: address,
                payment: payment,
                items: orderItems,
                status: insertedOrder.status
            };

            const orders = JSON.parse(localStorage.getItem("orders")) || [];
            orders.push({
                ...backendOrder,
                total: finalTotal.toLocaleString("en-PH", { maximumFractionDigits: 2 }),
                date: new Date().toLocaleString()
            });
            localStorage.setItem("orders", JSON.stringify(orders));

            const orderIdElement = document.getElementById("order-id");
            const orderCustomer = document.getElementById("order-customer");
            const orderPayment = document.getElementById("order-payment");
            const orderTotal = document.getElementById("order-total");

            if (orderIdElement) orderIdElement.textContent = orderID;
            if (orderCustomer) orderCustomer.textContent = name;
            if (orderPayment) orderPayment.textContent = payment;
            if (orderTotal) orderTotal.textContent = finalTotal.toLocaleString("en-PH", { maximumFractionDigits: 2 });

            cart = [];
            await saveUserCart();
            updateCart();
            closeCheckout();

            const successModal = document.getElementById("success-modal");
            if (successModal) successModal.style.display = "block";

            checkoutForm.reset();
            playNotificationSound();
            showNeonPopup("✅ Order placed successfully!");
        } catch (error) {
            console.error("ORDER ERROR:", error);
            alert("Hindi na-place ang order.\n\n" + (error.message || "Please try again."));
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Place Order";
            }
        }
    });
});

function closeSuccess() {
    const modal = document.getElementById("success-modal");
    if (modal) modal.style.display = "none";
}

function closeOrders() {
    const modal = document.getElementById("orders-modal");
    if (modal) modal.style.display = "none";
}

// ===============================
// ORDER TRACKING & MY ORDERS (Revision 1 Redesign)
// ===============================
async function syncCustomerOrdersWithBackend() {
    const currentUsername = localStorage.getItem("currentUser");
    if (!currentUsername) return [];

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return [];

        const { data: supaOrders, error } = await supabaseClient
            .from("orders")
            .select("*")
            .eq("user_id", user.id)
            .is("archived_at", null)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const orderIds = (supaOrders || []).map(order => order.id);
        let itemRows = [];
        if (orderIds.length) {
            const { data, error: itemError } = await supabaseClient
                .from("order_items")
                .select("*")
                .in("order_id", orderIds);
            if (itemError) throw itemError;
            itemRows = data || [];
        }

        const mappedOrders = (supaOrders || []).map(order => ({
            orderID: order.order_id || ("Order #" + order.id),
            username: currentUsername,
            name: order.name,
            contact: order.contact,
            address: order.address,
            payment: order.payment,
            items: itemRows.filter(item => item.order_id === order.id).map(item => {
                const prod = products.find(p => Number(p.id) === Number(item.product_id));
                return {
                    id: item.product_id,
                    name: item.product_name || prod?.name || "Product",
                    image: prod?.image || "images/item1.png",
                    size: item.size || "N/A",
                    quantity: Number(item.quantity || 1),
                    price: Number(item.price || 0),
                    customDesignId: item.custom_design_id || null
                };
            }),
            status: order.status || "Order Received",
            total: Number(order.total || 0).toLocaleString("en-PH", { maximumFractionDigits: 2 }),
            date: order.created_at ? new Date(order.created_at).toLocaleString() : "Date unavailable",
            created_at: order.created_at,
            delivered_date: order.delivered_at ? new Date(order.delivered_at).toLocaleString() : (order.status === "Delivered" ? new Date(order.updated_at || order.created_at).toLocaleString() : null)
        }));

        localStorage.setItem("orders", JSON.stringify(mappedOrders));
        return mappedOrders;
    } catch (error) {
        console.warn("Could not sync customer orders:", error);
        const allLocalOrders = JSON.parse(localStorage.getItem("orders")) || [];
        return allLocalOrders
            .filter(order => order.username && order.username.toLowerCase() === currentUsername.toLowerCase())
            .sort((a, b) => new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime());
    }
}

async function showOrders() {
    const ordersList = document.getElementById("orders-list");
    if (!ordersList) return;

    ordersList.innerHTML = `<p class="orders-loading-msg">🔄 Checking latest order status...</p>`;
    const orders = await syncCustomerOrdersWithBackend();
    ordersList.innerHTML = "";

    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div class="no-orders-box">
                <span style="font-size:36px;display:block;margin-bottom:8px">🛍️</span>
                <h3>No orders yet</h3>
                <p>When you place an order, its tracking progression and product details will appear here.</p>
            </div>
        `;
    } else {
        // Sort newest orders first
        const sortedOrders = orders.slice().sort((a, b) => {
            const timeA = new Date(a.created_at || a.date || 0).getTime();
            const timeB = new Date(b.created_at || b.date || 0).getTime();
            return timeB - timeA;
        });

        sortedOrders.forEach(order => {
            const isCancelled = order.status === "Cancelled";
            const statuses = ["Order Received", "Processing", "Shipped", "Delivered"];
            const currentIndex = statuses.indexOf(order.status);

            // Vertical Timeline Progression
            let timelineHTML = "";
            if (isCancelled) {
                timelineHTML = `
                    <div class="my-order-cancelled-box">
                        <span class="cancelled-icon">⚠️</span>
                        <div class="cancelled-text">
                            <strong>Order Cancelled</strong>
                            <p>This order was cancelled. Please contact customer support or place a new order.</p>
                        </div>
                    </div>
                `;
            } else {
                const steps = [
                    { title: "Order Received", sub: "Order placed & confirmed in system", icon: "✓" },
                    { title: "Processing", sub: "Garments selected, printed & packed", icon: "⚡" },
                    { title: "Shipped", sub: "Dispatched & in transit with courier", icon: "🚚" },
                    { title: "Delivered", sub: "Successfully delivered to your address", icon: "📦" }
                ];

                timelineHTML = `
                    <div class="my-order-timeline">
                        ${steps.map((st, i) => {
                            const isCompleted = currentIndex >= i;
                            const isCurrent = currentIndex === i;
                            const stateClass = isCurrent ? "current" : (isCompleted ? "completed" : "pending");
                            return `
                                <div class="timeline-row ${stateClass}">
                                    <div class="timeline-indicator-wrap">
                                        <div class="timeline-node">${isCompleted ? st.icon : (i + 1)}</div>
                                        ${i < steps.length - 1 ? `<div class="timeline-stem ${currentIndex > i ? 'active' : ''}"></div>` : ''}
                                    </div>
                                    <div class="timeline-desc">
                                        <div class="timeline-title-wrap">
                                            <strong class="timeline-step-title">${st.title}</strong>
                                            ${isCurrent ? '<span class="status-current-badge">CURRENT STATUS</span>' : ''}
                                        </div>
                                        <small class="timeline-step-sub">${st.sub}</small>
                                        ${i === 3 && isCompleted && order.delivered_date ? `<span class="delivered-date-tag">🎉 Delivered: ${order.delivered_date}</span>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join("")}
                    </div>
                `;
            }

            // Products list with thumbnail, size, quantity, and prices
            let itemsHTML = "";
            if (order.items && order.items.length > 0) {
                itemsHTML = order.items.map(item => {
                    const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
                    return `
                        <div class="my-order-product-card">
                            <img src="${item.image || 'images/item1.png'}" alt="${item.name}" class="order-item-thumb" onerror="this.src='images/item1.png'">
                            <div class="order-item-details">
                                <h4 class="order-item-name">${item.name}</h4>
                                <div class="order-item-meta">
                                    <span class="item-meta-pill">Size: <b>${item.size || 'OS'}</b></span>
                                    <span class="item-meta-pill">Qty: <b>${item.quantity}</b></span>
                                    ${item.customDesignId ? '<span class="item-meta-pill custom-badge">✦ Custom Design</span>' : ''}
                                </div>
                            </div>
                            <div class="order-item-pricing">
                                <div class="order-item-total">₱${itemTotal.toLocaleString()}</div>
                                <small class="order-item-unit">₱${Number(item.price).toLocaleString()} ea</small>
                            </div>
                        </div>
                    `;
                }).join("");
            } else {
                itemsHTML = `<p class="no-items-text">No product details found for this order.</p>`;
            }

            const statusClass = (order.status || 'received').toLowerCase().replace(/\s+/g, '-');

            ordersList.innerHTML += `
                <article class="my-order-card">
                    <div class="my-order-header">
                        <div>
                            <span class="order-tracking-label">ORDER DETAILS</span>
                            <h3 class="order-id-title">🛍️ ${order.orderID}</h3>
                            <span class="order-placed-date">📅 Placed on: ${order.date || "Date unavailable"}</span>
                        </div>
                        <span class="my-order-status-badge status-${statusClass}">
                            ${order.status || "Order Received"}
                        </span>
                    </div>

                    <!-- ORDER STATUS TIMELINE -->
                    <div class="my-order-section">
                        <span class="section-micro-label">ORDER PROGRESS TRACKING</span>
                        ${timelineHTML}
                    </div>

                    <!-- ORDERED PRODUCTS -->
                    <div class="my-order-section">
                        <span class="section-micro-label">ORDERED PRODUCTS (${order.items ? order.items.length : 0})</span>
                        <div class="my-order-products-list">
                            ${itemsHTML}
                        </div>
                    </div>

                    <!-- CUSTOMER & PAYMENT DETAILS -->
                    <div class="my-order-summary-grid">
                        <div class="summary-cell">
                            <small>CUSTOMER NAME</small>
                            <strong>${order.name || "—"}</strong>
                        </div>
                        <div class="summary-cell">
                            <small>CONTACT NUMBER</small>
                            <span>${order.contact || "—"}</span>
                        </div>
                        <div class="summary-cell">
                            <small>PAYMENT METHOD</small>
                            <span>${order.payment || "—"}</span>
                        </div>
                        <div class="summary-cell">
                            <small>TOTAL AMOUNT</small>
                            <strong class="order-total-price">₱${order.total}</strong>
                        </div>
                        <div class="summary-cell full-width">
                            <small>DELIVERY ADDRESS</small>
                            <span class="delivery-address-text">${order.address || "—"}</span>
                        </div>
                    </div>
                </article>
            `;
        });
    }

    const modal = document.getElementById("orders-modal");
    if (modal) modal.style.display = "block";
}

// ===============================
// REVIEWS SYSTEM
// ===============================
let eligibleReviewOrderItemId = null;

async function updateReviewEligibility(productId) {
    const reviewForm = document.getElementById("review-form");
    const lockedMessage = document.getElementById("review-locked-message");
    if (!reviewForm || !lockedMessage) return;

    eligibleReviewOrderItemId = null;
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        reviewForm.style.display = "none";
        lockedMessage.style.display = "block";
        lockedMessage.innerHTML = "🔒 Please log in and receive this product before leaving a review.";
        return;
    }

    const { data: deliveredOrders, error } = await supabaseClient
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "Delivered")
        .is("archived_at", null);

    if (error || !deliveredOrders?.length) {
        reviewForm.style.display = "none";
        lockedMessage.style.display = "block";
        lockedMessage.innerHTML = '🔒 You can rate this product once your order for it says <strong>"Delivered"</strong> in My Orders.';
        return;
    }

    const { data: items, error: itemError } = await supabaseClient
        .from("order_items")
        .select("id, product_id")
        .in("order_id", deliveredOrders.map(o => o.id))
        .eq("product_id", Number(productId));

    if (!itemError && items?.length) eligibleReviewOrderItemId = items[0].id;
    reviewForm.style.display = eligibleReviewOrderItemId ? "block" : "none";
    lockedMessage.style.display = eligibleReviewOrderItemId ? "none" : "block";
}

async function loadReviews(productId) {
    const reviewsList = document.getElementById("reviews-list");
    if (!reviewsList) return;

    reviewsList.innerHTML = "<p>Loading reviews...</p>";
    const { data, error } = await supabaseClient
        .from("reviews")
        .select("rating, comment, created_at, is_verified")
        .eq("product_id", Number(productId))
        .order("created_at", { ascending: false });

    if (error) {
        reviewsList.innerHTML = `<p>Could not load reviews: ${String(error.message).replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))}</p>`;
        return;
    }

    if (!data?.length) {
        reviewsList.innerHTML = "<p>No reviews yet.</p>";
        return;
    }

    reviewsList.innerHTML = data.map(review => {
        const comment = String(review.comment || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
        const date = review.created_at ? new Date(review.created_at).toLocaleDateString() : "";
        return `<div class="review-card">
            <div class="review-stars">${"⭐".repeat(Number(review.rating) || 0)}</div>
            <p>${comment}</p>
            <small>${date} ${review.is_verified ? "· ✓ Verified Purchase" : ""}</small>
        </div>`;
    }).join("");
}

async function addReview() {
    if (!selectedProduct) return;
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert("Please log in first.");
        openAccount();
        return;
    }

    if (!eligibleReviewOrderItemId) {
        await updateReviewEligibility(selectedProduct.id);
        if (!eligibleReviewOrderItemId) {
            alert("A delivered order is required to review this product.");
            return;
        }
    }

    const rating = Number(document.getElementById("review-rating")?.value);
    const comment = document.getElementById("review-text")?.value.trim() || "";

    if (!rating || rating < 1 || rating > 5) {
        alert("Please select a rating.");
        return;
    }
    if (!comment) {
        alert("Please write a review.");
        return;
    }

    // Bug 7: Prevent double submission of reviews
    const submitBtn = document.querySelector("#review-form button");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting Review...";
    }

    try {
        const { error } = await supabaseClient.rpc("submit_verified_review", {
            p_product_id: Number(selectedProduct.id),
            p_rating: rating,
            p_comment: comment,
            p_order_item_id: eligibleReviewOrderItemId
        });

        if (error) {
            alert("Could not submit review: " + error.message);
            return;
        }

        document.getElementById("review-rating").value = "";
        document.getElementById("review-text").value = "";
        await loadReviews(selectedProduct.id);
        await loadCommunityReviews();
        showNeonPopup("Verified review submitted! ⭐");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Review";
        }
    }
}

// ===============================
// USER PROFILE (Fixed: synchronized storage keys)
// ===============================
function saveProfile() {
    const currentUsername = getCurrentUsername();
    if (!currentUsername) {
        alert("Please login first.");
        return;
    }

    const nameElement = document.getElementById("profile-name");
    const contactElement = document.getElementById("profile-contact");
    const addressElement = document.getElementById("profile-address");
    const paymentElement = document.getElementById("profile-payment");

    if (!nameElement || !contactElement || !addressElement || !paymentElement) return;

    const profile = {
        name: nameElement.value.trim(),
        contact: contactElement.value.trim(),
        address: addressElement.value.trim(),
        payment: paymentElement.value
    };

    const profiles = JSON.parse(localStorage.getItem("profiles")) || {};
    profiles[currentUsername] = profile;
    localStorage.setItem("profiles", JSON.stringify(profiles));

    // Also populate individual keys for fallback compatibility
    localStorage.setItem("profileContact_" + currentUsername, profile.contact);
    localStorage.setItem("profileAddress_" + currentUsername, profile.address);
    localStorage.setItem("profilePayment_" + currentUsername, profile.payment);

    showNeonPopup("✅ Profile saved successfully!");
}

function openProfile() {
    const currentUsername = getCurrentUsername();
    if (!currentUsername) {
        alert("Please login first.");
        openAccount();
        return;
    }

    const profiles = JSON.parse(localStorage.getItem("profiles")) || {};
    const profile = profiles[currentUsername] || {};

    const nameElement = document.getElementById("profile-name");
    const contactElement = document.getElementById("profile-contact");
    const addressElement = document.getElementById("profile-address");
    const paymentElement = document.getElementById("profile-payment");

    if (nameElement) nameElement.value = profile.name || "";
    if (contactElement) contactElement.value = profile.contact || localStorage.getItem("profileContact_" + currentUsername) || "";
    if (addressElement) addressElement.value = profile.address || localStorage.getItem("profileAddress_" + currentUsername) || "";
    if (paymentElement) paymentElement.value = profile.payment || localStorage.getItem("profilePayment_" + currentUsername) || "";

    const modal = document.getElementById("profile-modal");
    if (modal) modal.style.display = "flex";
}

function closeProfile() {
    const modal = document.getElementById("profile-modal");
    if (modal) modal.style.display = "none";
}

// ===============================
// NOTIFICATIONS & EFFECTS
// ===============================
function showNeonPopup(message) {
    let popup = document.getElementById("neon-popup");
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "neon-popup";
        document.body.appendChild(popup);
    }

    popup.textContent = message;
    popup.classList.remove("show");
    void popup.offsetWidth;
    popup.classList.add("show");

    setTimeout(() => {
        popup.classList.remove("show");
    }, 1800);
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(700, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.12);

        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log("Notification sound unavailable.");
    }
}

document.addEventListener("click", function(event) {
    const button = event.target.closest("button");
    if (!button) return;

    button.classList.remove("neon-click");
    void button.offsetWidth;
    button.classList.add("neon-click");

    setTimeout(() => {
        button.classList.remove("neon-click");
    }, 350);
});

async function loadCommunityReviews() {
    const container = document.getElementById("community-reviews-grid");
    if (!container) return;

    const { data, error } = await supabaseClient
        .from("reviews")
        .select("rating, comment, created_at, is_verified, products(name)")
        .order("created_at", { ascending: false })
        .limit(8);

    if (error) {
        console.warn("Community reviews unavailable:", error.message);
        return;
    }
    if (!data?.length) return;

    container.innerHTML = data.map(review => {
        const safe = value => String(value || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
        const name = safe(review.products?.name || "FARRELL CLOTHING");
        const comment = safe(review.comment);
        const date = review.created_at ? new Date(review.created_at).toLocaleDateString() : "";
        return `
            <article class="review-card">
                <div class="review-header">
                    <div class="reviewer-meta">
                        <div class="reviewer-avatar">✓</div>
                        <div>
                            <div class="reviewer-name">VERIFIED CUSTOMER</div>
                            <small>${date}</small>
                        </div>
                    </div>
                    <div class="review-stars">${"★".repeat(Number(review.rating) || 0)}</div>
                </div>
                <p class="review-body">${comment}</p>
                <span class="review-product-tag">${name}${review.is_verified ? " • VERIFIED PURCHASE" : ""}</span>
            </article>
        `;
    }).join("");
}

// ===============================
// VIP NEWSLETTER SUBSCRIPTION
// ===============================
async function handleSubscribe(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const emailInput = form.querySelector('input[type="email"]');
    const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');
    const email = emailInput?.value.trim();
    if (!email) return;

    // Bug 7: Prevent double submission of subscriptions
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Subscribing...";
    }

    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            alert("Please log in first before subscribing.");
            openAccount();
            return;
        }

        const { error } = await supabaseClient.from("subscriptions").insert({
            user_id: user.id,
            email,
            status: "pending"
        });

        if (error) {
            if (error.code === "23505") throw new Error("You already have a pending or approved subscription.");
            throw error;
        }

        form.reset();
        alert("Subscription request submitted! Your 10% discount will be available only after admin approval.");
    } catch (error) {
        alert("Could not submit subscription: " + (error.message || "Please try again."));
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Subscribe";
        }
    }
}

// ===============================
// AUTHENTICATION & ACCOUNTS
// (Fixed: allows visitors to close modal / browse as guest)
// ===============================
function openAccount() {
    const loginPage = document.getElementById("login-page");
    if (!loginPage) return;

    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
        showAccountInfo();
    } else {
        loginPage.style.display = "flex";
        showLogin();
    }
}

function showLogin() {
    const loginSection = document.getElementById("login-section");
    const registerSection = document.getElementById("register-section");
    if (loginSection) loginSection.style.display = "block";
    if (registerSection) registerSection.style.display = "none";
}

function showRegister() {
    const loginSection = document.getElementById("login-section");
    const registerSection = document.getElementById("register-section");
    if (loginSection) loginSection.style.display = "none";
    if (registerSection) registerSection.style.display = "block";
}

function closeAccountPage() {
    const loginPage = document.getElementById("login-page");
    if (loginPage) loginPage.style.display = "none";
}

function forgotPassword() {
    alert("Password recovery will be available soon.");
}

async function loginUser() {
    const email = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error || !data.user) {
        alert("Login failed: " + (error?.message || "Please try again."));
        return;
    }

    const username = data.user.user_metadata?.username || data.user.email.split("@")[0];
    localStorage.setItem("currentUser", username);

    showNeonPopup("Login successful! 👋");

    try {
        await loadUserCart();
        updateCart();
    } catch (uiError) {
        console.error("POST-LOGIN ERROR:", uiError);
    }

    closeAccountPage();
}

async function registerUser() {
    const name = document.getElementById("register-name").value.trim();
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const confirm = document.getElementById("register-confirm").value;

    if (!name || !username || !email || !password || !confirm) {
        alert("Please fill in all fields.");
        return;
    }

    if (password !== confirm) {
        alert("Passwords do not match.");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    try {
        const { error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    name: name
                }
            }
        });

        if (error) {
            alert("Registration failed: " + error.message);
            return;
        }

        localStorage.setItem("currentUser", username);
        await loadUserCart();
        updateCart();

        showNeonPopup("Account created successfully! 🎉");
        closeAccountPage();
    } catch (error) {
        alert("Registration error: " + error.message);
    }
}

async function showAccountInfo() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error || !user) {
            openAccount();
            return;
        }

        const { data: profile } = await supabaseClient
            .from("profiles")
            .select("username, role")
            .eq("id", user.id)
            .maybeSingle();

        const username = profile?.username || user.user_metadata?.username || user.email?.split("@")[0];
        const name = user.user_metadata?.name || username;

        localStorage.setItem("currentUser", username);

        const nameElement = document.getElementById("profile-name");
        const contactElement = document.getElementById("profile-contact");
        const addressElement = document.getElementById("profile-address");
        const paymentElement = document.getElementById("profile-payment");

        const profiles = JSON.parse(localStorage.getItem("profiles")) || {};
        const storedProfile = profiles[username] || {};

        if (nameElement) nameElement.value = name;
        if (contactElement) contactElement.value = storedProfile.contact || localStorage.getItem("profileContact_" + username) || "";
        if (addressElement) addressElement.value = storedProfile.address || localStorage.getItem("profileAddress_" + username) || "";
        if (paymentElement) paymentElement.value = storedProfile.payment || localStorage.getItem("profilePayment_" + username) || "";

        const modal = document.getElementById("profile-modal");
        if (modal) modal.style.display = "flex";
    } catch (error) {
        console.error("ACCOUNT ERROR:", error);
        alert("Account error: " + error.message);
    }
}

async function logoutUser() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            alert("Logout failed: " + error.message);
            return;
        }

        localStorage.removeItem("currentUser");
        cart = [];
        alert("You have been logged out. 👋");
        location.reload();
    } catch (error) {
        console.error("LOGOUT ERROR:", error);
        alert("Logout error: " + error.message);
    }
}

// ===============================
// LIVE STORE CATALOG & FLASH SALE
// (Fixed: preserves product category & rating in Flash Sale)
// ===============================
async function loadStoreProducts(options = {}) {
    const force = Boolean(options && options.force);
    if (productsLoadPromise && !force) {
        return productsLoadPromise;
    }

    const requestSeq = ++productsLoadSeq;
    productsLoadState = "loading";

    const run = (async () => {
        try {
            const { data, error } = await supabaseClient
                .from("products")
                .select("*")
                .order("id", { ascending: true });

            if (error) throw error;
            if (requestSeq !== productsLoadSeq) return products;

            if (Array.isArray(data)) {
                const activeRows = data.filter(row => row.is_active !== false);
                const localImages = new Map(
                    (Array.isArray(products) ? products : []).map(p => [Number(p.id), p.image])
                );

                products = activeRows.map(row => ({
                    id: Number(row.id),
                    name: String(row.name || ""),
                    price: Number(row.price || 0),
                    oldPrice: Number(row.old_price || row.price || 0),
                    category: String(row.category || "Other").trim() || "Other",
                    rating: Number(row.rating || 0),
                    stock: Number(row.stock || 0),
                    image: row.image || localImages.get(Number(row.id)) || "images/item1.png"
                }));
                productsLoadState = "loaded";
            } else {
                productsLoadState = "error";
                console.error("LOAD STORE PRODUCTS ERROR: Unexpected response format", data);
            }
        } catch (error) {
            if (requestSeq !== productsLoadSeq) return products;
            productsLoadState = "error";
            console.error("LOAD STORE PRODUCTS ERROR:", error);
        } finally {
            if (requestSeq === productsLoadSeq) {
                productsLoadPromise = null;
            }
        }
        return products;
    })();

    productsLoadPromise = run;
    return run;
}

async function loadFlashSaleSettings() {
    try {
        const { data, error } = await supabaseClient
            .from("sale_settings")
            .select("is_active, ends_at")
            .eq("id", 1)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            flashSaleEndTime = data.is_active && data.ends_at
                ? new Date(data.ends_at).getTime()
                : Date.now();
        }
        await loadFlashSaleProducts();
    } catch (error) {
        console.warn("Using local flash-sale timer:", error.message);
        await loadFlashSaleProducts();
    }
}

async function loadFlashSaleProducts() {
    const container = document.getElementById("flash-products-dynamic");
    if (!container) return;

    const promo = container.querySelector(".dont-miss-card")?.outerHTML || "";
    try {
        const { data, error } = await supabaseClient
            .from("sale_products")
            .select("product_id, sort_order, products(id, name, price, old_price, image, stock, category, rating, is_active)")
            .order("sort_order", { ascending: true });

        if (error) throw error;
        const selected = (data || []).map(row => row.products).filter(p => p && p.is_active !== false);

        selected.forEach(row => {
            const normalized = {
                id: Number(row.id),
                name: row.name || "Product",
                price: Number(row.price || 0),
                oldPrice: Number(row.old_price || row.price || 0),
                category: row.category || "Other",
                rating: Number(row.rating || 0),
                stock: Number(row.stock || 0),
                image: row.image || "images/item1.png"
            };
            const existingIndex = products.findIndex(p => Number(p.id) === normalized.id);
            if (existingIndex >= 0) products[existingIndex] = { ...products[existingIndex], ...normalized };
            else products.push(normalized);
        });

        if (!selected.length) {
            container.innerHTML = `<p class="flash-sale-loading">No Flash Sale products selected yet.</p>${promo}`;
            return;
        }

        container.innerHTML = selected.map(product => {
            const id = Number(product.id);
            const price = Number(product.price || 0);
            const old = Number(product.old_price || price);
            const discount = old > price ? Math.round((1 - price / old) * 100) : 0;
            const image = String(product.image || "images/item1.png").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
            const name = String(product.name || "Product").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

            return `
                <div class="flash-product" onclick="openProductDetails(${id})">
                    ${discount ? `<span class="sale-badge">-${discount}%</span>` : ""}
                    <div class="flash-image"><img src="${image}" alt="${name}"></div>
                    <div class="flash-product-info">
                        <h3>${name}</h3>
                        <div class="flash-price">
                            <span class="new-price">₱${price.toLocaleString("en-PH")}</span>
                            ${old > price ? `<span class="old-price">₱${old.toLocaleString("en-PH")}</span>` : ""}
                        </div>
                        <button type="button" onclick="event.stopPropagation(); addToCart(${id})">🛒 Add to Cart</button>
                    </div>
                </div>
            `;
        }).join("") + promo;
    } catch (error) {
        console.warn("Flash Sale products unavailable:", error.message);
        container.innerHTML = `<p class="flash-sale-loading">Flash Sale products are temporarily unavailable.</p>${promo}`;
    }
}

// ===============================
// APP INITIALIZATION
// ===============================
async function startApp() {
    await loadStoreProducts();
    await loadFlashSaleSettings();
    setCategory(selectedCategory || "All");
    loadCommunityReviews();

    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        if (session?.user) {
            const username = session.user.user_metadata?.username ||
                session.user.email?.split("@")[0] || "customer";
            localStorage.setItem("currentUser", username);
        } else {
            localStorage.removeItem("currentUser");
        }
    } catch (authError) {
        console.error("STARTUP AUTH CHECK ERROR:", authError);
        localStorage.removeItem("currentUser");
    }

    const currentUser = getCurrentUsername();
    if (currentUser) {
        await loadUserCart();
    } else {
        cart = [];
    }

    const pendingCustomItem = localStorage.getItem("farrellPendingCustomCartItem");
    if (pendingCustomItem) {
        try {
            const customItem = JSON.parse(pendingCustomItem);
            const existing = cart.find(item =>
                Number(item.id) === Number(customItem.id) &&
                item.size === customItem.size &&
                item.customDesignId === customItem.customDesignId
            );
            if (existing) existing.quantity += Number(customItem.quantity || 1);
            else cart.push(customItem);
            localStorage.removeItem("farrellPendingCustomCartItem");
            await saveUserCart();
            showNeonPopup("Custom design added to your cart!");
        } catch (e) {
            console.error("CUSTOM CART RESTORE ERROR", e);
        }
    }

    updateCart();
}

startApp();

// ===============================
// PAGE EVENTS & AUTH STATE LISTENER
// ===============================
window.addEventListener("DOMContentLoaded", async function() {
    const loginPage = document.getElementById("login-page");
    await checkAdminAccess();

    if (loginPage) {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) throw error;

            if (session?.user) {
                const username = session.user.user_metadata?.username ||
                    session.user.email?.split("@")[0] || "customer";
                localStorage.setItem("currentUser", username);
                loginPage.style.display = "none";
            } else {
                localStorage.removeItem("currentUser");
                // Allow guests to browse; show login modal cleanly
                loginPage.style.display = "none";
            }
        } catch (error) {
            console.error("AUTH SESSION CHECK ERROR:", error);
            localStorage.removeItem("currentUser");
            loginPage.style.display = "none";
        }
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
            const username = session.user.user_metadata?.username ||
                session.user.email?.split("@")[0] || "customer";
            localStorage.setItem("currentUser", username);
            if (loginPage) loginPage.style.display = "none";
            window.setTimeout(() => checkAdminAccess(), 0);
        } else {
            localStorage.removeItem("currentUser");
            hideAdminLinks();
        }

        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
            window.setTimeout(async () => {
                await loadStoreProducts({ force: true });
                filterProducts();
                if (event === "SIGNED_IN") {
                    await loadUserCart();
                    updateCart();
                }
            }, 0);
        }
    });
});

// Restore live product catalog when returning via browser Back/Forward cache (e.g. Admin -> Store)
window.addEventListener("pageshow", async function(event) {
    if (event.persisted) {
        await loadStoreProducts({ force: true });
        await loadFlashSaleSettings();
        filterProducts();
        checkAdminAccess();
    }
});

// Loading screen
window.addEventListener("load", function() {
    setTimeout(function() {
        const loader = document.getElementById("farrel-loader");
        if (loader) loader.classList.add("hide-loader");
        document.body.classList.add("page-loaded");
    }, 1200);
});

// ===============================
// SIDEBAR NAVIGATION
// ===============================
function toggleSidebar() {
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    if (!sidebar || !overlay) return;

    const isOpen = sidebar.classList.contains("open");
    if (isOpen) {
        closeSidebar();
    } else {
        sidebar.classList.add("open");
        overlay.classList.add("open");
        document.body.classList.add("sidebar-locked");
    }
}

function closeSidebar() {
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.querySelector(".sidebar-overlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    document.body.classList.remove("sidebar-locked");
}

document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll(".sidebar-link:not(.theme-button), .sidebar-nav .admin-link").forEach(link => {
        link.addEventListener("click", closeSidebar);
    });
    checkAdminAccess();
});

// ===============================
// ADMIN ACCESS VISIBILITY
// ===============================
function hideAdminLinks() {
    ["admin-link", "header-admin-link"].forEach(id => {
        const link = document.getElementById(id);
        if (link) link.style.display = "none";
    });
}

async function checkAdminAccess() {
    const links = ["admin-link", "header-admin-link"]
        .map(id => document.getElementById(id))
        .filter(Boolean);
    links.forEach(link => link.style.display = "none");

    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) return;

        const { data: profile, error } = await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (error) return;

        if (String(profile?.role || "").trim().toLowerCase() === "admin") {
            links.forEach(link => {
                link.style.display = "inline-flex";
                link.removeAttribute("aria-hidden");
            });
        }
    } catch (error) {
        console.error("ADMIN ACCESS CHECK FAILED:", error);
    }
}

// ===============================
// THEME SWITCHER (Revision 2)
// ===============================
function toggleTheme(event) {
    if (event) {
        if (typeof event.preventDefault === "function") event.preventDefault();
        if (typeof event.stopPropagation === "function") event.stopPropagation();
    }
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    localStorage.setItem("farrelTheme", isLight ? "light" : "dark");
    updateThemeButton();
}
window.toggleTheme = toggleTheme;

function updateThemeButton() {
    const isLight = document.body.classList.contains("light-theme");
    document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
        const icon = btn.querySelector(".theme-icon") || btn.querySelector(".sidebar-icon");
        const label = btn.querySelector(".theme-label");
        if (icon) {
            icon.textContent = isLight ? "🌙" : "☀️";
        }
        if (label) {
            label.textContent = isLight ? "Dark Mode" : "Light Mode";
        }
        if (!icon && !label) {
            btn.textContent = isLight ? "🌙" : "☀️";
        }
        btn.setAttribute("title", isLight ? "Switch to Dark Mode" : "Switch to Light Mode");
        btn.setAttribute("aria-label", isLight ? "Switch to Dark Mode" : "Switch to Light Mode");
    });
}
window.updateThemeButton = updateThemeButton;

document.addEventListener("DOMContentLoaded", function() {
    const savedTheme = localStorage.getItem("farrelTheme");
    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
    } else {
        document.body.classList.remove("light-theme");
    }
    updateThemeButton();
});

// ===============================
// SCROLL & NAVIGATION HELPERS
// ===============================
function scrollToProducts() {
    const productsElement = document.getElementById("products");
    if (productsElement) {
        productsElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function openCollection(category) {
    setCategory(category);
    const productsElement = document.getElementById("products");
    if (productsElement) {
        setTimeout(function() {
            productsElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
    }
}

// ===============================
// FLASH SALE COUNTDOWN
// ===============================
let flashSaleEndTime = localStorage.getItem("farrelFlashSaleEnd");

if (!flashSaleEndTime || Date.now() >= Number(flashSaleEndTime)) {
    flashSaleEndTime = Date.now() + (2 * 60 * 60 * 1000);
    localStorage.setItem("farrelFlashSaleEnd", flashSaleEndTime);
}

function updateFlashSale() {
    const hoursElement = document.getElementById("sale-hours");
    const minutesElement = document.getElementById("sale-minutes");
    const secondsElement = document.getElementById("sale-seconds");
    const labelElement = document.querySelector(".countdown-label");
    const sectionElement = document.querySelector(".flash-sale-section");

    if (!hoursElement || !minutesElement || !secondsElement) return;

    const now = Date.now();
    const remaining = Number(flashSaleEndTime) - now;

    if (remaining <= 0) {
        hoursElement.textContent = "00";
        minutesElement.textContent = "00";
        secondsElement.textContent = "00";
        // Bug 8: Change label to FLASH SALE ENDED and mark section as expired
        if (labelElement) labelElement.textContent = "FLASH SALE ENDED";
        if (sectionElement) sectionElement.classList.add("sale-expired");
        return;
    }

    if (labelElement) labelElement.textContent = "ENDS IN";
    if (sectionElement) sectionElement.classList.remove("sale-expired");

    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    hoursElement.textContent = String(hours).padStart(2, "0");
    minutesElement.textContent = String(minutes).padStart(2, "0");
    secondsElement.textContent = String(seconds).padStart(2, "0");
}

updateFlashSale();
setInterval(updateFlashSale, 1000);

// ===============================
// CART ADDED POPUP
// ===============================
function showCartAdded() {
    const message = document.createElement("div");
    message.className = "cart-added-message";
    message.innerHTML = "✓ Added to Cart";
    document.body.appendChild(message);

    setTimeout(() => {
        message.classList.add("show");
    }, 10);

    setTimeout(() => {
        message.classList.remove("show");
        setTimeout(() => {
            message.remove();
        }, 250);
    }, 1200);
}

// ===============================
// PASSWORD VISIBILITY TOGGLE (Revision 3)
// ===============================
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === "password") {
        input.type = "text";
        if (btn) btn.textContent = "🙈";
        if (btn) btn.setAttribute("aria-label", "Hide password");
    } else {
        input.type = "password";
        if (btn) btn.textContent = "👁️";
        if (btn) btn.setAttribute("aria-label", "Show password");
    }
}
window.togglePasswordVisibility = togglePasswordVisibility;

// ===============================
// MODAL BACKDROP & ESCAPE DISMISSAL (Bug 5)
// ===============================
window.addEventListener("click", function(event) {
    const target = event.target;
    if (!target) return;

    if (target.id === "product-modal") {
        closeProductDetails();
    } else if (target.id === "cart-modal") {
        closeCart();
    } else if (target.id === "checkout-modal") {
        const submitBtn = document.querySelector("#checkout-form button[type='submit']");
        if (!submitBtn || !submitBtn.disabled) closeCheckout();
    } else if (target.id === "orders-modal") {
        closeOrders();
    } else if (target.id === "profile-modal") {
        closeProfile();
    } else if (target.id === "success-modal") {
        closeSuccess();
    } else if (target.id === "login-page") {
        closeAccountPage();
    }
});

window.addEventListener("keydown", function(event) {
    if (event.key === "Escape" || event.keyCode === 27) {
        const checkoutModal = document.getElementById("checkout-modal");
        const submitBtn = document.querySelector("#checkout-form button[type='submit']");
        if (checkoutModal && checkoutModal.style.display === "block") {
            if (!submitBtn || !submitBtn.disabled) closeCheckout();
            return;
        }

        const modals = [
            { id: "product-modal", close: closeProductDetails },
            { id: "cart-modal", close: closeCart },
            { id: "orders-modal", close: closeOrders },
            { id: "profile-modal", close: closeProfile },
            { id: "success-modal", close: closeSuccess },
            { id: "login-page", close: closeAccountPage }
        ];

        for (const m of modals) {
            const el = document.getElementById(m.id);
            if (el && (el.style.display === "block" || el.style.display === "flex")) {
                m.close();
                break;
            }
        }
    }
});

// ===============================
// SEARCH ENTER KEY SUPPORT (Bug 9)
// ===============================
document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                filterProducts();
                scrollToProducts();
            }
        });
    }
});
