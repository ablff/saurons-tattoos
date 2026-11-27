"use strict";

const navMenu = document.querySelector(".nav");
const navToggle = document.querySelector(".nav-toggle");

const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

const accordionSections = Array.from(
    document.querySelectorAll("details.page-section--accordion")
);

function closeAccordionSections(except = null) {
    accordionSections.forEach((section) => {
        if (section !== except) {
            section.open = false;
        }
    });
}

accordionSections.forEach((section) => {
    section.addEventListener("toggle", () => {
        if (section.open) {
            closeAccordionSections(section);
        }
    });
});

closeAccordionSections();

window.addEventListener("pageshow", () => {
    closeAccordionSections();
});

function closeMenu() {
    if (!navMenu || !navToggle) return;

    navMenu.classList.remove("nav--open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Abrir menu do estúdio");
}

function openMenu() {
    if (!navMenu || !navToggle) return;

    navMenu.classList.add("nav--open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Fechar menu do estúdio");
}

if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
        const isOpen = navMenu.classList.contains("nav--open");

        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    document.addEventListener("pointerdown", (event) => {
        if (
            !navMenu.contains(event.target) &&
            !navToggle.contains(event.target)
        ) {
            closeMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 760) {
            closeMenu();
        }
    });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");

        if (!href || href === "#") return;

        let target;

        try {
            target = document.querySelector(href);
        } catch {
            return;
        }

        if (!target) return;

        if (target.matches("details.page-section--accordion")) {
            event.preventDefault();

            closeAccordionSections(target);
            target.open = true;

            closeMenu();

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    target.scrollIntoView({
                        behavior: prefersReducedMotion ? "auto" : "smooth",
                        block: "start"
                    });
                });
            });

            return;
        }

        if (navMenu?.contains(link)) {
            closeMenu();
        }
    });
});

const galleryImages = document.querySelectorAll(".gallery__image");

const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox__image");
const lightboxViewport = document.querySelector(".lightbox__viewport");

const lightboxCloseButton = document.querySelector(".lightbox__close");
const lightboxResetButton = document.querySelector(".lightbox__reset");
const lightboxZoomToggle = document.querySelector(".lightbox__zoom-toggle");
const lightboxHint = document.querySelector(".lightbox__hint");

const budgetForm = document.querySelector("#budget-form");
const cursorLight = document.querySelector(".cursor-light");

const logoStage = document.querySelector(".hero__logo-stage");
const eyeCanvas = document.querySelector(".hero__eye-canvas");
const transitionCanvas = document.querySelector(".hero__transition-canvas");

const pointerPosition = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false
};

let hasAwakened = false;
let wakeTimer = null;

window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;

    if (cursorLight) {
        cursorLight.style.left = `${event.clientX}px`;
        cursorLight.style.top = `${event.clientY}px`;
    }

    pointerPosition.x = event.clientX;
    pointerPosition.y = event.clientY;
    pointerPosition.active = true;

    if (!logoStage || hasAwakened) return;

    updateRingReflection();
});

function updateRingReflection() {
    if (!logoStage || !pointerPosition.active || hasAwakened) return;

    const rect = logoStage.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = pointerPosition.x - centerX;
    const dy = pointerPosition.y - centerY;

    const distance = Math.hypot(dx, dy);

    let x = 50;
    let y = 50;

    if (distance > 0) {
        x = 50 + (dx / distance) * 35;
        y = 50 + (dy / distance) * 35;
    }

    logoStage.style.setProperty("--light-x", `${x}%`);
    logoStage.style.setProperty("--light-y", `${y}%`);

    logoStage.classList.add("has-pointer");
}

window.addEventListener("scroll", updateRingReflection, {
    passive: true
});

if (logoStage) {
    logoStage.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "touch" || hasAwakened) return;

        clearTimeout(wakeTimer);

        logoStage.classList.add("is-charging");

        wakeTimer = setTimeout(() => {
            awakenEye();
        }, 1500);
    });

    logoStage.addEventListener("pointerleave", () => {
        if (hasAwakened) return;

        clearTimeout(wakeTimer);
        logoStage.classList.remove("is-charging");
    });

    logoStage.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "touch") {
            awakenEye();
        }
    });
}

