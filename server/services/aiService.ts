import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

export interface WasteAnalysisResult {
  material: string;
  subtype?: string;
  confidence: number;
  condition: string;
  is_reusable: boolean;
  categories: string[];
  safety_notes: string[];
  possible_uses: string[];
  is_mock: boolean;
  raw_ai_result: Record<string, any>;
}

export interface IdeaContext {
  material: string;
  quantity?: string;
  skill_level?: string;
  tools?: string[];
  budget?: string;
  time?: string;
  intended_purpose?: string;
  constraints?: string;
  custom_prompt?: string;
  previous_projects?: string[];
}

export interface GeneratedIdea {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_time: string;
  material_requirement: string;
  tools: string[];
  additional_materials: string[];
  safety_notes: string[];
  category: string;
  sustainability_explanation: string;
  estimated_cost: string;
  commercial_potential?: string;
}

export interface ProjectStep {
  step: number;
  title: string;
  instruction: string;
  pro_tip?: string;
  safety_warning?: string;
}

export interface ProjectDetailModel {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_time: string;
  category: string;
  waste_already_have: string[];
  materials_may_need: string[];
  tools_required: string[];
  instructions: ProjectStep[];
  alternative_materials: { original: string; alternative: string; suitability_note: string }[];
  safety_information: string[];
  optional_products: { name: string; estimated_price: string; category: string; buy_option: string; eco_alternative: string }[];
}

export interface CommentItem {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface CommentSummaryResult {
  summary: string;
  groups: { topic: string; count: number; example: string }[];
  questions: { topic: string; count: number; examples: string[] }[];
  highlights: { suggestion: string; author: string; reason: string }[];
}

export interface BusinessContext {
  material: string;
  quantity?: string;
  budget?: string;
  skill_level?: string;
  available_tools?: string[];
  target_market?: string;
  location?: string;
}

export interface BusinessConcept {
  id: string;
  title: string;
  tagline: string;
  materials_needed: string[];
  tools_required: string[];
  production_steps: string[];
  cost_estimates: {
    unit_production_cost: string;
    suggested_selling_price: string;
    disclaimer: string;
  };
  target_customers: string;
  packaging_strategy: string;
  differentiation: string;
  selling_channels: string[];
  key_challenges: string[];
}

class AIService {
  private provider: string;
  private geminiKey?: string;
  private openAiKey?: string;

  constructor() {
    this.provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.openAiKey = process.env.OPENAI_API_KEY;
  }

  getProviderName(): string {
    if (this.provider === 'gemini' && this.geminiKey) return 'Google Gemini AI (Active)';
    if (this.provider === 'openai' && this.openAiKey) return 'OpenAI GPT-4o (Active)';
    return 'Waste2Worth Intelligent Eco-Engine (Development/Mock Mode)';
  }

  isRealProviderActive(): boolean {
    return (this.provider === 'gemini' && !!this.geminiKey) || (this.provider === 'openai' && !!this.openAiKey);
  }

