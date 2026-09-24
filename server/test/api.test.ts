import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { runSeed } from '../seed';

describe('Waste2Worth API Integration & Business Logic Tests', () => {
  let authToken = '';
  let testUserId = '';
  let testScanId = '';
  let testPostId = '';
  let testQuestionId = '';
  let testDonationId = '';
  let testDonationRequestId = '';

  beforeAll(() => {
    // Populate clean seed data
    runSeed();
  });

  // 1. Health Check
  it('GET /api/health should return ok and brand info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.app).toBe('Waste2Worth');
    expect(res.body.tagline).toContain('Don\'t Throw It — Transform It');
  });

  // 2. Authentication & User Journey
  it('POST /api/auth/register should create a new user account', async () => {
    const uniqueUser = `testuser_${Date.now()}`;
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Crafter',
      username: uniqueUser,
      email: `${uniqueUser}@example.com`,
      password: 'SecurePassword123!',
      role: 'USER',
      skill_level: 'Beginner'
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.token).toBeDefined();
    authToken = res.body.token;
    testUserId = res.body.user.id;
  });

  it('POST /api/auth/login should authenticate existing seed user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      login: 'rahul_crafts',
      password: 'Password123!'
    });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('rahul_crafts');
    expect(res.body.token).toBeDefined();
  });

  it('GET /api/auth/me should return current user profile with impact stats', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(testUserId);
    expect(res.body.user.stats).toBeDefined();
  });

  // 3. Waste Scanner & Material Recognition
  it('POST /api/scan should identify waste material from preset or upload', async () => {
    const res = await request(app)
      .post('/api/scan')
      .set('Authorization', `Bearer ${authToken}`)
      .field('samplePreset', 'cardboard')
      .field('imageUrl', 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&q=80');

    expect(res.status).toBe(201);
    expect(res.body.scan).toBeDefined();
    expect(res.body.scan.detected_material).toBe('Cardboard');
    expect(res.body.scan.confidence).toBeGreaterThan(0.7);
    expect(res.body.scan.categories.length).toBeGreaterThan(0);
    expect(res.body.scan.safety_notes.length).toBeGreaterThan(0);
    testScanId = res.body.scan.id;
  });

  it('POST /api/scan/:id/correct should allow manual material correction', async () => {
    const res = await request(app)
      .post(`/api/scan/${testScanId}/correct`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ correctedMaterial: 'Plastic bottle' });

    expect(res.status).toBe(200);
    expect(res.body.scan.detected_material).toBe('Plastic bottle');
    expect(res.body.scan.categories).toBeDefined();
  });

  // 4. AI Idea Generator
  it('POST /api/ideas/generate should return structured ideas and creator inspiration', async () => {
    const res = await request(app).post('/api/ideas/generate').send({
      material: 'Cardboard',
      skill_level: 'Beginner',
      budget: '₹500'
    });

    expect(res.status).toBe(200);
    expect(res.body.ideas.length).toBeGreaterThan(0);
    expect(res.body.ideas[0]).toHaveProperty('title');
    expect(res.body.ideas[0]).toHaveProperty('difficulty');
    expect(res.body.ideas[0]).toHaveProperty('tools');
    expect(res.body.ideas[0]).toHaveProperty('sustainability_explanation');
    expect(res.body.creator_inspiration).toBeDefined();
  });

  it('POST /api/ideas/regenerate should handle constraint prompts', async () => {
    const res = await request(app).post('/api/ideas/regenerate').send({
      material: 'Cardboard',
      constraint: 'easier',
      prompt: 'Give me ideas that require no tools'
    });

    expect(res.status).toBe(200);
    expect(res.body.ideas.length).toBeGreaterThan(0);
  });

  it('GET /api/ideas/projects/:id should return complete step-by-step instructions', async () => {
    const res = await request(app).get('/api/ideas/projects/proj-cardboard-organizer');
    expect(res.status).toBe(200);
    expect(res.body.project).toBeDefined();
    expect(res.body.project.instructions.length).toBeGreaterThanOrEqual(4);
    expect(res.body.project.waste_already_have).toBeDefined();
    expect(res.body.project.alternative_materials).toBeDefined();
  });

  // 5. Discover Feed & Project Posts (Before / After)
  it('GET /api/discover should return community projects with before/after photos', async () => {
    const res = await request(app).get('/api/discover');
    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBeGreaterThan(0);
    expect(res.body.posts[0]).toHaveProperty('before_image');
    expect(res.body.posts[0]).toHaveProperty('after_image');
    expect(res.body.posts[0]).toHaveProperty('creator');
  });

  it('POST /api/posts should publish completed project transformation', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Zero-Waste Egg Carton Seedling Starter',
        description: 'Used pressed pulp egg cartons with kitchen compost soil to start tomato seeds on my windowsill.',
        waste_used: 'Paper / Egg Cartons',
        quantity: '2 Cartons',
        before_image: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=600&q=80',
        after_image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&q=80',
        difficulty: 'Beginner',
        estimated_time: '20 minutes'
      });

    expect(res.status).toBe(201);
    expect(res.body.postId).toBeDefined();
    testPostId = res.body.postId;
  });

  it('POST /api/posts/:id/like should toggle likes', async () => {
    const res = await request(app)
      .post(`/api/posts/${testPostId}/like`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.liked).toBe(true);
  });

  // 6. Comments & AI Comment Manager (Section 20)
  it('POST /api/posts/:id/comments should add a comment', async () => {
    const res = await request(app)
      .post(`/api/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Did you poke drainage holes in the bottom of each egg cup?' });

    expect(res.status).toBe(201);
    expect(res.body.comment).toBeDefined();
  });

  it('POST /api/ai/comment-summary should summarize and group comments', async () => {
    // Seed post post-rahul-desk-organizer has 7 realistic comments
    const res = await request(app).post('/api/ai/comment-summary').send({
      postId: 'post-rahul-desk-organizer'
    });

    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.groups.length).toBeGreaterThan(0);
    expect(res.body.questions.length).toBeGreaterThan(0);
    expect(res.body.highlights.length).toBeGreaterThan(0);
    expect(res.body.ai_label).toContain('AI-generated discussion summary');
  });

  // 7. Idea Hub (Community Q&A)
  it('POST /api/idea-hub/questions should post question and generate initial AI suggestion', async () => {
    const res = await request(app)
      .post('/api/idea-hub/questions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        material: 'Old Clothes',
        quantity: '5 worn t-shirts',
        budget: '₹0',
        skill_level: 'Beginner',
        question: 'I have 5 faded cotton t-shirts. What can I make without a sewing machine?'
      });

    expect(res.status).toBe(201);
    expect(res.body.questionId).toBeDefined();
    testQuestionId = res.body.questionId;
  });

  it('GET /api/idea-hub/questions/:id should show question with AI and community responses', async () => {
    const res = await request(app).get(`/api/idea-hub/questions/${testQuestionId}`);
    expect(res.status).toBe(200);
    expect(res.body.question).toBeDefined();
    expect(res.body.responses.length).toBeGreaterThanOrEqual(1);
    expect(res.body.responses[0].is_ai_generated).toBe(1);
  });

  // 8. Business Section & Help My Business
  it('POST /api/business/ideas should generate business concepts with legal disclaimer', async () => {
    const res = await request(app).post('/api/business/ideas').send({
      material: 'Cardboard',
      quantity: '100 boxes',
      budget: '₹5,000',
      skill_level: 'Intermediate'
    });

    expect(res.status).toBe(200);
    expect(res.body.concepts.length).toBeGreaterThan(0);
    expect(res.body.legal_disclaimer).toContain('preliminary planning projections');
    expect(res.body.concepts[0].cost_estimates).toHaveProperty('unit_production_cost');
    expect(res.body.concepts[0].cost_estimates).toHaveProperty('suggested_selling_price');
  });

  it('POST /api/business/help should provide advisory recommendations', async () => {
    const res = await request(app).post('/api/business/help').send({
      businessName: 'GreenKraft',
      materialsUsed: ['Cardboard'],
      question: 'What else can I create to expand my corporate eco-gifting catalog?'
    });

    expect(res.status).toBe(200);
    expect(res.body.guidance.new_product_lines.length).toBeGreaterThan(0);
    expect(res.body.guidance.packaging_innovation.length).toBeGreaterThan(0);
  });

  // 9. Donations Marketplace Flow (Section 18: 16 Tests)
  // Test 1: Donation creation requires photo
  it('1. Donation creation requires photo', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        material: 'Cardboard Boxes',
        quantity: 30,
        unit: 'boxes',
        condition: 'Good & Clean',
        approx_location: 'Bandra West, Mumbai'
        // Missing photos
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('photo');
  });

  // Test 2: Donation starts as PENDING_VERIFICATION
  it('2. Donation starts as PENDING_VERIFICATION', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        material: 'Cardboard Boxes',
        category: 'Cardboard & Paper',
        quantity: 30,
        unit: 'boxes',
        condition: 'Good & Clean',
        description: '30 clean double-wall appliance boxes',
        approx_location: 'Bandra West, Mumbai',
        exact_pickup_address: 'Flat 402, Sea Green Apts, Hill Rd, Bandra West',
        images: [
          'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&q=80',
          'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&q=80'
        ],
        pickup_option: 'Self Pickup & Local Delivery Available'
      });

    expect(res.status).toBe(201);
    expect(res.body.donationId).toBeDefined();
    expect(res.body.status).toBe('PENDING_VERIFICATION');
    expect(res.body.verification_status).toBe('PENDING');
    testDonationId = res.body.donationId;
  });

  // Test 3: Pending donation cannot be claimed
  it('3. Pending donation cannot be claimed', async () => {
    const studentLogin = await request(app).post('/api/auth/login').send({
      login: 'maya_ecostudent',
      password: 'Password123!'
    });
    const studentToken = studentLogin.body.token;

    const res = await request(app)
      .post(`/api/donations/${testDonationId}/claim`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        requested_quantity: 10,
        message: 'Need 10 boxes for school science exhibition booth.',
        fulfillment_method: 'pickup'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('verification');
  });

  // Test 4: Non-admin cannot verify donation
  it('4. Non-admin cannot verify donation', async () => {
    const studentLogin = await request(app).post('/api/auth/login').send({
      login: 'maya_ecostudent',
      password: 'Password123!'
    });
    const studentToken = studentLogin.body.token;

    const res = await request(app)
      .post(`/api/admin/donations/${testDonationId}/verify`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ decision: 'approve' });

    expect(res.status).toBe(403);
  });

  // Test 5: Admin rejection requires reason
  it('5. Admin rejection requires reason', async () => {
    const adminLogin = await request(app).post('/api/auth/login').send({
      login: 'elena_admin',
      password: 'Password123!'
    });
    const adminToken = adminLogin.body.token;

    const res = await request(app)
      .post(`/api/admin/donations/${testDonationId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'reject', reason: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('reason');
  });

  // Test 6: Admin can reject donation with reason
  it('6. Admin can reject donation with reason', async () => {
    const adminLogin = await request(app).post('/api/auth/login').send({
      login: 'elena_admin',
      password: 'Password123!'
    });
    const adminToken = adminLogin.body.token;

    const res = await request(app)
      .post(`/api/admin/donations/${testDonationId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'reject', reason: 'Photo does not clearly show the material' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REJECTED');
    expect(res.body.rejection_reason).toBe('Photo does not clearly show the material');
  });

  // Test 7: Rejected donation can be resubmitted
  it('7. Rejected donation can be resubmitted', async () => {
    const res = await request(app)
      .put(`/api/donations/${testDonationId}/resubmit`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        material: 'Cardboard Boxes (High Quality)',
        quantity: 30,
        unit: 'boxes',
        condition: 'Dry & Folded Flat',
        description: 'Updated with sharp clear actual material photos',
        approx_location: 'Bandra West, Mumbai',
        images: [
          'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=700&q=80',
          'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=700&q=80'
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PENDING_VERIFICATION');
  });

  // Test 8: Admin can verify donation
  it('8. Admin can verify donation', async () => {
    const adminLogin = await request(app).post('/api/auth/login').send({
      login: 'elena_admin',
      password: 'Password123!'
    });
    const adminToken = adminLogin.body.token;

    const res = await request(app)
      .post(`/api/admin/donations/${testDonationId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'approve' });

    expect(res.status).toBe(200);
    expect(res.body.status.toUpperCase()).toBe('AVAILABLE');
    expect(res.body.verification_status.toUpperCase()).toBe('VERIFIED');
  });

  // Test 9: Exact donor address is protected from public view
  it('9. Exact donor address is protected', async () => {
    const studentLogin = await request(app).post('/api/auth/login').send({
      login: 'maya_ecostudent',
      password: 'Password123!'
    });
    const studentToken = studentLogin.body.token;

    const res = await request(app)
      .get(`/api/donations/${testDonationId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.donation.approx_location).toBe('Bandra West, Mumbai');
    // Public/unaccepted recipient MUST NOT see exact_pickup_address
    expect(res.body.donation.exact_pickup_address).toBeUndefined();
  });

  // Test 10: Verified donation becomes claimable & Material remains ₹0
  it('10. Verified donation becomes claimable (Material remains ₹0)', async () => {
    const studentLogin = await request(app).post('/api/auth/login').send({
      login: 'maya_ecostudent',
      password: 'Password123!'
    });
    const studentToken = studentLogin.body.token;

    const res = await request(app)
      .post(`/api/donations/${testDonationId}/claim`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        requested_quantity: 10,
        message: 'Need 10 boxes for school science exhibition booth.',
        fulfillment_method: 'pickup'
      });

    expect(res.status).toBe(201);
    expect(res.body.requestId).toBeDefined();
    expect(res.body.material_cost).toBe(0);
    expect(res.body.delivery_fee).toBe(0);
    testDonationRequestId = res.body.requestId;
  });

  // Test 11: Partial claim works
  it('11. Partial claim works', async () => {
    const res = await request(app)
      .post(`/api/donations/requests/${testDonationRequestId}/respond`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ decision: 'accept' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
    expect(res.body.remaining_quantity).toBe(20); // 30 - 10 = 20 remaining
  });

  // Test 12: Cannot claim more than remaining quantity
  it('12. Cannot claim more than remaining quantity', async () => {
    const studentLogin = await request(app).post('/api/auth/login').send({
      login: 'maya_ecostudent',
      password: 'Password123!'
    });
    const studentToken = studentLogin.body.token;

    const res = await request(app)
      .post(`/api/donations/${testDonationId}/claim`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        requested_quantity: 25, // Only 20 remaining!
        message: 'Trying to claim 25 boxes',
        fulfillment_method: 'pickup'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Cannot claim more than remaining quantity');
  });

  // Test 13: Self pickup workflow
  it('13. Self pickup workflow', async () => {
    const res = await request(app)
      .post(`/api/donations/requests/${testDonationRequestId}/fulfill`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ next_status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.fulfillment_status).toBe('completed');
  });

  // Test 14: Delivery workflow & Delivery fee is separate
  it('14. Delivery workflow and delivery fee is separate', async () => {
    const studentLogin = await request(app).post('/api/auth/login').send({
      login: 'maya_ecostudent',
      password: 'Password123!'
    });
    const studentToken = studentLogin.body.token;

    const res = await request(app)
      .post(`/api/donations/${testDonationId}/claim`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        requested_quantity: 20,
        message: 'Need the remaining 20 boxes delivered for workshop.',
        fulfillment_method: 'delivery',
        delivery_address: 'St. Xavier School, Fort, Mumbai'
      });

    expect(res.status).toBe(201);
    expect(res.body.material_cost).toBe(0); // Material is always ₹0
    expect(res.body.delivery_fee).toBeGreaterThanOrEqual(60); // Separate calculated delivery fee
    const deliveryRequestId = res.body.requestId;

    // Donor accepts
    const acceptRes = await request(app)
      .post(`/api/donations/requests/${deliveryRequestId}/respond`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ decision: 'accept' });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.remaining_quantity).toBe(0); // 20 - 20 = 0

    // Step advancement: DELIVERY_REQUESTED -> DELIVERY_SCHEDULED -> DELIVERED -> COMPLETED
    const step1 = await request(app)
      .post(`/api/donations/requests/${deliveryRequestId}/fulfill`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ next_status: 'DELIVERY_SCHEDULED' });
    expect(step1.status).toBe(200);

    const step2 = await request(app)
      .post(`/api/donations/requests/${deliveryRequestId}/fulfill`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ next_status: 'DELIVERED' });
    expect(step2.status).toBe(200);

    const step3 = await request(app)
      .post(`/api/donations/requests/${deliveryRequestId}/fulfill`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ next_status: 'COMPLETED' });
    expect(step3.status).toBe(200);
  });

  // Test 15: Completed donation changes status correctly
  it('15. Completed donation changes status correctly', async () => {
    const res = await request(app).get(`/api/donations/${testDonationId}`);
    expect(res.status).toBe(200);
    expect(res.body.donation.status).toBe('COMPLETED');
    expect(res.body.donation.remaining_quantity).toBe(0);
  });

  // Test 16: Accepted recipient can now see pickup address
  it('16. Accepted recipient can view exact pickup address for coordination', async () => {
    const studentLogin = await request(app).post('/api/auth/login').send({
      login: 'maya_ecostudent',
      password: 'Password123!'
    });
    const studentToken = studentLogin.body.token;

    const res = await request(app)
      .get(`/api/donations/${testDonationId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.donation.exact_pickup_address).toBe('Flat 402, Sea Green Apts, Hill Rd, Bandra West');
  });

  // 10. Environmental Impact Metrics
  it('GET /api/impact should calculate metrics from actual platform data without fabrication', async () => {
    const res = await request(app).get('/api/impact');
    expect(res.status).toBe(200);
    expect(res.body.global.materialsReused).toBeGreaterThanOrEqual(1);
    expect(res.body.global.projectsCompleted).toBeGreaterThanOrEqual(1);
    expect(res.body.global.materialsDonated).toBeGreaterThanOrEqual(1);
  });
});
