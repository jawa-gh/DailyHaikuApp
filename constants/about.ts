// Structured marketing-style copy for the About section in settings. Lives
// here rather than in the translation files because it's long-form content
// with a mix of paragraphs, bullet lists, and callouts — the i18n module is
// for short UI strings.
//
// Same translation strategy as the legal docs: full EN + DE, condensed FR + ES
// with a draft-translation banner.

import type { Language } from '@/i18n';

export type AboutSegment =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'callout'; text: string };

export type AboutBlock = {
  heading?: string;
  segments: AboutSegment[];
};

export type AboutContent = {
  /** Shown at the top to mark non-authoritative translations. */
  draftBanner?: string;
  /** Larger lead paragraph rendered before the first heading. */
  lead?: string;
  blocks: AboutBlock[];
};

export const ABOUT_CONTENT: Record<Language, AboutContent> = {
  en: {
    lead: 'Discover a moment of calm, creativity, and beauty every day.',
    blocks: [
      {
        segments: [
          {
            type: 'paragraph',
            text: 'Daily Haiku delivers a fresh, original haiku each morning — a tiny poem crafted to bring clarity, emotion, and stillness into your daily routine. Whether you enjoy poetry, mindfulness, journaling, or simply want a peaceful ritual, this app offers a quiet space in a busy world.',
          },
        ],
      },
      {
        heading: 'What is a Haiku?',
        segments: [
          {
            type: 'paragraph',
            text: 'A haiku is a traditional Japanese poem made of three lines, often following a 5–7–5 syllable pattern. Haiku capture a single moment — a feeling, a season, a detail of nature — in the simplest possible form.',
          },
          { type: 'bullets', items: ['Short', 'Evocative', 'Mindful', 'Deeply visual'] },
          { type: 'callout', text: 'A haiku is not just a poem. It’s a breath.' },
        ],
      },
      {
        heading: 'AI-Generated Poetry',
        segments: [
          {
            type: 'paragraph',
            text: 'The app uses advanced AI language models to create original haiku inspired by:',
          },
          {
            type: 'bullets',
            items: ['nature', 'emotion', 'seasons', 'mood', 'your own prompts'],
          },
          {
            type: 'paragraph',
            text: 'You receive a new haiku every day, and you can generate more whenever inspiration strikes. You can also write your own haiku, and the AI can refine it, rewrite it, or help you explore different styles.',
          },
        ],
      },
      {
        heading: 'Turn Haiku Into Art',
        segments: [
          {
            type: 'paragraph',
            text: 'Your words can become images. Using modern AI image generation, the app transforms your haiku into visual artwork that reflects the poem’s mood and atmosphere. Create:',
          },
          {
            type: 'bullets',
            items: [
              'serene landscapes',
              'abstract interpretations',
              'minimalist scenes',
              'dreamy, poetic visuals',
            ],
          },
          {
            type: 'paragraph',
            text: 'Perfect for sharing, journaling, or using as wallpapers.',
          },
        ],
      },
      {
        heading: 'Features',
        segments: [
          {
            type: 'bullets',
            items: [
              'Daily AI-crafted haiku delivered every morning',
              'Write your own haiku and refine them with AI',
              'Generate additional haiku using credits',
              'Create AI images inspired by your poems',
              'Save your favorites in a personal collection',
              'Share poems and images with friends',
              'Minimal, calming design focused on mindfulness',
            ],
          },
        ],
      },
      {
        heading: 'Credits',
        segments: [
          {
            type: 'paragraph',
            text: 'A simple, flexible credit system powers creativity:',
          },
          { type: 'bullets', items: ['1 haiku = 1 credit', '1 image = 2 credits'] },
          {
            type: 'paragraph',
            text: 'Credit packs are available so you can generate as much or as little as you like.',
          },
        ],
      },
      {
        heading: 'A Daily Ritual of Calm',
        segments: [
          {
            type: 'paragraph',
            text: 'This app is designed as a small sanctuary — a place to pause, breathe, and reconnect with yourself. A haiku is a moment. A moment is enough.',
          },
        ],
      },
    ],
  },

  de: {
    lead: 'Entdecke jeden Tag einen Moment der Ruhe, Kreativität und Schönheit.',
    blocks: [
      {
        segments: [
          {
            type: 'paragraph',
            text: 'Daily Haiku liefert dir jeden Morgen ein frisches, originales Haiku — ein kleines Gedicht, das Klarheit, Gefühl und Stille in deinen Alltag bringt. Ob du Poesie, Achtsamkeit, Journaling magst oder einfach ein ruhiges Ritual suchst — diese App schafft einen stillen Raum in einer hektischen Welt.',
          },
        ],
      },
      {
        heading: 'Was ist ein Haiku?',
        segments: [
          {
            type: 'paragraph',
            text: 'Ein Haiku ist ein traditionelles japanisches Gedicht aus drei Zeilen, oft im Silbenmuster 5–7–5. Haikus fangen einen einzelnen Moment ein — ein Gefühl, eine Jahreszeit, ein Detail aus der Natur — in der einfachsten möglichen Form.',
          },
          { type: 'bullets', items: ['Kurz', 'Evokativ', 'Achtsam', 'Tief visuell'] },
          { type: 'callout', text: 'Ein Haiku ist nicht nur ein Gedicht. Es ist ein Atemzug.' },
        ],
      },
      {
        heading: 'KI-generierte Poesie',
        segments: [
          {
            type: 'paragraph',
            text: 'Die App nutzt moderne KI-Sprachmodelle, um originale Haikus zu erschaffen, inspiriert von:',
          },
          {
            type: 'bullets',
            items: ['Natur', 'Gefühl', 'Jahreszeiten', 'Stimmung', 'deinen eigenen Themen'],
          },
          {
            type: 'paragraph',
            text: 'Du bekommst jeden Tag ein neues Haiku und kannst weitere generieren, wann immer dich die Inspiration trifft. Du kannst auch eigene Haikus schreiben und sie von der KI verfeinern, umformen oder in verschiedenen Stilen erkunden lassen.',
          },
        ],
      },
      {
        heading: 'Vom Haiku zum Kunstwerk',
        segments: [
          {
            type: 'paragraph',
            text: 'Deine Worte können zu Bildern werden. Mit moderner KI-Bildgenerierung verwandelt die App dein Haiku in Bildwerke, die Stimmung und Atmosphäre des Gedichts widerspiegeln. Erstelle:',
          },
          {
            type: 'bullets',
            items: [
              'ruhige Landschaften',
              'abstrakte Interpretationen',
              'minimalistische Szenen',
              'verträumte, poetische Bilder',
            ],
          },
          {
            type: 'paragraph',
            text: 'Ideal zum Teilen, fürs Journaling oder als Hintergrundbild.',
          },
        ],
      },
      {
        heading: 'Funktionen',
        segments: [
          {
            type: 'bullets',
            items: [
              'Tägliches KI-Haiku, jeden Morgen geliefert',
              'Eigene Haikus schreiben und mit KI verfeinern',
              'Weitere Haikus mit Guthaben generieren',
              'KI-Bilder zu deinen Gedichten erstellen',
              'Favoriten in einer persönlichen Sammlung speichern',
              'Gedichte und Bilder mit Freund:innen teilen',
              'Minimalistisches, ruhiges Design für Achtsamkeit',
            ],
          },
        ],
      },
      {
        heading: 'Guthaben',
        segments: [
          {
            type: 'paragraph',
            text: 'Ein einfaches, flexibles Guthabensystem treibt die Kreativität:',
          },
          { type: 'bullets', items: ['1 Haiku = 1 Guthaben', '1 Bild = 2 Guthaben'] },
          {
            type: 'paragraph',
            text: 'Guthabenpakete sind verfügbar, damit du so viel oder so wenig generieren kannst, wie du möchtest.',
          },
        ],
      },
      {
        heading: 'Ein tägliches Ritual der Ruhe',
        segments: [
          {
            type: 'paragraph',
            text: 'Diese App ist als kleines Refugium gedacht — ein Ort zum Innehalten, Atmen und Sich-selbst-Wiederbegegnen. Ein Haiku ist ein Moment. Ein Moment genügt.',
          },
        ],
      },
    ],
  },

  fr: {
    draftBanner: 'Traduction provisoire. La version anglaise fait foi.',
    lead: 'Découvrez chaque jour un moment de calme, de créativité et de beauté.',
    blocks: [
      {
        segments: [
          {
            type: 'paragraph',
            text: "Daily Haiku vous offre chaque matin un haïku original — un petit poème pensé pour apporter clarté, émotion et apaisement dans votre quotidien. Pour les amateurs de poésie, de pleine conscience, de journaling, ou simplement pour un rituel calme.",
          },
        ],
      },
      {
        heading: "Qu'est-ce qu'un haïku ?",
        segments: [
          {
            type: 'paragraph',
            text: "Un haïku est un poème japonais traditionnel en trois lignes, souvent au rythme 5–7–5. Il capture un instant — un sentiment, une saison, un détail de la nature — sous la forme la plus simple.",
          },
          { type: 'bullets', items: ['Court', 'Évocateur', 'Attentif', 'Profondément visuel'] },
          { type: 'callout', text: "Un haïku n'est pas seulement un poème. C'est un souffle." },
        ],
      },
      {
        heading: 'Poésie générée par IA',
        segments: [
          {
            type: 'paragraph',
            text: "L'application utilise des modèles d'IA pour créer des haïkus originaux inspirés par :",
          },
          {
            type: 'bullets',
            items: ['la nature', "l'émotion", 'les saisons', "l'ambiance", 'vos propres thèmes'],
          },
          {
            type: 'paragraph',
            text: "Un nouveau haïku chaque jour, et la possibilité d'en générer davantage à la demande. Vous pouvez aussi écrire le vôtre — l'IA peut l'affiner, le réécrire ou explorer d'autres styles.",
          },
        ],
      },
      {
        heading: 'Du haïku à l’image',
        segments: [
          {
            type: 'paragraph',
            text: "Vos mots peuvent devenir images. La génération d'images IA transforme votre haïku en illustrations qui reflètent son atmosphère :",
          },
          {
            type: 'bullets',
            items: [
              'paysages sereins',
              'interprétations abstraites',
              'scènes minimalistes',
              'visuels poétiques et oniriques',
            ],
          },
          {
            type: 'paragraph',
            text: 'Parfait pour partager, illustrer un journal ou décorer un écran.',
          },
        ],
      },
      {
        heading: 'Crédits',
        segments: [
          {
            type: 'bullets',
            items: ['1 haïku = 1 crédit', '1 image = 2 crédits'],
          },
          {
            type: 'paragraph',
            text: "Des packs de crédits permettent d'en générer autant que souhaité.",
          },
        ],
      },
      {
        heading: 'Un rituel quotidien de calme',
        segments: [
          {
            type: 'paragraph',
            text: 'Un petit sanctuaire — un endroit pour faire une pause, respirer, revenir à soi. Un haïku, c’est un instant. Un instant suffit.',
          },
        ],
      },
    ],
  },

  es: {
    draftBanner: 'Traducción provisional. La versión en inglés es la auténtica.',
    lead: 'Descubre cada día un momento de calma, creatividad y belleza.',
    blocks: [
      {
        segments: [
          {
            type: 'paragraph',
            text: 'Daily Haiku te entrega cada mañana un haiku original — un pequeño poema pensado para aportar claridad, emoción y quietud a tu rutina. Para quienes disfrutan de la poesía, el mindfulness, el journaling, o simplemente quieren un ritual tranquilo.',
          },
        ],
      },
      {
        heading: '¿Qué es un haiku?',
        segments: [
          {
            type: 'paragraph',
            text: 'Un haiku es un poema japonés tradicional de tres líneas, a menudo con un patrón 5–7–5. Captura un solo momento — un sentimiento, una estación, un detalle de la naturaleza — en la forma más simple posible.',
          },
          { type: 'bullets', items: ['Breve', 'Evocador', 'Atento', 'Profundamente visual'] },
          { type: 'callout', text: 'Un haiku no es solo un poema. Es un respiro.' },
        ],
      },
      {
        heading: 'Poesía generada por IA',
        segments: [
          {
            type: 'paragraph',
            text: 'La app usa modelos de IA para crear haikus originales inspirados en:',
          },
          {
            type: 'bullets',
            items: ['la naturaleza', 'la emoción', 'las estaciones', 'el ánimo', 'tus propios temas'],
          },
          {
            type: 'paragraph',
            text: 'Un haiku nuevo cada día, y la posibilidad de generar más cuando llegue la inspiración. También puedes escribir el tuyo — la IA puede afinarlo, reescribirlo o explorar otros estilos.',
          },
        ],
      },
      {
        heading: 'Del haiku a la imagen',
        segments: [
          {
            type: 'paragraph',
            text: 'Tus palabras pueden hacerse imagen. La generación de imágenes con IA transforma tu haiku en ilustraciones que reflejan su atmósfera:',
          },
          {
            type: 'bullets',
            items: [
              'paisajes serenos',
              'interpretaciones abstractas',
              'escenas minimalistas',
              'visuales poéticos y oníricos',
            ],
          },
          {
            type: 'paragraph',
            text: 'Perfecto para compartir, ilustrar un diario o usar como fondo de pantalla.',
          },
        ],
      },
      {
        heading: 'Créditos',
        segments: [
          {
            type: 'bullets',
            items: ['1 haiku = 1 crédito', '1 imagen = 2 créditos'],
          },
          {
            type: 'paragraph',
            text: 'Hay paquetes de créditos para que generes tanto como quieras.',
          },
        ],
      },
      {
        heading: 'Un ritual diario de calma',
        segments: [
          {
            type: 'paragraph',
            text: 'Un pequeño santuario — un lugar para hacer una pausa, respirar y reencontrarse con uno mismo. Un haiku es un momento. Un momento basta.',
          },
        ],
      },
    ],
  },
};