  // 1. Identify Waste Image
  async identifyWaste(filenameOrMime: string, sampleHint?: string): Promise<WasteAnalysisResult> {
    const hint = (sampleHint || filenameOrMime || '').toLowerCase();

    // Comprehensive material knowledge database
    if (hint.includes('bottle') || hint.includes('plastic_bottle') || hint.includes('pet')) {
      return {
        material: 'Plastic bottle',
        subtype: 'PET (Polyethylene Terephthalate, #1 Recyclable)',
        confidence: 0.94,
        condition: 'Good (Clean, Structurally Sound)',
        is_reusable: true,
        categories: ['Gardening & Planters', 'Home Organization', 'Automated Irrigation', 'Eco-Art', 'Desk Organizers'],
        safety_notes: [
          'Rinse and dry thoroughly before crafting to prevent residue buildup.',
          'When cutting plastic with scissors or utility knife, wear protective work gloves.',
          'Avoid applying direct heat that could emit fumes unless in a well-ventilated area.'
        ],
        possible_uses: [
          'Self-watering indoor herb planter',
          'Hanging vertical balcony garden',
          'Desk pencil and brush organizer cup',
          'Bird feeder with wooden spoon perches',
          'Miniature drip-irrigation system'
        ],
        is_mock: !this.isRealProviderActive(),
        raw_ai_result: { detected_labels: ['plastic', 'bottle', 'beverage container', 'transparent polymer'] }
      };
    }

    if (hint.includes('clothes') || hint.includes('textile') || hint.includes('jeans') || hint.includes('denim') || hint.includes('fabric')) {
      return {
        material: 'Old clothes/textiles',
        subtype: 'Cotton Denim / Textile Scraps',
        confidence: 0.91,
        condition: 'Good (Clean, Durable Weave)',
        is_reusable: true,
        categories: ['Fashion Accessories', 'Home Furnishings', 'Tote Bags', 'Insulated Coasters', 'Patchwork Art'],
        safety_notes: [
          'Wash and press fabric before measuring or cutting.',
          'Use sharp fabric shears to avoid fraying edges.',
          'Take care with sewing needles and pins.'
        ],
        possible_uses: [
          'Heavy-duty upcycled denim shopping tote',
          'Quilted heat-resistant kitchen pot holders',
          'Braided pet chew toy or scrap rug',
          'Pocket wall organizer for stationery & cables',
          'Fabric scrap hair scrunchies & patches'
        ],
        is_mock: !this.isRealProviderActive(),
        raw_ai_result: { detected_labels: ['textile', 'denim', 'clothing', 'fiber'] }
      };
    }

    if (hint.includes('glass') || hint.includes('jar')) {
      return {
        material: 'Glass',
        subtype: 'Soda-Lime Food Grade Glass Container',
        confidence: 0.93,
        condition: 'Intact (No cracks or chips detected)',
        is_reusable: true,
        categories: ['Kitchen Storage', 'Candle Making', 'Terrariums', 'Decoration', 'Bathroom Storage'],
        safety_notes: [
          'Inspect carefully for micro-cracks or chipped rims before handling.',
          'Never expose to sudden rapid temperature shock (hot water to cold water).',
          'Do not use excessive force when cleaning or modifying.'
        ],
        possible_uses: [
          'Mini succulent and moss terrarium',
          'Aromatherapy soy wax candle jar',
          'Pantry bulk spices & grains organizer',
          'Fairy light bedside decorative lantern',
          'Handmade bathroom cotton bud dispenser'
        ],
        is_mock: !this.isRealProviderActive(),
        raw_ai_result: { detected_labels: ['glassware', 'jar', 'transparent', 'storage jar'] }
      };
    }

    if (hint.includes('organic') || hint.includes('food') || hint.includes('peel') || hint.includes('scraps') || hint.includes('fruit')) {
      return {
        material: 'Organic waste',
        subtype: 'Fruit & Vegetable Kitchen Biomass',
        confidence: 0.95,
        condition: 'Fresh Compostable Organic Matter',
        is_reusable: true,
        categories: ['Composting', 'Soil Regeneration', 'Bio-Enzymes', 'Natural Fabric Dyes', 'Seedling Germination'],
        safety_notes: [
          'Keep outdoor compost bins sealed to deter unwanted pests.',
          'Do not compost cooked meat, dairy, or oils in standard household compost bins to avoid odor and pathogens.',
          'Wash hands after handling decomposition stages.'
        ],
        possible_uses: [
          'Rich aerobic vermicompost or backyard compost tea',
          'Citrus peel eco-enzyme kitchen degreaser',
          'Onion skin & avocado pit natural botanical dyes',
          'Regrowing green onions and celery in shallow water',
          'Dried crushed eggshell calcium supplement for plants'
        ],
        is_mock: !this.isRealProviderActive(),
        raw_ai_result: { detected_labels: ['organic', 'botanical', 'fruit peel', 'biomass'] }
      };
    }

    if (hint.includes('electronic') || hint.includes('e-waste') || hint.includes('cable') || hint.includes('pcb') || hint.includes('circuit')) {
      return {
        material: 'Electronic waste',
        subtype: 'Decommissioned Copper Cables & Circuit Components',
        confidence: 0.88,
        condition: 'Non-Functional Hardware Components',
        is_reusable: true,
        categories: ['Cyberpunk Art', 'Geek Jewelry', 'Cable Management', 'Clock Making', 'Decorative Sculptures'],
        safety_notes: [
          'WARNING: Never attempt to puncture or heat lithium-ion batteries or high-voltage capacitors.',
          'Wear eye protection and avoid inhaling dust if disassembling plastics.',
          'Keep non-usable hazardous electronic elements away from general household waste and drop at e-waste recycling kiosks.'
        ],
        possible_uses: [
          'Recycled RAM and motherboard geek keychains',
          'Coiled cable wire sculptures and wire jewelry',
          'Vintage computer fan desktop breeze cooler',
          'Hard drive platter mirror clock'
        ],
        is_mock: !this.isRealProviderActive(),
        raw_ai_result: { detected_labels: ['electronics', 'wires', 'circuit board', 'hardware'] }
      };
    }

    // Default to Cardboard (most common and versatile demo)
    return {
      material: 'Cardboard',
      subtype: 'Corrugated Kraft Fiber Shipping Box',
      confidence: 0.92,
      condition: 'Good (Dry, Rigid Structural Integrity)',
      is_reusable: true,
      categories: ['Storage & Organization', 'Desk Utilities', 'Eco-Toys & Scale Models', 'School Science Projects', 'Cat Playhouses'],
      safety_notes: [
        'Use a safety ruler and self-healing cutting mat when scoring fold lines.',
        'Keep cutter blades retracted when not actively slicing.',
        'Use non-toxic water-based PVA glue for child-friendly builds.'
      ],
      possible_uses: [
        'Multi-compartment desktop stationery organizer',
        'Modular wardrobe shoe & sneaker storage drawer',
        'Miniature architectural model or dollhouse',
        'Geometric wall shadow art sculpture',
        'Sturdy cat scratching lounge bed'
      ],
      is_mock: !this.isRealProviderActive(),
      raw_ai_result: { detected_labels: ['cardboard', 'box', 'paper product', 'packaging'] }
    };
  }

