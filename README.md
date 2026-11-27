# Sauron's Tattoos

Presentation and portfolio website for Sauron's Tattoos, developed to showcase tattoo works, promote the studio, and make it easier for clients to request quotes and get in touch.

The project combines a dark medieval visual identity with blackwork elements, fantasy references, and animated interactions developed with JavaScript.

## Features

- **Portfolio:** gallery of tattoos and illustrations.
- **Image viewer:** lightbox with high-resolution original images, zoom, and image navigation.
- **Custom cursor:** lighting effect and magnifying glass cursor in the image viewer.
- **Animated grimoire:** interactive background developed with Canvas API, featuring illustrations, inscriptions, and easter eggs.
- **Interactive identity:** glowing reflection effect on the logo and transformation of the logo into an animated eye.
- **Quote request:** form that prepares a message and opens a conversation through WhatsApp.
- **Aftercare:** basic guidelines for tattoo healing.
- **Location:** integrated Google Maps.
- **Responsive layout:** adaptation for desktops, tablets, and mobile devices.

## Technologies

- HTML5
- CSS3
- JavaScript
- Canvas API
- Google Maps Embed
- Google Fonts
- WhatsApp Click to Chat

## Project Structure
saurons-tattoos/
│
├── index.html
│
├── css/
│   └── styles.css
│
├── js/
│   ├── main.js
│   └── grimoire.js
│
└── assets/
└── images/
├── brand/
├── gallery/
└── originals/


## How to Run Locally

1. Clone this repository.
2. Open the project folder in Visual Studio Code.
3. Use the Live Server extension to run the `index.html` file.
4. Access the local address provided by Live Server.

## High-Resolution Images

The images displayed in the gallery are stored in:
assets/images/gallery/


The original versions used by the image viewer are stored in: assets/images/originals/


according to the paths defined in the `data-full` attribute of each image in the HTML file.

It is necessary to keep the corresponding file names and extensions unchanged.

## Credits

Project developed as a practical Front-End development study, exploring HTML, CSS, JavaScript, Canvas animations, and user experience.
