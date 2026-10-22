const fs = require('fs');
const path = require('path');

const dtPath = path.join(__dirname, '../lib/domTranslations.json');
const current = JSON.parse(fs.readFileSync(dtPath, 'utf8'));

const extraPagesDict = {
  // About Page
  "Our Core": ["Nos Valeurs", "Nuestros Valores", "Indangagaciro Zacu"],
  "Values": ["Valeurs", "Valores", "Indangagaciro"],
  "Our Core Values": ["Nos valeurs fondamentales", "Nuestros valores fundamentales", "Indangagaciro zacu z'ibanze"],
  "Our Mission": ["Notre Mission", "Nuestra Misión", "Ubutumwa Bwacu"],
  "Our Vision": ["Notre Vision", "Nuestra Visión", "Icyerekezo Cyacu"],
  "The Smart Way to Capture Life": ["La façon intelligente de capturer la vie", "La forma inteligente de capturar la vida", "Uburyo bugezweho bwo kubika amateka"],
  "A digital ecosystem": ["Un écosystème numérique", "Un ecosistema digital", "Urubuga rw'ikoranabuhanga rigezweho"],
  "On schedule": ["Dans les délais", "A tiempo", "Ku gihe nyacyo"],
  "Worldwide": ["Dans le monde entier", "En todo el mundo", "Ku isi yose"],
  "Who We Serve": ["Qui nous servons", "A quién servimos", "Abo dukorera"],
  "Built for the": ["Conçu pour le", "Diseñado para el", "Bigenewe"],
  "For Creators": ["Pour les Créateurs", "Para Creadores", "Ku Bahanzi"],
  "Creative": ["Créatif", "Creativo", "Ubuhanzi"],
  "Creative Professionals": ["Professionnels créatifs", "Profesionales creativos", "Abanyamwuga mu buhanzi"],
  "Join as a creator": ["Rejoindre comme créateur", "Únete como creador", "Injira nk'umuhanzi"],
  "For Organizers": ["Pour les Organisateurs", "Para Organizadores", "Ku Bategura Ibirori"],
  "Event Organizers": ["Organisateurs d'événements", "Organizadores de eventos", "Abategura ibirori"],
  "Browse vetted talent": ["Parcourir les talents vérifiés", "Explorar talentos verificados", "Shakisha abanyamwuga b'inararibonye"],
  "One contract, many gigs": ["Un contrat, plusieurs missions", "Un contrato, múltiples trabajos", "Amasezerano amwe, ibiraka byinshi"],
  "Plan with us": ["Planifiez avec nous", "Planifica con nosotros", "Tegurana natwe"],
  "For Memory Keepers": ["Pour ceux qui gardent des souvenirs", "Para guardianes de recuerdos", "Ku bazigama urwibutso"],
  "Individuals": ["Particuliers", "Particulares", "Abantu ku giti cyabo"],
  "Find local pros in minutes": ["Trouvez des pros locaux en quelques minutes", "Encuentra profesionales locales en minutos", "Bona abanyamwuga bo hafi yawe mu minota mike"],
  "Transparent pricing": ["Tarification transparente", "Precios transparentes", "Ibiciro bisobanutse"],
  "Vault-safe digital memories": ["Souvenirs numériques hautement sécurisés", "Recuerdos digitales seguros en bóveda", "Ububiko bw'urwibutso rwawe burinzwe cyane"],
  "Find your photographer": ["Trouvez votre photographe", "Encuentra a tu fotógrafo", "Shaka umufotozi wawe"],
  "Empowering visual storytellers": ["Donner du pouvoir aux conteurs visuels", "Empoderando a los narradores visuales", "Gushoboza abafotora kubara inkuru mu mashusho"],
  "Scroll to turn the page": ["Faites défiler pour tourner la page", "Desplaza para pasar la página", "Kanda hano uhindure urupapuro"],

  // Find My Photos Page
  "Find Your Photos": ["Retrouvez vos photos", "Encuentra tus fotos", "Shaka amafoto yawe"],
  "Scan your face or upload a photo to find your event pictures instantly": [
    "Scannez votre visage ou téléversez une photo pour trouver vos photos d'événement instantanément",
    "Escanea tu rostro o sube una foto para encontrar tus fotos del evento al instante",
    "Fata isura yawe cyangwa shyiraho ifoto kugira ngo ubone amafoto yawe mu birori ako kanya"
  ],
  "Take Selfie": ["Prendre un selfie", "Tomar una selfie", "Fata isura yawe (Selfie)"],
  "Upload Photo": ["Téléverser une photo", "Subir una foto", "Shyiraho ifoto"],
  "Upload a photo": ["Téléverser une photo", "Subir una foto", "Shyiraho ifoto"],
  "No photos found": ["Aucune photo trouvée", "No se encontraron fotos", "Nta mafoto yabonetse"],
  "Unlock Album": ["Débloquer l'album", "Desbloquear álbum", "Fungura ububiko bw'amafoto"],
  "Album is Locked": ["L'album est verrouillé", "El álbum está bloqueado", "Ububiko burafunze"],
  "Free Access": ["Accès gratuit", "Acceso gratuito", "Kwinjira ku buntu"],
  "Request Access": ["Demander l'accès", "Solicitar acceso", "Saba kwinjira"],
  "Enter Access Code": ["Entrez le code d'accès", "Ingresa el código de acceso", "Andika kode yo kwinjira"],
  "Invalid Access Code": ["Code d'accès invalide", "Código de acceso no válido", "Kode ntabwo yemewe"],
  "Purchase Album": ["Acheter l'album", "Comprar álbum", "Gura ububiko bw'amafoto"],
  "Price": ["Prix", "Precio", "Igiciro"],
  "Photos Matched": ["Photos correspondantes", "Fotos coincidentes", "Amafoto ahuye n'isura yawe"],
  "Matching photos found": ["Photos correspondantes trouvées", "Fotos coincidentes encontradas", "Amafoto ahuye n'isura yawe yabonetse"],
  "Searching photos...": ["Recherche des photos...", "Buscando fotos...", "Turimo gushakisha amafoto..."],
  "Please look at the camera": ["Veuillez regarder la caméra", "Por favor mira a la cámara", "Reba muri kamera"],
  "By photographer": ["Par le photographe", "Por el fotógrafo", "Yafashwe n'umufotozi"],
  "Unlock this album to view and download images.": [
    "Débloquez cet album pour voir et télécharger les images.",
    "Desbloquea este álbum para ver y descargar imágenes.",
    "Fungura ubu bubiko kugira ngo urebe kandi umanure amafoto."
  ],

  // Help Center & FAQ
  "Need Help?": ["Besoin d'aide ?", "¿Necesitas ayuda?", "Ukeneye ubufasha?"],
  "We're here to help": ["Nous sommes là pour vous aider", "Estamos aquí para ayudarte", "Turi hano kugira ngo tugufashe"],
  "Search help articles...": ["Rechercher des articles d'aide...", "Buscar artículos de ayuda...", "Shakisha inyandiko z'ubufasha..."],
  "Booking & Scheduling": ["Réservation et planification", "Reservas y programación", "Gufata umwanya no gutegura"],
  "Payments & Pricing": ["Paiements et tarifs", "Pagos y precios", "Kwishyura n'ibiciro"],
  "Account & Security": ["Compte et sécurité", "Cuenta y seguridad", "Konti n'umutekano"],
  "Technical Support": ["Support technique", "Soporte técnico", "Ubufasha mu by'ikoranabuhanga"],
  "Contact Support": ["Contacter le support", "Contactar a soporte", "Vugana n'abashinzwe ubufasha"],
  "Send us a message": ["Envoyez-nous un message", "Envíanos un mensaje", "Twoherereze ubutumwa"],
  "Send Message": ["Envoyer le message", "Enviar mensaje", "Ohereza ubutumwa"],
  "Message sent successfully": ["Message envoyé avec succès", "Mensaje enviado con éxito", "Ubutumwa bwoherejwe neza"],
  "Chat with us": ["Discutez avec nous", "Chatea con nosotros", "Vugana natwe ako kanya"],

  // Legal & Trust
  "Last Updated": ["Dernière mise à jour", "Última actualización", "Ibiheruka kuvugururwa"],
  "User Agreement": ["Accord de l'utilisateur", "Acuerdo de usuario", "Amasezerano y'umukoresha"],
  "Data Protection": ["Protection des données", "Protección de datos", "Umutekano w'amakuru yawe"],
  "Your Privacy Rights": ["Vos droits à la vie privée", "Tus derechos de privacidad", "Uburenganzira ku buzima bwawe bwite"],
  "Acceptable Use Policy": ["Politique d'utilisation acceptable", "Política de uso aceptable", "Amabwiriza y'imikoreshereze yemewe"],
  "Safety Guidelines": ["Consignes de sécurité", "Pautas de seguridad", "Amabwiriza y'umutekano"],
  "Reporting Issues": ["Signaler un problème", "Informar de un problema", "Kumenyesha ikibazo"],

  // Photographer Guide & Booking Flow
  "Getting Started": ["Pour commencer", "Primeros pasos", "Gutangira"],
  "How to receive bookings": ["Comment recevoir des réservations", "Cómo recibir reservas", "Uko wakira abakiriya bafatisha umwanya"],
  "Managing your schedule": ["Gérer votre emploi du temps", "Administrar tu horario", "Gucunga ingengabihe yawe"],
  "Setting your rates": ["Définir vos tarifs", "Establecer tus tarifas", "Gushyiraho ibiciro byawe"],
  "Payouts and earnings": ["Paiements et gains", "Pagos y ganancias", "Kwishyurwa n'inyungu yawe"],
  "Delivering photos to clients": ["Livrer des photos aux clients", "Entrega de fotos a clientes", "Koherereza abakiriya amafoto"],
  "Select a date": ["Sélectionner une date", "Seleccionar una fecha", "Hitamo itariki"],
  "Select time": ["Sélectionner l'heure", "Seleccionar hora", "Hitamo isaha"],
  "Pick the day of your event": ["Choisissez le jour de votre événement", "Elige el día de tu evento", "Hitamo umunsi w'ibirori byawe"],
  "Type or pick a date above": ["Tapez ou choisissez une date ci-dessus", "Escribe o elige una fecha arriba", "Andika cyangwa hitamo itariki haruguru"],
  "The event date must be in the future.": ["La date de l'événement doit être future.", "La fecha del evento debe ser futura.", "Itariki y'ibirori igomba kuba iri imbere."],
  "Sign in to complete your booking": ["Connectez-vous pour finaliser votre réservation", "Inicia sesión para completar tu reserva", "Injira kugira ngo urangize gufata umwanya"],

  // Donations & Payments
  "Support Local Talent": ["Soutenir les talents locaux", "Apoyar el talento local", "Shyigikira abanyamwuga bo mu gihugu"],
  "Make a Donation": ["Faire un don", "Hacer una donación", "Tanga inkunga"],
  "Choose Amount": ["Choisir le montant", "Elegir monto", "Hitamo umubare w'amafaranga"],
  "Custom Amount": ["Montant personnalisé", "Monto personalizado", "Andika andi mafaranga"],
  "Donate Now": ["Faire un don maintenant", "Donar ahora", "Tanga inkunga nonaha"],
  "Thank you for your generosity": ["Merci pour votre générosité", "Gracias por tu generosidad", "Urakoze cyane ku bw'ubuntu bwawe"],
  "Your contribution helps": ["Votre contribution aide", "Tu contribución ayuda", "Inkunga yawe irafasha cyane"],
  "Schedule Deposit": ["Planifier l'acompte", "Programar depósito", "Teganya ingwate"],
  "Deposit Amount": ["Montant de l'acompte", "Monto del depósito", "Amafaranga y'ingwate"],
  "Complete Payment": ["Finaliser le paiement", "Completar pago", "Uzuza ubwishyu"],
  "Payment Method": ["Mode de paiement", "Método de pago", "Uburyo bwo kwishyura"],
  "Mobile Money": ["Mobile Money", "Dinero Móvil", "Mobile Money"],
  "Credit Card": ["Carte de crédit", "Tarjeta de crédito", "Ikarita ya Banki"],
  "Pay with MTN": ["Payer avec MTN", "Pagar con MTN", "Ishyura ukoresheje MTN"],
  "Pay with Airtel": ["Payer avec Airtel", "Pagar con Airtel", "Ishyura ukoresheje Airtel"],
  "Transaction Status": ["Statut de la transaction", "Estado de la transacción", "Imiterere y'ihererekanya"],
  "Payment Successful": ["Paiement réussi", "Pago exitoso", "Ubwishyu bwagenze neza"],
  "Payment Failed": ["Échec du paiement", "Pago fallido", "Ubwishyu bwanze"],
  "Total Amount": ["Montant total", "Monto total", "Amafaranga yose hamwe"],
  "Fast & Secure Checkout": ["Paiement rapide et sécurisé", "Pago rápido y seguro", "Kwishyura byihuse kandi bizewe"],

  // Connect TV
  "Your TV is connected": ["Votre téléviseur est connecté", "Tu televisor está conectado", "Televiziyo yawe yamaze guhuzwa"],
  "You can disconnect it any time from Paired TVs.": [
    "Vous pouvez le déconnecter à tout moment depuis Téléviseurs associés.",
    "Puedes desconectarlo en cualquier momento desde Televisores emparejados.",
    "Ushobora kuyikuraho igihe cyose mu mateleviziyo yahujwe."
  ],
  "Manage paired TVs": ["Gérer les téléviseurs associés", "Administrar televisores emparejados", "Cunga amateleviziyo yahujwe"],
  "Connect another": ["Connecter un autre", "Conectar otro", "Huza indi televiziyo"],
  "Smart TV": ["Téléviseur connecté", "Smart TV", "Smart TV"],
  "Connect a TV": ["Connecter un téléviseur", "Conectar un televisor", "Huza na Televiziyo"],
  "Open Connekyt on your TV and choose": [
    "Ouvrez Connekyt sur votre téléviseur et choisissez",
    "Abre Connekyt en tu televisor y elige",
    "Fungura Connekyt kuri televiziyo yawe maze uhitemo"
  ],
  "Code from your TV": ["Code affiché sur votre téléviseur", "Código de tu televisor", "Kode iboneka kuri televiziyo yawe"],
  "Name this TV": ["Nommer ce téléviseur", "Nombra este televisor", "Ihe izina iyi televiziyo"],

  // Notifications & Alerts
  "Notification": ["Notification", "Notificación", "Imenyesha"],
  "Notifications": ["Notifications", "Notificaciones", "Imenyesha"],
  "You're all caught up": ["Vous êtes à jour", "Estás al día", "Nta makuru mashya ahari"],
  "View all notifications": ["Voir toutes les notifications", "Ver todas las notificaciones", "Reba amakuru yose"],
  "Mark as read": ["Marquer comme lu", "Marcar como leído", "Shyira nk'icyasomwe"],
  "Mark all as read": ["Tout marquer comme lu", "Marcar todo como leído", "Shyira byose nk'ibyasomwe"],

  // Profile & Settings
  "Profile Settings": ["Paramètres du profil", "Configuración de perfil", "Igenamiterere ry'umwirondoro"],
  "Personal Information": ["Informations personnelles", "Información personal", "Amakuru yihariye"],
  "Change Photo": ["Changer la photo", "Cambiar foto", "Hindura ifoto"],
  "Bio": ["Biographie", "Biografía", "Ibyerekeye wowe"],
  "Save Profile": ["Enregistrer le profil", "Guardar perfil", "Bika umwirondoro"],
  "Account Details": ["Détails du compte", "Detalles de la cuenta", "Amakuru arambuye kuri konti"]
};

for (const [k, v] of Object.entries(extraPagesDict)) {
  current[k] = v;
}

fs.writeFileSync(dtPath, JSON.stringify(current, null, 2), 'utf8');
console.log('Total entries in domTranslations.json is now:', Object.keys(current).length);
