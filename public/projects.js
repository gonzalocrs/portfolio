/*
  One entry per project. The page (project.html?p=<slug>) fills itself from this.

  Every field except title, group, hue and credits is optional; a section only
  appears once it has content.

    ready     true once the page has its real content. Until then the page shows
              the full layout as a roadmap, with marked placeholders.
    hero      path to the main image, e.g. "img/sierra-hotel/hero.jpg"
    lede      one or two sentences under the title
    text      a short second paragraph
    gallery   { drawings: [...], physical: [...], photos: [...] }
              each item: { src: "img/...", caption: "Ground floor plan" }

  Drop image files into public/img/<slug>/ and reference them here.
*/
window.PROJECTS = {
  "sierra-hotel": {
    title: "Sierra Hotel", group: "Built", hue: 18,
    kicker: "Cusco · 2023",
    credits: [["Type", "Hospitality"], ["Location", "Cusco, Peru"], ["Year", "2023"], ["Studio", "Urba"], ["Design", "Gonzalo Cáceres Valcárcel"]]
  },
  "edificio-murano": {
    title: "Edificio Murano", group: "Built", hue: 210,
    kicker: "Cusco · 2021",
    credits: [["Type", "Residential"], ["Location", "Cusco, Peru"], ["Year", "2021"], ["Studio", "Urba"], ["Design", "Gonzalo Cáceres Valcárcel"]]
  },
  "urba-branding": {
    title: "Urba Branding", group: "Built", hue: 96,
    kicker: "Lima · 2020",
    credits: [["Type", "Graphic / Branding"], ["Location", "Lima, Peru"], ["Year", "2020"], ["Studio", "Cirkel"], ["Design", "Gonzalo Cáceres Valcárcel"]]
  },

  "the-outermost-dock": {
    title: "The Outermost Dock", group: "Unbuilt", hue: 200,
    kicker: "Columbia GSAPP · 2026",
    credits: [["School", "Columbia GSAPP"], ["Year", "2026"], ["Design", "Gonzalo Cáceres Valcárcel"]]
  },
  "social-sanctuary": {
    title: "Social Sanctuary", group: "Unbuilt", hue: 42,
    kicker: "Columbia GSAPP · 2025",
    credits: [["School", "Columbia GSAPP"], ["Year", "2025"], ["Design", "Gonzalo Cáceres Valcárcel"]]
  },
  "permanent-impermanence": {
    title: "Permanent Impermanence", group: "Unbuilt", hue: 330,
    kicker: "Columbia GSAPP · 2025",
    credits: [["School", "Columbia GSAPP"], ["Year", "2025"], ["Design", "Gonzalo Cáceres Valcárcel"]]
  },
  "intra-urban-forestation": {
    title: "Intra-Urban Forestation", group: "Unbuilt", hue: 150,
    kicker: "Columbia GSAPP · 2024",
    credits: [["School", "Columbia GSAPP"], ["Year", "2024"], ["Design", "Gonzalo Cáceres Valcárcel"]]
  },

  "anticlastic-roof-structure": {
    title: "Anticlastic Roof Structure", group: "Research", hue: 8,
    kicker: "Robert Marino · 2026",
    lede: "A physical study of anticlastic plywood shell structures, investigating efficient, structurally sound, and expressive roof systems that can accommodate insulation.",
    text: "How can the geometry of double-curved surfaces be translated into a system of flat, developable plywood elements thick enough to accommodate insulation?",
    credits: [["Type", "Structural Form-Finding"], ["Practice", "Robert Marino Architects"], ["Year", "2026"], ["Design", "Gonzalo Cáceres Valcárcel"]]
  },
  "vaulted-shell-structure": {
    title: "Vaulted Shell Structure", group: "Research", hue: 260,
    kicker: "Robert Marino · 2026",
    lede: "A physical study of vaulted plywood shell structures, investigating efficient, structurally sound and expressive roof systems that can accommodate insulation.",
    credits: [["Type", "Structural Form-Finding"], ["Practice", "Robert Marino Architects"], ["Year", "2026"], ["Design", "Gonzalo Cáceres Valcárcel"]]
  },
  "modular-living-architecture": {
    title: "Modular Living Architecture", group: "Research", hue: 120,
    kicker: "2025",
    lede: "A modular system for sphere-like structures, built from the fewest possible parts that assemble with one another, like an organic system.",
    credits: [["Type", "Modular Systems"], ["Year", "2025"], ["Design", "Gonzalo Cáceres Valcárcel"]]
  }
};