const eyeContext = eyeCanvas?.getContext("2d") ?? null;
const transitionContext = transitionCanvas?.getContext("2d") ?? null;

let eyeMetrics = null;
let transitionMetrics = null;

function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();

    const ratio = Math.min(
        window.devicePixelRatio || 1,
        2
    );

    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);

    const context = canvas.getContext("2d");

    if (context) {
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    return {
        width: rect.width,
        height: rect.height
    };
}

const fireGlyphs = [
    ".",
    ":",
    ";",
    "+",
    "*",
    "x",
    "X",
    "#",
    "%",
    "@"
];

function getFireColor(heat) {
    if (heat < 0.28) return "#66100c";
    if (heat < 0.42) return "#a51c13";
    if (heat < 0.56) return "#d83218";
    if (heat < 0.70) return "#f35a1e";
    if (heat < 0.83) return "#ff912e";
    if (heat < 0.94) return "#ffc452";

    return "#fff0ad";
}

let pupilOffsetX = 0;
let pupilOffsetY = 0;

function drawAsciiEye(timestamp) {
    if (!eyeCanvas || !eyeContext) return;

    if (!eyeMetrics) {
        eyeMetrics = resizeCanvas(eyeCanvas);
    }

    const ctx = eyeContext;

    const width = eyeMetrics.width;
    const height = eyeMetrics.height;

    if (!width || !height) return;

    const time = timestamp * 0.001;

    ctx.clearRect(0, 0, width, height);

    const fontSize = Math.max(
        8,
        Math.min(13, width / 45)
    );

    const cellWidth = fontSize * 0.62;
    const cellHeight = fontSize * 1.12;

    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const centerX = width / 2;
    const centerY = height / 2;

    const halfWidth = width * 0.43;
    const halfHeight = height * 0.25;

    const eyeRect = eyeCanvas.getBoundingClientRect();

    const screenCenterX = eyeRect.left + eyeRect.width / 2;
    const screenCenterY = eyeRect.top + eyeRect.height / 2;

    let targetOffsetX = 0;
    let targetOffsetY = 0;

    if (pointerPosition.active) {
        const directionX =
            (pointerPosition.x - screenCenterX) /
            (eyeRect.width / 2);

        const directionY =
            (pointerPosition.y - screenCenterY) /
            (eyeRect.height / 2);

        const limitedX = Math.max(
            -1,
            Math.min(1, directionX)
        );

        const limitedY = Math.max(
            -1,
            Math.min(1, directionY)
        );

        targetOffsetX = limitedX * halfWidth * 0.22;
        targetOffsetY = limitedY * halfHeight * 0.16;
    }

    pupilOffsetX += (targetOffsetX - pupilOffsetX) * 0.16;
    pupilOffsetY += (targetOffsetY - pupilOffsetY) * 0.16;

    const pupilX = centerX + pupilOffsetX;
    const pupilY = centerY + pupilOffsetY;

    const columns = Math.ceil(width / cellWidth);
    const rows = Math.ceil(height / cellHeight);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const x = col * cellWidth + cellWidth / 2;
            const y = row * cellHeight + cellHeight / 2;

            const nx = (x - centerX) / halfWidth;
            const ny = (y - centerY) / halfHeight;

            const absoluteX = Math.abs(nx);

            if (absoluteX > 1) continue;

            const horizontalShape = Math.pow(
                Math.max(0, 1 - absoluteX),
                0.62
            );

            const flameWave =
                Math.sin(time * 4.8 + col * 0.42) +
                Math.sin(time * 3.1 - col * 0.23);

            const upperFlame =
                Math.max(0, flameWave) *
                0.17 *
                (1 - absoluteX);

            const lowerFlame =
                Math.max(
                    0,
                    Math.sin(time * 3.7 + col * 0.36)
                ) *
                0.045 *
                (1 - absoluteX);

            const upperLimit = -horizontalShape - upperFlame;
            const lowerLimit = horizontalShape + lowerFlame;

            if (ny < upperLimit || ny > lowerLimit) continue;

            const depth = Math.abs(ny) / (horizontalShape + 0.001);

            const flicker =
                Math.sin(time * 8 + col * 0.71 + row * 0.17) * 0.5 +
                Math.sin(time * 5 - col * 0.27 + row * 0.51) * 0.25;

            const speckle =
                Math.sin(
                    col * 12.9898 +
                    row * 78.233 +
                    Math.floor(time * 12) * 0.13
                ) * 0.5 + 0.5;

            let heat =
                0.30 +
                (1 - depth) * 0.20 +
                (1 - absoluteX) * 0.16 +
                flicker * 0.09 +
                speckle * 0.08;

            const irisX =
                (x - pupilX) / (halfWidth * 0.30);

            const irisY =
                (y - pupilY) / (halfHeight * 0.72);

            const irisDistance = Math.sqrt(
                irisX * irisX + irisY * irisY
            );

            if (irisDistance < 1.2) {
                heat += (1 - irisDistance / 1.2) * 0.48;
            }

            heat = Math.max(0.10, Math.min(1, heat));

            const glyphIndex = Math.min(
                fireGlyphs.length - 1,
                Math.floor(heat * fireGlyphs.length)
            );

            const glyph = fireGlyphs[glyphIndex];
            const color = getFireColor(heat);

            ctx.fillStyle = color;
            ctx.globalAlpha = 0.80 + speckle * 0.20;

            ctx.shadowColor = color;
            ctx.shadowBlur = heat > 0.75 ? 7 : 2;

            ctx.fillText(glyph, x, y);
        }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    ctx.save();

    ctx.fillStyle = "rgba(12, 1, 1, 0.97)";
    ctx.shadowColor = "rgba(255, 85, 20, 0.85)";
    ctx.shadowBlur = 10;

    ctx.beginPath();

    ctx.ellipse(
        pupilX,
        pupilY,
        cellWidth * 0.78,
        halfHeight * 0.54,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "rgba(255, 125, 35, 0.8)";
    ctx.lineWidth = 1.5;

    ctx.stroke();

    ctx.restore();

    for (let i = 0; i < 30; i++) {
        const phase = (time * 0.18 + i / 30) % 1;

        const sparkX =
            centerX +
            Math.sin(i * 8.17 + time * 0.8) *
            halfWidth *
            0.92;

        const sparkY =
            centerY -
            halfHeight * 0.9 -
            phase * height * 0.18;

        ctx.globalAlpha = (1 - phase) * 0.65;

        ctx.fillStyle =
            i % 3 === 0
                ? "#ffb13f"
                : i % 3 === 1
                    ? "#e44919"
                    : "#ff751e";

        ctx.font = `${fontSize}px monospace`;

        ctx.fillText(
            [".", ":", "*"][i % 3],
            sparkX,
            sparkY
        );
    }

    ctx.globalAlpha = 1;
}

