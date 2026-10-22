const fs = require('fs');
const path = require('path');

// 1. Load existing domTranslations.json
const existing = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/domTranslations.json'), 'utf8'));

// 2. Load messages
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../messages/en.json'), 'utf8'));
const fr = JSON.parse(fs.readFileSync(path.join(__dirname, '../messages/fr.json'), 'utf8'));
const es = JSON.parse(fs.readFileSync(path.join(__dirname, '../messages/es.json'), 'utf8'));
const rw = JSON.parse(fs.readFileSync(path.join(__dirname, '../messages/rw.json'), 'utf8'));

function flatten(obj, prefix = '') {
  let res = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(res, flatten(v, fullKey));
    } else if (typeof v === 'string') {
      res[fullKey] = v;
    }
  }
  return res;
}

const fEn = flatten(en);
const fFr = flatten(fr);
const fEs = flatten(es);
const fRw = flatten(rw);

const merged = { ...existing };

// Add from messages
for (const [k, enVal] of Object.entries(fEn)) {
  const frVal = fFr[k];
  const esVal = fEs[k];
  const rwVal = fRw[k];
  if (frVal && esVal && rwVal && typeof enVal === 'string') {
    const cleanEn = enVal.trim();
    if (cleanEn) {
      merged[cleanEn] = [frVal.trim(), esVal.trim(), rwVal.trim()];
    }
  }
}

