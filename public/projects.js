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
    hidden    true: the project is off the site (not in the index; its page goes to the home)
    order     optional: the pictures' order by hand, hero and diagram included, e.g. ["img/x/a.jpg", ...]
    hide      optional: pictures kept in the lists but not shown, e.g. ["img/x/b.jpg"]
    notFirst  true: the home never opens a visit on this project (it still comes up as you scroll)

  Drop image files into public/img/<slug>/ and reference them here.
*/
window.PROJECTS = {
  "the-outermost-dock": {
    title: "Outer Dock", group: "Unbuilt", hue: 200,
    // notes beside the pictures, one per picture as shown (hero first), his own sentences from the text below, word
    // for word (his ask, 2026-11-09: "the small tag descriptions next to the images explaining the project"); "" = none
    // the opening picture never carries a note (his note, 2026-11-09), so this one sits with the second picture
    notes: [
      "",
      "The barge tends to the artists, the artists tend to the barge, the dock tends to both."
    ],
    kicker: "New York, 2026",
    // his words, from his project sheet (2026-11-06)
    text: [
      "The site is Napeague Harbor on Long Island’s south fork, where Victor D’Amico anchored a WWII Navy barge in 1960 and converted it into a teaching studio for painters. For more than sixty years the barge has hosted artists each summer, but the surrounding real estate has priced out the very teachers the barge was built for.",
      "The project proposes a dry dock around the Art Barge, a temporary architectural apparatus that holds the barge, shelters it, and provides the missing housing for the artists who arrive each summer. The barge tends to the artists, the artists tend to the barge, the dock tends to both.",
      "In preparation."   // his ask, 2026-11-06: after the last paragraph, as a sentence
    ],
    credits: [["Site", "Napeague Harbor, New York"], ["Studio", "Columbia GSAPP"], ["Program", "Reciprocal Infrastructure"], ["Critic", "Robert Marino"], ["Year", "2026"]],
    // his sketch sheet (2026-11-06), the only picture so far ("In preparation" beside it was taken off at his ask)
    diagram: {src: "img/the-outermost-dock/diagram-2.jpg"}
    // (a site plan, an elevation and a model photo were added and taken off again at his ask, 2026-11-06)
  },
  "social-sanctuary": {
    title: "East 5th", group: "Unbuilt", hue: 42,
    sheetFrame: true,   // a very faint frame round each picture on the gallery sheet (his ask, 2026-11-06)
    kicker: "New York, 2025",
    text: [
      "East 5th proposes collective housing for newly arrived immigrants and refugees on a through-block site in New York’s East Village. The project understands sanctuary as a sense of safety and belonging formed through relationships. Drawing on Constant’s New Babylon and Gordon Pask’s concept of underspecified design, it leaves aspects of domestic and shared space open to interpretation, allowing residents to shape their surroundings as their needs and communities evolve.",
      "A diagonal dog-leg stair organizes the building, connecting residential levels with shared terraces, gardens, and cultural spaces. Its landings and adjoining spaces turn everyday movement into opportunities for conversation and exchange. Beneath the cantilevered housing, workshops, learning incubators, and a market connect residents with the surrounding neighborhood. Together, these spaces provide a framework for newcomers to establish roots, support one another, and participate in the life of the city."
    ],
    // Term: Fall 2025 (not shown; Program replaced Term)
    credits: [["Site", "324 E 5th St, New York"], ["Studio", "Core III, Columbia GSAPP"], ["Program", "Housing as social infrastructure"], ["Critic", "Lindy Roy"], ["Year", "2025"]],
    diagram: {src: "img/social-sanctuary/hand-drawing.jpg"},
    // no hero: the hand drawing opens, then the stair render, his sheets 11-15 (words, titles, scales and the photo's
    // dashed leader taken off, model photos removed and the three plans cropped by one shared window centred on the building, wide enough that no car is cut, 2026-11-06), his two model photos, the aerial render last (his order, 2026-11-05)
    inOrder: true,
    // a short tag beside each drawing, like Joint's (his ask, 2026-11-06: "a little tag explaining each drawing,
    // something very minimal"): his own sentences and phrases from the text above, word for word, until he writes his
    // own; one per picture in order (hand drawing first), "" = none. The references slide's note sits on its right (his
    // call, 2026-11-06)
    notes: [
      "",
      "",
      {text: "Drawing on Constant’s New Babylon and Gordon Pask’s concept of underspecified design, it leaves aspects of domestic and shared space open to interpretation, allowing residents to shape their surroundings as their needs and communities evolve.", side: "right"},
      {text: "A through-block site in New York’s East Village.", side: "right"},
      "Beneath the cantilevered housing, workshops, learning incubators, and a market connect residents with the surrounding neighborhood.",
      "A diagonal dog-leg stair organizes the building, connecting residential levels with shared terraces, gardens, and cultural spaces.",
      "Collective housing for newly arrived immigrants and refugees.",
      "",
      "Its landings and adjoining spaces turn everyday movement into opportunities for conversation and exchange.",
      "Together, these spaces provide a framework for newcomers to establish roots, support one another, and participate in the life of the city.",
      "",
      ""
    ],
    grid: [
      {src: "img/social-sanctuary/render-stairs.jpg", caption: "Stairs"},
        // his diagram1.pdf as it is (black ground, no crop; tenement-diagram.webp alone), with Constant's map and Pask's
        // diagram under the diagram, inside the black box (option A, his pick, 2026-11-06; no separate slide);
        // no effects; his own original colours (his call, 2026-11-06, after copper, Joint and 30%-darker versions); since
        // 2026-11-06 ~10:40pm NY his redone Artboard 10 (white ground, new palette), refs in the same places;
        // lines as his. Note on the left (notes below). Since 2026-11-06 ~12:15am NY his Artboard 30 (tenement facades +
        // the five diagrams, no references); the sheet still shows only the five diagrams
      {src: "img/social-sanctuary/tenement-diagram.webp", drawing: true, sheet: .6, sheetSrc: "img/social-sanctuary/sheet-diagram-2.webp", caption: "Tenement facades and underspecificity diagram"},
        // his artboard: neighbourhood map with the site, then the block plan; full width kept, the white above and below
        // cropped off so the tag sits beside the map (his ask, 2026-11-06)
      {src: "img/social-sanctuary/site-context.webp", drawing: true, scale: .75, caption: "Site in the East Village"},
      {src: "img/social-sanctuary/plan-first-floor.png", drawing: true, caption: "First floor plan"},
      {src: "img/social-sanctuary/plan-fourth-floor.png", drawing: true, caption: "Fourth floor plan"},
      {src: "img/social-sanctuary/plan-typical-floor.png", drawing: true, caption: "Typical floor plan"},
      {src: "img/social-sanctuary/model-1.jpg", caption: "Physical model"},
      {src: "img/social-sanctuary/section-ns-c.png", drawing: true, caption: "Section north-south"},   // cropped at his red lines, the buildings behind faded (2026-11-09)
      {src: "img/social-sanctuary/section-ew.png", drawing: true, caption: "Section east-west"},
        // the second model photo just before the aerial render (his call, 2026-11-06)
      {src: "img/social-sanctuary/model-2.jpg", caption: "Physical model"},
      // his new aerial render (Image2_5, 2026-11-06), replacing the earlier one
      {src: "img/social-sanctuary/render-aerial.jpg", caption: "Aerial view"}
    ]
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
        // walk-through notes, one per picture in order (hero first), for the ?walk= trial (2026-11-01): his own sentences
    // from the text above, word for word, set beside the picture each one speaks to; "" = no note (he can write his own)
    notes: [
      "Joint imagines a Manhattan where music, art, and independent culture can continue to claim space.",
      "Its name carries two meanings: the structural joint that connects individual parts, and the cultural space that brings people together.",
      "Inspired by Konrad Wachsmann’s systems of assembly, a modular framework allows spaces to evolve with the artists who inhabit them.",
      "Conceived the working DSNY Garage on 12th Avenue, the project builds on public infrastructure to create venues for gathering, experimentation, and performance.",   // "above" taken out at his ask (2026-11-06), in this note only
      "Structure becomes a means of supporting creative freedom, allowing different practices, voices, and audiences to meet.",
      "For artists without institutional backing or a lasting place in the city, it offers room to create, be heard, and build a community.",
      "",
      "Joint seeks to give something lasting to an inherently changing culture: a place to belong, and the freedom to become something new."
    ],
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
    // notes beside the pictures, one per picture as shown (hero first), his own sentences from the text below, word
    // for word (his ask, 2026-11-09: "the small tag descriptions next to the images explaining the project"); "" = none
    notes: [
      "Developing Curvature investigates the architectural potential of flat plywood: how the geometry of individual pieces can generate a surface of double curvature.",
      "The shell develops through the orientation, edges, and connections of planar elements, bringing material constraints directly into the production of form.",
      "",
      "The study explores how changes in panel orientation generate structural depth, linking the shell’s geometric character to its potential stiffness.",
      "The resulting geometry holds together two scales of expression: the precise articulation of individual panels and the continuity of the larger shell.",
      "Physical models serve as the primary design tool, allowing the surface to be assessed through its assembly, thickness, and spatial presence.",   // these two swapped (his ask, 2026-11-09)
      "",
      "",
      "",
      "This investigation opens a further direction: integrating insulation with the plywood skin so that thermal and structural functions might operate within one material system.",
      ""
    ],
    // his order (his second numbering on the gallery sheet, 2026-11-09 ~3:35am NY); the notes above moved with their
    // pictures. IMG_9921 and IMG_9865 crossed out (hidden below); "Through making, the project pursues..." went with IMG_9921
    order: ["img/anticlastic-roof-structure/hero.jpg", "img/anticlastic-roof-structure/hand-drawing.jpg", "img/anticlastic-roof-structure/physical/web/IMG_9868.jpg", "img/anticlastic-roof-structure/section.png",
      "img/anticlastic-roof-structure/physical/web/IMG_9768.jpg", "img/anticlastic-roof-structure/elevation.png", "img/anticlastic-roof-structure/physical/web/IMG_9760.jpg", "img/anticlastic-roof-structure/plan.png",
      "img/anticlastic-roof-structure/physical/web/IMG_9801.jpg", "img/anticlastic-roof-structure/physical/web/IMG_9909-Edit.jpg", "img/anticlastic-roof-structure/physical/web/IMG_9872.jpg"],
    hide: ["img/anticlastic-roof-structure/physical/web/IMG_9921.jpg", "img/anticlastic-roof-structure/physical/web/IMG_9865-Edit.jpg"],
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
    // notes beside the pictures, one per picture as shown (hero first), his own sentences from the text below, word
    // for word (his ask, 2026-11-09: "the small tag descriptions next to the images explaining the project"); "" = none
    notes: [
      "Lean Shells investigates how a roof can do more with less material.",
      "",
      "Thin plywood panels form hollow units whose angled connections generate a vault, combining structural depth with space for insulation.",
      "",
      "The study seeks an efficient enclosure through the careful arrangement of lightweight parts.",
      "Exposed plywood edges and repeating facets give the assembly its architectural character.",
      "",
      "",
      "Physical model making connects the detail of each joint to the geometry of the whole.",
      "",
      "",
      "Material economy becomes a design ambition: creating strength, shelter, and spatial presence through a restrained system of parts."
    ],
    kicker: "New York, 2026",
    text: [
      "Lean Shells investigates how a roof can do more with less material. Thin plywood panels form hollow units whose angled connections generate a vault, combining structural depth with space for insulation. The study seeks an efficient enclosure through the careful arrangement of lightweight parts.",
      "Physical model making connects the detail of each joint to the geometry of the whole. Exposed plywood edges and repeating facets give the assembly its architectural character. Material economy becomes a design ambition: creating strength, shelter, and spatial presence through a restrained system of parts."
    ],
    credits: [["Studio", "Robert Marino Architects"], ["Type", "Structural Systems, Material Research"], ["Design", "Gonzalo Cáceres Valcárcel"], ["Year", "2026"]],
    hero: "img/vaulted-shell-structure/model-9751.jpg",
    home: ["img/vaulted-shell-structure/model-9751.jpg", "img/vaulted-shell-structure/section.png"],
    // his order (his numbers on the gallery sheet, 2026-11-09; before, 2026-10-29: each drawing followed by the photo
    // of the same view): the hand drawing second, the drawings with the house last; the notes above moved with their pictures
    inOrder: true,
    grid: [
      {src: "img/vaulted-shell-structure/hand-drawing.jpg", drawing: true, caption: "Vaulted shell study"},
      {src: "img/vaulted-shell-structure/section.png", drawing: true, caption: "Section"},
      // model-9931 taken off (crossed out, his marks 2026-11-09)
      {src: "img/vaulted-shell-structure/model-9746.jpg", caption: "Physical model"},
      {src: "img/vaulted-shell-structure/elevation.png", drawing: true, caption: "Elevation"},
      {src: "img/vaulted-shell-structure/model-9795.jpg", caption: "Physical model"},
      {src: "img/vaulted-shell-structure/roof-plan.png", drawing: true, caption: "Roof plan"},
      {src: "img/vaulted-shell-structure/model-9937.jpg", caption: "Physical model, underside"},
      // model-9925 (front close-up of the joints) left out for now to try the page without it (his ask, 2026-10-29)
      {src: "img/vaulted-shell-structure/model-9928.jpg", caption: "Physical model, joints"},
      {src: "img/vaulted-shell-structure/site-plan.png", drawing: true, caption: "Plan with the existing house"},
      {src: "img/vaulted-shell-structure/site-elevation.png", drawing: true, caption: "Elevation with the existing house"},
      {src: "img/vaulted-shell-structure/house-elevation.png", drawing: true, caption: "End elevation with the existing house"}
    ]
  },
  // his ask (2026-11-06): first just below Joint, then moved below Lean Shells (Research); "a model study for TECH II with Zak Kostura" (Spring 2025, from his syllabus); no text yet
  "puente-de-la-mujer": {
    hidden: true,   // off the site for now (his ask, 2026-11-06 ~2:45am NY)
    title: "Puente de la Mujer", group: "Research", hue: 190,
    kicker: "New York, 2025",
    credits: [["Course", "TECH II, Columbia GSAPP"], ["Type", "Structures in Architecture"], ["Instructor", "Zak Kostura"], ["Term", "Spring 2025"], ["Year", "2025"]],   // from his syllabus header (2026-11-06); course code ARCH A4112 left out so the line does not wrap
    hero: "img/puente-de-la-mujer/perspective.jpg",
    // his order (2026-11-06), after the perspective
    inOrder: true,
    grid: [
      {src: "img/puente-de-la-mujer/model-black.jpg", caption: "Physical model"},
      {src: "img/puente-de-la-mujer/front.jpg", caption: "Front view"},
      {src: "img/puente-de-la-mujer/detail-black.jpg", caption: "Physical model, detail"},
      {src: "img/puente-de-la-mujer/top.jpg", caption: "Top view"}
    ]
  },
  "modular-living-architecture": {
    notFirst: true,   // never the project a visit opens on (his ask, 2026-11-06)
    title: "Open Assembly", group: "Research", hue: 120,
    kicker: "New York, 2025",
    // his text (2026-11-06 ~2:45am NY), word for word; it replaced the Geometry & Scaffolds paragraph
    text: [
      "Living Assemble is a modular kit based on regular polygons. Its pieces can form Platonic solids or be taken apart and recombined into unexpected patterns and spatial arrangements. Each assembly opens up another possibility.",
      "Through hands-on experimentation, the kit connects geometric precision with intuitive discovery. Building and rebuilding reveal how simple connections and repeated parts can create adaptable structures. These experiments explore living architecture through the relationship between engineered order and the complexity of natural systems.",
      "In preparation."   // his earlier ask (2026-11-06), kept
    ],
    // captions this time (his ask, 2026-11-06): his own sentences from the text, word for word, beside each picture as on Joint
    notes: [
      // his pairing (2026-11-06 ~2:55am NY): cube, tiling ("minus the polyhedra"), kit of parts
      "Living Assemble is a modular kit based on regular polygons.",
      "Its pieces can be taken apart and recombined into unexpected patterns and spatial arrangements.",
      "Building and rebuilding reveal how simple connections and repeated parts can create adaptable structures."
    ],
    credits: [["Studio", "ADR 2, Columbia GSAPP"], ["Type", "Modular Systems"], ["Design", "Gonzalo Cáceres Valcárcel"], ["Year", "2025"]],
    // his diagram.pdf (2026-11-06 ~1:15am NY), one picture per page, in its order; it replaced everything before
    inOrder: true,
    grid: [
      {src: "img/modular-living-architecture/cuboctahedron.webp", drawing: true, caption: "Truncated cuboctahedron, net and assembly"},
      {src: "img/modular-living-architecture/hexagon-tiling.webp", drawing: true, caption: "Hexagon tiling"},
      {src: "img/modular-living-architecture/sheet-3.webp", drawing: true, caption: "Ring and connector parts"}
    ]
  },
  // Built at the bottom of the index (his ask, 2026-11-09)
  "sierra-hotel": {
    title: "Sierra Hotel", group: "Built", hue: 18,
    // notes beside the pictures, one per picture as shown (hero first), his own sentences from the text below, word
    // for word (his ask, 2026-11-09: "the small tag descriptions next to the images explaining the project"); "" = none
    notes: [
      "The façade is organized into three elements: base, body, and crown.",
      "As my first non-residential project, it gave me the opportunity to explore how architecture could shape a guest’s experience while working within the constraints of an existing structure.",
      "Entrance details",   // his tag for the entrance details drawing (2026-11-09)
      "",   // the entrance render after it
      "This project transformed an existing structural shell into a hotel, requiring a complete redesign of the interior layout and façade.",
      "Materiality became a central focus of the design, connecting the hotel to Cusco’s architectural character.",
      "The base draws on the city’s rustic textures, while the body reinterprets the same warm palette through a contemporary, restrained composition.",
      "At the rooftop, natural materials and floor-to-ceiling glazing frame the surrounding mountains, making the landscape part of the guest experience."
    ],
    kicker: "Cusco, 2023",
    ready: true,
    text: [
      "This project transformed an existing structural shell into a hotel, requiring a complete redesign of the interior layout and façade. As my first non-residential project, it gave me the opportunity to explore how architecture could shape a guest’s experience while working within the constraints of an existing structure.",
      "Materiality became a central focus of the design, connecting the hotel to Cusco’s architectural character. The façade is organized into three elements: base, body, and crown. The base draws on the city’s rustic textures, while the body reinterprets the same warm palette through a contemporary, restrained composition. At the rooftop, natural materials and floor-to-ceiling glazing frame the surrounding mountains, making the landscape part of the guest experience."
    ],
    credits: [["Studio", "Urba Inmobiliaria"], ["Program", "Hospitality in Peru"], ["Design", "Gonzalo Cáceres Valcárcel"], ["Year", "2023"]],
    diagram: {src: "img/sierra-hotel/exploded-diagram.jpg", caption: "Exploded axonometric"},
    hero: "img/sierra-hotel/hero.jpg",
    home: ["img/sierra-hotel/elevation.svg", "img/sierra-hotel/floor-plans-30.webp"],
    // the order of the pictures (his numbering, 2026-11-09; the notes above moved with their pictures): elevation, floor
    // plans, entrance details, entrance render (his View 05, 2026-11-09), exploded axonometric, street render, the facade against the sky, the tiles. The floor
    // plans are his new sheet (floor_plans_30.webp, 2026-11-09) in place of floor-plans.svg; the entrance details added the same night
    order: ["img/sierra-hotel/elevation.svg", "img/sierra-hotel/floor-plans-30.webp", "img/sierra-hotel/facade-details.webp", "img/sierra-hotel/render-entrance.jpg", "img/sierra-hotel/exploded-diagram.jpg", "img/sierra-hotel/render-facade.jpg", "img/sierra-hotel/hero.jpg", "img/sierra-hotel/photo-1.jpg"],
    heroPosition: "center",
    heroPositionPhone: "78% center",   // where a phone-shaped crop of the hero looks (the building is on the right)
    // all the pictures in one grid after the text, (see project.js: grid)
    grid: [
      {src: "img/sierra-hotel/render-facade.jpg", size: "xl"},
      {src: "img/sierra-hotel/exploded-diagram.jpg", size: "tower", drawing: true, fill: true, caption: "Exploded axonometric"},
      {src: "img/sierra-hotel/elevation.svg", size: "half", drawing: true, caption: "Front elevation"},
      {src: "img/sierra-hotel/floor-plans-30.webp", size: "wide", drawing: true, caption: "Floor plans"},
      {src: "img/sierra-hotel/facade-details.webp", drawing: true, caption: "Entrance details"},
      {src: "img/sierra-hotel/render-entrance.jpg", caption: "Entrance"},
      {src: "img/sierra-hotel/photo-1.jpg", size: "half"}
    ],
    gallery: {
      photosLayout: "grid",
      drawings: [
        {src: "img/sierra-hotel/facade.webp", caption: "Facade"},
        {src: "img/sierra-hotel/floor-plans-3.webp", caption: "Floor plans"}
      ],
      photos: [
        {src: "img/sierra-hotel/photo-1.jpg", caption: ""},
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
    notFirst: true,   // never the project a visit opens on (his ask, 2026-11-06)
    title: "Urba Inmobiliaria", group: "Built", hue: 96,
    kicker: "Lima, 2020",
    // his text (2026-11-06), word for word
    text: [
      "Urba began with a desire to contribute to a more thoughtful way of building in the city. I believe each project carries a responsibility to the people who will inhabit it, the neighborhood around it, and the places and resources already there. That responsibility starts with listening, understanding the context, and asking what a project can give back.",
      "The name reflects an interest in the city as a shared place, shaped over time by many hands. My hope is for Urba to bring design, engineering, and development into closer conversation, creating spaces that meet everyday needs, make careful use of resources, and offer lasting value. It is an ambition to grow with the city, learning from its communities and helping build places where more people can feel they belong."
    ],
    credits: [["Program", "Brand design"], ["Design", "Gonzalo Cáceres Valcárcel"], ["Year", "2020"]],   // Studio Cirkel dropped, Program from Brand identity (his ask, 2026-11-06)
    // his brand pages (portfolio spreads 13-16 + brand manual 27/29/31, 2026-11-06), words taken off: visuals only
    // every drawing at half its usual size (his ask, 2026-11-06): scale .5; the wordmark's file carries its own margin
    inOrder: true,
    // his note for the step-by-step isotype (2026-11-06), word for word, beside the pictures as on Joint: one paragraph each beside the posters, the step-by-step and the Ur mark (his ask)
    notes: ["", "Urba’s mark reflects a city that is always evolving. Its shifting letterforms trace a process of forming ideas, building, and adapting to changing needs.", "While sketching variations of the name, I found that the relationship between the drawings mattered more than any single version. That discovery became the basis of the identity: a form that remains recognizable while allowing for change."],   // the Ur mark's note ("The mark expresses a principle...") taken off at his ask
    grid: [
      // 20% smaller than before (his ask, 2026-11-09)
      {src: "img/urba-branding/wordmark-tagline-2.png", drawing: true, scale: .8, caption: "Wordmark: Creamos espacios, construimos comunidad"},
      {src: "img/urba-branding/posters.png", drawing: true, scale: .5, caption: "Isotype in the three colours"},
      {src: "img/urba-branding/isotype-steps.png", drawing: true, scale: .5, caption: "Isotype, step by step"},
      // his Ur mark (logo_black_white-100.jpg, 2026-11-06) with the note's last paragraph; trimmed, shown smaller (scale .3) so it sits at the size of the other half-size drawings
      {src: "img/urba-branding/ur-mark.png", drawing: true, scale: .3, caption: "Ur mark", link: {href: "https://urba.pe", text: "urba.pe"}}
    ]
  }
};
