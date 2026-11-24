const navMenu = document.querySelector(".nav");
const navToggle = document.querySelector(".nav-toggle");
const galleryImages = document.querySelectorAll(".gallery__image");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox__image");
const lightboxCloseButton = document.querySelector(".lightbox__close")

navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("nav--open");
});

galleryImages.forEach((image) => {
    image.addEventListener("click", () => {
        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt;
        lightbox.showModal();
    });
}); 

lightboxCloseButton.addEventListener ("click", () => {
    lightbox.close ();
});