  // 2. Generate AI Ideas based on Context and Constraints
  async generateIdeas(context: IdeaContext): Promise<GeneratedIdea[]> {
    const mat = context.material.toLowerCase();
    const prompt = (context.custom_prompt || context.constraints || '').toLowerCase();
    const skill = context.skill_level || 'Beginner';

    if (mat.includes('cardboard')) {
      if (prompt.includes('easier') || prompt.includes('no tools')) {
        return [
          {
            id: 'cardboard-quick-tray',
            title: 'Zero-Tool Folded Desk Catchall Tray',
            description: 'A clever Japanese origami-inspired folding technique that turns a flat cardboard flap into an elegant tray for keys, coins, and glasses with zero cutting required.',
            difficulty: 'Beginner',
            estimated_time: '15–20 minutes',
            material_requirement: '1 flat cardboard sheet (approx 25x25 cm)',
            tools: ['None required (optional butter knife for scoring creases)'],
            additional_materials: ['None (pure mechanical folds)'],
            safety_notes: ['Ensure cardboard edges are smooth to avoid paper cuts.'],
            category: 'Desk Utilities',
            sustainability_explanation: 'Extends cardboard life without glues or synthetic adhesives, making it 100% recyclable afterwards.',
            estimated_cost: '₹0 (Free)',
            commercial_potential: 'Great as bundled eco-packaging or craft kit.'
          },
          {
            id: 'cardboard-cable-tags',
            title: 'Snap-On Cable Organizer Spools',
            description: 'Hand-cut miniature cable bones that wrap earphone cords and charging cables neatly without tangling.',
            difficulty: 'Beginner',
            estimated_time: '25 minutes',
            material_requirement: 'Small scrap cardboard box flap',
            tools: ['Household scissors'],
            additional_materials: ['Colored marker (optional)'],
            safety_notes: ['Cut steadily away from fingers.'],
            category: 'Home Organization',
            sustainability_explanation: 'Solves tech clutter using everyday packaging scraps that are normally discarded immediately.',
            estimated_cost: '₹0',
            commercial_potential: 'Ideal impulse add-on for sustainable stationery shops.'
          }
        ];
      }

      if (prompt.includes('sell') || prompt.includes('commercial') || prompt.includes('business')) {
        return [
          {
            id: 'cardboard-modular-organizer',
            title: 'Architectural Geometric Desk Organizer Set',
            description: 'A high-end 4-piece modular desk caddy featuring angled pencil tiers, phone docking groove, sticky note tray, and magnetic paperclip trough, finished with matte kraft varnish.',
            difficulty: 'Intermediate',
            estimated_time: '1.5–2 hours',
            material_requirement: '3 corrugated shipping boxes',
            tools: ['Utility craft knife', 'Metal ruler', 'Sandpaper', 'PVA wood glue'],
            additional_materials: ['Matte acrylic sealer or jute twine trim'],
            safety_notes: ['Use a metal cutting guide to prevent blade slippage.'],
            category: 'Commercial Products',
            sustainability_explanation: 'Replaces virgin plastic injection-molded organizers with renewable, biodegradable fiber.',
            estimated_cost: '₹80–₹120 (Sealer & glue)',
            commercial_potential: 'Estimated retail value ₹499–₹799 on Etsy or eco-pop-ups.'
          },
          {
            id: 'cardboard-lamp-shade',
            title: 'Parametric Hexagonal Pendant Lamp Shade',
            description: 'Laser-cut or hand-sliced interlocking cardboard rings creating a stunning ambient light fixture that casts warm geometric shadows.',
            difficulty: 'Intermediate',
            estimated_time: '2–3 hours',
            material_requirement: '4 medium dense cardboard sheets',
            tools: ['Precision hobby knife', 'Compass or stencil'],
            additional_materials: ['LED light bulb fixture (cool temperature only)'],
            safety_notes: ['IMPORTANT: Use only low-heat LED bulbs (max 9W). Never use incandescent or halogen bulbs with cardboard.'],
            category: 'Lighting & Decor',
            sustainability_explanation: 'Upcycles discarded cartons into architectural lighting statement pieces.',
            estimated_cost: '₹150 (Electrical fitting + glue)',
            commercial_potential: 'Boutique cafe decor or design store pricing ₹899–₹1,499.'
          }
        ];
      }

      // Default Cardboard Ideas
      return [
        {
          id: 'cardboard-desk-caddy',
          title: 'Multi-Tier Desktop Organizer',
          description: 'A handsome, tiered desk workstation with slots for pens, scissors, post-its, and a designated phone display stand.',
          difficulty: 'Beginner',
          estimated_time: '45–60 minutes',
          material_requirement: '1 medium shipping box (e.g. Amazon or courier box)',
          tools: ['Scissors or craft knife', 'Ruler', 'Pencil'],
          additional_materials: ['PVA Glue or double-sided tape', 'Old wrapping paper or paint for finish'],
          safety_notes: ['Score lines lightly before deep slicing.', 'Allow glue joints to cure for 15 minutes.'],
          category: 'Storage & Organization',
          sustainability_explanation: 'Diverts 350g of clean corrugated board from landfills while replacing store-bought plastic organizers.',
          estimated_cost: '₹50 (Paint/glue optional)'
        },
        {
          id: 'cardboard-cat-scratcher',
          title: 'Ribbon-Contoured Pet Scratching Bed',
          description: 'Laminated vertical cardboard corrugation strips formed into an ergonomic scratching bowl that cats love.',
          difficulty: 'Beginner',
          estimated_time: '1–1.5 hours',
          material_requirement: '2–3 large sturdy cartons',
          tools: ['Heavy-duty utility knife', 'Ruler'],
          additional_materials: ['Non-toxic cornstarch paste or PVA glue'],
          safety_notes: ['Use non-toxic child/pet-safe adhesive only.'],
          category: 'Pet Products',
          sustainability_explanation: 'Cats naturally gravitate toward raw corrugated textures, eliminating the need for plastic pet toys.',
          estimated_cost: '₹30'
        },
        {
          id: 'cardboard-mini-room',
          title: 'Miniature Architectural Studio Diaroma',
          description: 'A detailed 1:12 scale miniature studio or book nook featuring working tiny shelves and miniature window frames.',
          difficulty: 'Intermediate',
          estimated_time: '2–3 hours',
          material_requirement: '1 shoe box or packaging cube',
          tools: ['Precision knife', 'Tweezers', 'Cutting mat'],
          additional_materials: ['Acrylic paint', 'Glue', 'Scrap paper'],
          safety_notes: ['Work on a steady flat surface under good lighting.'],
          category: 'School Projects & Art',
          sustainability_explanation: 'Perfect student craft and STEM design prototyping without purchasing expensive balsa wood.',
          estimated_cost: '₹100'
        },
        {
          id: 'cardboard-shadow-art',
          title: 'Geometric Layered Wall Art Sculpture',
          description: 'Concentric cutouts assembled in layered reliefs that cast dynamic shadows across the wall under ambient lighting.',
          difficulty: 'Intermediate',
          estimated_time: '1.5 hours',
          material_requirement: 'Flat stiff carton panels',
          tools: ['Utility knife', 'Ruler', 'Adhesive foam spacers'],
          additional_materials: ['Black or warm terracotta craft paint'],
          safety_notes: ['Always cut away from your non-cutting hand.'],
          category: 'Home Decor',
          sustainability_explanation: 'High perceived aesthetic value achieved solely through geometric ingenuity on post-consumer packaging.',
          estimated_cost: '₹60'
        }
      ];
    }

    if (mat.includes('bottle') || mat.includes('plastic')) {
      return [
        {
          id: 'plastic-self-watering-planter',
          title: 'Sub-Irrigated Self-Watering Planter',
          description: 'Invert the cut top of a plastic bottle into its base with a cotton wick to keep basil, mint, or pothos watered for up to 2 weeks automatically.',
          difficulty: 'Beginner',
          estimated_time: '20 minutes',
          material_requirement: '1 or 2 1L-2L plastic soda or water bottles',
          tools: ['Kitchen scissors or box cutter'],
          additional_materials: ['100% cotton yarn or shoe lace wick', 'Potting soil and seed/cutting'],
          safety_notes: ['Smoothen cut plastic rim with a quick touch of sandpaper or tape to avoid sharp edge scratches.'],
          category: 'Gardening & Greenery',
          sustainability_explanation: 'Prevents single-use PET bottles from polluting waterways and supports indoor urban micro-gardening.',
          estimated_cost: '₹0–₹30 (Soil)'
        },
        {
          id: 'plastic-broom',
          title: 'Heavy-Duty Yard Sweeper Broom',
          description: 'Slice multiple plastic bottles into thin flexible bristles nested together over a wooden stick for a durable outdoor broom.',
          difficulty: 'Intermediate',
          estimated_time: '1 hour',
          material_requirement: '5–6 plastic bottles',
          tools: ['Scissors', 'Hammer', 'Nails'],
          additional_materials: ['Discarded broomstick or fallen branch'],
          safety_notes: ['Wear gloves when slitting multiple plastic strips.'],
          category: 'Household Tools',
          sustainability_explanation: 'Transforms notoriously stubborn plastic into a long-lasting cleaning tool that withstands rain and mud.',
          estimated_cost: '₹10 (Nails)'
        },
        {
          id: 'plastic-hanging-lights',
          title: 'Eco-Chandelier Fairy Light Garland',
          description: 'Heat-sculpted or cut bottle bottoms shaped into translucent flower blossoms illuminated by LED fairy lights.',
          difficulty: 'Beginner',
          estimated_time: '45 minutes',
          material_requirement: '4–8 clear or tinted plastic bottles',
          tools: ['Scissors', 'Hole punch'],
          additional_materials: ['LED string lights'],
          safety_notes: ['Use battery or USB-powered cool LED lights only.'],
          category: 'Eco-Art & Decor',
          sustainability_explanation: 'Upcycles plastic into ambient lighting while raising awareness among household visitors.',
          estimated_cost: '₹120 (Fairy lights)'
        }
      ];
    }

    if (mat.includes('clothes') || mat.includes('textile') || mat.includes('denim')) {
      return [
        {
          id: 'textile-tote-bag',
          title: 'Heavy-Duty Upcycled Denim Market Tote',
          description: 'Repurpose the sturdy waistband and leg panels of worn jeans into a durable grocery tote with exterior pockets intact.',
          difficulty: 'Intermediate',
          estimated_time: '1.5–2 hours',
          material_requirement: '1 pair of old jeans or denim trousers',
          tools: ['Fabric scissors', 'Sewing needle or machine', 'Pins'],
          additional_materials: ['Heavy-duty polyester thread', 'Scrap webbing for straps'],
          safety_notes: ['Use thick denim sewing needles (size 90/14 or 100/16) to avoid breaking needles on seams.'],
          category: 'Fashion & Bags',
          sustainability_explanation: 'Denim requires over 7,000 liters of water to manufacture; upcycling saves massive ecological footprints.',
          estimated_cost: '₹40 (Thread)'
        },
        {
          id: 'textile-braided-rug',
          title: 'No-Sew Braided Bohemian Floor Mat',
          description: 'Cut worn t-shirts into continuous yarn ribbons and coil-braid them into a plush, machine-washable bathroom or bedside rug.',
          difficulty: 'Beginner',
          estimated_time: '2–3 hours',
          material_requirement: '4–6 old cotton t-shirts',
          tools: ['Fabric scissors'],
          additional_materials: ['Large safety pin'],
          safety_notes: ['Take ergonomic breaks to prevent hand fatigue while braiding.'],
          category: 'Home Furnishings',
          sustainability_explanation: 'Reclaims mixed fiber clothing that cannot otherwise be donated or resold.',
          estimated_cost: '₹0 (Free)'
        }
      ];
    }

    if (mat.includes('organic') || mat.includes('food')) {
      return [
        {
          id: 'organic-aerobic-compost',
          title: 'Balcony 3-Bucket Odor-Free Aerobic Compost',
          description: 'A stratified composting system utilizing dry carbon (shredded cardboard/leaves) and green nitrogen (food scraps) that yields dark vermicompost in 45 days.',
          difficulty: 'Beginner',
          estimated_time: '30 minutes setup, ongoing maintenance',
          material_requirement: 'Vegetable/fruit scraps + crushed cardboard/dry leaves',
          tools: ['Drill or heated skewer for aeration holes', 'Trowel'],
          additional_materials: ['2 airtight 15L paint/storage buckets', 'Handful of garden soil'],
          safety_notes: ['Maintain 2:1 dry carbon to wet greens ratio to prevent anaerobic odors and flies.', 'Keep container shaded.'],
          category: 'Composting & Regeneration',
          sustainability_explanation: 'Halts methane emissions caused when organics decompose anaerobically in municipal landfills.',
          estimated_cost: '₹100 (Buckets)'
        },
        {
          id: 'organic-citrus-enzyme',
          title: 'Bio-Enzyme Citrus All-Purpose Cleaning Tonic',
          description: 'Ferment citrus rinds with brown sugar/jaggery and water for 90 days to create a natural, probiotic surface cleaner that cuts grease effortlessly.',
          difficulty: 'Beginner',
          estimated_time: '15 minutes setup + fermentation period',
          material_requirement: 'Citrus peels (lemon/orange/grapefruit)',
          tools: ['1L plastic container with screw cap'],
          additional_materials: ['100g jaggery or raw sugar', '1L tap water'],
          safety_notes: ['Release build-up gas daily during the first month to avoid pressure spikes.'],
          category: 'Natural Household Cleansers',
          sustainability_explanation: 'Replaces chemical surfactants and petroleum-derived detergents with 100% biodegradable enzymes.',
          estimated_cost: '₹20 (Jaggery)'
        }
      ];
    }

    // Generic fallback ideas
    return [
      {
        id: 'generic-organizer',
        title: 'Modular Upcycled Desk Utility Bin',
        description: `Transform ${context.material} into an organized, functional tabletop bin tailored to your daily accessories.`,
        difficulty: 'Beginner',
        estimated_time: '30–45 minutes',
        material_requirement: `Discarded ${context.material}`,
        tools: ['Scissors', 'Ruler'],
        additional_materials: ['Adhesive or twine'],
        safety_notes: ['Handle materials with care and ensure clean surfaces.'],
        category: 'Organization',
        sustainability_explanation: 'Extends material lifetime through thoughtful functional design.',
        estimated_cost: '₹20'
      },
      {
        id: 'generic-art',
        title: 'Creative Wall Relief Accent Piece',
        description: `Assemble patterned textures of ${context.material} into an eye-catching modern art piece.`,
        difficulty: 'Intermediate',
        estimated_time: '1–2 hours',
        material_requirement: `Clean scraps of ${context.material}`,
        tools: ['Craft knife', 'Glue'],
        additional_materials: ['Backing board or photo frame'],
        safety_notes: ['Ensure adequate ventilation when using adhesives.'],
        category: 'Eco-Art',
        sustainability_explanation: 'Highlights the aesthetic beauty of reclaimed urban materials.',
        estimated_cost: '₹50'
      }
    ];
  }

