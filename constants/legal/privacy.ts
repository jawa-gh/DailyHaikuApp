// Privacy Policy content, structured as data so the screen can render with
// consistent typography across languages.
//
// Drafts only — have a lawyer review before publishing.
//
// Heads up: the contact email below is a personal address. For a public app,
// consider routing through a forwarding alias (e.g. privacy@dailyhaiku.app)
// to keep the inbox manageable and protect against scraped-spam.

import type { Language } from '@/i18n';
import { LEGAL_CONTACT_EMAIL } from '@/constants/legal/shared';

export type LegalSegment =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'subheading'; text: string };

export type LegalSection = {
  /** Optional — omit for the intro / lead section under the title. */
  heading?: string;
  segments: LegalSegment[];
};

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  /** Shown at the top of the screen to mark non-authoritative translations. */
  draftBanner?: string;
  sections: LegalSection[];
};

export const PRIVACY_POLICY: Record<Language, LegalDocument> = {
  en: {
    title: 'Privacy & Data Protection',
    lastUpdated: 'Last updated: 6 May 2026',
    sections: [
      {
        segments: [
          {
            type: 'paragraph',
            text: 'Your privacy matters. This app is designed to collect only the minimum amount of personal data required to provide its core features. We do not use advertising, third-party tracking, or analytics tools.',
          },
        ],
      },
      {
        heading: 'What data we collect',
        segments: [
          { type: 'paragraph', text: 'We only collect data necessary to operate the app:' },
          { type: 'subheading', text: 'Account information' },
          { type: 'paragraph', text: 'When you sign in using Apple or Google, we receive:' },
          {
            type: 'bullets',
            items: [
              'your Apple / Google user ID',
              'your display name (if provided)',
              'your email address (if provided by the provider)',
            ],
          },
          { type: 'paragraph', text: 'This is required to create and maintain your account.' },
          { type: 'subheading', text: 'Usage data related to your haiku and images' },
          {
            type: 'bullets',
            items: [
              'haiku you generate',
              'images you generate',
              'credits you use',
              'purchase history (via RevenueCat)',
            ],
          },
          {
            type: 'paragraph',
            text: 'This data is stored to provide your history, manage credits, and prevent abuse.',
          },
          { type: 'subheading', text: 'Technical data' },
          { type: 'bullets', items: ['device type', 'app version', 'basic error logs'] },
          { type: 'paragraph', text: 'This is required for security and debugging.' },
          {
            type: 'paragraph',
            text: 'We do not collect location data, advertising identifiers, or behavioral tracking.',
          },
        ],
      },
      {
        heading: 'AI Processing',
        segments: [
          { type: 'paragraph', text: 'Haiku and image generation is performed using OpenAI.' },
          {
            type: 'paragraph',
            text: 'Your text prompts (haiku or instructions) and image prompts are sent to OpenAI only for the purpose of generating the requested output.',
          },
          { type: 'paragraph', text: 'We do not send:' },
          {
            type: 'bullets',
            items: ['your name', 'your email', 'your account ID', 'any personal profile data'],
          },
          { type: 'paragraph', text: 'OpenAI acts as a data processor under GDPR.' },
        ],
      },
      {
        heading: 'Where your data is stored',
        segments: [
          { type: 'paragraph', text: 'We use Firebase (Google Cloud) as our backend.' },
          {
            type: 'paragraph',
            text: "Data may be stored in the EU or other regions depending on Google Cloud's infrastructure, always under GDPR-compliant terms.",
          },
          { type: 'paragraph', text: 'Purchases are managed by RevenueCat, which stores:' },
          {
            type: 'bullets',
            items: ['purchase receipts', 'subscription status', 'credit pack purchases'],
          },
          {
            type: 'paragraph',
            text: 'RevenueCat does not receive your haiku, images, or personal content.',
          },
        ],
      },
      {
        heading: 'Why we process your data (Legal Basis)',
        segments: [
          { type: 'paragraph', text: 'Under GDPR, we process your data based on:' },
          {
            type: 'bullets',
            items: [
              'Art. 6(1)(b) – to provide the service (account, haiku generation, credits)',
              'Art. 6(1)(f) – legitimate interest (security, fraud prevention)',
              'Art. 6(1)(a) – consent (optional features, if any)',
            ],
          },
          { type: 'paragraph', text: 'We do not use your data for marketing or profiling.' },
        ],
      },
      {
        heading: 'Data retention',
        segments: [
          { type: 'paragraph', text: 'We keep your data only as long as your account exists.' },
          { type: 'paragraph', text: 'You may request deletion at any time.' },
          {
            type: 'paragraph',
            text: 'Generated haiku and images are stored until you delete them or delete your account.',
          },
        ],
      },
      {
        heading: 'Your GDPR rights',
        segments: [
          { type: 'paragraph', text: 'You have the right to:' },
          {
            type: 'bullets',
            items: [
              'Access your data',
              'Correct your data',
              'Delete your data',
              'Export your data',
              'Withdraw consent',
              'Object to processing',
              'Lodge a complaint with your local data authority',
            ],
          },
          { type: 'paragraph', text: 'Request these anytime via in-app support or email.' },
        ],
      },
      {
        heading: 'Contact',
        segments: [
          { type: 'paragraph', text: 'For privacy questions or data requests, contact:' },
          { type: 'paragraph', text: LEGAL_CONTACT_EMAIL },
        ],
      },
      {
        heading: 'No tracking, no ads',
        segments: [
          { type: 'paragraph', text: 'We do not use:' },
          {
            type: 'bullets',
            items: [
              'advertising networks',
              'tracking SDKs',
              'behavioral analytics',
              'third-party marketing tools',
            ],
          },
          { type: 'paragraph', text: 'Your data is never sold or shared with advertisers.' },
        ],
      },
    ],
  },

  de: {
    title: 'Datenschutz',
    lastUpdated: 'Stand: 6. Mai 2026',
    sections: [
      {
        segments: [
          {
            type: 'paragraph',
            text: 'Deine Privatsphäre ist uns wichtig. Diese App ist so gestaltet, dass nur das absolute Minimum an personenbezogenen Daten erhoben wird, das für die Kernfunktionen erforderlich ist. Wir verwenden keine Werbung, kein Tracking Dritter und keine Analyse-Tools.',
          },
        ],
      },
      {
        heading: 'Welche Daten wir erfassen',
        segments: [
          { type: 'paragraph', text: 'Wir erheben nur Daten, die für den Betrieb der App notwendig sind:' },
          { type: 'subheading', text: 'Kontoinformationen' },
          { type: 'paragraph', text: 'Wenn du dich mit Apple oder Google anmeldest, erhalten wir:' },
          {
            type: 'bullets',
            items: [
              'deine Apple- / Google-Nutzerkennung',
              'deinen Anzeigenamen (sofern angegeben)',
              'deine E-Mail-Adresse (sofern vom Anbieter übermittelt)',
            ],
          },
          { type: 'paragraph', text: 'Erforderlich, um dein Konto zu erstellen und zu pflegen.' },
          { type: 'subheading', text: 'Nutzungsdaten zu deinen Haikus und Bildern' },
          {
            type: 'bullets',
            items: [
              'von dir generierte Haikus',
              'von dir generierte Bilder',
              'verbrauchte Guthaben',
              'Kaufhistorie (über RevenueCat)',
            ],
          },
          {
            type: 'paragraph',
            text: 'Diese Daten werden gespeichert, um dir deinen Verlauf bereitzustellen, Guthaben zu verwalten und Missbrauch zu verhindern.',
          },
          { type: 'subheading', text: 'Technische Daten' },
          { type: 'bullets', items: ['Gerätetyp', 'App-Version', 'einfache Fehlerprotokolle'] },
          { type: 'paragraph', text: 'Erforderlich für Sicherheit und Fehlersuche.' },
          {
            type: 'paragraph',
            text: 'Wir erfassen keine Standortdaten, Werbe-IDs oder Verhaltens-Tracking.',
          },
        ],
      },
      {
        heading: 'KI-Verarbeitung',
        segments: [
          { type: 'paragraph', text: 'Die Generierung von Haikus und Bildern erfolgt mittels OpenAI.' },
          {
            type: 'paragraph',
            text: 'Deine Textvorgaben (Haiku oder Anweisungen) und Bildvorgaben werden ausschließlich zum Zweck der angeforderten Generierung an OpenAI gesendet.',
          },
          { type: 'paragraph', text: 'Wir senden nicht:' },
          {
            type: 'bullets',
            items: ['deinen Namen', 'deine E-Mail', 'deine Konto-ID', 'sonstige personenbezogene Profildaten'],
          },
          { type: 'paragraph', text: 'OpenAI agiert als Auftragsverarbeiter nach DSGVO.' },
        ],
      },
      {
        heading: 'Wo deine Daten gespeichert werden',
        segments: [
          { type: 'paragraph', text: 'Wir verwenden Firebase (Google Cloud) als Backend.' },
          {
            type: 'paragraph',
            text: 'Daten können — abhängig von Google Clouds Infrastruktur — in der EU oder in anderen Regionen gespeichert werden, stets unter DSGVO-konformen Bedingungen.',
          },
          { type: 'paragraph', text: 'Käufe werden von RevenueCat verwaltet. Dort werden gespeichert:' },
          {
            type: 'bullets',
            items: ['Kaufbelege', 'Abonnement-Status', 'Käufe von Guthabenpaketen'],
          },
          {
            type: 'paragraph',
            text: 'RevenueCat erhält keine Haikus, Bilder oder sonstige persönlichen Inhalte.',
          },
        ],
      },
      {
        heading: 'Warum wir deine Daten verarbeiten (Rechtsgrundlage)',
        segments: [
          { type: 'paragraph', text: 'Nach DSGVO verarbeiten wir deine Daten auf Basis von:' },
          {
            type: 'bullets',
            items: [
              'Art. 6 Abs. 1 lit. b – Bereitstellung des Dienstes (Konto, Haiku-Generierung, Guthaben)',
              'Art. 6 Abs. 1 lit. f – berechtigtes Interesse (Sicherheit, Missbrauchsabwehr)',
              'Art. 6 Abs. 1 lit. a – Einwilligung (optionale Funktionen, sofern vorhanden)',
            ],
          },
          { type: 'paragraph', text: 'Wir nutzen deine Daten nicht für Marketing oder Profilbildung.' },
        ],
      },
      {
        heading: 'Speicherdauer',
        segments: [
          { type: 'paragraph', text: 'Wir bewahren deine Daten nur so lange auf, wie dein Konto besteht.' },
          { type: 'paragraph', text: 'Du kannst die Löschung jederzeit verlangen.' },
          {
            type: 'paragraph',
            text: 'Generierte Haikus und Bilder bleiben gespeichert, bis du sie oder dein Konto löschst.',
          },
        ],
      },
      {
        heading: 'Deine DSGVO-Rechte',
        segments: [
          { type: 'paragraph', text: 'Du hast das Recht auf:' },
          {
            type: 'bullets',
            items: [
              'Auskunft zu deinen Daten',
              'Berichtigung deiner Daten',
              'Löschung deiner Daten',
              'Datenübertragbarkeit',
              'Widerruf der Einwilligung',
              'Widerspruch gegen die Verarbeitung',
              'Beschwerde bei deiner zuständigen Aufsichtsbehörde',
            ],
          },
          { type: 'paragraph', text: 'Stelle Anfragen jederzeit über den In-App-Support oder per E-Mail.' },
        ],
      },
      {
        heading: 'Kontakt',
        segments: [
          { type: 'paragraph', text: 'Für Datenschutzfragen oder Datenanfragen erreichst du uns unter:' },
          { type: 'paragraph', text: LEGAL_CONTACT_EMAIL },
        ],
      },
      {
        heading: 'Kein Tracking, keine Werbung',
        segments: [
          { type: 'paragraph', text: 'Wir verwenden nicht:' },
          {
            type: 'bullets',
            items: [
              'Werbenetzwerke',
              'Tracking-SDKs',
              'Verhaltensanalyse',
              'Marketing-Tools Dritter',
            ],
          },
          { type: 'paragraph', text: 'Deine Daten werden nicht verkauft oder mit Werbetreibenden geteilt.' },
        ],
      },
    ],
  },

  fr: {
    title: 'Confidentialité & protection des données',
    lastUpdated: 'Dernière mise à jour : 6 mai 2026',
    draftBanner: 'Traduction provisoire. La version anglaise fait foi.',
    sections: [
      {
        segments: [
          {
            type: 'paragraph',
            text: "Votre vie privée compte. L'application ne collecte que le minimum de données personnelles nécessaires à ses fonctions principales. Pas de publicité, pas de pistage tiers, pas d'outils d'analyse.",
          },
        ],
      },
      {
        heading: 'Données collectées',
        segments: [
          { type: 'subheading', text: 'Compte' },
          {
            type: 'bullets',
            items: [
              'identifiant Apple / Google',
              "nom d'affichage (si fourni)",
              'adresse e-mail (si fournie par le provider)',
            ],
          },
          { type: 'subheading', text: 'Usage (haïkus et images)' },
          {
            type: 'bullets',
            items: ['haïkus générés', 'images générées', 'crédits utilisés', "historique d'achats (via RevenueCat)"],
          },
          { type: 'subheading', text: 'Données techniques' },
          { type: 'bullets', items: ["type d'appareil", "version de l'app", "journaux d'erreurs basiques"] },
          {
            type: 'paragraph',
            text: "Aucune donnée de localisation, identifiant publicitaire ou pistage comportemental n'est collecté.",
          },
        ],
      },
      {
        heading: 'Traitement IA',
        segments: [
          {
            type: 'paragraph',
            text: "Les générations utilisent OpenAI. Seuls vos prompts (texte ou image) sont transmis, exclusivement pour produire la sortie demandée.",
          },
          { type: 'paragraph', text: 'Ne sont jamais envoyés à OpenAI :' },
          {
            type: 'bullets',
            items: ['votre nom', 'votre e-mail', "l'identifiant de compte", 'toute donnée de profil personnelle'],
          },
          { type: 'paragraph', text: 'OpenAI agit comme sous-traitant au sens du RGPD.' },
        ],
      },
      {
        heading: 'Où sont stockées vos données',
        segments: [
          {
            type: 'paragraph',
            text: 'Backend Firebase (Google Cloud), sous conditions conformes RGPD. Achats gérés par RevenueCat (reçus, statut, packs achetés). RevenueCat ne reçoit ni haïku, ni image, ni contenu personnel.',
          },
        ],
      },
      {
        heading: 'Base légale (RGPD Art. 6)',
        segments: [
          {
            type: 'bullets',
            items: [
              "Art. 6(1)(b) – exécution du service (compte, génération, crédits)",
              "Art. 6(1)(f) – intérêt légitime (sécurité, prévention de la fraude)",
              "Art. 6(1)(a) – consentement (fonctionnalités optionnelles, le cas échéant)",
            ],
          },
          { type: 'paragraph', text: 'Aucun marketing, aucun profilage.' },
        ],
      },
      {
        heading: 'Conservation',
        segments: [
          {
            type: 'paragraph',
            text: "Données conservées pendant la durée d'existence du compte. Suppression possible à tout moment. Haïkus et images restent jusqu'à suppression manuelle ou du compte.",
          },
        ],
      },
      {
        heading: 'Vos droits RGPD',
        segments: [
          {
            type: 'bullets',
            items: [
              'Accès',
              'Rectification',
              'Effacement',
              'Portabilité',
              'Retrait du consentement',
              'Opposition',
              "Réclamation auprès de votre autorité (en France, la CNIL — https://www.cnil.fr)",
            ],
          },
        ],
      },
      {
        heading: 'Contact',
        segments: [
          { type: 'paragraph', text: 'Questions ou demandes RGPD :' },
          { type: 'paragraph', text: LEGAL_CONTACT_EMAIL },
        ],
      },
      {
        heading: 'Pas de pistage, pas de publicité',
        segments: [
          {
            type: 'paragraph',
            text: "Aucune régie publicitaire, aucun SDK de pistage, aucune analyse comportementale, aucun outil marketing tiers. Vos données ne sont ni vendues ni partagées avec des annonceurs.",
          },
        ],
      },
    ],
  },

  es: {
    title: 'Privacidad y protección de datos',
    lastUpdated: 'Última actualización: 6 de mayo de 2026',
    draftBanner: 'Traducción provisional. La versión en inglés es la auténtica.',
    sections: [
      {
        segments: [
          {
            type: 'paragraph',
            text: 'Tu privacidad importa. La aplicación recopila únicamente el mínimo de datos personales necesarios para sus funciones esenciales. Sin publicidad, sin rastreo de terceros, sin herramientas de analítica.',
          },
        ],
      },
      {
        heading: 'Datos que recopilamos',
        segments: [
          { type: 'subheading', text: 'Cuenta' },
          {
            type: 'bullets',
            items: [
              'ID de usuario de Apple / Google',
              'nombre para mostrar (si se proporciona)',
              'correo electrónico (si lo facilita el proveedor)',
            ],
          },
          { type: 'subheading', text: 'Uso (haikus e imágenes)' },
          {
            type: 'bullets',
            items: ['haikus generados', 'imágenes generadas', 'créditos consumidos', 'historial de compras (vía RevenueCat)'],
          },
          { type: 'subheading', text: 'Datos técnicos' },
          { type: 'bullets', items: ['tipo de dispositivo', 'versión de la app', 'registros de errores básicos'] },
          {
            type: 'paragraph',
            text: 'No recopilamos ubicación, identificadores publicitarios ni rastreo conductual.',
          },
        ],
      },
      {
        heading: 'Procesamiento con IA',
        segments: [
          {
            type: 'paragraph',
            text: 'La generación usa OpenAI. Sólo enviamos tus prompts (texto o imagen) y exclusivamente para producir la salida solicitada.',
          },
          { type: 'paragraph', text: 'Nunca enviamos a OpenAI:' },
          {
            type: 'bullets',
            items: ['tu nombre', 'tu correo', 'tu ID de cuenta', 'cualquier dato de perfil personal'],
          },
          { type: 'paragraph', text: 'OpenAI actúa como encargado del tratamiento según el RGPD.' },
        ],
      },
      {
        heading: 'Dónde se almacenan tus datos',
        segments: [
          {
            type: 'paragraph',
            text: 'Backend en Firebase (Google Cloud) bajo términos conformes al RGPD. Compras gestionadas por RevenueCat (recibos, estado, paquetes). RevenueCat no recibe haikus, imágenes ni contenido personal.',
          },
        ],
      },
      {
        heading: 'Base legal (RGPD Art. 6)',
        segments: [
          {
            type: 'bullets',
            items: [
              'Art. 6(1)(b) – ejecución del servicio (cuenta, generación, créditos)',
              'Art. 6(1)(f) – interés legítimo (seguridad, prevención de fraude)',
              'Art. 6(1)(a) – consentimiento (funcionalidades opcionales, en su caso)',
            ],
          },
          { type: 'paragraph', text: 'No hay marketing ni elaboración de perfiles.' },
        ],
      },
      {
        heading: 'Conservación',
        segments: [
          {
            type: 'paragraph',
            text: 'Conservamos los datos durante la vida de la cuenta. Puedes solicitar la eliminación en cualquier momento. Los haikus e imágenes permanecen hasta que los borres o elimines la cuenta.',
          },
        ],
      },
      {
        heading: 'Tus derechos RGPD',
        segments: [
          {
            type: 'bullets',
            items: [
              'Acceso',
              'Rectificación',
              'Supresión',
              'Portabilidad',
              'Retirada del consentimiento',
              'Oposición',
              'Reclamación ante tu autoridad (en España: AEPD — https://www.aepd.es)',
            ],
          },
        ],
      },
      {
        heading: 'Contacto',
        segments: [
          { type: 'paragraph', text: 'Para consultas o solicitudes RGPD:' },
          { type: 'paragraph', text: LEGAL_CONTACT_EMAIL },
        ],
      },
      {
        heading: 'Sin rastreo, sin publicidad',
        segments: [
          {
            type: 'paragraph',
            text: 'No usamos redes publicitarias, SDK de rastreo, analítica conductual ni herramientas de marketing de terceros. Tus datos no se venden ni se comparten con anunciantes.',
          },
        ],
      },
    ],
  },
};
