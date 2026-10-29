/*
  One entry per project. The page (project.html?p=<slug>) fills itself from this.

  Every field except title, group, hue and credits is optional; a section only
  appears once it has content.

    ready     true once the page has its real content. Until then the page shows
              the full layout as a roadmap, with marked placeholders.
    hero      path to the main image, e.g. "img/sierra-hotel/hero.jpg"
    dark      optional: true turns the whole page dark while this project's picture is up on the home and on its
              page (trial, 2026-10-29); drawings keep their own white
    heroPositionPhone  optional: where a phone-shaped crop of the hero looks on the home page, e.g. "78% center"
    home      optional: the picture the home page shows for this project, e.g. ["img/sierra-hotel/elevation.svg"]; the
              home shows one picture per project, so only the first one listed counts; without it the home uses the first
    lede      one or two sentences under the title
    text      a short second paragraph
    grid      optional: [{src, size, drawing, fill, caption}, ...] shows every picture in one hand-arranged grid after
              the text instead of the galleries. size: small (default) / xl / tower / half / wide / full / big / tall;
              drawing: shown whole instead of cropped; fill: a drawing that may be cropped to fill its tile.
              An entry that is itself a list ([{src, a}, ...]) is one row across the width, every picture whole
    gallery   { drawings: [...], physical: [...] (the physical models), photos: [...] }
              each item: { src: "img/...", caption: "Ground floor plan" }
              photos & renders are laid out freely, without frames and at each picture's own proportions,
              in a long section you scroll through; drawings are shown all at once, and click to enlarge
              physical models can also carry a paragraph shown under the model:
              { src: "img/...", caption: "Massing model", text: "Basswood, 1:200" }
    physicalNote  one line shown under every physical model photo (same for all of
              them); an individual item's own "text" above overrides it for that photo

  Drop image files into public/img/<slug>/ and reference them here.
*/
window.PROJECTS = {
  "sierra-hotel": {
    title: "Sierra Hotel", group: "Built", hue: 18,
    kicker: "Cusco, 2023",
    ready: true,
    text: [
      "This project transformed an existing structural shell into a hotel, requiring a complete redesign of the interior layout and façade. As my first non-residential project, it gave me the opportunity to explore how architecture could shape a guest’s experience while working within the constraints of an existing structure.",
      "Materiality became a central focus of the design, connecting the hotel to Cusco’s architectural character. The façade is organized into three elements: base, body, and crown. The base draws on the city’s rustic textures, while the body reinterprets the same warm palette through a contemporary, restrained composition. At the rooftop, natural materials and floor-to-ceiling glazing frame the surrounding mountains, making the landscape part of the guest experience."
    ],
    credits: [["Type", "Hospitality"], ["Location", "Cusco, Peru"], ["Year", "2023"], ["Studio", "Urba"], ["Design", "Gonzalo Cáceres Valcárcel"]],
    diagram: {src: "img/sierra-hotel/exploded-diagram.jpg", caption: "Exploded axonometric"},
    hero: "img/sierra-hotel/hero.jpg",
    home: ["img/sierra-hotel/elevation.svg", "img/sierra-hotel/floor-plans.svg"],
    heroPosition: "center",
    heroPositionPhone: "78% center",   // where a phone-shaped crop of the hero looks (the building is on the right)
    // all the pictures in one grid after the text, (see project.js: grid)
    grid: [
      {src: "img/sierra-hotel/photo-4-crop.jpg", size: "full"},
      {src: "img/sierra-hotel/render-facade.jpg", size: "xl"},
      {src: "img/sierra-hotel/exploded-diagram.jpg", size: "tower", drawing: true, fill: true, caption: "Exploded axonometric"},
      {src: "img/sierra-hotel/elevation.svg", size: "half", drawing: true, caption: "Front elevation"},
      {src: "img/sierra-hotel/floor-plans.svg", size: "wide", drawing: true, caption: "Floor plans"},
      {src: "img/sierra-hotel/photo-1.jpg", size: "half"},
      {src: "img/sierra-hotel/photo-3.jpg", size: "half"}
    ],
    gallery: {
      photosLayout: "grid",
      drawings: [
        {src: "img/sierra-hotel/facade.webp", caption: "Facade"},
        {src: "img/sierra-hotel/floor-plans-3.webp", caption: "Floor plans"}
      ],
      photos: [
        {src: "img/sierra-hotel/photo-1.jpg", caption: ""},
        {src: "img/sierra-hotel/photo-3.jpg", caption: ""},
        {src: "img/sierra-hotel/photo-4.jpg", caption: ""},
        {src: "img/sierra-hotel/render-facade.jpg", caption: ""}
      ]
    }
  },
  "edificio-murano": {
    title: "Edificio Murano", group: "Built", hue: 210,
    kicker: "Cusco, 2021",
    credits: [["Type", "Residential"], ["Location", "Cusco, Peru"], ["Year", "2021"], ["Studio", "Urba"], ["Design", "Gonzalo Cáceres Valcárcel"]],
    diagram: {}
  },
  "urba-branding": {
    title: "Urba Inmobiliaria", group: "Built", hue: 96,
    kicker: "Lima, 2020",
    credits: [["Type", "Graphic / Branding"], ["Location", "Lima, Peru"], ["Year", "2020"], ["Studio", "Cirkel"], ["Design", "Gonzalo Cáceres Valcárcel"]],
    diagram: {}
  },

  "the-outermost-dock": {
    title: "Outer Dock", group: "Unbuilt", hue: 200,
    kicker: "New York, 2026",
    credits: [["School", "Columbia GSAPP"], ["Year", "2026"], ["Design", "Gonzalo Cáceres Valcárcel"]],
    diagram: {}
  },
  "social-sanctuary": {
    title: "East 5th", group: "Unbuilt", hue: 42,
    kicker: "New York, 2025",
    credits: [["School", "Columbia GSAPP"], ["Year", "2025"], ["Design", "Gonzalo Cáceres Valcárcel"]],
    diagram: {src: "img/social-sanctuary/hand-drawing.jpg"}
  },
  "permanent-impermanence": {
    title: "Joint", group: "Unbuilt", hue: 330, dark: true,
    kicker: "New York, 2025",
    hero: "img/permanent-impermanence/hero.jpg",
    credits: [["School", "Columbia GSAPP"], ["Year", "2025"], ["Design", "Gonzalo Cáceres Valcárcel"]],
    diagram: {}
  },
  "intra-urban-forestation": {
    title: "Aftergrowth", group: "Unbuilt", hue: 150,
    kicker: "New York, 2024",
    credits: [["School", "Columbia GSAPP"], ["Year", "2024"], ["Design", "Gonzalo Cáceres Valcárcel"]],
    diagram: {}
  },

  "anticlastic-roof-structure": {
    title: "Anticlastic Surfaces", group: "Research", hue: 8,
    kicker: "New York, 2026",
    lede: "How can a double-curved surface emerge from a system of flat, developable elements?",
    text: [
      "This study explores the translation of double-curved geometry into a constructible system of flat plywood panels. Rather than beginning with a continuous shell and subdividing it, the surface is developed through the geometry of individual planar elements, testing how their orientation, edges, and connections can collectively generate an anticlastic form.",
      "Physical models became a way to investigate the relationship between geometry, material, and structural behavior. As the panels accumulate, their changes in direction produce depth across the surface, allowing the shell to gain stiffness while maintaining the economy and fabrication logic of flat sheet material. The resulting geometry is therefore not only a formal approximation of a curved surface, but an exploration of how curvature itself can become a structural mechanism.",
      "The study also raises a question beyond the plywood shell: if structural depth is generated by the geometry of the surface, could the layers normally added to that depth participate in the structural system itself? Rather than treating insulation as a separate layer applied to a finished structure, future iterations could explore whether it might work together with the plywood skin to reinforce the shell, potentially reducing material while increasing its thickness and performance."
    ],
    credits: [["Type", "Structural Form-Finding, Material Research"], ["Practice", "Robert Marino Architects"], ["Year", "2026"], ["Design", "Gonzalo Cáceres Valcárcel"]],
    diagram: {src: "img/anticlastic-roof-structure/hand-drawing.jpg", caption: "Spherical vs. hyperbolic curvature study"},
    hero: "img/anticlastic-roof-structure/hero.jpg",
    home: ["img/anticlastic-roof-structure/section.png", "img/anticlastic-roof-structure/hero.jpg"],
    heroPosition: "center",
    physicalNote: "Physical Form-Finding · Plywood · 1:12 Scale",
    // all the pictures in one grid after the text (see project.js: grid)
    grid: [
      {src: "img/anticlastic-roof-structure/physical/web/IMG_9768.jpg", size: "full"},
      [{src: "img/anticlastic-roof-structure/physical/web/IMG_9868.jpg", a: 1.5},
       {src: "img/anticlastic-roof-structure/hand-drawing.jpg", a: 0.768, drawing: true, caption: "Spherical vs. hyperbolic curvature study"}],
      // each drawing beside the photo of the same view: the section with the arch seen end-on
      {src: "img/anticlastic-roof-structure/section.png", drawing: true, caption: "Section"},
      {src: "img/anticlastic-roof-structure/physical/web/IMG_9865-Edit.jpg", size: "big"},
      {src: "img/anticlastic-roof-structure/physical/web/IMG_9909-Edit.jpg"},
      // the plan with the model seen from above
      [{src: "img/anticlastic-roof-structure/physical/web/IMG_9801.jpg", a: 1.5}, {src: "img/anticlastic-roof-structure/plan.png", a: 1.5, drawing: true, caption: "Floor plan"}],
      // the elevation with the model's side profile
      {src: "img/anticlastic-roof-structure/elevation.png", drawing: true, caption: "Front elevation"},
      {src: "img/anticlastic-roof-structure/physical/web/IMG_9760.jpg", size: "big"},
      {src: "img/anticlastic-roof-structure/physical/web/IMG_9872.jpg"},
      {src: "img/anticlastic-roof-structure/physical/web/IMG_9921.jpg", size: "full"}
    ],
    gallery: {
      drawings: [
        {src: "img/anticlastic-roof-structure/elevation.png", caption: "Front elevation"},
        {src: "img/anticlastic-roof-structure/plan.png", caption: "Floor plan"},
        {src: "img/anticlastic-roof-structure/section.png", caption: "Section"}
      ],
      physical: [
        {src: "img/anticlastic-roof-structure/physical/IMG_9760.jpg", caption: "Physical model"},
        {src: "img/anticlastic-roof-structure/physical/IMG_9768.jpg", caption: "Physical model"},
        {src: "img/anticlastic-roof-structure/physical/IMG_9801.jpg", caption: "Physical model"},
        {src: "img/anticlastic-roof-structure/physical/IMG_9865-Edit.jpg", caption: "Physical model"},
        {src: "img/anticlastic-roof-structure/physical/IMG_9868.jpg", caption: "Physical model"},
        {src: "img/anticlastic-roof-structure/physical/IMG_9872.jpg", caption: "Physical model"},
        {src: "img/anticlastic-roof-structure/physical/IMG_9909-Edit.jpg", caption: "Physical model"},
        {src: "img/anticlastic-roof-structure/physical/IMG_9921.jpg", caption: "Physical model"}
      ]
    }
  },
  "vaulted-shell-structure": {
    title: "Lean Shells", group: "Research", hue: 260,
    kicker: "New York, 2026",
    lede: "A physical study of vaulted plywood shell structures, investigating efficient, structurally sound and expressive roof systems that can accommodate insulation.",
    credits: [["Type", "Structural Form-Finding"], ["Practice", "Robert Marino Architects"], ["Year", "2026"], ["Design", "Gonzalo Cáceres Valcárcel"]],
    // reserves the full-bleed diagram slot (see anticlastic-roof-structure)
    // before the real drawing exists; shows a roadmap placeholder until then
    diagram: {}
  },
  "modular-living-architecture": {
    title: "Open Assembly", group: "Research", hue: 120,
    kicker: "New York, 2025",
    lede: "A modular system for sphere-like structures, built from the fewest possible parts that assemble with one another, like an organic system.",
    credits: [["Type", "Modular Systems"], ["Year", "2025"], ["Design", "Gonzalo Cáceres Valcárcel"]],
    diagram: {}
  }
};