let lastEyeFrame = 0;

function startEyeAnimation() {
    if (!eyeCanvas || !eyeContext) return;

    eyeMetrics = resizeCanvas(eyeCanvas);
    lastEyeFrame = 0;

    function animateEye(timestamp) {
        if (!hasAwakened) return;

        if (timestamp - lastEyeFrame >= 1000 / 24) {
            lastEyeFrame = timestamp;
            drawAsciiEye(timestamp);
        }

        requestAnimationFrame(animateEye);
    }

    requestAnimationFrame(animateEye);
}

let transitionParticles = [];

const TRANSITION_DURATION = 1800;

const emberColors = [
    "#66100c",
    "#a51c13",
    "#d83218",
    "#f35a1e",
    "#ff912e",
    "#ffc452",
    "#fff0ad"
];

const emberGlyphs = [
    ".",
    ":",
    ";",
    "+",
    "*",
    "x",
    "X",
    "#"
];

function createTransitionParticles() {
    if (!transitionCanvas || !logoStage) return;

    transitionMetrics = resizeCanvas(transitionCanvas);

    const width = transitionMetrics.width;
    const height = transitionMetrics.height;

    const canvasRect = transitionCanvas.getBoundingClientRect();
    const stageRect = logoStage.getBoundingClientRect();

    const offsetX = stageRect.left - canvasRect.left;
    const offsetY = stageRect.top - canvasRect.top;

    const centerX = width / 2;
    const centerY = height / 2;

    const halfWidth = width * 0.43;
    const halfHeight = height * 0.25;

    const particleCount = Math.min(
        420,
        Math.max(
            180,
            Math.floor((width * height) / 800)
        )
    );

    transitionParticles = [];

    for (let i = 0; i < particleCount; i++) {
        const startX = offsetX + Math.random() * stageRect.width;
        const startY = offsetY + Math.random() * stageRect.height;

        const nx = Math.random() * 2 - 1;

        const boundary = Math.pow(
            Math.max(0, 1 - Math.abs(nx)),
            0.62
        );

        const targetX = centerX + nx * halfWidth;

        const targetY =
            centerY +
            (Math.random() * 2 - 1) *
            boundary *
            halfHeight *
            0.85;

        transitionParticles.push({
            startX,
            startY,
            targetX,
            targetY,
            delay: Math.random() * 0.25,
            lift: 15 + Math.random() * 55,
            size: 9 + Math.random() * 5,
            alpha: 0.65 + Math.random() * 0.35,
            seed: Math.random() * Math.PI * 2,
            glyph: emberGlyphs[
                Math.floor(Math.random() * emberGlyphs.length)
            ],
            color: emberColors[
                Math.floor(Math.random() * emberColors.length)
            ]
        });
    }
}

