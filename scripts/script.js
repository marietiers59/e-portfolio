/* =========================================================
   Portfolio — Marie Tiers
   1. Défilement amorti (Menu ⏫, Contact ⏬, liens internes)
   2. Formulaire de contact
   3. Utilitaires
   ========================================================= */
'use strict';

/* ---------- 1. Défilement amorti ---------- */
const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)');
let idAnimation = null;

/** Courbe « ease-in-out » : démarrage doux, accélération, arrivée douce. */
const amorti = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const hauteurMax = () => document.documentElement.scrollHeight - window.innerHeight;
const borner = (y) => Math.max(0, Math.min(y, hauteurMax()));

function decalageBarre() {
  const barre = document.querySelector('.barre-haut');
  return (barre ? barre.offsetHeight : 0) + 16;
}

function arreterDefilement() {
  if (idAnimation !== null) {
    cancelAnimationFrame(idAnimation);
    idAnimation = null;
  }
}

/**
 * Fait défiler la page jusqu'à la position renvoyée par `calculerCible`.
 * La cible est recalculée à chaque image : si une image se charge
 * pendant le trajet, on arrive quand même au bon endroit.
 */
function defilerVers(calculerCible, quandArrive) {
  arreterDefilement();
  const depart = window.scrollY;
  const distance = Math.abs(borner(calculerCible()) - depart);

  if (mouvementReduit.matches || distance < 2) {
    window.scrollTo({ top: borner(calculerCible()), behavior: 'instant' });
    quandArrive?.();
    return;
  }

  const duree = Math.min(1600, 500 + distance * 0.3); // en millisecondes
  const debut = performance.now();

  const etape = (maintenant) => {
    const t = Math.min(1, (maintenant - debut) / duree);
    const cible = borner(calculerCible());
    window.scrollTo({ top: depart + (cible - depart) * amorti(t), behavior: 'instant' });

    if (t < 1) {
      idAnimation = requestAnimationFrame(etape);
    } else {
      idAnimation = null;
      quandArrive?.();
    }
  };
  idAnimation = requestAnimationFrame(etape);
}

// Le visiteur reprend la main (molette, doigt, clavier) : on arrête l'animation.
['wheel', 'touchstart', 'keydown'].forEach((type) =>
  window.addEventListener(type, arreterDefilement, { passive: true })
);

/** Place le focus clavier sur l'arrivée, sans provoquer de saut. */
function donnerLeFocus(element) {
  if (!element) return;
  if (!element.matches('a, button, input, select, textarea, [tabindex]')) {
    element.setAttribute('tabindex', '-1');
  }
  element.focus({ preventScroll: true });
}

document.addEventListener('click', (evt) => {
  const lien = evt.target.closest('a[href^="#"]');
  if (!lien || evt.defaultPrevented || evt.button !== 0 ||
      evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey) return;

  const id = decodeURIComponent(lien.hash.slice(1));
  let calculerCible;
  let aFocaliser;

  if (lien.dataset.defilement === 'haut' || id === 'haut') {
    calculerCible = () => 0;
    aFocaliser = document.getElementById('titre-principal');
  } else if (lien.dataset.defilement === 'bas' || id === 'bas') {
    calculerCible = hauteurMax;
    aFocaliser = document.getElementById('contact-titre');
  } else {
    const cible = document.getElementById(id);
    if (!cible) return;
    calculerCible = () => cible.getBoundingClientRect().top + window.scrollY - decalageBarre();
    aFocaliser = cible.querySelector('h1, h2') ?? cible;
    history.pushState(null, '', `#${id}`);
  }

  evt.preventDefault();
  defilerVers(calculerCible, () => donnerLeFocus(aFocaliser));
});

/* ---------- 2. Formulaire de contact ---------- */
const formulaire = document.getElementById('formulaire-contact');

if (formulaire) {
  const statut = formulaire.querySelector('.formulaire-statut');
  const bouton = formulaire.querySelector('button[type="submit"]');
  const destinataire = formulaire.dataset.destinataire;

  const afficher = (texte, etat = 'ok') => {
    statut.textContent = texte;
    statut.dataset.etat = etat;
  };

  // L'événement « submit » ne se déclenche que si les champs requis sont valides.
  formulaire.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const donnees = new FormData(formulaire);
    if (donnees.get('_gotcha')) return; // champ piège rempli : sans doute un robot

    const adresseService = (formulaire.dataset.endpoint || '').trim();

    // Sans service d'envoi : on prépare l'e-mail dans la messagerie du visiteur.
    if (!adresseService) {
      const sujet = `[Portfolio] ${donnees.get('objet')} — ${donnees.get('nom')}`;
      const corps = `${donnees.get('message')}\n\n${donnees.get('nom')}\n${donnees.get('email')}`;
      window.location.href =
        `mailto:${destinataire}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
      afficher('Votre messagerie s’ouvre avec le message prêt à partir.');
      return;
    }

    // Avec un service (Formspree ou équivalent) : envoi direct.
    bouton.disabled = true;
    afficher('Envoi en cours…');
    try {
      const reponse = await fetch(adresseService, {
        method: 'POST',
        body: donnees,
        headers: { Accept: 'application/json' },
      });
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
      formulaire.reset();
      afficher('Merci ! Votre message est bien parti, je vous réponds rapidement.');
    } catch (erreur) {
      console.error(erreur);
      afficher(`L’envoi n’a pas abouti. Vous pouvez m’écrire directement à ${destinataire}.`, 'erreur');
    } finally {
      bouton.disabled = false;
    }
  });
}

/* ---------- 3. Utilitaires ---------- */
document.querySelectorAll('[data-annee]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});