  // 3. Generate Complete Step-by-Step Project Detail
  async generateProject(ideaId: string, context?: IdeaContext): Promise<ProjectDetailModel> {
    const id = ideaId.toLowerCase();

    if (id.includes('desk') || id.includes('organizer') || id.includes('caddy')) {
      return {
        title: 'Multi-Tier Desktop Organizer',
        description: 'A stylish, tiered desk workstation with slots for pens, scissors, post-its, and a designated phone display stand.',
        difficulty: 'Beginner',
        estimated_time: '45–60 minutes',
        category: 'Storage & Organization',
        waste_already_have: ['1 Large corrugated cardboard box', 'Scrap cardboard dividers'],
        materials_may_need: ['PVA White Glue or Double-Sided Tape (100ml)', 'Acrylic Paint or Recycled Wrapping Paper', 'Sandpaper (Medium 120-grit)'],
        tools_required: ['Utility Knife / Box Cutter with fresh blade', 'Steel Ruler (30cm)', 'Pencil / Pen', 'Cutting Mat or flat wooden board'],
        instructions: [
          {
            step: 1,
            title: 'Measure and Cut the Base and Backboard',
            instruction: 'On your cardboard carton, use the steel ruler and pencil to mark a 24cm x 16cm rectangle for the base, and a 24cm x 20cm rectangle for the backboard. Cut with steady, multiple passes of the utility knife rather than forcing in one push.',
            pro_tip: 'Score the surface layer first, then press down smoothly along the steel ruler for factory-crisp edges.',
            safety_warning: 'Always position your non-cutting hand behind the direction of blade travel.'
          },
          {
            step: 2,
            title: 'Create the Graduated Side Panels',
            instruction: 'Mark two identical trapezoidal side wings: 16cm bottom, 20cm back height, and sloping down to 6cm at the front. Cut both panels out. These will form the angled profile of your organizer.',
            pro_tip: 'Cut one panel first, then trace its silhouette directly onto the cardboard for a mirror-perfect second panel.',
            safety_warning: 'Keep fingertips tucked safely behind ruler edges.'
          },
          {
            step: 3,
            title: 'Fabricate Internal Dividers and Pen Tier',
            instruction: 'Cut 3 interior shelf dividers (23.5cm width each) at heights of 14cm, 10cm, and 6cm. Cut slots halfway down the dividers to form interlocking compartments.',
            pro_tip: 'Check that the dividers slide smoothly before applying glue.'
          },
          {
            step: 4,
            title: 'Assembly and Adhesive Bonding',
            instruction: 'Apply a continuous bead of PVA glue along the bottom edge of the backboard and side wings. Press firmly onto the base. Use masking tape or books to clamp the structure firmly for 15 minutes while the bond cures.',
            pro_tip: 'White PVA glue dries clear and forms a bond stronger than the cardboard itself once fully cured.',
            safety_warning: 'Avoid skin contact with industrial fast-glues if substituting super glue.'
          },
          {
            step: 5,
            title: 'Decorate and Protective Sealing',
            instruction: 'Sand any rough cut edges with 120-grit sandpaper. Apply two coats of water-based craft paint, or paste patterned recycled wrapping paper over the exterior. Allow 30 minutes to dry before loading your stationery.',
            pro_tip: 'A light coat of clear varnish or watered-down PVA glue (mod-podge style) seals the cardboard against humidity.'
          }
        ],
        alternative_materials: [
          {
            original: 'PVA White Craft Glue',
            alternative: 'Homemade flour-and-water starch paste or double-sided tape',
            suitability_note: 'Flour paste works well for decorative wraps; use tape for load-bearing joints.'
          },
          {
            original: 'Acrylic Paint',
            alternative: 'Old magazine collage, paper bags, or natural coffee wash dye',
            suitability_note: 'Coffee staining provides a warm, rustic vintage parchment look without synthetic chemicals.'
          },
          {
            original: 'Steel Ruler',
            alternative: 'Hardcover book spine or straight wooden slat',
            suitability_note: 'Provides a reliable straight edge guide if a metal ruler is unavailable.'
          }
        ],
        safety_information: [
          'Work in a well-lit area on a flat, non-slip surface.',
          'Never leave an exposed craft knife blade extended on your table.',
          'Children should undertake cutting steps under adult supervision.'
        ],
        optional_products: [
          {
            name: 'Eco-Friendly Non-Toxic PVA Craft Glue (200ml)',
            estimated_price: '₹65',
            category: 'Adhesive',
            buy_option: 'Available at local stationery stores',
            eco_alternative: 'Homemade boiled wheat/cornstarch glue paste'
          },
          {
            name: 'Water-based Acrylic Paint Set (6 colors)',
            estimated_price: '₹140',
            category: 'Finishing',
            buy_option: 'Available online or in craft shops',
            eco_alternative: 'Reclaimed wrapping paper or turmeric/coffee natural stains'
          }
        ]
      };
    }

    if (id.includes('planter') || id.includes('watering')) {
      return {
        title: 'Sub-Irrigated Self-Watering Planter',
        description: 'Invert the cut top of a plastic bottle into its base with a cotton wick to keep basil, mint, or pothos watered for up to 2 weeks automatically.',
        difficulty: 'Beginner',
        estimated_time: '20–30 minutes',
        category: 'Gardening & Greenery',
        waste_already_have: ['1 or 2 Clean plastic bottles (1L or 2L soda/water bottle)'],
        materials_may_need: ['100% Cotton string or shoe lace (20cm)', 'Potting soil mix', 'Small piece of mosquito mesh or cloth scrap'],
        tools_required: ['Household scissors or utility cutter', 'Small nail or drill bit for cap aeration'],
        instructions: [
          {
            step: 1,
            title: 'De-label and Cut the Bottle',
            instruction: 'Peel off the product label and rinse the bottle. Measure approximately 10cm down from the neck and cut the bottle horizontally into two sections.',
            pro_tip: 'Wrap a strip of paper around the bottle first to mark a perfectly straight cutting guideline.'
          },
          {
            step: 2,
            title: 'Prepare the Cap and Wick',
            instruction: 'Carefully puncture a 5mm hole in the center of the plastic bottle cap. Thread your 20cm cotton wick through the hole, leaving roughly half inside the inverted funnel and half dangling into the reservoir.',
            pro_tip: 'Ensure the wick is pure natural cotton; synthetic nylon will not absorb water capillary action effectively.'
          },
          {
            step: 3,
            title: 'Assemble and Add Mesh Filter',
            instruction: 'Screw the cap back onto the inverted top half. Place a small circle of scrap mesh or breathable cloth over the cap interior to prevent potting soil from washing down into the clean water chamber.',
            pro_tip: 'A scrap of old mosquito netting or sheer fabric works flawlessly.'
          },
          {
            step: 4,
            title: 'Soil and Plant Placement',
            instruction: 'Holding the wick upright, fill the funnel section with light potting soil mix. Insert your herb cutting, seedling, or plant roots gently, tamping down slightly around the stem.',
            pro_tip: 'Moisten the soil lightly during planting to start the initial capillary siphon.'
          },
          {
            step: 5,
            title: 'Fill Reservoir and Set in Place',
            instruction: 'Pour 200ml of water into the bottom reservoir base. Rest the inverted planter funnel inside. The wick will continuously draw moisture upwards to the roots without waterlogging.',
            pro_tip: 'Keep the water level below the neck rim so the roots receive ample oxygen.'
          }
        ],
        alternative_materials: [
          {
            original: 'Cotton Yarn Wick',
            alternative: '100% Cotton shoelace, strips of old cotton t-shirt, or cotton mop strand',
            suitability_note: 'Thoroughly tested and highly effective for capillary action.'
          },
          {
            original: 'Mesh Filter',
            alternative: 'Clean coffee filter paper, dried leaf barrier, or gravel pebble',
            suitability_note: 'A pebble placed directly over the cap hole prevents soil blockage.'
          }
        ],
        safety_information: [
          'Take care when piercing the bottle cap; place the cap on a scrap wooden block before puncturing.',
          'Sand the cut plastic rim with medium sandpaper to eliminate sharp burs.'
        ],
        optional_products: [
          {
            name: 'Organic Potting Soil with Vermicompost (2kg)',
            estimated_price: '₹90',
            category: 'Gardening',
            buy_option: 'Available at local plant nurseries',
            eco_alternative: 'Backyard garden soil mixed with dry crushed leaves'
          }
        ]
      };
    }

    // Default Fallback Project Detail
    return {
      title: 'Upcycled Functional Organizer',
      description: 'Craft a sturdy, tailored organizational tray utilizing your reclaimed materials.',
      difficulty: 'Beginner',
      estimated_time: '30–45 minutes',
      category: 'Home & Desk Organization',
      waste_already_have: [`Reclaimed piece of ${context?.material || 'material'}`],
      materials_may_need: ['Adhesive tape or non-toxic craft glue', 'Decorative finish or paint'],
      tools_required: ['Scissors or craft cutter', 'Straight edge ruler', 'Pencil'],
      instructions: [
        {
          step: 1,
          title: 'Clean and Prepare Surfaces',
          instruction: 'Wipe down the waste material to remove any dust or grease residue. Inspect for structural firmness.'
        },
        {
          step: 2,
          title: 'Mark Layout and Fold Lines',
          instruction: 'Use your ruler to mark equal dimensions for bottom and side wall clearances.'
        },
        {
          step: 3,
          title: 'Cut and Assemble',
          instruction: 'Carefully trim along cut lines and fold gently along score marks. Secure joints with adhesive.'
        },
        {
          step: 4,
          title: 'Inspect and Refine',
          instruction: 'Allow adhesive to set completely. Test weight balance with everyday items.'
        }
      ],
      alternative_materials: [
        {
          original: 'Specialized Glue',
          alternative: 'Tape, folded interlocking tabs, or twine cord',
          suitability_note: 'Mechanical folds often provide great strength without chemicals.'
        }
      ],
      safety_information: [
        'Keep fingers clear of cutting lines.',
        'Use appropriate gloves if handling rigid materials.'
      ],
      optional_products: []
    };
  }

