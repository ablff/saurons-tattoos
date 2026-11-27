"use strict";

(() => {
    const canvas = document.querySelector(".grimoire-background__canvas");
    const main = document.querySelector("main.container");

    if (!canvas || !main) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const coarse = window.matchMedia(
        "(hover: none), (pointer: coarse)"
    ).matches;

    const PAGE_MS = 120000;
    const TURN_MS = 2600;
    const LIGHT_R = coarse ? 130 : 175;
    const INK = "rgb(216,190,142)";
    const RED = "rgb(190,72,52)";
    const DIM = 0.2;

    const rng = (seed) => () => {
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;

        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const ease = (x) => x * x * (3 - 2 * x);
    const clamp = (value, min, max) =>
        Math.max(min, Math.min(max, value));

    const createCanvas = (width, height) => {
        const element = document.createElement("canvas");

        element.width = width;
        element.height = height;

        return element;
    };

    const getScale = () => Math.min(dpr, 1.5);

    const PAGES = [
        {
            id: "moria",
            sec: {
                side: 0,
                y0: 0.56,
                p: 0,
                hold: 0,
                found: false,
                armed: true,
                fly: -1
            }
        },
        {
            id: "ring",
            sec: {
                side: 1,
                y0: 0.30,
                p: 0,
                hold: 0,
                found: false,
                armed: true,
                fly: -1
            }
        },
        {
            id: "smaug",
            sec: {
                side: 1,
                y0: 0.64,
                p: 0,
                hold: 0,
                found: false,
                armed: true,
                fly: -1
            }
        },
        {
            id: "alchemy",
            sec: {
                side: 0,
                y0: 0.30,
                p: 0,
                hold: 0,
                found: false,
                armed: true,
                fly: -1
            }
        }
    ];

    const SPREADS = [
        {
            tint: "150,195,235",
            gl: "KHAZAD-DÛM · DURIN · THE DEEP PLACES",
            gr: "Sub montibus antiquis",
            L: {
                k: "recipe",
                title: "POTIO MITHRIL",
                sub: "ad lucem in tenebris",
                art: "flask",
                items: [
                    ["Argentum montis", "iii unc."],
                    ["Aqua profunda", "i calix"],
                    ["Pulvis lapidis", "ii pugni"],
                    ["Lux stellae", "gutta"]
                ],
                steps: [
                    "Misce sub luna nova.",
                    "Coque donec lucet.",
                    "Bibe in silentio."
                ]
            },
            R: {
                k: "spell",
                title: "APERI PORTAM",
                lines: [
                    "Dic «amicus»",
                    "et intra."
                ],
                note: "Lapides audiunt",
                art: "pentacle"
            }
        },
        {
            tint: "240,175,70",
            gl: "ANNATAR · DOMINATION",
            gr: "THE ONE RING · ASH AND FIRE",
            L: {
                k: "spell",
                title: "ANULUS UNUS",
                lines: [
                    "Ignis in auro dormit,",
                    "umbra in igne vigilat."
                ],
                note: "Ne tangas",
                art: "pentacle"
            },
            R: {
                k: "recipe",
                title: "ELIXIR AURI",
                sub: "cinis et flamma",
                art: "sprig",
                items: [
                    ["Aurum liquidum", "i uncia"],
                    ["Cinis ignis", "ii pugni"],
                    ["Lacrima solis", "gutta"],
                    ["Sanguis ruber", "iii guttae"]
                ],
                steps: [
                    "Solve in igne lento.",
                    "Misce cum cinere.",
                    "Serva in tenebris."
                ]
            }
        },
        {
            tint: "235,115,50",
            gl: "AUREUM · TREASURE",
            gr: "Flamma in tenebris",
            L: {
                k: "herbal",
                title: "DRACO IGNIS",
                sub: "natura et usus",
                art: "scales",
                notes: [
                    ["squamae", "aurum tegunt"],
                    ["oculus", "semper vigilat"],
                    ["halitus", "ignis vivus"]
                ]
            },
            R: {
                k: "recipe",
                title: "FLAMMA DRACONIS",
                sub: "contra frigus noctis",
                art: "mushroom",
                items: [
                    ["Squama draconis", "i"],
                    ["Carbo ardens", "iii"],
                    ["Fel nocturnum", "ii guttae"],
                    ["Sulphur", "pars"]
                ],
                steps: [
                    "Ure in vase ferreo.",
                    "Infunde sub umbra.",
                    "Bibe caute."
                ]
            }
        },
        {
            tint: "205,175,120",
            gl: "TRANSMUTATION · PHILOSOPHER STONE",
            gr: "Visita interiora terrae",
            L: {
                k: "recipe",
                title: "AQUA VITAE",
                sub: "liquor primus",
                art: "flask",
                items: [
                    ["Vitriolum", "ii partes"],
                    ["Mercurius", "i pars"],
                    ["Rosa nocturna", "iii folia"],
                    ["Aqua lunae", "calix"]
                ],
                steps: [
                    "Distilla ter.",
                    "Filtra per lanam.",
                    "Serva sub vitro."
                ]
            },
            R: {
                k: "opus",
                title: "OPUS MAGNUM",
                stages: [
                    ["NIGREDO", "putrefactio"],
                    ["ALBEDO", "purificatio"],
                    ["RUBEDO", "perfectio"]
                ],
                line: "Solve · Coagula"
            }
        }
    ];

    let width = 0;
    let height = 0;
    let dpr = 1;

    let book = null;

    let mainL = 0;
    let mainR = 0;

    let currentPage = 0;
    let previousPage = -1;

    let pageStart = 0;
    let turnStart = -1;

    let margin = 20;
    let centerX = 0;
    let pageWidth = 0;

    let leafFront = null;
    let leafBack = null;

    const pointer = {
        x: -999,
        y: -999,
        active: false
    };

    const dust = [];
    const embers = [];
    const inkCache = new Map();

    const lightCanvas = createCanvas(1, 1);
    const lightContext = lightCanvas.getContext("2d");

    function createNoise(w, h, cell) {
        const noiseCanvas = createCanvas(
            Math.ceil(w / cell),
            Math.ceil(h / cell)
        );

        const noiseContext = noiseCanvas.getContext("2d");
        const imageData = noiseContext.createImageData(
            noiseCanvas.width,
            noiseCanvas.height
        );

        for (let i = 0; i < imageData.data.length; i += 4) {
            const value = Math.random() * 255;

            imageData.data[i] = value;
            imageData.data[i + 1] = value;
            imageData.data[i + 2] = value;
            imageData.data[i + 3] = 255;
        }

        noiseContext.putImageData(imageData, 0, 0);

        return noiseCanvas;
    }

    function buildBook() {
        book = createCanvas(
            Math.round(width * dpr),
            Math.round(height * dpr)
        );

        const b = book.getContext("2d");
        const random = rng(7);

        b.scale(dpr, dpr);

        function overlay(cell, alpha) {
            b.globalCompositeOperation = "overlay";
            b.globalAlpha = alpha;
            b.imageSmoothingEnabled = true;

            b.drawImage(
                createNoise(width, height, cell),
                0,
                0,
                width,
                height
            );

            b.globalCompositeOperation = "source-over";
            b.globalAlpha = 1;
        }

        b.fillStyle = "#0c0706";
        b.fillRect(0, 0, width, height);

        overlay(3, 0.4);

        b.save();

        b.beginPath();
        b.rect(
            margin,
            margin,
            width - 2 * margin,
            height - 2 * margin
        );
        b.clip();

        for (const cx of [
            (margin + centerX) / 2,
            (centerX + width - margin) / 2
        ]) {
            const gradient = b.createRadialGradient(
                cx,
                height * 0.45,
                0,
                cx,
                height * 0.5,
                Math.max(pageWidth, height * 0.6)
            );

            gradient.addColorStop(0, "#3d2d1f");
            gradient.addColorStop(0.6, "#2b1f15");
            gradient.addColorStop(1, "#18110c");

            b.fillStyle = gradient;

            b.fillRect(
                cx - pageWidth / 2 - 2,
                margin,
                pageWidth + 4,
                height - 2 * margin
            );
        }

        overlay(90, 0.25);
        overlay(20, 0.3);
        overlay(4, 0.25);
        overlay(1.5, 0.2);

        b.strokeStyle = "rgba(210,180,130,0.05)";
        b.lineWidth = 0.6;

        for (let i = 0; i < 380; i++) {
            const x = random() * width;
            const y = random() * height;
            const angle = random() * 6.28;
            const length = 6 + random() * 22;

            b.beginPath();
            b.moveTo(x, y);

            b.quadraticCurveTo(
                x + Math.cos(angle) * length / 2,
                y + Math.sin(angle) * length / 2 + 3,
                x + Math.cos(angle) * length,
                y + Math.sin(angle) * length
            );

            b.stroke();
        }

        function blob(x, y, radius, stops) {
            const gradient = b.createRadialGradient(
                x,
                y,
                0,
                x,
                y,
                radius
            );

            stops.forEach(([offset, color]) => {
                gradient.addColorStop(offset, color);
            });

            b.fillStyle = gradient;

            b.fillRect(
                x - radius,
                y - radius,
                radius * 2,
                radius * 2
            );
        }

        for (let i = 0; i < 8; i++) {
            const x = random() * width;
            const y = random() * height;
            const radius = 40 + random() * 120;

            blob(x, y, radius, [
                [0, "rgba(95,58,22,0.2)"],
                [0.8, "rgba(80,48,18,0.08)"],
                [1, "rgba(0,0,0,0)"]
            ]);

            if (random() < 0.5) {
                b.strokeStyle = "rgba(100,60,22,0.14)";
                b.lineWidth = 2;

                b.beginPath();
                b.arc(x, y, radius * 0.78, 0, 6.28);
                b.stroke();
            }
        }

        for (let i = 0; i < 6; i++) {
            blob(
                random() * width,
                random() * height,
                6 + random() * 24,
                [
                    [0, "rgba(6,4,3,0.55)"],
                    [1, "rgba(6,4,3,0)"]
                ]
            );
        }

        for (let i = 0; i < 5; i++) {
            const side = i % 4;

            const x = side === 0
                ? margin
                : side === 1
                    ? width - margin
                    : random() * width;

            const y = side === 2
                ? margin
                : side === 3
                    ? height - margin
                    : random() * height;

            blob(x, y, 40 + random() * 60, [
                [0, "rgba(0,0,0,0.9)"],
                [0.5, "rgba(0,0,0,0.55)"],
                [0.8, "rgba(125,55,16,0.22)"],
                [1, "rgba(0,0,0,0)"]
            ]);
        }

        b.strokeStyle = "rgba(140,80,45,0.42)";
        b.lineWidth = 1;

        for (const [start, end] of [
            [margin + 20, centerX - 36],
            [centerX + 36, width - margin - 20]
        ]) {
            for (const offset of [0, 4]) {
                b.strokeRect(
                    start + offset,
                    margin + 20 + offset,
                    end - start - 2 * offset,
                    height - 2 * margin - 40 - 2 * offset
                );
            }
        }

        const gutter = b.createLinearGradient(
            centerX - 70,
            0,
            centerX + 70,
            0
        );

        gutter.addColorStop(0, "rgba(0,0,0,0)");
        gutter.addColorStop(0.5, "rgba(0,0,0,0.7)");
        gutter.addColorStop(1, "rgba(0,0,0,0)");

        b.fillStyle = gutter;
        b.fillRect(centerX - 70, 0, 140, height);

        b.fillStyle = "rgba(0,0,0,0.5)";

        for (
            let y = margin + 40;
            y < height - margin - 40;
            y += 90
        ) {
            b.fillRect(centerX - 1, y, 2, 20);
        }

        for (const [start, end] of [
            [0, 0.07],
            [1, 0.93]
        ]) {
            const gradient = b.createLinearGradient(
                width * start,
                0,
                width * end,
                0
            );

            gradient.addColorStop(0, "rgba(0,0,0,0.55)");
            gradient.addColorStop(1, "rgba(0,0,0,0)");

            b.fillStyle = gradient;
            b.fillRect(0, 0, width, height);
        }

        const vignette = b.createRadialGradient(
            width / 2,
            height / 2,
            Math.min(width, height) * 0.3,
            width / 2,
            height / 2,
            Math.hypot(width, height) * 0.6
        );

        vignette.addColorStop(0, "rgba(0,0,0,0)");
        vignette.addColorStop(1, "rgba(0,0,0,0.65)");

        b.fillStyle = vignette;
        b.fillRect(0, 0, width, height);

        b.restore();

        for (let i = 1; i <= 4; i++) {
            b.strokeStyle = i % 2
                ? "rgba(0,0,0,0.4)"
                : "rgba(200,170,120,0.13)";

            b.lineWidth = 1;

            b.beginPath();

            b.moveTo(
                margin + 1 + i * 1.6,
                margin + 3 + i
            );

            b.lineTo(
                margin + 1 + i * 1.6,
                height - margin - 3 - i
            );

            b.moveTo(
                width - margin - 1 - i * 1.6,
                margin + 3 + i
            );

            b.lineTo(
                width - margin - 1 - i * 1.6,
                height - margin - 3 - i
            );

            b.stroke();
        }

        b.save();

        b.setLineDash([7, 6]);
        b.strokeStyle = "rgba(197,161,90,0.25)";
        b.strokeRect(
            margin / 2,
            margin / 2,
            width - margin,
            height - margin
        );

        b.setLineDash([]);
        b.shadowColor = "rgba(0,0,0,0.9)";
        b.shadowBlur = 16;
        b.strokeStyle = "rgba(0,0,0,0.8)";
        b.lineWidth = 2;

        b.strokeRect(
            margin,
            margin,
            width - 2 * margin,
            height - 2 * margin
        );

        b.restore();
    }

    function drawArt(g, type, x, y, size) {
        g.save();

        g.strokeStyle = INK;
        g.fillStyle = INK;
        g.lineWidth = 1.3;
        g.lineCap = "round";
        g.beginPath();

        if (type === "flask") {
            const cy = y + size * 0.3;
            const radius = size * 0.5;
            const edge = 0.284;

            g.moveTo(x + size * 0.14, y - size * 0.72);

            g.lineTo(
                x + size * 0.14,
                cy - Math.sqrt(
                    radius * radius - size * size * 0.0196
                )
            );

            g.arc(
                x,
                cy,
                radius,
                -Math.PI / 2 + edge,
                1.5 * Math.PI - edge
            );

            g.lineTo(x - size * 0.14, y - size * 0.72);

            g.moveTo(x - size * 0.22, y - size * 0.72);
            g.lineTo(x + size * 0.22, y - size * 0.72);
            g.stroke();

            g.beginPath();

            g.moveTo(
                x - size * 0.46,
                cy + size * 0.05
            );

            g.quadraticCurveTo(
                x - size * 0.2,
                cy - size * 0.08,
                x,
                cy + size * 0.05
            );

            g.quadraticCurveTo(
                x + size * 0.2,
                cy + size * 0.18,
                x + size * 0.46,
                cy + size * 0.05
            );

            g.stroke();

            for (let i = 0; i < 4; i++) {
                g.beginPath();

                g.arc(
                    x + (i - 1.5) * size * 0.14,
                    cy + size * 0.2 + (i % 2) * size * 0.1,
                    size * 0.03 + (i % 2) * size * 0.02,
                    0,
                    6.28
                );

                g.stroke();
            }
        } else if (type === "mushroom") {
            g.ellipse(
                x,
                y,
                size * 0.55,
                size * 0.4,
                0,
                Math.PI,
                0
            );

            g.lineTo(x - size * 0.55, y);
            g.stroke();

            g.beginPath();

            g.moveTo(x - size * 0.14, y);

            g.bezierCurveTo(
                x - size * 0.1,
                y + size * 0.3,
                x - size * 0.2,
                y + size * 0.5,
                x - size * 0.22,
                y + size * 0.6
            );

            g.lineTo(x + size * 0.22, y + size * 0.6);

            g.bezierCurveTo(
                x + size * 0.2,
                y + size * 0.5,
                x + size * 0.1,
                y + size * 0.3,
                x + size * 0.14,
                y
            );

            g.stroke();

            for (let i = 0; i < 4; i++) {
                g.beginPath();

                g.arc(
                    x + (i - 1.5) * size * 0.22,
                    y - size * 0.18 - (i % 2) * size * 0.08,
                    size * 0.05,
                    0,
                    6.28
                );

                g.fill();
            }
        } else if (type === "sprig") {
            g.moveTo(x, y + size * 0.7);

            g.quadraticCurveTo(
                x + size * 0.12,
                y,
                x,
                y - size * 0.7
            );

            g.stroke();

            for (let i = 0; i < 6; i++) {
                const direction = i % 2 ? 1 : -1;

                g.beginPath();

                g.ellipse(
                    x + direction * size * 0.2,
                    y + size * 0.45 - i * size * 0.2,
                    size * 0.2,
                    size * 0.08,
                    -direction * 0.6,
                    0,
                    6.28
                );

                g.stroke();
            }
        } else if (type === "pentacle") {
            g.arc(x, y, size, 0, 6.28);

            g.moveTo(x + size * 0.86, y);
            g.arc(x, y, size * 0.86, 0, 6.28);

            g.stroke();

            g.beginPath();

            for (let i = 0; i < 5; i++) {
                const angle = -Math.PI / 2 + i * 4 * Math.PI / 5;

                g[i ? "lineTo" : "moveTo"](
                    x + Math.cos(angle) * size * 0.86,
                    y + Math.sin(angle) * size * 0.86
                );
            }

            g.closePath();
            g.stroke();

            g.font = `${size * 0.15}px "IM Fell English", serif`;
            g.textAlign = "center";

            const runes = "ᚠᚢᚦᚨᚱᚲᛏᛟᛚᛁᛖᚾ";

            for (let i = 0; i < 12; i++) {
                const angle = i / 12 * 6.28;

                g.fillText(
                    runes[i],
                    x + Math.cos(angle) * size * 1.14,
                    y + Math.sin(angle) * size * 1.14 + size * 0.05
                );
            }
        } else if (type === "moons") {
            for (let i = 0; i < 5; i++) {
                const cx = x + (i - 2) * size * 2.6;
                const curvature = Math.cos(i * Math.PI / 4);

                g.beginPath();
                g.arc(cx, y, size, 0, 6.28);
                g.stroke();

                g.beginPath();

                g.arc(
                    cx,
                    y,
                    size,
                    -Math.PI / 2,
                    Math.PI / 2,
                    true
                );

                g.ellipse(
                    cx,
                    y,
                    size * Math.abs(curvature),
                    size,
                    0,
                    Math.PI / 2,
                    -Math.PI / 2,
                    curvature > 0
                );

                g.fill();
            }
        } else if (type === "scales") {
            g.arc(x, y, size, 0, 6.28);
            g.stroke();

            g.save();

            g.beginPath();
            g.arc(x, y, size, 0, 6.28);
            g.clip();

            for (let row = -8; row <= 8; row++) {
                for (let col = -8; col <= 8; col++) {
                    g.beginPath();

                    g.arc(
                        x + col * size * 0.2 + (row & 1) * size * 0.1,
                        y + row * size * 0.14,
                        size * 0.1,
                        0,
                        Math.PI
                    );

                    g.stroke();
                }
            }

            g.restore();

            g.fillStyle = "#150d0a";

            g.beginPath();
            g.ellipse(x, y, size * 0.5, size * 0.22, 0, 0, 6.28);
            g.fill();
            g.stroke();

            g.fillStyle = INK;

            g.beginPath();
            g.ellipse(x, y, size * 0.05, size * 0.2, 0, 0, 6.28);
            g.fill();
        }

        g.restore();
    }

    function paintPage(g, data, rect, spread) {
        const center = rect.x + rect.w / 2;
        const fontSize = clamp(rect.w * 0.052, 10, 18);
        const titleSize = clamp(rect.w * 0.075, 14, 26);
        const tint = `rgb(${spread.tint})`;

        const italic = `italic ${fontSize}px "IM Fell English", Georgia, serif`;
        const caption = (scale) =>
            `600 ${fontSize * scale}px Cinzel, Georgia, serif`;

        const text = (value, x, y, font, color, align = "center") => {
            g.font = font;
            g.fillStyle = color;
            g.textAlign = align;
            g.fillText(value, x, y);
        };

        const rule = (y, ruleWidth) => {
            g.strokeStyle = INK;
            g.lineWidth = 0.8;

            g.beginPath();
            g.moveTo(center - ruleWidth, y);
            g.lineTo(center - 9, y);
            g.moveTo(center + 9, y);
            g.lineTo(center + ruleWidth, y);
            g.stroke();

            text("✦", center, y + 4, caption(0.8), RED);
        };

        const titleY = rect.y + rect.h * 0.09;

        text(
            data.title,
            center,
            titleY,
            `600 ${titleSize}px Cinzel, Georgia, serif`,
            tint
        );

        rule(titleY + titleSize * 0.8, rect.w * 0.3);

        if (data.sub) {
            text(
                data.sub,
                center,
                titleY + titleSize * 2,
                italic,
                INK
            );
        }

        if (data.k === "recipe") {
            drawArt(
                g,
                data.art,
                center,
                rect.y + rect.h * 0.29,
                rect.w * 0.15
            );

            let y = rect.y + rect.h * 0.46;

            text("INGREDIENTIA", center, y, caption(0.75), RED);

            y += fontSize * 2;

            const left = rect.x + rect.w * 0.1;
            const right = rect.x + rect.w * 0.9;

            for (const [name, quantity] of data.items) {
                g.font = italic;

                const nameWidth = g.measureText(name).width;
                const quantityWidth = g.measureText(quantity).width;

                text(name, left, y, italic, INK, "left");
                text(quantity, right, y, italic, INK, "right");

                g.save();

                g.strokeStyle = INK;
                g.setLineDash([1, 4]);

                g.beginPath();
                g.moveTo(left + nameWidth + 6, y);
                g.lineTo(right - quantityWidth - 6, y);
                g.stroke();

                g.restore();

                y += fontSize * 1.9;
            }

            y += fontSize * 0.6;

            text("MODUS", center, y, caption(0.75), RED);

            y += fontSize * 2;

            data.steps.forEach((step, index) => {
                text(
                    `${["i", "ii", "iii", "iv"][index]}.  ${step}`,
                    left,
                    y,
                    italic,
                    INK,
                    "left"
                );

                y += fontSize * 1.8;
            });
        } else if (data.k === "spell") {
            drawArt(
                g,
                data.art,
                center,
                rect.y + rect.h * 0.42,
                Math.min(rect.w, rect.h) * 0.3
            );

            data.lines.forEach((line, index) => {
                text(
                    line,
                    center,
                    rect.y + rect.h * 0.74 + index * fontSize * 2.2,
                    `italic ${fontSize * 1.35}px "IM Fell English", serif`,
                    INK
                );
            });

            rule(
                rect.y + rect.h * 0.74 + data.lines.length * fontSize * 2.2,
                rect.w * 0.18
            );

            text(
                data.note,
                center,
                rect.y + rect.h * 0.92 - fontSize,
                italic,
                RED
            );
        } else if (data.k === "herbal") {
            drawArt(
                g,
                data.art,
                center,
                rect.y + rect.h * 0.4,
                Math.min(rect.w, rect.h) * 0.3
            );

            data.notes.forEach(([name, description], index) => {
                const y = rect.y + rect.h * (0.7 + index * 0.07);

                text(
                    name,
                    center - 12,
                    y,
                    caption(0.8),
                    tint,
                    "right"
                );

                text(
                    description,
                    center + 12,
                    y,
                    italic,
                    INK,
                    "left"
                );
            });
        } else {
            drawArt(
                g,
                "moons",
                center,
                rect.y + rect.h * 0.25,
                rect.w * 0.045
            );

            data.stages.forEach(([name, description], index) => {
                const y = rect.y + rect.h * (0.42 + index * 0.15);

                g.beginPath();

                g.arc(
                    center - rect.w * 0.3,
                    y - fontSize * 0.3,
                    fontSize * 0.8,
                    0,
                    6.28
                );

                g.fillStyle = ["#000", "#f1e6cf", "#a32a22"][index];
                g.fill();

                g.strokeStyle = INK;
                g.stroke();

                text(
                    name,
                    center - rect.w * 0.18,
                    y - fontSize * 0.1,
                    caption(1.1),
                    tint,
                    "left"
                );

                text(
                    description,
                    center - rect.w * 0.18,
                    y + fontSize * 1.3,
                    italic,
                    INK,
                    "left"
                );
            });

            text(
                data.line,
                center,
                rect.y + rect.h * 0.9 - fontSize,
                `italic ${fontSize * 1.3}px "IM Fell English", serif`,
                RED
            );
        }

        text(
            "— ✦ —",
            center,
            rect.y + rect.h - fontSize * 0.5,
            italic,
            RED
        );
    }

    function paintSpread(g, index) {
        const spread = SPREADS[index];

        const padding = 30;
        const gutter = 46;

        const y = margin + padding;
        const pageHeight = height - 2 * (margin + padding);

        paintPage(
            g,
            spread.L,
            {
                x: margin + padding,
                y,
                w: centerX - gutter - (margin + padding),
                h: pageHeight
            },
            spread
        );

        paintPage(
            g,
            spread.R,
            {
                x: centerX + gutter,
                y,
                w: width - margin - padding - (centerX + gutter),
                h: pageHeight
            },
            spread
        );

        g.fillStyle = INK;
        g.font = 'italic 11px "IM Fell English", serif';
        g.textAlign = "center";

        for (const [label, x, angle] of [
            [spread.gl, margin + 12, -Math.PI / 2],
            [spread.gr, width - margin - 12, Math.PI / 2]
        ]) {
            g.save();

            g.translate(x, height / 2);
            g.rotate(angle);
            g.fillText(label, 0, 0, height * 0.6);

            g.restore();
        }
    }

    function getInk(index) {
        if (!inkCache.has(index)) {
            const scale = getScale();

            const inkCanvas = createCanvas(
                Math.round(width * scale),
                Math.round(height * scale)
            );

            const inkContext = inkCanvas.getContext("2d");

            inkContext.scale(scale, scale);
            paintSpread(inkContext, index);

            inkCache.set(index, inkCanvas);
        }

        return inkCache.get(index);
    }

    function layout() {
        margin = clamp(width * 0.028, 12, 42);

        centerX = width / 2;
        pageWidth = centerX - margin;

        const rect = main.getBoundingClientRect();

        mainL = rect.left;
        mainR = rect.right;

        const leftSpace = Math.max(0, rect.left);
        const rightSpace = Math.max(0, width - rect.right);

        PAGES.forEach(({ sec }) => {
            const room = sec.side ? rightSpace : leftSpace;

            sec.k = room >= 150
                ? clamp(room / 190, 0.8, 1.3)
                : 0.85;

            sec.x = room >= 150
                ? sec.side
                    ? width - room / 2
                    : room / 2
                : sec.side
                    ? width * 0.9
                    : width * 0.1;

            sec.y = height * sec.y0;
            sec.R = 74 * sec.k;
        });
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        layout();
        inkCache.clear();
        buildBook();

        if (turnStart >= 0 && previousPage >= 0) {
            prepareLeaf(previousPage, currentPage);
        }

        if (reduced) {
            render(performance.now());
        }
    }

    function initDust() {
        for (let i = 0; i < 42; i++) {
            dust.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                r: 0.6 + Math.random() * 1.3,
                vx: (Math.random() - 0.5) * 5,
                vy: -1 - Math.random() * 4,
                ph: Math.random() * 6.28
            });
        }
    }

    function spawnEmber(x, y, burst) {
        if (embers.length > 90) return;

        embers.push({
            x,
            y,
            vx: (Math.random() - 0.5) * (burst ? 40 : 10),
            vy: -(8 + Math.random() * (burst ? 40 : 18)),
            life: 0,
            max: 3 + Math.random() * 3,
            r: 0.8 + Math.random() * 1.4
        });
    }

    function stepParticles(dt, time, page) {
        for (const particle of dust) {
            particle.x += (
                particle.vx + Math.sin(time + particle.ph) * 3
            ) * dt;

            particle.y += particle.vy * dt;

            if (particle.y < -5) {
                particle.y = height + 5;
                particle.x = Math.random() * width;
            }

            if (particle.x < -5) {
                particle.x = width + 5;
            }

            if (particle.x > width + 5) {
                particle.x = -5;
            }
        }

        if (
            (page.id === "ring" || page.id === "smaug") &&
            Math.random() < dt * 2.5
        ) {
            spawnEmber(
                Math.random() * width,
                height + 4,
                false
            );
        }

        for (let i = embers.length - 1; i >= 0; i--) {
            const ember = embers[i];

            ember.life += dt;

            ember.x += (
                ember.vx + Math.sin(time * 2 + i) * 6
            ) * dt;

            ember.y += ember.vy * dt;

            if (ember.life > ember.max) {
                embers.splice(i, 1);
            }
        }
    }

    function drawParticles() {
        for (const particle of dust) {
            const near = pointer.active
                ? clamp(
                    1 - Math.hypot(
                        particle.x - pointer.x,
                        particle.y - pointer.y
                    ) / LIGHT_R,
                    0,
                    1
                )
                : 0;

            ctx.fillStyle = `rgba(232,205,150,${0.08 + near * 0.4})`;

            ctx.beginPath();
            ctx.arc(
                particle.x,
                particle.y,
                particle.r,
                0,
                6.283
            );
            ctx.fill();
        }

        for (const ember of embers) {
            const alpha = Math.sin(
                Math.PI * ember.life / ember.max
            );

            const green = Math.round(
                clamp(120 + ember.life * 30, 0, 255)
            );

            ctx.fillStyle = `rgba(255,${green},40,${alpha * 0.75})`;
            ctx.shadowColor = "rgba(255,110,30,0.9)";
            ctx.shadowBlur = 6;

            ctx.beginPath();
            ctx.arc(ember.x, ember.y, ember.r, 0, 6.283);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    }

    const drawDash = (progress, length) => {
        ctx.setLineDash([length, length]);
        ctx.lineDashOffset = length * (1 - progress);
    };

    const drawTyped = (value, x, y, progress) => {
        ctx.fillText(
            value.slice(0, Math.ceil(value.length * progress)),
            x,
            y
        );
    };

    function drawMoria(secret, progress, time) {
        const { x, y, k } = secret;

        const w = 44 * k;
        const h = 56 * k;
        const color = "150,195,235";

        ctx.strokeStyle = ctx.fillStyle =
            `rgba(${color},${0.95 * progress})`;

        ctx.shadowColor = `rgba(${color},1)`;
        ctx.shadowBlur = 14 * progress;
        ctx.lineWidth = 1.5 * k;

        ctx.beginPath();

        ctx.moveTo(x - w, y + h);
        ctx.lineTo(x - w, y - h * 0.2);
        ctx.arc(x, y - h * 0.2, w, Math.PI, 0);
        ctx.lineTo(x + w, y + h);

        const gradient = ctx.createRadialGradient(
            x,
            y + h * 0.2,
            0,
            x,
            y + h * 0.2,
            h
        );

        gradient.addColorStop(
            0,
            `rgba(80,130,185,${0.3 * progress})`
        );

        gradient.addColorStop(1, "rgba(0,0,0,0)");

        const previousFill = ctx.fillStyle;

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.fillStyle = previousFill;

        drawDash(progress, h * 4 + w * 3.2);

        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();

        ctx.moveTo(x, y - h * 0.2 - w);
        ctx.lineTo(x, y + h);

        ctx.stroke();

        ctx.font = `${12 * k}px "IM Fell English", serif`;
        ctx.textAlign = "center";

        const runes = "ᚠᚢᚦᚨᚱᚲᛏ";

        for (let i = 0; i < 7; i++) {
            const angle =
                Math.PI + 0.35 + i * (Math.PI - 0.7) / 6;

            const radius = w + 15 * k;

            ctx.globalAlpha =
                clamp(progress * 7 - i, 0, 1) *
                (0.7 + 0.3 * Math.sin(time * 2 + i));

            ctx.fillText(
                runes[i],
                x + Math.cos(angle) * radius,
                y - h * 0.2 + Math.sin(angle) * radius
            );
        }

        ctx.globalAlpha = 1;
        ctx.font = `600 ${8.5 * k}px Cinzel, serif`;

        drawTyped(
            "PORTAL DE MORIA",
            x,
            y + h + 20 * k,
            progress
        );
    }

    function drawRing(secret, progress, time) {
        const { x, y, k } = secret;

        const rx = 22 * k * (
            1 + 0.04 * progress * Math.sin(time * 3)
        );

        const ry = 30 * k * (
            1 + 0.04 * progress * Math.sin(time * 3)
        );

        ctx.lineWidth = 2.2 * k;
        ctx.strokeStyle = `rgba(240,195,100,${progress})`;
        ctx.shadowColor = "rgba(255,190,80,0.9)";
        ctx.shadowBlur = 12 * progress;

        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, -0.3, 0, 6.283);

        drawDash(progress, 260 * k);

        ctx.stroke();
        ctx.setLineDash([]);

        const angle = time * 1.8;

        ctx.strokeStyle = `rgba(255,246,205,${progress})`;
        ctx.lineWidth = 3 * k;
        ctx.shadowBlur = 16 * progress;

        ctx.beginPath();
        ctx.ellipse(
            x,
            y,
            rx,
            ry,
            -0.3,
            angle,
            angle + 0.6
        );
        ctx.stroke();

        ctx.font = `${10 * k}px "IM Fell English", serif`;
        ctx.textAlign = "center";
        ctx.shadowBlur = 8 * progress;

        const runes = "ᚠᚢᚦᚨᚱᚲᛏᛟᛚᛁᛖᚾ";

        for (let i = 0; i < 12; i++) {
            const runeAngle = i / 12 * 6.283 + time * 0.15;

            const green = Math.round(
                110 + 40 * Math.sin(time * 3 + i)
            );

            ctx.fillStyle =
                `rgba(255,${green},40,${progress * 0.75})`;

            ctx.fillText(
                runes[i],
                x + Math.cos(runeAngle) * (rx + 17 * k),
                y + Math.sin(runeAngle) * (ry + 17 * k) + 3
            );
        }

        const beamX = (
            (time * 0.16) % 1.4 - 0.2
        ) * width;

        const gradient = ctx.createLinearGradient(
            beamX - 160,
            0,
            beamX + 160,
            0
        );

        gradient.addColorStop(0, "rgba(255,200,100,0)");
        gradient.addColorStop(
            0.5,
            `rgba(255,200,100,${0.1 * progress})`
        );
        gradient.addColorStop(1, "rgba(255,200,100,0)");

        ctx.shadowBlur = 0;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    function drawWingPath() {
        ctx.beginPath();

        ctx.moveTo(0, 0);

        ctx.bezierCurveTo(
            -0.3,
            -0.7,
            -0.9,
            -0.8,
            -1.5,
            -0.35
        );

        ctx.quadraticCurveTo(-1.25, -0.28, -1.2, -0.05);
        ctx.quadraticCurveTo(-1, -0.12, -0.9, 0.12);
        ctx.quadraticCurveTo(-0.72, 0, -0.55, 0.22);
        ctx.quadraticCurveTo(-0.35, 0.12, 0, 0.18);

        ctx.closePath();
    }

    function drawSmaug(secret, progress, time) {
        if (secret.fly >= 0) {
            const flight = (time - secret.fly) / 6;

            if (flight >= 1) {
                secret.fly = -1;
            } else {
                const size = Math.min(width * 0.16, 230);
                const alpha = Math.sin(Math.PI * flight);

                const x = -size + flight * (width + size * 2.4);
                const y = height * (0.18 + 0.32 * flight);

                const gradient = ctx.createRadialGradient(
                    x,
                    y,
                    0,
                    x,
                    y,
                    size * 2.2
                );

                gradient.addColorStop(
                    0,
                    `rgba(255,120,40,${0.16 * alpha})`
                );

                gradient.addColorStop(1, "rgba(255,120,40,0)");

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

                ctx.save();

                ctx.translate(x, y);
                ctx.scale(size, size);
                ctx.rotate(0.12);

                ctx.fillStyle = `rgba(0,0,0,${0.42 * alpha})`;
                ctx.shadowColor = "black";
                ctx.shadowBlur = 40;

                drawWingPath();
                ctx.fill();

                ctx.scale(-1, 1);

                drawWingPath();
                ctx.fill();

                ctx.restore();

                if (Math.random() < 0.5) {
                    spawnEmber(x, y, true);
                }
            }
        }

        const { x, y, k } = secret;

        const green = Math.round(
            100 + 30 * Math.sin(time * 4)
        );

        ctx.fillStyle = `rgba(255,${green},40,${progress * 0.9})`;
        ctx.shadowColor = "rgba(255,90,30,1)";
        ctx.shadowBlur = 16 * progress;

        ctx.beginPath();

        ctx.ellipse(
            x,
            y,
            16 * k * progress,
            4 * k * progress,
            0,
            0,
            6.283
        );

        ctx.fill();

        ctx.fillStyle = `rgba(10,2,2,${progress})`;

        ctx.beginPath();

        ctx.ellipse(
            x,
            y,
            1.6 * k,
            4 * k * progress,
            0,
            0,
            6.283
        );

        ctx.fill();

        ctx.shadowBlur = 8 * progress;
        ctx.fillStyle = `rgba(240,170,90,${progress * 0.85})`;
        ctx.font = `600 ${8.5 * k}px Cinzel, serif`;
        ctx.textAlign = "center";

        drawTyped(
            "DRACO IGNIS",
            x,
            y + 30 * k,
            progress
        );
    }

    function drawAlchemy(secret, progress, time) {
        const { x, y, k } = secret;

        const radius = 46 * k;
        const color = "215,185,125";

        ctx.strokeStyle = ctx.fillStyle =
            `rgba(${color},${0.95 * progress})`;

        ctx.shadowColor = `rgba(${color},1)`;
        ctx.shadowBlur = 10 * progress;
        ctx.lineWidth = 1.2 * k;

        for (const r of [radius, radius * 0.78]) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 6.283);

            drawDash(progress, r * 6.4);

            ctx.stroke();
        }

        const rotation = time * 0.25;

        for (const direction of [-1, 1]) {
            ctx.beginPath();

            for (let i = 0; i < 3; i++) {
                const angle =
                    rotation * -direction +
                    i * 2.094 +
                    (direction > 0 ? -1.571 : 1.571);

                ctx[i ? "lineTo" : "moveTo"](
                    x + Math.cos(angle) * radius * 0.78,
                    y + Math.sin(angle) * radius * 0.78
                );
            }

            ctx.closePath();

            drawDash(progress, radius * 5);

            ctx.stroke();
        }

        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        ctx.font = `${11 * k}px "IM Fell English", serif`;
        ctx.textAlign = "center";

        const symbols = "☉☽☿♀♂♃♄";

        for (let i = 0; i < 7; i++) {
            const angle = i / 7 * 6.283 + rotation;

            ctx.globalAlpha = clamp(progress * 7 - i, 0, 1);

            ctx.fillText(
                symbols[i],
                x + Math.cos(angle) * (radius + 14 * k),
                y + Math.sin(angle) * (radius + 14 * k) + 4
            );
        }

        ctx.globalAlpha = 1;
        ctx.font = `600 ${8.5 * k}px Cinzel, serif`;

        drawTyped(
            "V.I.T.R.I.O.L.",
            x,
            y + radius + 38 * k,
            progress
        );

        ctx.font = `italic ${9 * k}px "IM Fell English", serif`;

        drawTyped(
            "visita interiora terrae",
            x,
            y + radius + 52 * k,
            clamp((progress - 0.4) / 0.6, 0, 1)
        );
    }

    const MOTIFS = {
        moria: drawMoria,
        ring: drawRing,
        smaug: drawSmaug,
        alchemy: drawAlchemy
    };

    function updateSecret(page, dt, time, allowed) {
        const secret = page.sec;

        const hover =
            allowed &&
            pointer.active &&
            Math.hypot(
                pointer.x - secret.x,
                pointer.y - secret.y
            ) < secret.R;

        if (reduced) {
            secret.p = hover ? 1 : 0;
        } else if (hover) {
            secret.hold += dt;

            if (secret.hold > 0.45) {
                secret.p = Math.min(1, secret.p + dt / 1.6);
            }
        } else {
            secret.hold = 0;

            secret.p = Math.max(
                0,
                secret.p - dt / (secret.found ? 6 : 3.5)
            );
        }

        if (secret.p >= 1) {
            secret.found = true;
        }

        if (page.id === "smaug") {
            if (secret.p < 0.3) {
                secret.armed = true;
            }

            if (
                secret.p > 0.55 &&
                secret.armed &&
                secret.fly < 0
            ) {
                secret.fly = time;
                secret.armed = false;

                for (let i = 0; i < 28; i++) {
                    spawnEmber(secret.x, secret.y, true);
                }
            }
        }
    }

    function drawSecret(page, alpha, time) {
        const secret = page.sec;

        const visibility = Math.max(
            secret.p,
            secret.found ? 0.1 : 0
        );

        if (visibility < 0.02 && secret.fly < 0) return;

        ctx.save();
        ctx.globalAlpha = alpha;

        MOTIFS[page.id](secret, visibility, time);

        ctx.restore();
    }

    function prepareLeaf(frontIndex, backIndex) {
        const scale = getScale();

        const pageHeight = height - 2 * margin;

        const leafWidth = Math.round(pageWidth * scale);
        const leafHeight = Math.round(pageHeight * scale);

        leafFront = createCanvas(leafWidth, leafHeight);
        leafBack = createCanvas(leafWidth, leafHeight);

        const frontContext = leafFront.getContext("2d");
        const backContext = leafBack.getContext("2d");

        frontContext.drawImage(
            book,
            centerX * dpr,
            margin * dpr,
            pageWidth * dpr,
            pageHeight * dpr,
            0,
            0,
            leafWidth,
            leafHeight
        );

        backContext.drawImage(
            book,
            margin * dpr,
            margin * dpr,
            pageWidth * dpr,
            pageHeight * dpr,
            0,
            0,
            leafWidth,
            leafHeight
        );

        frontContext.globalAlpha = DIM;
        backContext.globalAlpha = DIM;

        frontContext.drawImage(
            getInk(frontIndex),
            centerX * scale,
            margin * scale,
            pageWidth * scale,
            pageHeight * scale,
            0,
            0,
            leafWidth,
            leafHeight
        );

        backContext.drawImage(
            getInk(backIndex),
            margin * scale,
            margin * scale,
            pageWidth * scale,
            pageHeight * scale,
            0,
            0,
            leafWidth,
            leafHeight
        );
    }

    function drawLeaf(progress) {
        const angle = ease(progress) * Math.PI;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);

        const strips = 40;
        const pageHeight = height - 2 * margin;

        const source = cosine >= 0 ? leafFront : leafBack;
        const stripWidth = source.width / strips;

        for (let i = 0; i < strips; i++) {
            const u0 = i / strips;
            const u1 = (i + 1) / strips;

            const xa = centerX + u0 * pageWidth * cosine;
            const xb = centerX + u1 * pageWidth * cosine;

            const scaleY = 1 - 0.07 * sine * (u0 + u1) / 2;

            const top =
                margin +
                pageHeight * (1 - scaleY) / 2 -
                sine * u0 * 16;

            const sourceX = cosine >= 0
                ? i * stripWidth
                : (strips - 1 - i) * stripWidth;

            const left = Math.min(xa, xb);
            const strip = Math.abs(xb - xa) + 0.7;

            ctx.drawImage(
                source,
                sourceX,
                0,
                stripWidth,
                source.height,
                left,
                top,
                strip,
                pageHeight * scaleY
            );

            ctx.fillStyle = `rgba(0,0,0,${
                sine * (0.1 + 0.5 * u0 * u0) +
                (cosine < 0 ? 0.1 * sine : 0)
            })`;

            ctx.fillRect(
                left,
                top,
                strip,
                pageHeight * scaleY
            );
        }

        const edgeX = centerX + pageWidth * cosine;
        const direction = cosine >= 0 ? 1 : -1;

        const gradient = ctx.createLinearGradient(
            edgeX,
            0,
            edgeX + direction * pageWidth * 0.28,
            0
        );

        gradient.addColorStop(
            0,
            `rgba(0,0,0,${0.45 * sine})`
        );

        gradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = gradient;

        ctx.fillRect(
            Math.min(edgeX, edgeX + direction * pageWidth * 0.28),
            margin,
            pageWidth * 0.28,
            pageHeight
        );

        ctx.fillStyle = `rgba(235,210,165,${0.4 * sine})`;

        ctx.fillRect(
            edgeX - 1,
            margin - sine * 16,
            2,
            pageHeight * (1 - 0.07 * sine)
        );
    }

    function drawLit() {
        const radius = LIGHT_R + 15;
        const diameter = radius * 2;
        const scale = getScale();

        if (lightCanvas.width !== diameter) {
            lightCanvas.width = diameter;
            lightCanvas.height = diameter;
        }

        lightContext.globalCompositeOperation = "source-over";
        lightContext.clearRect(0, 0, diameter, diameter);

        lightContext.drawImage(
            getInk(currentPage),
            (pointer.x - radius) * scale,
            (pointer.y - radius) * scale,
            diameter * scale,
            diameter * scale,
            0,
            0,
            diameter,
            diameter
        );

        const gradient = lightContext.createRadialGradient(
            radius,
            radius,
            radius * 0.12,
            radius,
            radius,
            radius
        );

        gradient.addColorStop(0, "rgba(0,0,0,1)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        lightContext.globalCompositeOperation = "destination-in";
        lightContext.fillStyle = gradient;

        lightContext.fillRect(0, 0, diameter, diameter);

        ctx.globalAlpha = 0.95;

        ctx.drawImage(
            lightCanvas,
            pointer.x - radius,
            pointer.y - radius
        );

        ctx.globalAlpha = 1;
    }

    function render(now) {
        const time = now * 0.001;
        const scale = getScale();

        const turning = turnStart >= 0 && previousPage >= 0;

        const progress = turning
            ? clamp((now - turnStart) / TURN_MS, 0, 1)
            : 1;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(book, 0, 0, width, height);

        ctx.globalAlpha = DIM;

        if (turning) {
            ctx.drawImage(
                getInk(previousPage),
                0,
                0,
                centerX * scale,
                height * scale,
                0,
                0,
                centerX,
                height
            );

            ctx.drawImage(
                getInk(currentPage),
                centerX * scale,
                0,
                (width - centerX) * scale,
                height * scale,
                centerX,
                0,
                width - centerX,
                height
            );
        } else {
            ctx.drawImage(
                getInk(currentPage),
                0,
                0,
                width,
                height
            );
        }

        ctx.globalAlpha = 1;

        if (pointer.active) {
            const gradient = ctx.createRadialGradient(
                pointer.x,
                pointer.y,
                0,
                pointer.x,
                pointer.y,
                LIGHT_R + 15
            );

            gradient.addColorStop(
                0,
                "rgba(205,150,70,0.12)"
            );

            gradient.addColorStop(
                0.5,
                "rgba(160,75,40,0.04)"
            );

            gradient.addColorStop(
                1,
                "rgba(0,0,0,0)"
            );

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            if (!turning) {
                drawLit();
            }
        }

        if (turning) {
            drawSecret(PAGES[previousPage], 1 - progress, time);
            drawSecret(PAGES[currentPage], progress, time);
        } else {
            drawSecret(PAGES[currentPage], 1, time);
        }

        const contentGradient = ctx.createLinearGradient(
            mainL,
            0,
            mainR,
            0
        );

        contentGradient.addColorStop(0, "rgba(10,6,4,0)");
        contentGradient.addColorStop(0.5, "rgba(10,6,4,0.42)");
        contentGradient.addColorStop(1, "rgba(10,6,4,0)");

        ctx.fillStyle = contentGradient;

        ctx.fillRect(
            mainL,
            0,
            mainR - mainL,
            height
        );

        if (turning) {
            drawLeaf(progress);
        }

        drawParticles();

        ctx.fillStyle = `rgba(0,0,0,${
            0.05 + 0.04 * Math.sin(time * 0.7)
        })`;

        ctx.fillRect(0, 0, width, height);
    }

    let lastFrame = 0;

    function frame(timestamp) {
        requestAnimationFrame(frame);

        if (
            document.hidden ||
            timestamp - lastFrame < 1000 / 30
        ) {
            return;
        }

        const dt = Math.min(
            0.1,
            (timestamp - lastFrame) / 1000
        );

        lastFrame = timestamp;

        if (coarse) {
            pointer.active = true;

            pointer.x =
                width * (0.5 + 0.42 * Math.sin(timestamp * 0.00017));

            pointer.y =
                height * (0.5 + 0.38 * Math.sin(timestamp * 0.00011 + 1));
        }

        if (
            turnStart < 0 &&
            timestamp - pageStart > PAGE_MS
        ) {
            previousPage = currentPage;
            currentPage = (currentPage + 1) % PAGES.length;

            pageStart = timestamp;
            turnStart = timestamp;

            prepareLeaf(previousPage, currentPage);
        }

        if (
            turnStart >= 0 &&
            timestamp - turnStart > TURN_MS
        ) {
            turnStart = -1;
            previousPage = -1;
        }

        getInk((currentPage + 1) % PAGES.length);

        PAGES.forEach((page, index) => {
            if (index === currentPage) return;

            page.sec.p = Math.max(
                0,
                page.sec.p - dt / 2
            );

            page.sec.hold = 0;
        });

        updateSecret(
            PAGES[currentPage],
            dt,
            timestamp * 0.001,
            turnStart < 0
        );

        stepParticles(
            dt,
            timestamp * 0.001,
            PAGES[currentPage]
        );

        render(timestamp);
    }

    let queued = false;

    window.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;

        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.active = true;

        if (reduced && !queued) {
            queued = true;

            requestAnimationFrame(() => {
                queued = false;

                updateSecret(
                    PAGES[currentPage],
                    0,
                    0,
                    true
                );

                render(performance.now());
            });
        }
    });

    document.addEventListener("mouseleave", () => {
        pointer.active = false;

        if (reduced) {
            render(performance.now());
        }
    });

    window.addEventListener("resize", resize);

    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            inkCache.clear();

            if (reduced) {
                render(performance.now());
            }
        });
    }

    initDust();
    resize();

    if (!reduced) {
        pageStart = performance.now();
        requestAnimationFrame(frame);
    }
})();