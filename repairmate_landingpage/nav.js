// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Obtener los elementos necesarios
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.querySelector('.overlay');
    
    // Función para alternar el menú
    function toggleMenu() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        
        // Prevenir el scroll cuando el menú está abierto
        if (hamburger.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
    
    // Agregar evento click al hamburger
    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }
    
    // Agregar evento click al overlay
    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }
    
    // Cerrar el menú cuando se hace click en un enlace
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger.classList.contains('active')) {
                toggleMenu();
            }
        });
    });
    
    // Cerrar el menú cuando se redimensiona la ventana a un tamaño mayor
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && hamburger.classList.contains('active')) {
            toggleMenu();
        }
    });
});