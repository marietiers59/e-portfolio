// Script pour afficher l'année en cours dans le pied de page
        document.addEventListener("DOMContentLoaded", function() {
            const currentYear = new Date().getFullYear();
            document.getElementById("current-year").textContent = currentYear;
        });