// 3. Add essential website phrases and UI text
const webPhrases = {
  // Navigation & Branding
  "Connekyt": ["Connekyt", "Connekyt", "Connekyt"],
  "Amoria Connekyt": ["Amoria Connekyt", "Amoria Connekyt", "Amoria Connekyt"],
  "Amoria": ["Amoria", "Amoria", "Amoria"],
  "THE MULTI CREATIVE PLATFORM": ["LA PLATEFORME MULTI-CRÉATIVE", "LA PLATAFORMA MULTICREATIVA", "URUBURA RW'ABAHANZI BOSE"],
  "The Multi Creative Platform": ["La plateforme multi-créative", "La plataforma multicreativa", "Urubuga rw'abahanzi bose"],
  "Multi Creative Platform": ["Plateforme Multi-Créative", "Plataforma Multicreativa", "Urubuga rw'abahanzi bose"],
  "Find My Photos": ["Retrouver Mes Photos", "Encontrar Mis Fotos", "Shaka Amafoto Yanjye"],
  "Find my photos": ["Retrouver mes photos", "Encontrar mis fotos", "Shaka amafoto yanjye"],
  "Find photos": ["Trouver des photos", "Encontrar fotos", "Shaka amafoto"],
  "Search by selfie": ["Recherche par selfie", "Buscar por selfie", "Shakisha ukoresheje selfie"],
  "Take a selfie": ["Prendre un selfie", "Tomar una selfie", "Fata ifoto yawe"],
  "Upload photo": ["Téléverser une photo", "Subir una foto", "Shyiraho ifoto"],
  "Upload a photo": ["Téléverser une photo", "Subir una foto", "Shyiraho ifoto"],
  "Upload selfie": ["Téléverser un selfie", "Subir una selfie", "Shyiraho selfie"],
  "Browse Photographers": ["Parcourir les photographes", "Explorar fotógrafos", "Shakisha abafotora"],
  "Browse Events": ["Parcourir les événements", "Explorar eventos", "Shakisha ibirori"],
  "Live Events": ["Événements en direct", "Eventos en vivo", "Ibirori biri kuba"],
  "Upcoming Events": ["Événements à venir", "Próximos eventos", "Ibirori biri imbere"],
  "Recent Events": ["Événements récents", "Eventos recientes", "Ibirori biheruka"],
  "All Events": ["Tous les événements", "Todos los eventos", "Ibirori byose"],
  "All Photographers": ["Tous les photographes", "Todos los fotógrafos", "Abafotora bose"],

  // Hero & CTAs
  "Find A Photographer": ["Trouver un photographe", "Encontrar un fotógrafo", "Shaka umufotozi"],
  "Find a Photographer": ["Trouver un photographe", "Encontrar un fotógrafo", "Shaka umufotozi"],
  "Join As A Photographer": ["Rejoindre en tant que photographe", "Unirse como fotógrafo", "Injira nk'umufotozi"],
  "Join as a Photographer": ["Rejoindre en tant que photographe", "Unirse como fotógrafo", "Injira nk'umufotozi"],
  "Join as a photographer": ["Rejoindre en tant que photographe", "Unirse como fotógrafo", "Injira nk'umufotozi"],
  "Book Now": ["Réserver maintenant", "Reservar ahora", "Fata umwanya nonaha"],
  "Book now": ["Réserver maintenant", "Reservar ahora", "Fata umwanya nonaha"],
  "Book A Photographer": ["Réserver un photographe", "Reservar un fotógrafo", "Fata umwanya n'umufotozi"],
  "Book a Photographer": ["Réserver un photographe", "Reservar un fotógrafo", "Fata umwanya n'umufotozi"],
  "Instant Digital Delivery": ["Livraison numérique instantanée", "Entrega digital instantánea", "Kwakira amafoto ako kanya"],
  "Secure Payments": ["Paiements sécurisés", "Pagos seguros", "Ubwishyu bwizewe"],
  "Watch Live Streams": ["Regarder en direct", "Ver transmisiones en vivo", "Reba imbonankubone"],
  "Watch Live": ["Regarder en direct", "Ver en vivo", "Reba imbonankubone"],
  "Watch Stream": ["Regarder la diffusion", "Ver transmisión", "Reba imbonankubone"],
  "View Profile": ["Voir le profil", "Ver perfil", "Reba umwirondoro"],
  "View Event": ["Voir l'événement", "Ver evento", "Reba ibirori"],
  "View Gallery": ["Voir la galerie", "Ver galería", "Reba ububiko"],

  // Sections
  "How It Works": ["Comment ça marche", "Cómo funciona", "Uko bikora"],
  "How it Works": ["Comment ça marche", "Cómo funciona", "Uko bikora"],
  "How it works": ["Comment ça marche", "Cómo funciona", "Uko bikora"],
  "Why Amoria": ["Pourquoi Amoria", "¿Por qué Amoria?", "Kuki wahitamo Amoria"],
  "Why Connekyt": ["Pourquoi Connekyt", "¿Por qué Connekyt?", "Kuki wahitamo Connekyt"],
  "Global Network": ["Réseau mondial", "Red global", "Urusobe rw'isi yose"],
  "For Photographers": ["Pour les photographes", "Para fotógrafos", "Ku bafotora"],
  "For Clients": ["Pour les clients", "Para clientes", "Ku bakiriya"],
  "For Events": ["Pour les événements", "Para eventos", "Ku birori"],

  // About, Contact, Legal, Help
  "About Us": ["À propos de nous", "Sobre nosotros", "Ibyerekeye twebwe"],
  "About us": ["À propos de nous", "Sobre nosotros", "Ibyerekeye twebwe"],
  "Contact Us": ["Contactez-nous", "Contáctanos", "Twandikire"],
  "Contact us": ["Contactez-nous", "Contáctanos", "Twandikire"],
  "Help Center": ["Centre d'aide", "Centro de ayuda", "Ahabarizwa ubufasha"],
  "Help center": ["Centre d'aide", "Centro de ayuda", "Ahabarizwa ubufasha"],
  "Frequently Asked Questions": ["Foire aux questions", "Preguntas frecuentes", "Ibibazo bikunze kubazwa"],
  "Terms of Service": ["Conditions d'utilisation", "Términos de servicio", "Amabwiriza y'imikoreshereze"],
  "Terms of service": ["Conditions d'utilisation", "Términos de servicio", "Amabwiriza y'imikoreshereze"],
  "Privacy Policy": ["Politique de confidentialité", "Política de privacidad", "Politiki y'ubuzima bwite"],
  "Privacy policy": ["Politique de confidentialité", "Política de privacidad", "Politiki y'ubuzima bwite"],
  "Trust & Safety": ["Confiance et sécurité", "Confianza y seguridad", "Kwizera n'umutekano"],
  "Trust & safety": ["Confiance et sécurité", "Confianza y seguridad", "Kwizera n'umutekano"],
  "Photographer Guide": ["Guide du photographe", "Guía del fotógrafo", "Igitabo cy'umufotozi"],
  "Photographer guide": ["Guide du photographe", "Guía del fotógrafo", "Igitabo cy'umufotozi"],
  "Delete Account": ["Supprimer le compte", "Eliminar cuenta", "Siba konti"],
  "Delete account": ["Supprimer le compte", "Eliminar cuenta", "Siba konti"],

  // Auth & General
  "Sign In": ["Se connecter", "Iniciar sesión", "Injira"],
  "Sign in": ["Se connecter", "Iniciar sesión", "Injira"],
  "Sign In with Google": ["Se connecter avec Google", "Iniciar sesión con Google", "Injira ukoresheje Google"],
  "Continue with Google": ["Continuer avec Google", "Continuar con Google", "Komeza na Google"],
  "Don't have an account?": ["Vous n'avez pas de compte ?", "¿No tienes una cuenta?", "Nta konti ufite?"],
  "Already have an account?": ["Vous avez déjà un compte ?", "¿Ya tienes una cuenta?", "Usanzwe ufite konti?"],
  "No account?": ["Pas de compte ?", "¿No tienes cuenta?", "Nta konti?"],
  "Email Address": ["Adresse e-mail", "Dirección de correo electrónico", "Aderesi ya imeri"],
  "Email address": ["Adresse e-mail", "Dirección de correo electrónico", "Aderesi ya imeri"],
  "Email": ["E-mail", "Correo", "Imeri"],
  "Password": ["Mot de passe", "Contraseña", "Ijambobanga"],
  "Forgot Password?": ["Mot de passe oublié ?", "¿Olvidaste tu contraseña?", "Wibagiwe ijambobanga?"],
  "Forgot password?": ["Mot de passe oublié ?", "¿Olvidaste tu contraseña?", "Wibagiwe ijambobanga?"],
  "Reset Password": ["Réinitialiser le mot de passe", "Restablecer contraseña", "Hindura ijambobanga"],
  "Reset password": ["Réinitialiser le mot de passe", "Restablecer contraseña", "Hindura ijambobanga"],
  "Remember me": ["Se souvenir de moi", "Recordarme", "Unyibuke"],
  "Create Account": ["Créer un compte", "Crear cuenta", "Kora konti nshya"],
  "Create account": ["Créer un compte", "Crear cuenta", "Kora konti nshya"],
  "Full Name": ["Nom complet", "Nombre completo", "Amazina yose"],
  "Full name": ["Nom complet", "Nombre completo", "Amazina yose"],
  "Phone Number": ["Numéro de téléphone", "Número de teléfono", "Nimero ya telefoni"],
  "Phone number": ["Numéro de téléphone", "Número de teléfono", "Nimero ya telefoni"],
  "Phone": ["Téléphone", "Teléfono", "Telefoni"],

  // Footer & Status
  "All Rights Reserved": ["Tous droits réservés", "Todos los derechos reservados", "Uburenganzira bwose burabitswe"],
  "All rights reserved": ["Tous droits réservés", "Todos los derechos reservados", "Uburenganzira bwose burabitswe"],
  "All rights reserved.": ["Tous droits réservés.", "Todos los derechos reservados.", "Uburenganzira bwose burabitswe."],
  "Search": ["Rechercher", "Buscar", "Shakisha"],
  "Search...": ["Rechercher...", "Buscar...", "Shakisha..."],
  "Search by name, location...": ["Rechercher par nom, lieu...", "Buscar por nombre, ubicación...", "Shakisha izina, ahantu..."],
  "Search events...": ["Rechercher des événements...", "Buscar eventos...", "Shakisha ibirori..."],
  "Search photographers...": ["Rechercher des photographes...", "Buscar fotógrafos...", "Shakisha abafotora..."],
  "Filter": ["Filtrer", "Filtrar", "Yungurura"],
  "Filters": ["Filtres", "Filtros", "Imiyungururo"],
  "Clear": ["Effacer", "Borrar", "Siba"],
  "Clear all": ["Tout effacer", "Borrar todo", "Siba byose"],
  "Apply": ["Appliquer", "Aplicar", "Emeza"],
  "Cancel": ["Annuler", "Cancelar", "Kureka"],
  "Close": ["Fermer", "Cerrar", "Funga"],
  "Submit": ["Soumettre", "Enviar", "Ohereza"],
  "Save": ["Enregistrer", "Guardar", "Bika"],
  "Confirm": ["Confirmer", "Confirmar", "Emeza"],
  "Back": ["Retour", "Atrás", "Gusubira inyuma"],
  "Next": ["Suivant", "Siguiente", "Komeza"],
  "Previous": ["Précédent", "Anterior", "Ibyabanjirije"],
  "Loading...": ["Chargement...", "Cargando...", "Biri gupakira..."],
  "Loading": ["Chargement", "Cargando", "Biri gupakira"],
  "Success": ["Succès", "Éxito", "Byagenze neza"],
  "Error": ["Erreur", "Error", "Ikosa ryabaye"],
  "Available": ["Disponible", "Disponible", "Birahari"],
  "Booked": ["Réservé", "Reservado", "Byafashwe"],
  "Completed": ["Terminé", "Completado", "Byarangiye"],
  "Pending": ["En attente", "Pendiente", "Bitegerejwe"],
  "Free": ["Gratuit", "Gratis", "Ku buntu"],
  "Download": ["Télécharger", "Descargar", "Manura"],
  "Download Photo": ["Télécharger la photo", "Descargar foto", "Manura ifoto"],
  "Download Photos": ["Télécharger les photos", "Descargar fotos", "Manura amafoto"],
  "Download All": ["Tout télécharger", "Descargar todo", "Manura byose"],
  "Share": ["Partager", "Compartir", "Sangiza"],
  "Share Event": ["Partager l'événement", "Compartir evento", "Sangiza ibirori"],
  "Copy Link": ["Copier le lien", "Copiar enlace", "Koporora umurongo"],
  "Link copied!": ["Lien copié !", "¡Enlace copiado!", "Umurongo wakoporowe!"]
};

for (const [k, v] of Object.entries(webPhrases)) {
  merged[k] = v;
}

fs.writeFileSync(
  path.join(__dirname, '../lib/domTranslations.json'),
  JSON.stringify(merged, null, 2),
  'utf8'
);

console.log('Successfully written domTranslations.json with total entries:', Object.keys(merged).length);