function startTransitionAnimation() {
    if (!transitionCanvas || !transitionContext) return;

    createTransitionParticles();

    const transitionStartTime = performance.now();

    transitionCanvas.classList.remove("is-fading");

    function drawTransition(timestamp) {
        const ctx = transitionContext;

        const width = transitionMetrics.width;
        const height = transitionMetrics.height;

        const elapsed = timestamp - transitionStartTime;

        const progress = Math.min(
            elapsed / TRANSITION_DURATION,
            1
        );

        ctx.clearRect(0, 0, width, height);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (const particle of transitionParticles) {
            const localProgress = Math.max(
                0,
                Math.min(
                    1,
                    (progress - particle.delay) /
                    (1 - particle.delay)
                )
            );

            const eased =
                localProgress *
                localProgress *
                (3 - 2 * localProgress);

            const drift =
                Math.sin(timestamp * 0.005 + particle.seed) *
                (1 - eased) *
                12;

            const x =
                particle.startX +
                (particle.targetX - particle.startX) * eased +
                drift;

            const y =
                particle.startY +
                (particle.targetY - particle.startY) * eased -
                Math.sin(localProgress * Math.PI) * particle.lift;

            const alpha =
                (1 - eased * 0.82) *
                particle.alpha *
                Math.min(1, progress * 4 + 0.15);

            if (alpha <= 0.01) continue;

            ctx.globalAlpha = alpha;

            ctx.fillStyle = particle.color;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 8;

            ctx.font = `bold ${particle.size}px "Courier New", monospace`;

            ctx.fillText(particle.glyph, x, y);
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        if (elapsed < TRANSITION_DURATION) {
            requestAnimationFrame(drawTransition);
        } else {
            ctx.clearRect(0, 0, width, height);

            transitionCanvas.classList.add("is-fading");

            transitionParticles = [];
        }
    }

    requestAnimationFrame(drawTransition);
}

function awakenEye() {
    if (
        hasAwakened ||
        !logoStage ||
        !eyeCanvas ||
        !transitionCanvas
    ) {
        return;
    }

    hasAwakened = true;

    clearTimeout(wakeTimer);

    logoStage.classList.remove("is-charging", "has-pointer");
    logoStage.classList.add("is-awakening");

    if (prefersReducedMotion) {
        eyeMetrics = resizeCanvas(eyeCanvas);

        logoStage.classList.add("is-awakened");

        drawAsciiEye(0);

        return;
    }

    startEyeAnimation();
    startTransitionAnimation();

    setTimeout(() => {
        logoStage.classList.add("is-awakened");
    }, 650);
}

window.addEventListener("resize", () => {
    updateRingReflection();

    if (hasAwakened && eyeCanvas) {
        eyeMetrics = resizeCanvas(eyeCanvas);

        if (prefersReducedMotion) {
            drawAsciiEye(0);
        }
    }
});

if (lightbox && lightboxImage && lightboxViewport) {
    let currentScale = 1;

    let currentX = 0;
    let currentY = 0;

    let startX = 0;
    let startY = 0;

    let dragStartX = 0;
    let dragStartY = 0;

    let dragging = false;
    let zoomMode = false;

    const minScale = 1;
    const maxScale = 3;

    function clampPan() {
        if (currentScale <= 1) {
            currentX = 0;
            currentY = 0;
            return;
        }

        const viewportWidth = lightboxViewport.clientWidth;
        const viewportHeight = lightboxViewport.clientHeight;

        const baseWidth = lightboxImage.offsetWidth;
        const baseHeight = lightboxImage.offsetHeight;

        const maxX = Math.max(
            0,
            (baseWidth * currentScale - viewportWidth) / 2
        );

        const maxY = Math.max(
            0,
            (baseHeight * currentScale - viewportHeight) / 2
        );

        currentX = Math.max(
            -maxX,
            Math.min(maxX, currentX)
        );

        currentY = Math.max(
            -maxY,
            Math.min(maxY, currentY)
        );
    }

    function applyTransform() {
        clampPan();

        lightboxImage.style.transform =
            `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
    }

    function updateZoomMode() {
        if (cursorLight) {
            cursorLight.classList.toggle("is-zoom-cursor", zoomMode);
        }

        if (lightboxZoomToggle) {
            lightboxZoomToggle.setAttribute(
                "aria-pressed",
                String(zoomMode)
            );

            lightboxZoomToggle.setAttribute(
                "aria-label",
                zoomMode ? "Desativar lupa" : "Ativar lupa"
            );

            lightboxZoomToggle.setAttribute(
                "title",
                zoomMode
                    ? "Clique na imagem para ampliar"
                    : "Ativar lupa"
            );
        }

        if (lightboxHint) {
            if (zoomMode) {
                lightboxHint.textContent =
                    "Lupa ativada: clique no ponto da imagem que deseja ampliar.";
            } else if (currentScale > 1.01) {
                lightboxHint.textContent =
                    "Imagem ampliada: arraste para explorar os detalhes ou use 1:1 para restaurar.";
            } else {
                lightboxHint.textContent =
                    "Ative a lupa e clique na imagem para ampliar. A roda do mouse também controla o zoom.";
            }
        }

        applyTransform();
    }

    function resetZoom() {
        currentScale = 1;
        currentX = 0;
        currentY = 0;
        dragging = false;

        updateZoomMode();
    }

    function getZoomOrigin(event) {
        const rect = lightboxViewport.getBoundingClientRect();

        return {
            x: rect.width
                ? (event.clientX - rect.left) / rect.width
                : 0.5,
            y: rect.height
                ? (event.clientY - rect.top) / rect.height
                : 0.5
        };
    }

    function setZoom(scale, originX = 0.5, originY = 0.5) {
        const nextScale = Math.max(
            minScale,
            Math.min(maxScale, scale)
        );

        const rect = lightboxViewport.getBoundingClientRect();

        if (!rect.width || !rect.height) return;

        const beforeX = (
            originX * rect.width -
            rect.width / 2 -
            currentX
        ) / currentScale;

        const beforeY = (
            originY * rect.height -
            rect.height / 2 -
            currentY
        ) / currentScale;

        currentScale = nextScale;

        currentX =
            originX * rect.width -
            rect.width / 2 -
            beforeX * currentScale;

        currentY =
            originY * rect.height -
            rect.height / 2 -
            beforeY * currentScale;

        updateZoomMode();
    }

    function openLightbox(image) {
        const thumbnailSrc = image.currentSrc || image.src;

        const fullSrc = (
            image.dataset.full ||
            image.dataset.original ||
            ""
        ).trim();

        lightboxImage.alt = image.alt;

        lightboxImage.removeAttribute("src");

        lightboxImage.onerror = null;
        lightboxImage.onload = null;

        zoomMode = false;
        resetZoom();

        document.body.classList.add("lightbox-open");

        if (fullSrc) {
            let fallbackUsed = false;

            lightboxImage.onerror = () => {
                if (fallbackUsed) return;

                fallbackUsed = true;

                lightboxImage.onerror = null;
                lightboxImage.src = thumbnailSrc;
            };

            lightboxImage.src = fullSrc;
        } else {
            lightboxImage.src = thumbnailSrc;
        }

        if (cursorLight) {
            lightbox.append(cursorLight);
            cursorLight.classList.remove("is-zoom-cursor");
        }

        lightbox.showModal();
    }

    galleryImages.forEach((image) => {
        image.setAttribute("tabindex", "0");
        image.setAttribute("role", "button");

        image.setAttribute(
            "aria-label",
            `${image.alt}. Abrir imagem ampliada.`
        );

        image.addEventListener("click", () => {
            openLightbox(image);
        });

        image.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openLightbox(image);
            }
        });
    });

    lightboxZoomToggle?.addEventListener("click", () => {
        zoomMode = !zoomMode;
        updateZoomMode();
    });

    lightboxCloseButton?.addEventListener("click", () => {
        lightbox.close();
    });

    lightboxResetButton?.addEventListener("click", () => {
        zoomMode = false;
        resetZoom();
    });

    lightbox.addEventListener("close", () => {
        zoomMode = false;
        resetZoom();

        lightboxImage.onerror = null;
        lightboxImage.onload = null;

        lightboxImage.removeAttribute("src");
        lightboxImage.alt = "";

        document.body.classList.remove("lightbox-open");

        if (cursorLight) {
            cursorLight.classList.remove("is-zoom-cursor");
            document.body.append(cursorLight);
        }
    });

    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            lightbox.close();
        }
    });

    lightboxImage.addEventListener("click", (event) => {
        if (!zoomMode) return;

        const { x: originX, y: originY } = getZoomOrigin(event);

        if (currentScale <= 1.01) {
            setZoom(2.2, originX, originY);
        } else {
            resetZoom();
        }

        zoomMode = false;
        updateZoomMode();
    });

    lightboxViewport.addEventListener(
        "wheel",
        (event) => {
            event.preventDefault();

            const { x: originX, y: originY } = getZoomOrigin(event);
            const delta = event.deltaY > 0 ? -0.14 : 0.14;

            setZoom(
                currentScale + delta,
                originX,
                originY
            );
        },
        {
            passive: false
        }
    );

    lightboxViewport.addEventListener("dblclick", (event) => {
        if (zoomMode) return;

        const { x: originX, y: originY } = getZoomOrigin(event);

        if (currentScale <= 1.01) {
            setZoom(2.2, originX, originY);
        } else {
            resetZoom();
        }
    });

    lightboxViewport.addEventListener("pointerdown", (event) => {
        if (
            event.button !== 0 ||
            zoomMode ||
            currentScale <= 1.01
        ) {
            return;
        }

        dragging = true;

        startX = event.clientX;
        startY = event.clientY;

        dragStartX = currentX;
        dragStartY = currentY;

        lightboxViewport.setPointerCapture(event.pointerId);

        applyTransform();
    });

    lightboxViewport.addEventListener("pointermove", (event) => {
        if (!dragging) return;

        currentX = dragStartX + (event.clientX - startX);
        currentY = dragStartY + (event.clientY - startY);

        applyTransform();
    });

    function endDrag() {
        if (!dragging) return;

        dragging = false;
        applyTransform();
    }

    lightboxViewport.addEventListener("pointerup", endDrag);
    lightboxViewport.addEventListener("pointercancel", endDrag);
    lightboxViewport.addEventListener("lostpointercapture", endDrag);
}

if (budgetForm) {
    const WHATSAPP_NUMBER = "5519999998300";

    budgetForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!budgetForm.reportValidity()) return;

        const data = new FormData(budgetForm);

        const nome = String(data.get("nome") || "").trim();
        const telefone = String(data.get("telefone") || "").trim();
        const parte = String(data.get("parte") || "").trim();
        const tamanho = String(data.get("tamanho") || "").trim();
        const estilo = String(data.get("estilo") || "").trim();
        const prazo = String(data.get("data") || "").trim();
        const detalhes = String(data.get("detalhes") || "").trim();

        const mensagem =
            `Olá! Quero pedir um orçamento de tatuagem.\n\n` +
            `Nome: ${nome}\n` +
            `Telefone/WhatsApp: ${telefone}\n` +
            `Parte do corpo: ${parte}\n` +
            `Tamanho aproximado: ${tamanho}\n` +
            `Estilo: ${estilo}\n` +
            `Prazo: ${prazo}\n\n` +
            `Detalhes da ideia:\n${detalhes}\n\n` +
            `Estou ciente de que o trabalho é realizado em preto e branco.`;

        const url =
            `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;

        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );
    });
}