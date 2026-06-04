// Terms of Service. Drafts only — have a lawyer review before publishing.
//
// Two placeholders to fill in before going public:
//   - LEGAL_ENTITY_NAME — your real legal entity name. Currently rendered
//     verbatim so the user sees "[YOUR NAME / COMPANY]" in app until you
//     replace it.
//   - Governing law (Austria) — change if your operating jurisdiction differs.

import type { LegalDocument } from '@/constants/legal/privacy';
import type { Language } from '@/i18n';
import { LEGAL_CONTACT_EMAIL, LEGAL_ENTITY_NAME } from '@/constants/legal/shared';

export const TERMS_OF_SERVICE: Record<Language, LegalDocument> = {
  en: {
    title: 'Terms of Service',
    lastUpdated: 'Last updated: 6 May 2026',
    sections: [
      {
        heading: 'Introduction',
        segments: [
          {
            type: 'paragraph',
            text: `These Terms of Service ("Terms") govern your use of the mobile application ("the App") provided by ${LEGAL_ENTITY_NAME} ("we", "us", "our").`,
          },
          {
            type: 'paragraph',
            text: 'By accessing or using the App, you agree to be bound by these Terms. If you do not agree, you must not use the App.',
          },
        ],
      },
      {
        heading: 'Account Registration',
        segments: [
          {
            type: 'paragraph',
            text: 'To use the App, you must sign in using Sign in with Apple or Google Sign-In.',
          },
          {
            type: 'paragraph',
            text: 'You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.',
          },
          {
            type: 'paragraph',
            text: 'We may suspend or terminate accounts that violate these Terms.',
          },
        ],
      },
      {
        heading: 'Services Provided',
        segments: [
          { type: 'paragraph', text: 'The App provides the following services:' },
          {
            type: 'bullets',
            items: [
              'Delivery of a daily AI-generated haiku',
              'Ability to generate additional haiku',
              'Ability to create AI-generated images based on haiku',
              'Ability to write, save, and manage your own haiku',
              'Access to credit-based features',
              'Optional in-app purchases and subscriptions',
            ],
          },
          {
            type: 'paragraph',
            text: 'We may update, modify, or discontinue features at any time.',
          },
        ],
      },
      {
        heading: 'AI-Generated Content',
        segments: [
          { type: 'paragraph', text: 'The App uses OpenAI to generate haiku and images.' },
          {
            type: 'paragraph',
            text: 'By submitting text or prompts, you grant us the right to process this content solely for the purpose of generating outputs.',
          },
          {
            type: 'paragraph',
            text: "You retain ownership of your generated haiku and images, subject to OpenAI's usage policies.",
          },
          {
            type: 'paragraph',
            text: 'We do not guarantee the accuracy, originality, or appropriateness of AI-generated content.',
          },
        ],
      },
      {
        heading: 'User Content',
        segments: [
          {
            type: 'paragraph',
            text: 'You may create, upload, or store haiku or other content within the App ("User Content").',
          },
          { type: 'paragraph', text: 'You retain all rights to your User Content.' },
          { type: 'paragraph', text: 'You agree not to submit content that is:' },
          {
            type: 'bullets',
            items: [
              'illegal, harmful, or abusive',
              'infringing on third-party rights',
              'hateful, violent, or discriminatory',
              'sexually explicit',
              'intended to misuse or overload the AI system',
            ],
          },
          { type: 'paragraph', text: 'We may remove content that violates these rules.' },
        ],
      },
      {
        heading: 'In-App Purchases and Subscriptions',
        segments: [
          {
            type: 'paragraph',
            text: 'The App offers credit packs, subscriptions, and a Starter Pack through the Apple App Store or Google Play Store.',
          },
          { type: 'subheading', text: 'RevenueCat' },
          { type: 'paragraph', text: 'Purchases are processed and validated via RevenueCat.' },
          {
            type: 'paragraph',
            text: 'RevenueCat receives purchase receipts and subscription status but does not receive your haiku or personal content.',
          },
          { type: 'subheading', text: 'Refunds' },
          { type: 'paragraph', text: 'All purchases are final.' },
          {
            type: 'paragraph',
            text: 'Refunds must be requested directly from Apple or Google according to their policies.',
          },
          { type: 'subheading', text: 'Credits' },
          {
            type: 'paragraph',
            text: 'Credits are consumable digital items used to generate haiku or images.',
          },
          {
            type: 'paragraph',
            text: 'Credits have no monetary value and cannot be transferred, refunded, or exchanged.',
          },
        ],
      },
      {
        heading: 'Acceptable Use',
        segments: [
          { type: 'paragraph', text: 'You agree not to:' },
          {
            type: 'bullets',
            items: [
              'reverse engineer, decompile, or modify the App',
              'attempt to bypass credit usage or security mechanisms',
              'use automated tools or bots',
              'misuse AI features for harmful or illegal purposes',
              "interfere with the App's operation or servers",
            ],
          },
          { type: 'paragraph', text: 'Violation may result in account termination.' },
        ],
      },
      {
        heading: 'Intellectual Property',
        segments: [
          {
            type: 'paragraph',
            text: `All rights to the App, including design, code, branding, and non-user content, belong to ${LEGAL_ENTITY_NAME}.`,
          },
          {
            type: 'paragraph',
            text: 'You may not copy, distribute, or create derivative works of the App without permission.',
          },
        ],
      },
      {
        heading: 'Availability and Disclaimer',
        segments: [
          {
            type: 'paragraph',
            text: 'The App is provided "as is" and "as available" without warranties of any kind.',
          },
          {
            type: 'paragraph',
            text: 'We do not guarantee uninterrupted service, error-free operation, or permanent availability of features.',
          },
          { type: 'paragraph', text: 'We are not liable for:' },
          {
            type: 'bullets',
            items: [
              'AI-generated content',
              'data loss',
              'service interruptions',
              'outages of third-party services (Firebase, OpenAI, RevenueCat, Apple, Google)',
            ],
          },
        ],
      },
      {
        heading: 'Limitation of Liability',
        segments: [
          {
            type: 'paragraph',
            text: 'To the maximum extent permitted by law, we are not liable for any indirect, incidental, consequential, or punitive damages arising from your use of the App.',
          },
          {
            type: 'paragraph',
            text: 'Our total liability shall not exceed the amount you paid for the App in the 12 months preceding the claim.',
          },
        ],
      },
      {
        heading: 'Termination',
        segments: [
          { type: 'paragraph', text: 'We may suspend or terminate your account if you:' },
          {
            type: 'bullets',
            items: [
              'violate these Terms',
              'misuse the App',
              'engage in fraudulent activity',
              'attempt to circumvent credit or purchase systems',
            ],
          },
          { type: 'paragraph', text: 'You may delete your account at any time.' },
        ],
      },
      {
        heading: 'Governing Law',
        segments: [
          {
            type: 'paragraph',
            text: 'These Terms are governed by the laws of Austria, without regard to conflict-of-law principles.',
          },
        ],
      },
      {
        heading: 'Changes to the Terms',
        segments: [
          { type: 'paragraph', text: 'We may update these Terms from time to time.' },
          { type: 'paragraph', text: 'Material changes will be communicated within the App.' },
          {
            type: 'paragraph',
            text: 'Continued use of the App constitutes acceptance of the updated Terms.',
          },
        ],
      },
      {
        heading: 'Contact',
        segments: [
          { type: 'paragraph', text: 'For questions regarding these Terms, contact:' },
          { type: 'paragraph', text: LEGAL_CONTACT_EMAIL },
        ],
      },
    ],
  },

  de: {
    title: 'Nutzungsbedingungen',
    lastUpdated: 'Stand: 6. Mai 2026',
    sections: [
      {
        heading: 'Einleitung',
        segments: [
          {
            type: 'paragraph',
            text: `Diese Nutzungsbedingungen ("Bedingungen") regeln deine Nutzung der mobilen Anwendung ("die App"), bereitgestellt von ${LEGAL_ENTITY_NAME} ("wir", "uns", "unser").`,
          },
          {
            type: 'paragraph',
            text: 'Durch Zugriff auf oder Nutzung der App erklärst du dich an diese Bedingungen gebunden. Wenn du nicht zustimmst, darfst du die App nicht nutzen.',
          },
        ],
      },
      {
        heading: 'Kontoregistrierung',
        segments: [
          {
            type: 'paragraph',
            text: 'Zur Nutzung der App musst du dich mit "Sign in with Apple" oder "Google Sign-In" anmelden.',
          },
          {
            type: 'paragraph',
            text: 'Du bist verantwortlich für die Vertraulichkeit deiner Anmeldedaten und für alle Aktivitäten unter deinem Konto.',
          },
          {
            type: 'paragraph',
            text: 'Wir können Konten sperren oder kündigen, die diese Bedingungen verletzen.',
          },
        ],
      },
      {
        heading: 'Bereitgestellte Leistungen',
        segments: [
          { type: 'paragraph', text: 'Die App bietet folgende Leistungen:' },
          {
            type: 'bullets',
            items: [
              'tägliches KI-generiertes Haiku',
              'Generierung weiterer Haikus',
              'Erstellung KI-generierter Bilder zu Haikus',
              'Schreiben, Speichern und Verwalten eigener Haikus',
              'Zugriff auf guthabenbasierte Funktionen',
              'optionale In-App-Käufe und Abonnements',
            ],
          },
          {
            type: 'paragraph',
            text: 'Wir können Funktionen jederzeit aktualisieren, ändern oder einstellen.',
          },
        ],
      },
      {
        heading: 'KI-generierte Inhalte',
        segments: [
          { type: 'paragraph', text: 'Die App verwendet OpenAI zur Generierung von Haikus und Bildern.' },
          {
            type: 'paragraph',
            text: 'Mit der Übermittlung von Text oder Vorgaben gestattest du uns, diese Inhalte ausschließlich zum Zweck der Generierung zu verarbeiten.',
          },
          {
            type: 'paragraph',
            text: 'Die Rechte an den generierten Haikus und Bildern verbleiben bei dir, vorbehaltlich der Nutzungsrichtlinien von OpenAI.',
          },
          {
            type: 'paragraph',
            text: 'Wir übernehmen keine Garantie für Genauigkeit, Originalität oder Angemessenheit KI-generierter Inhalte.',
          },
        ],
      },
      {
        heading: 'Nutzerinhalte',
        segments: [
          {
            type: 'paragraph',
            text: 'Du kannst innerhalb der App Haikus oder andere Inhalte ("Nutzerinhalte") erstellen, hochladen oder speichern.',
          },
          { type: 'paragraph', text: 'Sämtliche Rechte an deinen Nutzerinhalten verbleiben bei dir.' },
          { type: 'paragraph', text: 'Du verpflichtest dich, keine Inhalte einzureichen, die:' },
          {
            type: 'bullets',
            items: [
              'rechtswidrig, schädlich oder missbräuchlich sind',
              'Rechte Dritter verletzen',
              'hasserfüllt, gewaltverherrlichend oder diskriminierend sind',
              'sexuell explizit sind',
              'darauf abzielen, das KI-System zu missbrauchen oder zu überlasten',
            ],
          },
          {
            type: 'paragraph',
            text: 'Wir können Inhalte entfernen, die gegen diese Regeln verstoßen.',
          },
        ],
      },
      {
        heading: 'In-App-Käufe und Abonnements',
        segments: [
          {
            type: 'paragraph',
            text: 'Die App bietet Guthabenpakete, Abonnements und ein Starter-Paket über den Apple App Store oder Google Play Store an.',
          },
          { type: 'subheading', text: 'RevenueCat' },
          { type: 'paragraph', text: 'Käufe werden über RevenueCat verarbeitet und validiert.' },
          {
            type: 'paragraph',
            text: 'RevenueCat erhält Kaufbelege und Abonnement-Status, jedoch keine Haikus oder persönlichen Inhalte.',
          },
          { type: 'subheading', text: 'Erstattungen' },
          { type: 'paragraph', text: 'Alle Käufe sind endgültig.' },
          {
            type: 'paragraph',
            text: 'Erstattungen sind direkt bei Apple oder Google nach deren Richtlinien zu beantragen.',
          },
          { type: 'subheading', text: 'Guthaben' },
          {
            type: 'paragraph',
            text: 'Guthaben sind verbrauchbare digitale Güter zur Generierung von Haikus oder Bildern.',
          },
          {
            type: 'paragraph',
            text: 'Guthaben haben keinen Geldwert und können nicht übertragen, erstattet oder umgetauscht werden.',
          },
        ],
      },
      {
        heading: 'Zulässige Nutzung',
        segments: [
          { type: 'paragraph', text: 'Du verpflichtest dich, nicht:' },
          {
            type: 'bullets',
            items: [
              'die App zurückzuentwickeln, zu dekompilieren oder zu modifizieren',
              'Mechanismen für Guthabennutzung oder Sicherheit zu umgehen',
              'automatisierte Tools oder Bots einzusetzen',
              'KI-Funktionen für schädliche oder rechtswidrige Zwecke zu missbrauchen',
              'den Betrieb der App oder unsere Server zu stören',
            ],
          },
          {
            type: 'paragraph',
            text: 'Verstöße können zur Kündigung des Kontos führen.',
          },
        ],
      },
      {
        heading: 'Geistiges Eigentum',
        segments: [
          {
            type: 'paragraph',
            text: `Sämtliche Rechte an der App, einschließlich Design, Code, Markenelementen und nicht-nutzergenerierten Inhalten, gehören ${LEGAL_ENTITY_NAME}.`,
          },
          {
            type: 'paragraph',
            text: 'Ohne Erlaubnis darfst du die App nicht kopieren, verbreiten oder Bearbeitungen davon erstellen.',
          },
        ],
      },
      {
        heading: 'Verfügbarkeit und Haftungsausschluss',
        segments: [
          {
            type: 'paragraph',
            text: 'Die App wird "wie besehen" und "wie verfügbar" ohne jegliche Gewährleistung bereitgestellt.',
          },
          {
            type: 'paragraph',
            text: 'Wir garantieren keinen unterbrechungsfreien Betrieb, keine fehlerfreie Funktion und keine dauerhafte Verfügbarkeit von Funktionen.',
          },
          { type: 'paragraph', text: 'Wir haften nicht für:' },
          {
            type: 'bullets',
            items: [
              'KI-generierte Inhalte',
              'Datenverlust',
              'Dienstunterbrechungen',
              'Ausfälle von Drittanbietern (Firebase, OpenAI, RevenueCat, Apple, Google)',
            ],
          },
        ],
      },
      {
        heading: 'Haftungsbeschränkung',
        segments: [
          {
            type: 'paragraph',
            text: 'Soweit gesetzlich zulässig, haften wir nicht für indirekte, beiläufige, Folge- oder Strafschäden, die aus deiner Nutzung der App entstehen.',
          },
          {
            type: 'paragraph',
            text: 'Unsere Gesamthaftung übersteigt nicht den Betrag, den du in den 12 Monaten vor dem Anspruch für die App gezahlt hast.',
          },
        ],
      },
      {
        heading: 'Beendigung',
        segments: [
          {
            type: 'paragraph',
            text: 'Wir können dein Konto sperren oder kündigen, wenn du:',
          },
          {
            type: 'bullets',
            items: [
              'gegen diese Bedingungen verstößt',
              'die App missbrauchst',
              'betrügerische Aktivitäten ausübst',
              'versuchst, das Guthaben- oder Kaufsystem zu umgehen',
            ],
          },
          { type: 'paragraph', text: 'Du kannst dein Konto jederzeit löschen.' },
        ],
      },
      {
        heading: 'Anwendbares Recht',
        segments: [
          {
            type: 'paragraph',
            text: 'Diese Bedingungen unterliegen dem Recht der Republik Österreich unter Ausschluss der Kollisionsnormen.',
          },
        ],
      },
      {
        heading: 'Änderungen der Bedingungen',
        segments: [
          { type: 'paragraph', text: 'Wir können diese Bedingungen von Zeit zu Zeit aktualisieren.' },
          { type: 'paragraph', text: 'Wesentliche Änderungen werden in der App kommuniziert.' },
          {
            type: 'paragraph',
            text: 'Die fortgesetzte Nutzung der App gilt als Annahme der aktualisierten Bedingungen.',
          },
        ],
      },
      {
        heading: 'Kontakt',
        segments: [
          { type: 'paragraph', text: 'Bei Fragen zu diesen Bedingungen erreichst du uns unter:' },
          { type: 'paragraph', text: LEGAL_CONTACT_EMAIL },
        ],
      },
    ],
  },

  fr: {
    title: "Conditions d'utilisation",
    lastUpdated: 'Dernière mise à jour : 6 mai 2026',
    draftBanner: 'Traduction provisoire. La version anglaise fait foi.',
    sections: [
      {
        heading: 'Introduction',
        segments: [
          {
            type: 'paragraph',
            text: `Les présentes conditions ("Conditions") régissent votre utilisation de l'application mobile ("l'App"), fournie par ${LEGAL_ENTITY_NAME}.`,
          },
          {
            type: 'paragraph',
            text: "En utilisant l'App, vous acceptez ces Conditions. Si vous n'êtes pas d'accord, n'utilisez pas l'App.",
          },
        ],
      },
      {
        heading: 'Compte',
        segments: [
          {
            type: 'paragraph',
            text: "Connexion via Sign in with Apple ou Google Sign-In. Vous êtes responsable de la sécurité de votre compte. Nous pouvons suspendre les comptes en infraction.",
          },
        ],
      },
      {
        heading: 'Services',
        segments: [
          { type: 'paragraph', text: "L'App propose :" },
          {
            type: 'bullets',
            items: [
              'haïku quotidien généré par IA',
              'génération de haïkus supplémentaires',
              "création d'images IA inspirées des haïkus",
              'écriture, sauvegarde et gestion de vos propres haïkus',
              'fonctionnalités basées sur des crédits',
              'achats intégrés et abonnements',
            ],
          },
          {
            type: 'paragraph',
            text: 'Les fonctionnalités peuvent être modifiées ou retirées à tout moment.',
          },
        ],
      },
      {
        heading: 'Contenu généré par IA',
        segments: [
          {
            type: 'paragraph',
            text: "Les générations passent par OpenAI. Vous nous accordez le droit de traiter vos prompts uniquement pour produire les sorties demandées. Vous conservez la propriété de vos haïkus et images, sous réserve des conditions d'OpenAI. Aucune garantie d'exactitude, d'originalité ou d'adéquation.",
          },
        ],
      },
      {
        heading: 'Contenu utilisateur',
        segments: [
          {
            type: 'paragraph',
            text: 'Vous conservez les droits sur votre Contenu. Vous vous engagez à ne pas soumettre de contenu :',
          },
          {
            type: 'bullets',
            items: [
              'illégal, nuisible ou abusif',
              'portant atteinte aux droits de tiers',
              'haineux, violent ou discriminatoire',
              'sexuellement explicite',
              "destiné à abuser ou surcharger le système d'IA",
            ],
          },
          { type: 'paragraph', text: 'Nous pouvons retirer tout contenu non conforme.' },
        ],
      },
      {
        heading: 'Achats intégrés et abonnements',
        segments: [
          {
            type: 'paragraph',
            text: "Packs de crédits, abonnements et Starter Pack via App Store / Google Play. Achats traités par RevenueCat (reçus, statut), qui ne reçoit ni vos haïkus ni vos contenus personnels. Tous les achats sont définitifs ; les remboursements relèvent d'Apple / Google selon leurs règles. Les crédits sont des biens numériques consommables sans valeur monétaire.",
          },
        ],
      },
      {
        heading: 'Utilisation acceptable',
        segments: [
          { type: 'paragraph', text: 'Interdit :' },
          {
            type: 'bullets',
            items: [
              "rétro-ingénierie, décompilation ou modification de l'App",
              'contournement des crédits ou des mécanismes de sécurité',
              'outils automatisés ou bots',
              "mésusage de l'IA à des fins nuisibles ou illégales",
              "interférence avec le fonctionnement de l'App ou nos serveurs",
            ],
          },
        ],
      },
      {
        heading: 'Propriété intellectuelle',
        segments: [
          {
            type: 'paragraph',
            text: `Tous les droits sur l'App (design, code, marque, contenus non-utilisateur) appartiennent à ${LEGAL_ENTITY_NAME}. Toute copie, distribution ou œuvre dérivée est interdite sans autorisation.`,
          },
        ],
      },
      {
        heading: 'Disponibilité et garantie',
        segments: [
          {
            type: 'paragraph',
            text: 'App fournie « telle quelle » et « selon disponibilité ». Aucune garantie de continuité ou d\'absence d\'erreurs. Non responsables des contenus IA, pertes de données, interruptions, ni des pannes des services tiers (Firebase, OpenAI, RevenueCat, Apple, Google).',
          },
        ],
      },
      {
        heading: 'Limitation de responsabilité',
        segments: [
          {
            type: 'paragraph',
            text: "Dans la limite autorisée par la loi, aucune responsabilité pour dommages indirects ou consécutifs. Notre responsabilité totale n'excède pas le montant payé pour l'App au cours des 12 mois précédents.",
          },
        ],
      },
      {
        heading: 'Résiliation',
        segments: [
          { type: 'paragraph', text: 'Nous pouvons suspendre votre compte en cas de :' },
          {
            type: 'bullets',
            items: [
              'violation des Conditions',
              "mauvaise utilisation de l'App",
              'fraude',
              'tentative de contournement du système de crédits / achats',
            ],
          },
          { type: 'paragraph', text: 'Vous pouvez supprimer votre compte à tout moment.' },
        ],
      },
      {
        heading: 'Droit applicable',
        segments: [
          {
            type: 'paragraph',
            text: 'Droit autrichien, à l\'exclusion des règles de conflit de lois.',
          },
        ],
      },
      {
        heading: 'Modifications',
        segments: [
          {
            type: 'paragraph',
            text: "Nous pouvons mettre à jour les Conditions. Les modifications matérielles sont communiquées dans l'App. L'utilisation continue vaut acceptation.",
          },
        ],
      },
      {
        heading: 'Contact',
        segments: [
          { type: 'paragraph', text: 'Questions :' },
          { type: 'paragraph', text: LEGAL_CONTACT_EMAIL },
        ],
      },
    ],
  },

  es: {
    title: 'Términos del servicio',
    lastUpdated: 'Última actualización: 6 de mayo de 2026',
    draftBanner: 'Traducción provisional. La versión en inglés es la auténtica.',
    sections: [
      {
        heading: 'Introducción',
        segments: [
          {
            type: 'paragraph',
            text: `Estos términos ("Términos") rigen tu uso de la aplicación móvil ("la App"), proporcionada por ${LEGAL_ENTITY_NAME}.`,
          },
          {
            type: 'paragraph',
            text: 'Al usar la App, aceptas estos Términos. Si no estás de acuerdo, no la uses.',
          },
        ],
      },
      {
        heading: 'Cuenta',
        segments: [
          {
            type: 'paragraph',
            text: 'Inicio de sesión con Sign in with Apple o Google Sign-In. Eres responsable de la seguridad de tu cuenta. Podemos suspender cuentas en infracción.',
          },
        ],
      },
      {
        heading: 'Servicios',
        segments: [
          { type: 'paragraph', text: 'La App ofrece:' },
          {
            type: 'bullets',
            items: [
              'haiku diario generado por IA',
              'generación de haikus adicionales',
              'creación de imágenes IA inspiradas en haikus',
              'escritura, guardado y gestión de tus propios haikus',
              'funcionalidades basadas en créditos',
              'compras integradas y suscripciones',
            ],
          },
          {
            type: 'paragraph',
            text: 'Las funcionalidades pueden actualizarse o retirarse en cualquier momento.',
          },
        ],
      },
      {
        heading: 'Contenido generado por IA',
        segments: [
          {
            type: 'paragraph',
            text: 'La generación usa OpenAI. Nos otorgas el derecho de procesar tus prompts solo para producir los resultados solicitados. Conservas la propiedad de tus haikus e imágenes, sujeta a las políticas de OpenAI. Sin garantía de exactitud, originalidad o adecuación.',
          },
        ],
      },
      {
        heading: 'Contenido del usuario',
        segments: [
          {
            type: 'paragraph',
            text: 'Conservas los derechos sobre tu Contenido. Te comprometes a no enviar contenido:',
          },
          {
            type: 'bullets',
            items: [
              'ilegal, dañino o abusivo',
              'que infrinja derechos de terceros',
              'odioso, violento o discriminatorio',
              'sexualmente explícito',
              'destinado a abusar o sobrecargar el sistema de IA',
            ],
          },
          { type: 'paragraph', text: 'Podemos eliminar contenido que incumpla estas reglas.' },
        ],
      },
      {
        heading: 'Compras integradas y suscripciones',
        segments: [
          {
            type: 'paragraph',
            text: 'Paquetes de créditos, suscripciones y Starter Pack vía App Store / Google Play. Compras procesadas por RevenueCat (recibos, estado), que no recibe haikus ni contenido personal. Todas las compras son finales; los reembolsos los gestionan Apple / Google según sus políticas. Los créditos son bienes digitales consumibles sin valor monetario.',
          },
        ],
      },
      {
        heading: 'Uso aceptable',
        segments: [
          { type: 'paragraph', text: 'Prohibido:' },
          {
            type: 'bullets',
            items: [
              'ingeniería inversa, descompilación o modificación de la App',
              'eludir los créditos o mecanismos de seguridad',
              'herramientas automatizadas o bots',
              'uso indebido de la IA con fines dañinos o ilegales',
              'interferir con el funcionamiento de la App o los servidores',
            ],
          },
        ],
      },
      {
        heading: 'Propiedad intelectual',
        segments: [
          {
            type: 'paragraph',
            text: `Todos los derechos sobre la App (diseño, código, marca, contenido no del usuario) pertenecen a ${LEGAL_ENTITY_NAME}. Está prohibido copiar, distribuir o crear obras derivadas sin permiso.`,
          },
        ],
      },
      {
        heading: 'Disponibilidad y garantía',
        segments: [
          {
            type: 'paragraph',
            text: 'App proporcionada «tal cual» y «según disponibilidad». Sin garantía de continuidad ni de ausencia de errores. No responsables del contenido IA, pérdida de datos, interrupciones, ni de fallos de servicios de terceros (Firebase, OpenAI, RevenueCat, Apple, Google).',
          },
        ],
      },
      {
        heading: 'Limitación de responsabilidad',
        segments: [
          {
            type: 'paragraph',
            text: 'En la medida permitida por la ley, sin responsabilidad por daños indirectos o consecuentes. Nuestra responsabilidad total no excederá el importe pagado por la App en los 12 meses anteriores.',
          },
        ],
      },
      {
        heading: 'Terminación',
        segments: [
          { type: 'paragraph', text: 'Podemos suspender tu cuenta en caso de:' },
          {
            type: 'bullets',
            items: [
              'incumplimiento de estos Términos',
              'uso indebido de la App',
              'fraude',
              'intento de eludir el sistema de créditos / compras',
            ],
          },
          { type: 'paragraph', text: 'Puedes eliminar tu cuenta en cualquier momento.' },
        ],
      },
      {
        heading: 'Ley aplicable',
        segments: [
          {
            type: 'paragraph',
            text: 'Derecho austriaco, sin perjuicio de las normas de conflicto de leyes.',
          },
        ],
      },
      {
        heading: 'Modificaciones',
        segments: [
          {
            type: 'paragraph',
            text: 'Podemos actualizar los Términos. Los cambios materiales se comunicarán dentro de la App. El uso continuado vale como aceptación.',
          },
        ],
      },
      {
        heading: 'Contacto',
        segments: [
          { type: 'paragraph', text: 'Consultas:' },
          { type: 'paragraph', text: LEGAL_CONTACT_EMAIL },
        ],
      },
    ],
  },
};