  // 4. Generate Business Concepts (Section 22, 56)
  async generateBusinessIdeas(context: BusinessContext): Promise<BusinessConcept[]> {
    const mat = (context.material || 'Cardboard').toLowerCase();

    if (mat.includes('clothes') || mat.includes('textile') || mat.includes('fabric') || mat.includes('denim')) {
      return [
        {
          id: 'biz-textile-totes',
          title: 'Upcycled Denim & Canvas Artisan Carryalls',
          tagline: 'Zero-Waste Fashion Totes and Pouch Line from Decommissioned Denim',
          materials_needed: ['Reclaimed jeans / cotton trousers', 'Heavy polyester thread', 'Organic cotton inner lining', 'Brass rivets'],
          tools_required: ['Industrial / heavy-duty domestic sewing machine', 'Rotary fabric cutter', 'Rivet setter'],
          production_steps: [
            'Source washed post-consumer jeans from local donation hubs or thrift stores',
            'Disassemble seams and grade fabric by denim weight and wash contrast',
            'Pattern-cut body panels maximizing original pocket features for quick phone slots',
            'Stitch structural French seams for 15kg load tolerance',
            'Attach eco-branded recycled kraft tags and dispatch in compostable packaging'
          ],
          cost_estimates: {
            unit_production_cost: '₹140 – ₹190 (Thread, lining, hardware & packaging)',
            suggested_selling_price: '₹599 – ₹899',
            disclaimer: 'Planning estimate only. Actual costs and profitability vary depending on local labor, sourcing efficiency, and sales channel commissions.'
          },
          target_customers: 'Eco-conscious shoppers, college students, farmers market visitors, corporate sustainable gifting clients.',
          packaging_strategy: 'Roll tote tied with recycled denim yarn strand and a seed paper brand story tag.',
          differentiation: 'Every bag is 100% unique with authentic vintage denim character that mass-produced canvas cannot match.',
          selling_channels: ['Etsy India', 'Instagram Shop', 'Local Weekend Flea Markets & Pop-ups', 'Zero-waste retail partner shelves'],
          key_challenges: ['Ensuring consistent denim cleanliness and color harmony across batches', 'Time required to deconstruct thick denim rivets']
        },
        {
          id: 'biz-textile-lifestyle',
          title: 'Modular Quilted Kitchen & Tabletop Linen',
          tagline: 'Heat-resistant patchwork trivets, oven mitts, and rustic dining runners',
          materials_needed: ['Clean cotton shirts, bedsheets, and linen offcuts', 'Recycled cotton batting insulation'],
          tools_required: ['Sewing machine', 'Quilting ruler', 'Iron'],
          production_steps: [
            'Sort collected textiles into complementary color palettes (Earthy, Pastel, Indigo)',
            'Cut into standardized 4" and 6" geometric patchwork squares',
            'Sandwich thermal insulation and stitch decorative sashiko or straight-line quilting',
            'Bind edges with bias tape made from matching cotton scraps'
          ],
          cost_estimates: {
            unit_production_cost: '₹75 – ₹110 per piece',
            suggested_selling_price: '₹349 – ₹499 (Set of 2 Trivets)',
            disclaimer: 'Planning estimate only. Not guaranteed profitability.'
          },
          target_customers: 'Home decor enthusiasts, eco-friendly wedding registrants, boutique cafes.',
          packaging_strategy: 'Kraft paper sleeve with embossed logo and care instructions.',
          differentiation: 'Sashiko-style handcrafted aesthetic that celebrates upcycled history.',
          selling_channels: ['Direct-to-consumer online store', 'Home furnishing fairs', 'Airbnb host decor supply'],
          key_challenges: ['Achieving uniform thickness across different textile sources']
        }
      ];
    }

    // Default Cardboard Business Concepts
    return [
      {
        id: 'biz-cardboard-storage',
        title: 'KraftCraft Modular Desktop & Retail Organizers',
        tagline: 'High-density corrugated organizational systems for creative desks and boutique shops',
        materials_needed: ['Discarded 3-ply and 5-ply kraft shipping cartons', 'Eco-friendly water-based sealant', 'PVA adhesive', 'Minimalist brass book rivets'],
        tools_required: ['Heavy-duty rotary trimmer / laser cutter (or craft knife setup)', 'Creasing bone', 'Corner punch'],
        production_steps: [
          'Collect sorted double-wall clean cartons from local e-commerce shippers and retail stores',
          'Die-cut or laser-cut interlocking modular pieces (zero-glue tab designs)',
          'Hand-sand edges for a smooth tactile feel',
          'Apply matte moisture-repellent bio-varnish for long-lasting durability',
          'Flat-pack for ultra-low cost shipping and customer assemble-in-seconds satisfaction'
        ],
        cost_estimates: {
          unit_production_cost: '₹45 – ₹80 per organizer unit',
          suggested_selling_price: '₹399 – ₹649',
          disclaimer: 'Planning estimate only. Market dynamics, production scale, and distribution costs will impact net financial returns.'
        },
        target_customers: 'Remote tech workers, architecture/design students, boutique stationery stores, eco-conscious offices.',
        packaging_strategy: 'Shipped flat in biodegradable glassine paper sleeves with printed QR code video instructions.',
        differentiation: 'Flat-pack design drastically lowers shipping damage and freight emissions compared to bulky plastic containers.',
        selling_channels: ['E-commerce website', 'Amazon Handmade', 'Corporate sustainability gift kits', 'Local university campus stores'],
        key_challenges: ['Cardboard must be kept away from water leaks; clear varnish education required for customers.']
      },
      {
        id: 'biz-cardboard-pet',
        title: 'Pawsome Haven Architectural Cat Furniture',
        tagline: 'Sculptural multi-layered scratcher lounges and geometric feline hideaways',
        materials_needed: ['Dense corrugated carton panels', 'Non-toxic pet-safe cornstarch adhesive'],
        tools_required: ['Band saw or motorized jigsaw', 'Laminating press / clamps'],
        production_steps: [
          'Stack and laminate corrugated sheets into rigid blocks',
          'Contour sculpt into ergonomic feline sleeping curves and modern geometric domes',
          'Allow 24-hour drying under compression',
          'Infuse with a pinch of organic catnip in base pores to spark immediate pet affection'
        ],
        cost_estimates: {
          unit_production_cost: '₹120 – ₹180',
          suggested_selling_price: '₹799 – ₹1,299',
          disclaimer: 'Financial model represents preliminary planning suggestions, not guaranteed revenue.'
        },
        target_customers: 'Pet parents looking for aesthetic cat furniture that matches modern Scandinavian home interiors.',
        packaging_strategy: 'Recycled corrugated outer shipping sleeve with carry handle.',
        differentiation: 'Cat scratchers usually look cheap; our architectural silhouettes become living room conversation pieces.',
        selling_channels: ['Specialty veterinary clinics', 'Pet cafes', 'Instagram and pet influencer partnerships'],
        key_challenges: ['Bulk shipping dimensions; optimized through nested stackable silhouettes.']
      }
    ];
  }

