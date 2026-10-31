const navMenu = document.querySelector(".nav");
const navToggle = document.querySelector(".nav-toggle");

navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("nav--open");
});

