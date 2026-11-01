// =====================================
// ARTSPACE : DONNEES ET STOCKAGE
// =====================================

const getData = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const saveData = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

let accounts = getData("artspaceAccounts", []);
let currentUser = getData("artspaceSession", null);

let arts = getData("artspaceArts", []);
let messages = getData("artspaceMessages", []);

let friendRequests = getData("artspaceFriendRequests", []);
let friendships = getData("artspaceFriendships", []);
let conversations = getData("artspaceConversations", []);

let activeChatUserId = null;
let authMode = "login";

const defaultAvatar =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#332746"/>
      <circle cx="50" cy="36" r="19" fill="#a879ff"/>
      <path d="M15 100 Q20 62 50 62 Q80 62 85 100" fill="#a879ff"/>
    </svg>
  `);

// =====================================
// ELEMENTS
// =====================================

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");

const authForm = document.getElementById("authForm");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const authUsername = document.getElementById("authUsername");
const usernameGroup = document.getElementById("usernameGroup");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");

// =====================================
// AUTHENTIFICATION
// =====================================

function setAuthMode(mode) {
  authMode = mode;
  authMessage.textContent = "";
  authMessage.className = "form-message";

  const signup = mode === "signup";

  loginTab.classList.toggle("selected", !signup);
  signupTab.classList.toggle("selected", signup);

  usernameGroup.classList.toggle("hidden", !signup);
  authUsername.required = signup;

  authSubmit.textContent = signup
    ? "Créer mon compte"
    : "Se connecter";
}

loginTab.addEventListener("click", () => setAuthMode("login"));
signupTab.addEventListener("click", () => setAuthMode("signup"));

authForm.addEventListener("submit", event => {
  event.preventDefault();

  accounts = getData("artspaceAccounts", []);

  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value;
  const username = authUsername.value.trim();

  if (authMode === "signup") {
    if (username.length < 2) {
      authMessage.textContent = "Ton pseudo doit contenir au moins 2 caractères.";
      return;
    }

    if (accounts.some(account => account.email === email)) {
      authMessage.textContent = "Cette adresse possède déjà un compte.";
      return;
    }

    const newAccount = {
      id: Date.now().toString(),
      username,
      email,
      password,
      bio: "",
      avatar: defaultAvatar,
      banner: "",
      privateEmail: false
    };

    accounts.push(newAccount);
    saveData("artspaceAccounts", accounts);

    authMessage.className = "form-message success";
    authMessage.textContent = "Compte créé ! Tu peux maintenant te connecter.";

    setAuthMode("login");
    authPassword.value = "";
    return;
  }

  const account = accounts.find(
    item => item.email === email && item.password === password
  );

  if (!account) {
    authMessage.textContent = "Adresse e-mail ou mot de passe incorrect.";
    return;
  }

  currentUser = {
    id: account.id,
    email: account.email
  };

  saveData("artspaceSession", currentUser);

  authForm.reset();
  openApplication();
});

// =====================================
// UTILISATEUR ACTUEL
// =====================================

function getCurrentAccount() {
  if (!currentUser) return null;

  accounts = getData("artspaceAccounts", []);

  return accounts.find(account => account.id === currentUser.id) || null;
}

function updateAccount(updatedAccount) {
  accounts = getData("artspaceAccounts", []);

  const index = accounts.findIndex(
    account => account.id === updatedAccount.id
  );

  if (index !== -1) {
    accounts[index] = updatedAccount;
    saveData("artspaceAccounts", accounts);
  }
}

// =====================================
// OUVRIR / FERMER APPLICATION
// =====================================

function openApplication() {
  const account = getCurrentAccount();

  if (!account) {
    logout();
    return;
  }

  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  refreshProfile();
  renderArts();
  renderMessages();
  loadSettings();
  openPage("home");
}

function logout() {
  localStorage.removeItem("artspaceSession");
  currentUser = null;
  activeChatUserId = null;

  appScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");

  authForm.reset();
  setAuthMode("login");
}

document.getElementById("sidebarLogout").addEventListener("click", logout);
document.getElementById("settingsLogout").addEventListener("click", logout);

// =====================================
// NAVIGATION
// =====================================

const pageNames = {
  home: "Accueil",
  discover: "Découvrir",
  arts: "Mes arts",
  messages: "Messages",
  profile: "Mon profil",
  settings: "Paramètres"
};

function openPage(pageId) {
  const page = document.getElementById(pageId);

  if (!page) return;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active");
  });

  page.classList.add("active");

  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageId
    );
  });

  document.getElementById("pageTitle").textContent =
    pageNames[pageId] || "ArtSpace";

  if (
    pageId === "discover" ||
    pageId === "home" ||
    pageId === "arts" ||
    pageId === "profile"
  ) {
    renderArts();
  }

  if (pageId === "messages") {
    renderMessages();
  }
}

document.querySelectorAll(".nav-button").forEach(button => {
  button.addEventListener("click", () => {
    openPage(button.dataset.page);
  });
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => {
    openPage(button.dataset.go);
  });
});

// =====================================
// AFFICHAGE DU PROFIL
// =====================================

function refreshProfile() {
  const account = getCurrentAccount();

  if (!account) return;

  document.getElementById("topUsername").textContent = account.username;
  document.getElementById("smallAvatar").src =
    account.avatar || defaultAvatar;

  document.getElementById("profileAvatar").src =
    account.avatar || defaultAvatar;

  document.getElementById("profileDisplayName").textContent =
    account.username;

  document.getElementById("profileDisplayBio").textContent =
    account.bio || "Aucune biographie pour le moment.";

  document.getElementById("profileEmail").textContent =
    account.privateEmail ? "Adresse e-mail masquée" : account.email;

  document.getElementById("profileBanner").style.backgroundImage =
    account.banner ? `url("${account.banner}")` : "";

  document.getElementById("editUsername").value = account.username;
  document.getElementById("editBio").value = account.bio || "";
}

// =====================================
// IMPORTER DES IMAGES
// =====================================

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Choisis un fichier image."));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      reject(new Error("Image trop lourde. Maximum : 2 Mo."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Impossible de lire cette image."));

    reader.readAsDataURL(file);
  });
}

// =====================================
// PUBLICATIONS
// =====================================

const artImage = document.getElementById("artImage");
const artTitle = document.getElementById("artTitle");
const artDescription = document.getElementById("artDescription");
const uploadMessage = document.getElementById("uploadMessage");

document.getElementById("publishArt").addEventListener("click", async () => {
  const account = getCurrentAccount();
  const file = artImage.files[0];

  uploadMessage.className = "form-message";

  if (!account) return;

  if (!file) {
    uploadMessage.textContent = "Choisis une image avant de publier.";
    return;
  }

  if (!artTitle.value.trim()) {
    uploadMessage.textContent = "Ajoute un titre à ton œuvre.";
    return;
  }

  try {
    const imageData = await readImage(file);

    arts = getData("artspaceArts", []);

    arts.unshift({
      id: Date.now().toString(),
      userId: account.id,
      author: account.username,
      title: artTitle.value.trim(),
      description: artDescription.value.trim(),
      image: imageData,
      date: new Date().toLocaleDateString("fr-FR")
    });

    saveData("artspaceArts", arts);

    artImage.value = "";
    artTitle.value = "";
    artDescription.value = "";

    uploadMessage.className = "form-message success";
    uploadMessage.textContent = "Ta création a été publiée !";

    renderArts();

  } catch (error) {
    uploadMessage.textContent = error.message;
  }
});

// =====================================
// AFFICHAGE DES GALERIES
// =====================================

function createArtCard(art, allowDelete = false) {
  const card = document.createElement("article");
  card.className = "art-card";

  const image = document.createElement("img");
  image.src = art.image;
  image.alt = art.title;

  const info = document.createElement("div");
  info.className = "art-info";

  const title = document.createElement("h3");
  title.textContent = art.title;

  const description = document.createElement("p");
  description.textContent = art.description || "Aucune description.";

  const author = document.createElement("div");
  author.className = "art-author";
  author.textContent = `Par ${art.author} · ${art.date}`;

  info.append(title, description, author);
  card.append(image, info);

  if (allowDelete) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Supprimer";

    deleteButton.addEventListener("click", () => {
      deleteArt(art.id);
    });

    info.append(deleteButton);
  }

  return card;
}

function fillGallery(elementId, items, allowDelete = false) {
  const gallery = document.getElementById(elementId);
  gallery.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "Aucune création pour le moment.";
    gallery.append(empty);
    return;
  }

  items.forEach(art => {
    gallery.append(createArtCard(art, allowDelete));
  });
}

function renderArts() {
  const account = getCurrentAccount();

  if (!account) return;

  arts = getData("artspaceArts", []);

  const myArts = arts.filter(art => art.userId === account.id);

  fillGallery("homeGallery", arts.slice(0, 6));
  fillGallery("discoverGallery", arts);
  fillGallery("myGallery", myArts, true);
  fillGallery("profileGallery", myArts);
}

function deleteArt(id) {
  const account = getCurrentAccount();

  if (!account) return;

  arts = getData("artspaceArts", []);

  arts = arts.filter(art => {
    return !(art.id === id && art.userId === account.id);
  });

  saveData("artspaceArts", arts);
  renderArts();
}

// =====================================
// MODIFIER LE PROFIL
// =====================================

document.getElementById("saveProfile").addEventListener("click", async () => {
  const account = getCurrentAccount();
  const profileMessage = document.getElementById("profileMessage");

  if (!account) return;

  const username = document.getElementById("editUsername").value.trim();
  const bio = document.getElementById("editBio").value.trim();

  if (username.length < 2) {
    profileMessage.textContent = "Ton pseudo doit contenir au moins 2 caractères.";
    return;
  }

  const avatarFile = document.getElementById("avatarUpload").files[0];
  const bannerFile = document.getElementById("bannerUpload").files[0];

  try {
    if (avatarFile) {
      account.avatar = await readImage(avatarFile);
    }

    if (bannerFile) {
      account.banner = await readImage(bannerFile);
    }

    account.username = username;
    account.bio = bio;

    updateAccount(account);

    arts = getData("artspaceArts", []);

    arts.forEach(art => {
      if (art.userId === account.id) {
        art.author = account.username;
      }
    });

    saveData("artspaceArts", arts);

    document.getElementById("avatarUpload").value = "";
    document.getElementById("bannerUpload").value = "";

    refreshProfile();
    renderArts();
    renderMessages();

    profileMessage.className = "form-message success";
    profileMessage.textContent = "Ton profil a été mis à jour !";

  } catch (error) {
    profileMessage.className = "form-message";
    profileMessage.textContent = error.message;
  }
});

// =====================================
// SYSTEME DE CONTACTS
// =====================================

function reloadSocialData() {
  accounts = getData("artspaceAccounts", []);
  friendRequests = getData("artspaceFriendRequests", []);
  friendships = getData("artspaceFriendships", []);
  conversations = getData("artspaceConversations", []);
}

function getAccountById(id) {
  return accounts.find(account => account.id === id) || null;
}

function areFriends(firstId, secondId) {
  return friendships.some(friendship => {
    return (
      (friendship.userA === firstId && friendship.userB === secondId) ||
      (friendship.userA === secondId && friendship.userB === firstId)
    );
  });
}

function getRequestBetween(firstId, secondId) {
  return friendRequests.find(request => {
    return (
      (request.fromId === firstId && request.toId === secondId) ||
      (request.fromId === secondId && request.toId === firstId)
    );
  });
}

function sendFriendRequest(targetId) {
  const account = getCurrentAccount();
  const status = document.getElementById("messageStatus");

  if (!account || targetId === account.id) return;

  reloadSocialData();

  if (!getAccountById(targetId)) return;

  if (areFriends(account.id, targetId)) {
    renderMessages();
    return;
  }

  const existingRequest = getRequestBetween(account.id, targetId);

  if (existingRequest) {
    if (
      existingRequest.fromId === targetId &&
      existingRequest.toId === account.id
    ) {
      acceptFriendRequest(existingRequest.id);
      return;
    }

    renderMessages();
    return;
  }

  friendRequests.push({
    id: Date.now().toString(),
    fromId: account.id,
    toId: targetId,
    date: new Date().toISOString()
  });

  saveData("artspaceFriendRequests", friendRequests);

  status.className = "form-message success";
  status.textContent = "Demande d'ami envoyée.";

  renderMessages();
}

function acceptFriendRequest(requestId) {
  const account = getCurrentAccount();

  if (!account) return;

  reloadSocialData();

  const request = friendRequests.find(item => {
    return item.id === requestId && item.toId === account.id;
  });

  if (!request) return;

  if (!areFriends(request.fromId, request.toId)) {
    friendships.push({
      userA: request.fromId,
      userB: request.toId,
      date: new Date().toISOString()
    });
  }

  friendRequests = friendRequests.filter(item => item.id !== requestId);

  saveData("artspaceFriendships", friendships);
  saveData("artspaceFriendRequests", friendRequests);

  renderMessages();
}

function rejectFriendRequest(requestId) {
  const account = getCurrentAccount();

  if (!account) return;

  reloadSocialData();

  friendRequests = friendRequests.filter(request => {
    return !(request.id === requestId && request.toId === account.id);
  });

  saveData("artspaceFriendRequests", friendRequests);
  renderMessages();
}

// =====================================
// RECHERCHE D'UTILISATEURS
// =====================================

const userSearch = document.getElementById("userSearch");

userSearch.addEventListener("input", renderUserSearch);

function renderUserSearch() {
  const account = getCurrentAccount();
  const results = document.getElementById("userSearchResults");

  if (!account) return;

  reloadSocialData();

  const search = userSearch.value.trim().toLowerCase();
  results.innerHTML = "";

  if (!search) {
    const hint = document.createElement("p");
    hint.className = "chat-hint";
    hint.textContent = "Écris un pseudo pour rechercher des utilisateurs.";
    results.append(hint);
    return;
  }

  const foundAccounts = accounts.filter(item => {
    return (
      item.id !== account.id &&
      item.username.toLowerCase().includes(search)
    );
  });

  if (foundAccounts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "chat-hint";
    empty.textContent = "Aucun utilisateur trouvé.";
    results.append(empty);
    return;
  }

  foundAccounts.forEach(found => {
    const row = document.createElement("div");
    row.className = "request-card";

    const user = document.createElement("div");
    user.className = "request-user";

    const avatar = document.createElement("img");
    avatar.src = found.avatar || defaultAvatar;
    avatar.alt = "";

    const name = document.createElement("strong");
    name.textContent = found.username;

    user.append(avatar, name);
    row.append(user);

    const button = document.createElement("button");
    button.className = "add-friend-button";

    if (areFriends(account.id, found.id)) {
      button.textContent = "Déjà dans tes contacts";
      button.disabled = true;
    } else {
      const request = getRequestBetween(account.id, found.id);

      if (!request) {
        button.textContent = "＋ Ajouter";
        button.addEventListener("click", () => {
          sendFriendRequest(found.id);
        });
      } else if (request.fromId === account.id) {
        button.textContent = "Demande envoyée";
        button.disabled = true;
      } else {
        button.textContent = "Demande reçue";
        button.disabled = true;
      }
    }

    row.append(button);
    results.append(row);
  });
}

// =====================================
// AFFICHER LES DEMANDES D'AMIS
// =====================================

function renderFriendRequests() {
  const account = getCurrentAccount();
  const list = document.getElementById("friendRequests");
  const count = document.getElementById("requestCount");

  if (!account) return;

  reloadSocialData();

  const incoming = friendRequests.filter(request => {
    return request.toId === account.id;
  });

  list.innerHTML = "";
  count.textContent = incoming.length;

  if (incoming.length === 0) {
    const empty = document.createElement("p");
    empty.className = "chat-hint";
    empty.textContent = "Aucune demande reçue.";
    list.append(empty);
    return;
  }

  incoming.forEach(request => {
    const sender = getAccountById(request.fromId);

    if (!sender) return;

    const card = document.createElement("div");
    card.className = "request-card";

    const user = document.createElement("div");
    user.className = "request-user";

    const avatar = document.createElement("img");
    avatar.src = sender.avatar || defaultAvatar;
    avatar.alt = "";

    const name = document.createElement("strong");
    name.textContent = sender.username;

    user.append(avatar, name);

    const actions = document.createElement("div");
    actions.className = "request-actions";

    const accept = document.createElement("button");
    accept.className = "accept-request";
    accept.textContent = "Accepter";
    accept.addEventListener("click", () => {
      acceptFriendRequest(request.id);
    });

    const reject = document.createElement("button");
    reject.className = "reject-request";
    reject.textContent = "Refuser";
    reject.addEventListener("click", () => {
      rejectFriendRequest(request.id);
    });

    actions.append(accept, reject);
    card.append(user, actions);
    list.append(card);
  });
}

// =====================================
// AFFICHER LES CONTACTS
// =====================================

function renderFriendList() {
  const account = getCurrentAccount();
  const list = document.getElementById("friendList");

  if (!account) return;

  reloadSocialData();
  list.innerHTML = "";

  const myFriends = friendships
    .filter(friendship => {
      return (
        friendship.userA === account.id ||
        friendship.userB === account.id
      );
    })
    .map(friendship => {
      const friendId = friendship.userA === account.id
        ? friendship.userB
        : friendship.userA;

      return getAccountById(friendId);
    })
    .filter(Boolean);

  if (myFriends.length === 0) {
    const empty = document.createElement("p");
    empty.className = "chat-hint";
    empty.textContent = "Tu n'as pas encore de contact.";
    list.append(empty);
    return;
  }

  myFriends.forEach(friend => {
    const button = document.createElement("button");
    button.className = "chat-user";

    if (activeChatUserId === friend.id) {
      button.classList.add("selected");
    }

    const avatar = document.createElement("img");
    avatar.src = friend.avatar || defaultAvatar;
    avatar.alt = "";

    const info = document.createElement("span");
    info.className = "chat-user-info";

    const name = document.createElement("strong");
    name.textContent = friend.username;

    const subtitle = document.createElement("small");
    subtitle.textContent = "Ouvrir la discussion";

    info.append(name, subtitle);
    button.append(avatar, info);

    button.addEventListener("click", () => {
      openConversation(friend.id);
    });

    list.append(button);
  });
}

// =====================================
// CONVERSATIONS
// =====================================

function getConversation(firstId, secondId) {
  return conversations.find(conversation => {
    return (
      (conversation.userA === firstId && conversation.userB === secondId) ||
      (conversation.userA === secondId && conversation.userB === firstId)
    );
  });
}

function openConversation(friendId) {
  const account = getCurrentAccount();

  if (!account || !areFriends(account.id, friendId)) return;

  const friend = getAccountById(friendId);

  if (!friend) return;

  activeChatUserId = friendId;

  document.getElementById("chatEmpty").classList.add("hidden");
  document.getElementById("conversation").classList.remove("hidden");

  document.getElementById("chatAvatar").src =
    friend.avatar || defaultAvatar;

  document.getElementById("chatUsername").textContent =
    friend.username;

  document.getElementById("messageStatus").textContent = "";

  renderFriendList();
  renderConversationMessages();
}

function renderConversationMessages() {
  const account = getCurrentAccount();
  const list = document.getElementById("chatMessages");

  if (!account || !activeChatUserId) return;

  reloadSocialData();

  const conversation = getConversation(account.id, activeChatUserId);

  list.innerHTML = "";

  if (!conversation || conversation.messages.length === 0) {
    const empty = document.createElement("p");
    empty.className = "chat-hint";
    empty.style.textAlign = "center";
    empty.textContent = "Début de votre conversation. Envoie le premier message !";
    list.append(empty);
    return;
  }

  conversation.messages.forEach(message => {
    const bubble = document.createElement("div");

    bubble.className = message.senderId === account.id
      ? "chat-bubble mine"
      : "chat-bubble theirs";

    const content = document.createElement("span");
    content.textContent = message.text;

    const date = document.createElement("small");
    date.textContent = message.date;

    bubble.append(content, date);
    list.append(bubble);
  });

  list.scrollTop = list.scrollHeight;
}

// =====================================
// ENVOYER UN MESSAGE
// =====================================

document.getElementById("chatForm").addEventListener("submit", event => {
  event.preventDefault();

  const account = getCurrentAccount();
  const input = document.getElementById("chatInput");
  const status = document.getElementById("messageStatus");
  const text = input.value.trim();

  if (!account || !activeChatUserId || !text) return;

  reloadSocialData();

  if (!areFriends(account.id, activeChatUserId)) {
    status.textContent = "Tu dois être contact avec cette personne pour discuter.";
    return;
  }

  let conversation = getConversation(account.id, activeChatUserId);

  if (!conversation) {
    conversation = {
      id: Date.now().toString(),
      userA: account.id,
      userB: activeChatUserId,
      messages: []
    };

    conversations.push(conversation);
  }

  conversation.messages.push({
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    senderId: account.id,
    text,
    date: new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  });

  saveData("artspaceConversations", conversations);

  input.value = "";
  status.textContent = "";

  renderConversationMessages();
});

// =====================================
// FERMER UNE CONVERSATION
// =====================================

document.getElementById("closeConversation").addEventListener("click", () => {
  activeChatUserId = null;

  document.getElementById("conversation").classList.add("hidden");
  document.getElementById("chatEmpty").classList.remove("hidden");

  renderFriendList();
});

// =====================================
// AFFICHAGE GENERAL DES MESSAGES
// =====================================

function renderMessages() {
  const account = getCurrentAccount();

  if (!account) return;

  reloadSocialData();

  renderUserSearch();
  renderFriendRequests();
  renderFriendList();

  if (activeChatUserId) {
    if (areFriends(account.id, activeChatUserId)) {
      const friend = getAccountById(activeChatUserId);

      if (friend) {
        document.getElementById("chatEmpty").classList.add("hidden");
        document.getElementById("conversation").classList.remove("hidden");
        document.getElementById("chatAvatar").src =
          friend.avatar || defaultAvatar;
        document.getElementById("chatUsername").textContent =
          friend.username;

        renderConversationMessages();
      }
    } else {
      activeChatUserId = null;
      document.getElementById("conversation").classList.add("hidden");
      document.getElementById("chatEmpty").classList.remove("hidden");
    }
  }
}

// =====================================
// PARAMETRES ET THEMES
// =====================================

const themeSelect = document.getElementById("themeSelect");
const privateEmail = document.getElementById("privateEmail");

function loadSettings() {
  const account = getCurrentAccount();

  if (!account) return;

  const theme = localStorage.getItem("artspaceTheme") || "dark";

  themeSelect.value = theme;
  document.body.classList.toggle("light-theme", theme === "light");

  privateEmail.checked = Boolean(account.privateEmail);

  document.getElementById("settingsEmail").textContent =
    `Connecté avec : ${account.email}`;
}

themeSelect.addEventListener("change", () => {
  const theme = themeSelect.value;

  localStorage.setItem("artspaceTheme", theme);
  document.body.classList.toggle("light-theme", theme === "light");
});

privateEmail.addEventListener("change", () => {
  const account = getCurrentAccount();

  if (!account) return;

  account.privateEmail = privateEmail.checked;
  updateAccount(account);
  refreshProfile();
});

// =====================================
// DEMARRAGE
// =====================================

if (currentUser && getCurrentAccount()) {
  openApplication();
} else {
  currentUser = null;
  authScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
  setAuthMode("login");
}