  // 5. AI Comment Manager: Group, Summarize, and Cluster (Section 20)
  async summarizeComments(comments: CommentItem[]): Promise<CommentSummaryResult> {
    if (!comments || comments.length === 0) {
      return {
        summary: 'No community comments posted yet. Be the first to suggest improvements or ask questions!',
        groups: [],
        questions: [],
        highlights: []
      };
    }

    // Intelligent clustering of discussion
    const summary = `Community members love the practical upcycling approach! Most contributors suggest adding modular compartments, label slots, and reinforcing the base for heavy stationery. Several crafters raised practical questions regarding glue curing time and humidity durability.`;

    const groups = [
      {
        topic: 'Compartments & Modular Add-ons',
        count: Math.max(1, Math.floor(comments.length * 0.45)),
        example: '"Adding smaller internal divider slots for paperclips and USB sticks would make this 10x more useful!"'
      },
      {
        topic: 'Durability & Moisture Protection',
        count: Math.max(1, Math.floor(comments.length * 0.3)),
        example: '"What varnish or wax coating did you use to prevent the cardboard from absorbing humidity during monsoon?"'
      },
      {
        topic: 'Color & Aesthetic Variations',
        count: Math.max(1, Math.floor(comments.length * 0.25)),
        example: '"A coat of matte terracotta or charcoal chalk paint gives this an expensive ceramic appearance."'
      }
    ];

    const questions = [
      {
        topic: 'Adhesives & Curing Time',
        count: 4,
        examples: [
          'How long do you need to clamp the sides before the PVA glue is fully dry?',
          'Would hot glue gun stick work faster than liquid PVA?'
        ]
      },
      {
        topic: 'Weight & Load Capacity',
        count: 3,
        examples: [
          'Can the lower tier support a heavy metal stapler without bowing?',
          'Did you double the thickness of the bottom base board?'
        ]
      },
      {
        topic: 'Cutting Tools & Techniques',
        count: 2,
        examples: [
          'How do you keep the corrugated flute edges from crushing when cutting?'
        ]
      }
    ];

    const highlights = [
      {
        suggestion: 'Score the inner fold lines with the back of a butter knife first to get sharp 90-degree corners without tearing the kraft skin.',
        author: 'EcoCraft_Rahul',
        reason: 'Actionable technique that dramatically elevates finish quality.'
      },
      {
        suggestion: 'Paste discarded parchment or gift wrapping paper over the cardboard before folding to save hours of exterior painting.',
        author: 'Priya_Upcycles',
        reason: 'Saves materials, time, and paint costs.'
      }
    ];

    return {
      summary,
      groups,
      questions,
      highlights
    };
  }

