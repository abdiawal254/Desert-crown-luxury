// Desert Crown Luxury - product catalog
// Exposed globally as window.PRODUCTS so it works with local file hosting.
(function () {
  const PRODUCTS = [
    {
      id: "astrum-chronograph-watch",
      name: "Astrum Chronograph",
      category: "watches",
      price: 2490,
      rating: 4.8,
      accent: "#FFD98B",
      symbol: "AC",
      tag: "Atelier Edition",
      image:
        "https://images.unsplash.com/photo-1760532466974-f969f56dfcc8?fm=jpg&q=60&w=1200&auto=format&fit=crop",
      description:
        "A bold Dubai-night chronograph with a radiant gold aura and precise finishing for everyday luxury.",
      details: {
        Movement: "Quartz Precision",
        Dial: "Sunburst Gold Gradient",
        Material: "Stainless Steel + PVD",
        WaterResistance: "50m"
      },
      keyPoints: [
        "Signature luminous indices for a confident, elegant look.",
        "Comfort-fit bracelet designed for long evenings and quick journeys."
      ]
    },
    {
      id: "desert-arc-watch",
      name: "Desert Arc Watch",
      category: "watches",
      price: 1790,
      rating: 4.6,
      accent: "#E2B45A",
      symbol: "DA",
      tag: "Sahara Gold",
      image:
        "https://images.unsplash.com/photo-1735352245286-9bc4157d22a4?fm=jpg&q=60&w=1200&auto=format&fit=crop",
      description:
        "Inspired by the curves of dunes at sunset, this piece pairs dark depth with a refined golden arc.",
      details: {
        Movement: "Japanese Quartz",
        Dial: "Deep Ink + Gold Arc",
        Material: "Steel Case, Soft-Touch Strap",
        WaterResistance: "40m"
      },
      keyPoints: [
        "Slim profile with premium finishing for modern styling.",
        "Smooth crown feel with a balanced, everyday presence."
      ]
    },
    {
      id: "crown-noir-watch",
      name: "Crown Noir",
      category: "watches",
      price: 3190,
      rating: 4.9,
      accent: "#B8862B",
      symbol: "CN",
      tag: "Royal Noir",
      image:
        "https://images.unsplash.com/photo-1697866226888-bc6980506420?fm=jpg&q=60&w=1200&auto=format&fit=crop",
      description:
        "A dark, cinematic dial framed in gold highlights—made for arrivals, anniversaries, and after-hours.",
      details: {
        Movement: "Swiss-Style Precision",
        Dial: "Noir Black with Gold Breach",
        Material: "PVD Coated Steel",
        WaterResistance: "60m"
      },
      keyPoints: [
        "High-contrast legibility with elegant gold detailing.",
        "Premium bracelet texture for a luxury, secure wear."
      ]
    },
    {
      id: "oasis-lune-watch",
      name: "Oasis Lune",
      category: "watches",
      price: 1390,
      rating: 4.5,
      accent: "#FFD98B",
      symbol: "OL",
      tag: "Lune Glow",
      image:
        "https://images.unsplash.com/photo-1697866226888-bc6980506420?fm=jpg&q=60&w=1200&auto=format&fit=crop",
      description:
        "A warm gold shimmer over a serene dial—balanced for formal events and calm weekends.",
      details: {
        Movement: "Quartz Precision",
        Dial: "Opal Teal with Gold Lune",
        Material: "Steel + Micro-Polish",
        WaterResistance: "45m"
      },
      keyPoints: [
        "Light-reflecting dial tones that feel alive in the sun.",
        "Designed with an effortless, refined silhouette."
      ]
    },
    {
      id: "khanzu-ember-gold",
      name: "Khanzu Ember Gold",
      category: "khanzu",
      price: 420,
      rating: 4.7,
      accent: "#E2B45A",
      symbol: "KE",
      tag: "Golden Stitch",
      image:
        "https://images.unsplash.com/photo-1756412066323-a336d2becc10?fm=jpg&q=60&w=1200&auto=format&fit=crop",
      description:
        "A Dubai-inspired khanzu with rich tonal depth and a subtle gold stitch accent that elevates every step.",
      details: {
        Fabric: "Premium Blend Weave",
        Finish: "Embroidered Gold Edge",
        Fit: "Tailored Comfort",
        Style: "Modern Traditional"
      },
      keyPoints: [
        "Comfort-first drape with an elevated, polished finish.",
        "Stitching highlights designed for a luxe silhouette."
      ]
    },
    {
      id: "khanzu-desert-veil",
      name: "Khanzu Desert Veil",
      category: "khanzu",
      price: 360,
      rating: 4.6,
      accent: "#FFD98B",
      symbol: "DV",
      tag: "Dune Luxe",
      image:
        "https://images.unsplash.com/photo-1624184026612-1691d1239122?fm=jpg&q=60&w=1200&auto=format&fit=crop",
      description:
        "A refined khanzu in warm sand tones with a soft luminous finish—crafted for evening gatherings.",
      details: {
        Fabric: "Breathable Luxury Weave",
        Finish: "Lustre Sand Tone",
        Fit: "Relaxed Elegant",
        Style: "Dubai Evening"
      },
      keyPoints: [
        "Light movement with premium structure for a confident look.",
        "Pairs effortlessly with your finest accessories."
      ]
    },
    {
      id: "khanzu-midnight-sultan",
      name: "Khanzu Midnight Sultan",
      category: "khanzu",
      price: 510,
      rating: 4.9,
      accent: "#B8862B",
      symbol: "MS",
      tag: "Night Crown",
      image:
        "https://images.unsplash.com/photo-1756412066323-a336d2becc10?fm=jpg&q=60&w=1200&auto=format&fit=crop",
      description:
        "Dark midnight khanzu with subtle gold highlights—an elegant statement for cultural ceremonies.",
      details: {
        Fabric: "Silk-like Premium Blend",
        Finish: "Gold Micro-Accent Lines",
        Fit: "Structured Comfort",
        Style: "Ceremony Ready"
      },
      keyPoints: [
        "A high-end drape that catches light with restraint.",
        "Designed to feel luxurious from first wear to final dance."
      ]
    },
    {
      id: "khanzu-pearl-sands",
      name: "Khanzu Pearl Sands",
      category: "khanzu",
      price: 390,
      rating: 4.6,
      accent: "#E2B45A",
      symbol: "PS",
      tag: "Pearl Edge",
      image:
        "https://images.unsplash.com/photo-1624184026612-1691d1239122?fm=jpg&q=60&w=1200&auto=format&fit=crop",
      description:
        "A luminous khanzu that combines pearl tones and desert warmth for a modern, elegant presence.",
      details: {
        Fabric: "Soft Luxe Weave",
        Finish: "Pearl Gradient Border",
        Fit: "Comfort Tailored",
        Style: "Everyday Royal"
      },
      keyPoints: [
        "Balanced tone with a premium, subtle glow.",
        "A refined choice for daily wear and curated moments."
      ]
    }
  ];

  // Attach to window for non-module usage.
  window.PRODUCTS = PRODUCTS;
})();

