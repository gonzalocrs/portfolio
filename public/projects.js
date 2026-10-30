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
    inOrder   optional: true keeps the grid's own order after the hero (otherwise drawings, then models, then photos)
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
    credits: [["Studio", "Urba Inmobiliaria"], ["Program", "Hospitality in Peru"], ["Design", "Gonzalo Cáceres Valcárcel"], ["Year", "2023"]],
    diagram: {src: "img/sierra-hotel/exploded-diagram.jpg", caption: "Exploded axonometric"},
    hero: "img/sierra-hotel/hero.jpg",
    home: ["img/sierra-hotel/elevation.svg", "img/sierra-hotel/floor-plans.svg"],
    heroPosition: "center",
    heroPositionPhone: "78% center",   // where a phone-shaped crop of the hero looks (the building is on the right)
    // all the pictures in one grid after the text, (see project.js: grid)
    grid: [
      {src: "img/sierra-hotel/render-facade.jpg", size: "xl"},
      {src: "img/sierra-hotel/exploded-diagram.jpg", size: "tower", drawing: true, fill: true, caption: "Exploded axonometric"},
      {src: "img/sierra-hotel/elevation.svg", size: "half", drawing: true, caption: "Front elevation"},
      {src: "img/sierra-hotel/floor-plans.svg", size: "wide", drawing: true, caption: "Floor plans"},
      {src: "img/sierra-hotel/photo-1.jpg", size: "half"},
      {src: "img/sierra-hotel/photo-3.jpg", size: "half"},
      // his note, 2026-10-29: this one last
      {src: "img/sierra-hotel/photo-4-crop.jpg", size: "full"}
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
    credits: [["Studio", "Urba Inmobiliaria"], ["Program", "Housing in Peru"], ["Design", "Gonzalo Cáceres Valcárcel"], ["Year", "2021"]],
    diagram: {}
  },
  "urba-branding": {
    title: "Urba Inmobiliaria", group: "Built", hue: 96,
    kicker: "Lima, 2020",
    credits: [["Studio", "Cirkel"], ["Program", "Brand identity"], ["Design", "Gonzalo Cáceres Valcárcel"], ["Year", "2020"]],
    diagram: {}
  },

  "the-outermost-dock": {
    title: "Outer Dock", group: "Unbuilt", hue: 200,
    kicker: "New York, 2026",
    credits: [["Site", ""], ["Studio", "Columbia GSAPP"], ["Program", "Architecture as reciprocal infrastructure"], ["Critic", ""], ["Year", "2026"]],
    diagram: {}
  },
  "social-sanctuary": {
    title: "East 5th", group: "Unbuilt", hue: 42,
    kicker: "New York, 2025",
    // Term: Fall 2025 (not shown; Program replaced Term)
    credits: [["Site", ""], ["Studio", "Core III, Columbia GSAPP"], ["Program", "Housing as social infrastructure"], ["Critic", "Lindy Roy"], ["Year", "2025"]],
    diagram: {src: "img/social-sanctuary/hand-drawing.jpg"}
  },
  "permanent-impermanence": {
    title: "Joint", group: "Unbuilt", hue: 330, dark: true,
    kicker: "New York, 2025",
    hero: "img/permanent-impermanence/perspective.jpg",
    text: [
      "Joint imagines a Manhattan where music, art, and independent culture can continue to claim space. Conceived above the working DSNY Garage on 12th Avenue, the project builds on public infrastructure to create venues for gathering, experimentation, and performance. For artists without institutional backing or a lasting place in the city, it offers room to create, be heard, and build a community.",
      "Its name carries two meanings: the structural joint that connects individual parts, and the cultural space that brings people together. Inspired by Konrad Wachsmann’s systems of assembly, a modular framework allows spaces to evolve with the artists who inhabit them. Structure becomes a means of supporting creative freedom, allowing different practices, voices, and audiences to meet. Joint seeks to give something lasting to an inherently changing culture: a place to belong, and the freedom to become something new."
    ],
    // Site still to come from him (an empty value isn't shown); Program replaces Term (his note, 2026-10-29). Term: Spring 2025
    credits: [["Site", ""], ["Studio", "Core II, Columbia GSAPP"], ["Program", "An architecture of instability"], ["Critic", "Christoph Kumpusch"], ["Year", "2025"]],
    // after the hero, in this order (his order, 2026-10-29), drawings and renders mixed
    inOrder: true,
    grid: [
      {src: "img/permanent-impermanence/stair.jpg", caption: "Pavilion"},
      {src: "img/permanent-impermanence/elevations.jpg", drawing: true, caption: "Pavilion elevations"},
      {src: "img/permanent-impermanence/pavilion.jpg", caption: "Perspective"},
      {src: "img/permanent-impermanence/section.jpg", drawing: true, caption: "Section"},
      {src: "img/permanent-impermanence/flyer.jpg", drawing: true, caption: "Flyer"},
      {src: "img/permanent-impermanence/theater.jpg", caption: "Theater"},
      {src: "img/permanent-impermanence/hallway.jpg", caption: "Hallway"}
    ]
  },
  "anticlastic-roof-structure": {
    title: "Anticlastic Surfaces", group: "Research", hue: 8,
    kicker: "New York, 2026",
    text: [
      "Developing Curvature investigates the architectural potential of flat plywood: how the geometry of individual pieces can generate a surface of double curvature. The shell develops through the orientation, edges, and connections of planar elements, bringing material constraints directly into the production of form. Physical models serve as the primary design tool, allowing the surface to be assessed through its assembly, thickness, and spatial presence. The resulting geometry holds together two scales of expression: the precise articulation of individual panels and the continuity of the larger shell.",
      "The study explores how changes in panel orientation generate structural depth, linking the shell’s geometric character to its potential stiffness. This investigation opens a further direction: integrating insulation with the plywood skin so that thermal and structural functions might operate within one material system. Through making, the project pursues an economy of means in which construction, performance, and architectural expression develop together."
    ],
    credits: [["Studio", "Robert Marino Architects"], ["Type", "Structural Form-Finding, Material Research"], ["Design", "Gonzalo Cáceres Valcárcel"], ["Year", "2026"]],
    diagram: {src: "img/anticlastic-roof-structure/hand-drawing.jpg", caption: "Spherical vs. hyperbolic curvature study"},
    hero: "img/anticlastic-roof-structure/hero.jpg",
    home: ["img/anticlastic-roof-structure/hero.jpg", "img/anticlastic-roof-structure/section.png"],
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
    credits: [["Studio", "Robert Marino Architects"], ["Type", "Structural Form-Finding"], ["Design", "Gonzalo Cáceres Valcárcel"], ["Year", "2026"]],
    hero: "img/vaulted-shell-structure/model-9751.jpg",
    home: ["img/vaulted-shell-structure/model-9751.jpg", "img/vaulted-shell-structure/section.png"],
    // his order (2026-10-29): each drawing followed by the photo of the same view, the drawings with the house last
    inOrder: true,
    grid: [
      {src: "img/vaulted-shell-structure/section.png", drawing: true, caption: "Section"},
      {src: "img/vaulted-shell-structure/model-9931.jpg", caption: "Physical model"},
      {src: "img/vaulted-shell-structure/elevation.png", drawing: true, caption: "Elevation"},
      {src: "img/vaulted-shell-structure/model-9746.jpg", caption: "Physical model"},
      {src: "img/vaulted-shell-structure/roof-plan.png", drawing: true, caption: "Roof plan"},
      {src: "img/vaulted-shell-structure/model-9795.jpg", caption: "Physical model"},
      {src: "img/vaulted-shell-structure/hand-drawing.jpg", drawing: true, caption: "Vaulted shell study"},
      {src: "img/vaulted-shell-structure/model-9937.jpg", caption: "Physical model, underside"},
      {src: "img/vaulted-shell-structure/model-9925.jpg", caption: "Physical model, joints"},
      {src: "img/vaulted-shell-structure/model-9928.jpg", caption: "Physical model, joints"},
      {src: "img/vaulted-shell-structure/model-9933.jpg", caption: "Physical model, crown"},
      {src: "img/vaulted-shell-structure/site-plan.png", drawing: true, caption: "Plan with the existing house"},
      {src: "img/vaulted-shell-structure/site-elevation.png", drawing: true, caption: "Elevation with the existing house"},
      {src: "img/vaulted-shell-structure/house-elevation.png", drawing: true, caption: "End elevation with the existing house"}
    ]
  },
  "modular-living-architecture": {
    title: "Open Assembly", group: "Research", hue: 120,
    kicker: "New York, 2025",
    lede: "A modular system for sphere-like structures, built from the fewest possible parts that assemble with one another, like an organic system.",
    credits: [["Type", "Modular Systems"], ["Design", "Gonzalo Cáceres Valcárcel"], ["Year", "2025"]],
    diagram: {}
  }
};