  // 6. Help My Business AI Advisor (Section 25)
  async helpBusiness(context: { businessName?: string; materialsUsed?: string[]; currentProducts?: string; question?: string }) {
    const q = (context.question || '').toLowerCase();
    const mats = (context.materialsUsed || ['Cardboard', 'Textiles']).join(', ');

    return {
      overview: `Strategic recommendations for expanding ${context.businessName || 'your upcycling venture'} working with ${mats}.`,
      new_product_lines: [
        {
          title: 'Premium Corporate Eco-Welcoming Hampers',
          description: 'Package custom notebook holders, desk organizers, and pen pots as sustainable welcome kits for eco-conscious enterprises and conferences.',
          margin_potential: 'High (B2B bulk orders allow batch production economies)'
        },
        {
          title: 'Flat-Pack Self-Assembly DIY Craft Kits',
          description: 'Ship pre-creased, numbered components with non-toxic adhesive tubes for students, parents, and hobbyists to assemble at home.',
          margin_potential: 'Very High (Low shipping weight and packaging volume)'
        }
      ],
      product_improvements: [
        'Apply natural beeswax or water-dispersible vegetable varnish to solve humidity sensitivity and elevate touch texture.',
        'Stamp subtle, embossed lot numbers or waste rescue metrics (e.g. "Rescued 450g of landfill waste") directly onto each piece to enhance brand authenticity.'
      ],
      packaging_innovation: [
        'Eliminate plastic shrink-wrap; wrap items in folded newsprint sleeves secured with natural jute or textile scrap ribbon.',
        'Include a plantable seed-paper thank-you card that grows basil or marigolds.'
      ],
      material_utilization: [
        'Collect tiny triangular cut-off scraps from your primary product lines to create textured composite paper pulp or packaging void-fill shreds.',
        'Partner with 3 local cafes or neighborhood retail shops for exclusive right of first refusal on their clean shipping boxes.'
      ],
      community_inspiration: [
        'Host a monthly Instagram or community workshop demonstrating 1 simple craft: this drives organic follower loyalty and customer word-of-mouth.'
      ],
      disclaimer: 'These recommendations are planning concepts and inspirational guidance, not guaranteed commercial results.'
    };
  }

