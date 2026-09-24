import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db';

export function runSeed() {
  console.log('🌱 Seeding Waste2Worth database with rich production-grade demo data...');
  initDatabase();

  const passwordHash = bcrypt.hashSync('Password123!', 10);

  // 1. Seed Users (Different Roles: USER, CREATOR, BUSINESS, MODERATOR, ADMIN, STUDENT)
  const users = [
    {
      id: 'user-admin',
      name: 'Elena Rostova',
      username: 'elena_admin',
      email: 'admin@waste2worth.eco',
      role: 'ADMIN',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      bio: 'Environmental systems designer & Waste2Worth community moderator.',
      skill_level: 'Advanced'
    },
    {
      id: 'user-creator-rahul',
      name: 'Rahul Sharma',
      username: 'rahul_crafts',
      email: 'rahul@creator.eco',
      role: 'CREATOR',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      bio: 'Upcycling maker & industrial design student. Turning packaging cardboard into kinetic art and modular desk furniture.',
      skill_level: 'Advanced'
    },
    {
      id: 'user-creator-priya',
      name: 'Priya Sundaram',
      username: 'priya_textiles',
      email: 'priya@textiles.eco',
      role: 'CREATOR',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80',
      bio: 'Textile artist transforming discarded post-consumer denim and sari scraps into timeless accessories.',
      skill_level: 'Intermediate'
    },
    {
      id: 'user-biz-greenkraft',
      name: 'Aarav Patel',
      username: 'greenkraft_studios',
      email: 'aarav@greenkraft.in',
      role: 'BUSINESS',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
      bio: 'Founder at GreenKraft Studios. We turn corporate corrugated packaging waste into ergonomic commercial desk wares.',
      skill_level: 'Advanced'
    },
    {
      id: 'user-student-maya',
      name: 'Maya Chen',
      username: 'maya_ecostudent',
      email: 'maya@student.edu',
      role: 'USER',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
      bio: 'High school biology and environmental science student exploring zero-waste composting and balcony micro-gardening.',
      skill_level: 'Beginner'
    },
    {
      id: 'user-donor-vikram',
      name: 'Vikram Malhotra',
      username: 'vikram_m',
      email: 'vikram@donor.org',
      role: 'USER',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
      bio: 'Logistics coordinator passionate about circular logistics. Regularly listing clean bulk packaging boxes for educators and makers.',
      skill_level: 'Beginner'
    }
  ];

  for (const u of users) {
    db.prepare(`
      INSERT OR REPLACE INTO users (id, name, username, email, password_hash, avatar_url, bio, skill_level, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(u.id, u.name, u.username, u.email, passwordHash, u.avatar_url, u.bio, u.skill_level, u.role);
  }

  // 2. Seed Materials
  const materials = [
    {
      id: 'mat-cardboard',
      name: 'Cardboard',
      category: 'Paper & Board',
      description: 'Sturdy corrugated fiberboard from delivery cartons and product boxes.',
      safety_information: 'Use safe cutting mats; retract utility knife blades when pausing.',
      icon: '📦'
    },
    {
      id: 'mat-plastic-bottle',
      name: 'Plastic bottle',
      category: 'Polymers',
      description: 'Food-grade PET beverage and personal care bottles.',
      safety_information: 'Rinse thoroughly; sand cut plastic edges to avoid skin scratches.',
      icon: '🍾'
    },
    {
      id: 'mat-textiles',
      name: 'Old clothes/textiles',
      category: 'Fabrics',
      description: 'Worn cotton denim, shirts, linens, and fabric offcuts.',
      safety_information: 'Use sharp fabric shears; pin carefully to avoid needle sticks.',
      icon: '👕'
    },
    {
      id: 'mat-glass',
      name: 'Glass',
      category: 'Silicates',
      description: 'Clean glass sauce jars, beverage bottles, and containers.',
      safety_information: 'Inspect rims for chips; never expose to thermal shock.',
      icon: '🫙'
    },
    {
      id: 'mat-organic',
      name: 'Organic waste',
      category: 'Biomass',
      description: 'Fruit peels, vegetable scraps, coffee grounds, and dry garden leaves.',
      safety_information: 'Maintain carbon-to-nitrogen ratios to prevent anaerobic odor.',
      icon: '🍎'
    }
  ];

  for (const m of materials) {
    db.prepare(`
      INSERT OR REPLACE INTO materials (id, name, category, description, safety_information, icon)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(m.id, m.name, m.category, m.description, m.safety_information, m.icon);
  }

  // 3. Seed Projects
  const projects = [
    {
      id: 'proj-cardboard-organizer',
      creator_id: 'user-creator-rahul',
      title: 'Architectural Geometric Desk Organizer',
      description: 'A handsome, tiered desk workstation with slots for pens, scissors, post-its, and a designated phone display stand made entirely from delivery cartons.',
      difficulty: 'Beginner',
      estimated_time: '45–60 minutes',
      material_requirements: JSON.stringify(['1 Large corrugated cardboard box', 'Scrap cardboard dividers']),
      tool_requirements: JSON.stringify(['Utility Knife', 'Steel Ruler', 'PVA Glue', 'Pencil']),
      instructions: JSON.stringify([
        { step: 1, title: 'Measure and Cut Base', instruction: 'Mark a 24cm x 16cm rectangle for the base and cut with three steady passes of the craft knife.' },
        { step: 2, title: 'Profile the Sloped Sides', instruction: 'Cut two identical trapezoids sloping from 20cm at the back down to 6cm at the front.' },
        { step: 3, title: 'Cut Tier Dividers', instruction: 'Cut internal dividers at 14cm, 10cm, and 6cm heights with interlocking vertical slots.' },
        { step: 4, title: 'Glue and Clamp Structure', instruction: 'Apply PVA glue along bottom edges and secure with masking tape for 15 minutes.' },
        { step: 5, title: 'Finish with Kraft Sealer', instruction: 'Lightly sand edges and apply two coats of clear water-based sealer or recycled wrapping paper.' }
      ]),
      safety_information: 'Work on a cutting mat and cut away from your non-cutting hand.',
      cover_image: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&q=80',
      category: 'Cardboard Storage',
      is_organic: 0,
      alternative_materials: JSON.stringify([
        { original: 'PVA Glue', alternative: 'Double-sided tape or homemade starch paste', suitability_note: 'Tape allows immediate assembly.' }
      ]),
      optional_products: JSON.stringify([
        { name: 'Eco-Friendly PVA Craft Glue', estimated_price: '₹65', category: 'Adhesive', buy_option: 'Local stationery', eco_alternative: 'Boiled cornstarch paste' }
      ]),
      views_count: 1240
    },
    {
      id: 'proj-bottle-planter',
      creator_id: 'user-student-maya',
      title: 'Sub-Irrigated Self-Watering Herb Planter',
      description: 'Invert the cut top of a plastic soda bottle into its base with a natural cotton wick to keep basil or mint hydrated automatically.',
      difficulty: 'Beginner',
      estimated_time: '20 minutes',
      material_requirements: JSON.stringify(['1 Clean 1.5L or 2L plastic bottle', 'Cotton string (20cm)']),
      tool_requirements: JSON.stringify(['Scissors', 'Puncturing pin']),
      instructions: JSON.stringify([
        { step: 1, title: 'Cut Bottle in Half', instruction: 'Wash bottle and cut horizontally roughly 10cm below the neck.' },
        { step: 2, title: 'Cap Wick Hole', instruction: 'Puncture a 5mm hole in the bottle cap and thread the cotton wick through.' },
        { step: 3, title: 'Soil and Planting', instruction: 'Insert inverted funnel into base, fill with potting soil, and plant seedling.' },
        { step: 4, title: 'Add Reservoir Water', instruction: 'Pour 250ml water into the bottom reservoir.' }
      ]),
      safety_information: 'Sand the cut plastic rim to remove sharp burs.',
      cover_image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80',
      category: 'Plastic bottle Gardening',
      is_organic: 0,
      views_count: 890
    },
    {
      id: 'proj-denim-tote',
      creator_id: 'user-creator-priya',
      title: 'Heavy-Duty Upcycled Denim Market Tote',
      description: 'Repurpose the sturdy waistband and leg panels of worn jeans into a durable grocery carryall with pockets intact.',
      difficulty: 'Intermediate',
      estimated_time: '1.5 hours',
      material_requirements: JSON.stringify(['1 Pair worn denim jeans', 'Heavy polyester thread']),
      tool_requirements: JSON.stringify(['Fabric Shears', 'Sewing Machine or Needle', 'Pins']),
      instructions: JSON.stringify([
        { step: 1, title: 'Cut Legs Below Pockets', instruction: 'Cut across the jeans legs right below the back pockets to form the upper body.' },
        { step: 2, title: 'Stitch Bottom Seam', instruction: 'Turn inside out and sew a reinforced double straight stitch across the bottom opening.' },
        { step: 3, title: 'Fashion Carry Straps', instruction: 'Cut 4cm wide strips from the remaining lower leg panels and sew into sturdy shoulder straps.' },
        { step: 4, title: 'Attach Straps to Waistband', instruction: 'Bar-tack straps securely to the reinforced inner waistband.' }
      ]),
      safety_information: 'Use thick denim sewing needles to avoid breaking on bulky seams.',
      cover_image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80',
      category: 'Old clothes/textiles Fashion',
      is_organic: 0,
      views_count: 1450
    },
    {
      id: 'proj-balcony-compost',
      creator_id: 'user-student-maya',
      title: 'Odor-Free Balcony Aerobic Compost Bin',
      description: 'Stratify kitchen greens and shredded dry cardboard in a twin-bucket system to harvest rich black compost in 40 days.',
      difficulty: 'Beginner',
      estimated_time: '30 minutes setup',
      material_requirements: JSON.stringify(['Fruit & vegetable peels', 'Shredded cardboard & dry leaves']),
      tool_requirements: JSON.stringify(['Aerated storage bucket', 'Small hand trowel']),
      instructions: JSON.stringify([
        { step: 1, title: 'Bottom Aeration Layer', instruction: 'Place 5cm of coarse twigs or crushed cardboard at the base for air circulation.' },
        { step: 2, title: 'Alternate Layers', instruction: 'Layer green wet scraps with twice the volume of dry shredded cardboard (browns).' },
        { step: 3, title: 'Weekly Aeration', instruction: 'Turn the pile once a week with a trowel to infuse oxygen and prevent odor.' }
      ]),
      safety_information: 'Do not add dairy or meat to home balcony compost to prevent pests.',
      cover_image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&q=80',
      category: 'Organic waste Composting',
      is_organic: 1,
      views_count: 670
    }
  ];

  for (const p of projects) {
    db.prepare(`
      INSERT OR REPLACE INTO projects (
        id, creator_id, title, description, difficulty, estimated_time,
        material_requirements, tool_requirements, instructions, safety_information,
        cover_image, category, is_organic, alternative_materials, optional_products, views_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.id, p.creator_id, p.title, p.description, p.difficulty, p.estimated_time,
      p.material_requirements, p.tool_requirements, p.instructions, p.safety_information,
      p.cover_image, p.category, p.is_organic, p.alternative_materials || '[]', p.optional_products || '[]', p.views_count
    );
  }

  // 4. Seed Project Posts (Discover Feed with Before & After!)
  const posts = [
    {
      id: 'post-rahul-desk-organizer',
      user_id: 'user-creator-rahul',
      project_id: 'proj-cardboard-organizer',
      title: 'Turned a Soggy Courier Carton into this Architectural Desk Set!',
      description: 'Had 3 Amazon shipping boxes destined for the trash. Decided to test the geometric interlocking method. Coated with natural beeswax and tea-leaf dye for the warm earthy tint!',
      waste_used: 'Corrugated Cardboard',
      quantity: '2 Delivery Cartons',
      before_image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&q=80', // Discarded cardboard boxes
      after_image: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&q=80', // Beautiful wooden/kraft desk organizer
      difficulty: 'Beginner',
      estimated_time: '1 hour',
      likes_count: 42,
      saves_count: 19
    },
    {
      id: 'post-priya-denim-tote',
      user_id: 'user-creator-priya',
      project_id: 'proj-denim-tote',
      title: 'Never Buying Canvas Totes Again: 10-Year-Old Levi’s Jeans Transformed',
      description: 'The knees tore out, but the heavy denim fabric around the thighs and pockets was still bulletproof. Kept the original pockets on the exterior so I have instant access to my metro card and phone!',
      waste_used: 'Old Clothes / Denim Jeans',
      quantity: '1 Pair of Worn Jeans',
      before_image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80', // Torn vintage jeans
      after_image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80', // Chic artisan denim tote
      difficulty: 'Intermediate',
      estimated_time: '1.5 hours',
      likes_count: 67,
      saves_count: 38
    },
    {
      id: 'post-maya-bottle-garden',
      user_id: 'user-student-maya',
      project_id: 'proj-bottle-planter',
      title: 'Balcony Herb Wall using Discarded 2L Soda Bottles',
      description: 'Collected 6 plastic bottles from my college cafeteria bin. Installed cotton wicks and now my basil and mint thrive even when I forget to water during exam week!',
      waste_used: 'Plastic bottles',
      quantity: '6 Soda Bottles',
      before_image: 'https://images.unsplash.com/photo-1562077772-3ab121863412?w=800&q=80', // Plastic bottle waste
      after_image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80', // Lush indoor green planter
      difficulty: 'Beginner',
      estimated_time: '40 minutes',
      likes_count: 31,
      saves_count: 14
    }
  ];

  for (const post of posts) {
    db.prepare(`
      INSERT OR REPLACE INTO project_posts (
        id, user_id, project_id, title, description, waste_used, quantity,
        before_image, after_image, difficulty, estimated_time, likes_count, saves_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      post.id, post.user_id, post.project_id, post.title, post.description,
      post.waste_used, post.quantity, post.before_image, post.after_image,
      post.difficulty, post.estimated_time, post.likes_count, post.saves_count
    );
  }

  // 5. Seed Realistic Comments on Rahul's Cardboard Project Post
  // Perfect for demonstrating Section 20 (AI Comment Manager grouping and discussion summary)
  const comments = [
    {
      id: 'comm-1',
      post_id: 'post-rahul-desk-organizer',
      user_id: 'user-creator-priya',
      content: 'This looks stunning Rahul! Did you use standard PVA glue or wood glue? How long did it take to cure before you could put heavy items on it?'
    },
    {
      id: 'comm-2',
      post_id: 'post-rahul-desk-organizer',
      user_id: 'user-student-maya',
      content: 'You could make a version with multiple smaller compartments for paperclips and thumb drives!'
    },
    {
      id: 'comm-3',
      post_id: 'post-rahul-desk-organizer',
      user_id: 'user-donor-vikram',
      content: 'I have 40 clean cartons at my warehouse if anyone in Mumbai wants to build something like this.'
    },
    {
      id: 'comm-4',
      post_id: 'post-rahul-desk-organizer',
      user_id: 'user-biz-greenkraft',
      content: 'Pro tip for anyone trying this: Score the fold lines lightly with the back of a butter knife first. It prevents the corrugated kraft face from tearing.'
    },
    {
      id: 'comm-5',
      post_id: 'post-rahul-desk-organizer',
      user_id: 'user-admin',
      content: 'Adding internal label slots or magnetic paperclip troughs would make this look like a ₹1,200 luxury retail item!'
    },
    {
      id: 'comm-6',
      post_id: 'post-rahul-desk-organizer',
      user_id: 'user-student-maya',
      content: 'Can the lower tier support a heavy metal stapler without bowing?'
    },
    {
      id: 'comm-7',
      post_id: 'post-rahul-desk-organizer',
      user_id: 'user-creator-rahul',
      content: 'Thanks everyone! Yes, standard PVA cured in 15 mins for assembly, but I let it cure overnight for full structural rigidity.'
    }
  ];

  for (const c of comments) {
    db.prepare(`
      INSERT OR REPLACE INTO comments (id, post_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `).run(c.id, c.post_id, c.user_id, c.content);
  }

  // 6. Pre-generate Initial AI Comment Summary for Post 1
  db.prepare(`
    INSERT OR REPLACE INTO comment_ai_summaries (
      id, post_id, summary, groups, questions, highlights, generated_at
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    'summary-rahul-desk',
    'post-rahul-desk-organizer',
    'Community feedback enthusiastically praises the clean finish! Contributors suggest adding modular divider slots for stationery clips and using magnetic paperclip troughs. Practical questions focus on PVA glue curing time and base load capacity.',
    JSON.stringify([
      { topic: 'Modular Divider & Label Suggestions', count: 3, example: '"You could make a version with multiple smaller compartments for paperclips!"' },
      { topic: 'Durability & Load-Bearing Questions', count: 2, example: '"Can the lower tier support a heavy metal stapler without bowing?"' },
      { topic: 'Scoring & Cutting Techniques', count: 1, example: '"Score fold lines with the back of a butter knife to prevent tearing."' }
    ]),
    JSON.stringify([
      { topic: 'Glue Curing Time', count: 2, examples: ['How long did it take to cure before placing heavy items?', 'Standard PVA or wood glue?'] },
      { topic: 'Structural Weight Tolerance', count: 1, examples: ['Will the bottom tier sag under heavy staplers?'] }
    ]),
    JSON.stringify([
      { suggestion: 'Score the inner fold lines with the back of a butter knife first to get sharp 90-degree corners without tearing the kraft skin.', author: 'Aarav Patel', reason: 'Prevents corrugated tear-out.' }
    ])
  );

  // 7. Seed Idea Hub Questions (Section 15)
  const ideaRequests = [
    {
      id: 'req-bottles-20',
      user_id: 'user-student-maya',
      material: 'Plastic bottle',
      quantity: '20 bottles',
      budget: 'Under ₹200',
      skill_level: 'Beginner',
      question: 'I collected 20 identical transparent 1L water bottles from our school sports day. What is the most creative or practical thing I can make with them?'
    },
    {
      id: 'req-cardboard-50',
      user_id: 'user-donor-vikram',
      material: 'Cardboard',
      quantity: '10 large appliance boxes',
      budget: '₹500',
      skill_level: 'Intermediate',
      question: 'Have 10 very thick refrigerator cartons. Looking for ideas for community children play structures or modular shelving.'
    }
  ];

  for (const r of ideaRequests) {
    db.prepare(`
      INSERT OR REPLACE INTO idea_requests (id, user_id, material, quantity, budget, skill_level, question)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(r.id, r.user_id, r.material, r.quantity, r.budget, r.skill_level, r.question);
  }

  // Seed responses for req-bottles-20
  db.prepare(`
    INSERT OR REPLACE INTO idea_responses (id, request_id, user_id, content, is_ai_generated, helpful_count, used_count)
    VALUES (?, ?, NULL, ?, 1, 8, 2)
  `).run(
    'resp-ai-bottles',
    'req-bottles-20',
    '🤖 **Waste2Worth AI Suggestion: Vertical Hydroponic Salad Tower**\n\nCut drainage holes and nest 5 bottles vertically with a string wick. Connect 4 towers side-by-side on a wooden frame. You can grow 20 lettuce heads in a 1-foot balcony footprint!\n\n• **Difficulty:** Beginner\n• **Estimated Time:** 1 hour\n• **Tools:** Scissors, soldering iron or nail for holes\n• **Cost:** ₹0 (Reclaimed materials)'
  );

  db.prepare(`
    INSERT OR REPLACE INTO idea_responses (id, request_id, user_id, content, is_ai_generated, helpful_count, used_count)
    VALUES (?, ?, ?, ?, 0, 12, 5)
  `).run(
    'resp-rahul-bottles',
    'req-bottles-20',
    'user-creator-rahul',
    'Try making acoustic ceiling baffles or modular drawer organizers! Cut the bottles into 3-inch cylinders, heat the rims briefly against an iron on low heat to curl the sharp plastic smooth, and glue them into a honey-comb grid for sock/cable drawers.'
  );

  // 8. Seed Businesses (Section 23 & 24)
  const businesses = [
    {
      id: 'biz-greenkraft',
      user_id: 'user-biz-greenkraft',
      name: 'GreenKraft Eco-Design Studio',
      description: 'Transforming industrial corrugated cardboard packaging into minimalist architectural home office desk accessories and flat-pack lighting fixtures.',
      story: 'Started in 2024 after witnessing thousands of tons of pristine shipping cartons discarded behind local warehouses. We engineered a proprietary non-toxic moisture-resistant biowax coating that makes cardboard durable enough to last for years.',
      location: 'Pune, Maharashtra',
      website: 'https://greenkraft.eco',
      contact_method: 'Platform Chat & info@greenkraft.eco',
      materials_used: JSON.stringify(['Cardboard', 'Bio-Resin', 'Jute Cord']),
      logo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&q=80'
    },
    {
      id: 'biz-revive-denim',
      user_id: 'user-creator-priya',
      name: 'Revive Denim Works',
      description: 'Handcrafted artisan carryalls, laptop sleeves, and patchwork home furnishings upcycled from post-consumer denim jeans.',
      story: 'Each piece preserves the original wear patterns, copper rivets, and fading of vintage jeans. No two products are ever identical.',
      location: 'Bengaluru, Karnataka',
      website: 'https://revivedenim.eco',
      contact_method: 'Platform Inquiries & Instagram @revivedenim',
      materials_used: JSON.stringify(['Old clothes/textiles', 'Reclaimed Brass Hardware']),
      logo_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200&q=80'
    }
  ];

  for (const b of businesses) {
    db.prepare(`
      INSERT OR REPLACE INTO businesses (id, user_id, name, description, story, location, website, contact_method, materials_used, logo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(b.id, b.user_id, b.name, b.description, b.story, b.location, b.website, b.contact_method, b.materials_used, b.logo_url);
  }

  // Seed Business Products
  const products = [
    {
      id: 'prod-gk-organizer',
      business_id: 'biz-greenkraft',
      name: 'Architectural Geometric Desk Set',
      description: '4-Piece modular desk caddy crafted from compressed recycled shipping cartons with matte moisture-resistant bio-varnish.',
      price: 549,
      images: JSON.stringify(['https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600&q=80']),
      materials: JSON.stringify(['Cardboard', 'Natural Wax'])
    },
    {
      id: 'prod-revive-tote',
      business_id: 'biz-revive-denim',
      name: 'Artisan Upcycled Denim Market Tote',
      description: 'Heavyweight reinforced shopper bag with dual front phone pockets and vintage copper rivet accents.',
      price: 799,
      images: JSON.stringify(['https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80']),
      materials: JSON.stringify(['Recycled Denim', 'Organic Cotton Lining'])
    }
  ];

  for (const p of products) {
    db.prepare(`
      INSERT OR REPLACE INTO business_products (id, business_id, name, description, price, images, materials)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(p.id, p.business_id, p.name, p.description, p.price, p.images, p.materials);
  }

  // 9. Seed Donations (Section 26 & 57)
  const donations = [
    {
      id: 'don-boxes-50',
      user_id: 'user-donor-vikram',
      material: 'Cardboard Boxes',
      quantity: 50,
      remaining_quantity: 30, // 20 already claimed (Section 57 partial claim example!)
      unit: 'boxes',
      condition: 'Clean, Single-Use Shipping Cartons',
      description: '50 clean double-wall delivery boxes from our office IT equipment upgrade. Flat-packed and dry. Free for makers, students, or small businesses.',
      approx_location: 'Andheri East, Mumbai',
      image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&q=80',
        'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&q=80'
      ]),
      pickup_option: 'Self Pickup & Local Delivery Available',
      delivery_available: 1,
      estimated_delivery_fee: 80,
      status: 'partially_claimed',
      verification_status: 'verified',
      verified_at: '2026-03-20 10:00:00'
    },
    {
      id: 'don-bottles-40',
      user_id: 'user-student-maya',
      material: 'Plastic Bottles (PET)',
      quantity: 40,
      remaining_quantity: 40,
      unit: 'bottles',
      condition: 'Rinsed & De-labeled',
      description: '40 transparent 1L and 2L PET bottles collected from school recycling drive. Clean and dry, ready for vertical gardening or art projects.',
      approx_location: 'Indiranagar, Bengaluru',
      image_url: 'https://images.unsplash.com/photo-1562077772-3ab121863412?w=600&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1562077772-3ab121863412?w=600&q=80',
        'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80'
      ]),
      pickup_option: 'Self Pickup & Local Delivery Available',
      delivery_available: 1,
      estimated_delivery_fee: 70,
      status: 'available',
      verification_status: 'verified',
      verified_at: '2026-03-21 14:30:00'
    },
    {
      id: 'don-denim-scraps',
      user_id: 'user-creator-priya',
      material: 'Denim & Textile Remnants',
      quantity: 15,
      remaining_quantity: 15,
      unit: 'kg',
      condition: 'Clean Fabric Scraps & Swatches',
      description: 'Assorted indigo denim cuttings and cotton scrap remnants from our studio bag production. Ideal for patchwork quilters or craft teachers.',
      approx_location: 'Koramangala, Bengaluru',
      image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80'
      ]),
      pickup_option: 'Self Pickup Only',
      delivery_available: 0,
      estimated_delivery_fee: 0,
      status: 'available',
      verification_status: 'verified',
      verified_at: '2026-03-22 09:15:00'
    },
    {
      id: 'don-glass-jars-25',
      user_id: 'user-biz-greenkraft',
      material: 'Glass Jars & Bottles',
      quantity: 25,
      remaining_quantity: 25,
      unit: 'jars',
      condition: 'Thoroughly Washed & Sanitized',
      description: '25 assorted clear sauce and preserve glass jars with twist-off lids. Great for candle pouring, spices, or terrariums.',
      approx_location: 'Bandra West, Mumbai',
      image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80',
        'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?w=600&q=80'
      ]),
      pickup_option: 'Self Pickup & Local Delivery Available',
      delivery_available: 1,
      estimated_delivery_fee: 75,
      status: 'under_verification',
      verification_status: 'pending',
      verified_at: null
    }
  ];

  for (const d of donations) {
    db.prepare(`
      INSERT OR REPLACE INTO donations (
        id, user_id, material, quantity, remaining_quantity, unit,
        condition, description, approx_location, image_url, images,
        pickup_option, delivery_available, estimated_delivery_fee, status, verification_status, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      d.id, d.user_id, d.material, d.quantity, d.remaining_quantity, d.unit,
      d.condition, d.description, d.approx_location, d.image_url, d.images,
      d.pickup_option, d.delivery_available, d.estimated_delivery_fee, d.status, d.verification_status, d.verified_at
    );
  }

  // Seed sample accepted donation request for don-boxes-50 (Section 57 demonstration!)
  db.prepare(`
    INSERT OR REPLACE INTO donation_requests (
      id, donation_id, requester_id, requested_quantity, message,
      fulfillment_type, delivery_fee, delivery_address, fulfillment_status, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'req-don-school',
    'don-boxes-50',
    'user-student-maya',
    20,
    'I need 20 boxes for a school robotics & architectural scale modeling project.',
    'pickup',
    0,
    null,
    'ready_for_pickup',
    'accepted'
  );

  // 10. Seed Sample Initial Scans
  db.prepare(`
    INSERT OR REPLACE INTO waste_scans (
      id, user_id, image_url, detected_material, confidence, condition, is_reusable, categories, safety_notes, raw_ai_result
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).run(
    'scan-demo-cardboard',
    'user-creator-rahul',
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&q=80',
    'Cardboard',
    0.92,
    'Good',
    JSON.stringify(['Storage & Organization', 'Desk Utilities', 'Scale Models']),
    JSON.stringify(['Use a steel ruler for straight cuts.', 'Keep cutter blades retracted when pausing.']),
    JSON.stringify({ detected_labels: ['cardboard', 'packaging box'] })
  );

  console.log('✅ Waste2Worth seed data populated successfully!');
}

if (process.argv[1]?.includes('seed')) {
  runSeed();
}
