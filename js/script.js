const TOAST_DURATION = 5000;
const MAX_TOASTS = 4;
const LEAVE_DURATION = 300;

const TOAST_TYPES = {
    success: {
        icon: "fa-circle-check",
        title: "Success",
        message: "Your changes were saved."
    },
    error: {
        icon: "fa-circle-xmark",
        title: "Error",
        message: "Something went wrong. Please try again."
    },
    info: {
        icon: "fa-circle-info",
        title: "Info",
        message: "A new version is available."
    },
    warning: {
        icon: "fa-triangle-exclamation",
        title: "Warning",
        message: "Your session will expire in 2 minutes."
    }
};

const toastBox = document.getElementById("toastBox");
const clearBtn = document.getElementById("clearBtn");
const triggers = document.querySelectorAll(".trigger");

let activeToasts = [];

function createIcon(className) {
    const icon = document.createElement("i");
    icon.className = "fa-solid " + className;
    icon.setAttribute("aria-hidden", "true");
    return icon;
}

function buildToastElement(type) {
    const config = TOAST_TYPES[type];

    const toast = document.createElement("div");
    toast.className = "toast toast-" + type;

    const iconWrap = document.createElement("span");
    iconWrap.className = "toast-icon";
    iconWrap.appendChild(createIcon(config.icon));

    const body = document.createElement("div");
    body.className = "toast-body";

    const title = document.createElement("p");
    title.className = "toast-title";
    title.textContent = config.title;

    const message = document.createElement("p");
    message.className = "toast-message";
    message.textContent = config.message;

    body.append(title, message);

    const closeButton = document.createElement("button");
    closeButton.className = "toast-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Dismiss " + config.title.toLowerCase() + " notification");
    closeButton.appendChild(createIcon("fa-xmark"));

    const progress = document.createElement("span");
    progress.className = "toast-progress";
    progress.setAttribute("aria-hidden", "true");

    toast.append(iconWrap, body, closeButton, progress);
    return { toast: toast, closeButton: closeButton };
}

function startTimer(record) {
    record.startedAt = Date.now();
    record.timerId = setTimeout(function () {
        dismissToast(record);
    }, record.remaining);
}

function pauseTimer(record) {
    if (record.timerId === null) {
        return;
    }
    clearTimeout(record.timerId);
    record.timerId = null;
    record.remaining -= Date.now() - record.startedAt;
    record.el.classList.add("is-paused");
}

function resumeTimer(record) {
    // stay paused while the mouse or keyboard focus is still on the toast
    if (record.hovered || record.focused || record.timerId !== null || record.leaving) {
        return;
    }
    record.el.classList.remove("is-paused");
    startTimer(record);
}

function dismissToast(record) {
    if (record.leaving) {
        return;
    }
    record.leaving = true;
    clearTimeout(record.timerId);
    record.timerId = null;
    activeToasts = activeToasts.filter(function (item) {
        return item !== record;
    });

    // move focus somewhere sensible if it was on the toast being removed
    if (record.el.contains(document.activeElement)) {
        clearBtn.focus();
    }

    record.el.classList.add("is-leaving");
    setTimeout(function () {
        record.el.remove();
    }, LEAVE_DURATION);
}

function addHoverAndFocusPause(record) {
    record.el.addEventListener("mouseenter", function () {
        record.hovered = true;
        pauseTimer(record);
    });
    record.el.addEventListener("mouseleave", function () {
        record.hovered = false;
        resumeTimer(record);
    });
    record.el.addEventListener("focusin", function () {
        record.focused = true;
        pauseTimer(record);
    });
    record.el.addEventListener("focusout", function (event) {
        if (record.el.contains(event.relatedTarget)) {
            return;
        }
        record.focused = false;
        resumeTimer(record);
    });
}

function showToast(type) {
    if (!TOAST_TYPES[type]) {
        return;
    }

    if (activeToasts.length >= MAX_TOASTS) {
        dismissToast(activeToasts[0]);
    }

    const parts = buildToastElement(type);
    const record = {
        el: parts.toast,
        remaining: TOAST_DURATION,
        startedAt: 0,
        timerId: null,
        hovered: false,
        focused: false,
        leaving: false
    };

    parts.closeButton.addEventListener("click", function () {
        dismissToast(record);
    });
    addHoverAndFocusPause(record);

    toastBox.appendChild(record.el);
    activeToasts.push(record);
    startTimer(record);
}

function clearAllToasts() {
    activeToasts.slice().forEach(dismissToast);
}

function init() {
    toastBox.style.setProperty("--toast-duration", TOAST_DURATION + "ms");

    triggers.forEach(function (button) {
        button.addEventListener("click", function () {
            showToast(button.dataset.type);
        });
    });
    clearBtn.addEventListener("click", clearAllToasts);
}

init();