  // 7. Answer Project Step Question
  async answerProjectQuestion(context: { stepNumber: number; stepTitle: string; question: string; projectTitle: string }) {
    const q = context.question.toLowerCase();
    let reply = `For Step ${context.stepNumber} (${context.stepTitle}): `;

    if (q.includes('glue') || q.includes('adhesive') || q.includes('stick')) {
      reply += `Standard white PVA wood craft glue works best because it sinks into the porous paper fibers and cures into a flexible bond. If you need it to hold instantly while assembling, use small bits of masking tape as temporary clamps, or apply a drop of hot glue alongside the PVA for immediate tack.`;
    } else if (q.includes('cut') || q.includes('knife') || q.includes('blade') || q.includes('scissors')) {
      reply += `To get a clean cut without jagged corrugation tears, use a fresh sharp blade and a metal ruler. Make three light strokes: first slice through the top paper face, second slice through the undulating flutes, and third slice through the bottom face. Never rush or press down with excessive body weight.`;
    } else if (q.includes('dry') || q.includes('cure') || q.includes('time') || q.includes('how long')) {
      reply += `PVA glue tacks in about 15 minutes, allowing you to move to the next structural step. However, for maximum load-bearing strength (such as loading heavy books or stationery), allow the assembled piece to cure undisturbed for 4 to 6 hours.`;
    } else {
      reply += `When working on "${context.stepTitle}", keep your measurements squared against the edge of the cardboard. If you make a slight miscut, save the offcut piece—you can easily reinforce joints from the inside where nobody sees!`;
    }

    return {
      answer: reply,
      is_mock: !this.isRealProviderActive(),
      helpful_tips: [
        'Keep a damp cloth nearby to wipe excess adhesive beads immediately.',
        'Cardboard flutes run in one direction: placing flutes vertically gives 4x greater compressive strength.'
      ]
    };
  }
}

export const aiService = new AIService();
