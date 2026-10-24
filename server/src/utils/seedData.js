const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seed() {
  await db.init();
  console.log('[Seed] Starting database seeding with Indian multi-city context...');

  // Clear existing data in correct FK order
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM evaluation_records;
    DELETE FROM activity_logs;
    DELETE FROM donation_assignments;
    DELETE FROM donations;
    DELETE FROM volunteers;
    DELETE FROM ngos;
    DELETE FROM users;
  `);

  const saltRounds = 10;
  const adminPass = bcrypt.hashSync('admin123', saltRounds);
  const ngoPass = bcrypt.hashSync('ngo123', saltRounds);
  const donorPass = bcrypt.hashSync('donor123', saltRounds);
  const volPass = bcrypt.hashSync('vol123', saltRounds);

  // 1. Users with mandatory city
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, phone, city)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(1, 'System Administrator', 'admin@foodaid.in', adminPass, 'admin', '+91 98201 10001', 'Bengaluru');
  insertUser.run(2, 'Annapoorna Caterers & Restaurant (Donor)', 'annapoorna@donor.in', donorPass, 'donor', '+91 98450 20002', 'Bengaluru');
  insertUser.run(3, 'Iyengar Sweets & Traditional Bakery (Donor)', 'iyengar.bakery@donor.in', donorPass, 'donor', '+91 99100 30003', 'Bengaluru');
  insertUser.run(4, 'Roti Bank Seva Foundation (NGO)', 'rotibank@ngo.in', ngoPass, 'ngo', '+91 98860 40004', 'Bengaluru');
  insertUser.run(5, 'Akshaya Annadanam Trust (NGO)', 'akshaya@ngo.in', ngoPass, 'ngo', '+91 98110 50005', 'Mumbai');
  insertUser.run(6, 'Rohan Iyer (Volunteer)', 'rohan.volunteer@seva.in', volPass, 'volunteer', '+91 97400 60006', 'Bengaluru');
  insertUser.run(7, 'Ananya Deshmukh (Volunteer)', 'ananya.volunteer@seva.in', volPass, 'volunteer', '+91 98920 70007', 'Mumbai');
  insertUser.run(8, 'Taj Gateway Banquet Hall (Donor)', 'taj.mumbai@donor.in', donorPass, 'donor', '+91 98200 80008', 'Mumbai');

  // 2. NGOs
  const insertNgo = db.prepare(`
    INSERT INTO ngos (id, user_id, ngo_name, registration_number, address, city, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertNgo.run(1, 4, 'Roti Bank Seva Foundation', 'DARPAN-KA-2022-04812', '12, 5th Cross, Koramangala 4th Block', 'Bengaluru', 1);
  insertNgo.run(2, 5, 'Akshaya Annadanam Trust', 'DARPAN-MH-2023-09142', 'Shop 4, Linking Road, Bandra West', 'Mumbai', 1);

  // 3. Volunteers with UPI ID & total earnings
  const insertVolunteer = db.prepare(`
    INSERT INTO volunteers (id, user_id, availability_status, preferred_areas, total_deliveries, hours_contributed, total_earnings, upi_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertVolunteer.run(1, 6, 'available', 'Koramangala, Indiranagar, HSR Layout, Bengaluru', 16, 24.0, 4000.0, 'rohan.iyer@okhdfcbank');
  insertVolunteer.run(2, 7, 'available', 'Bandra West, Dadar, Andheri, Mumbai', 10, 15.0, 2500.0, 'ananya.deshmukh@okaxis');

  // Timestamps for dynamic relative testing
  const now = new Date();
  
  // Urgent: expires in 85 minutes from now
  const urgentExpiry = new Date(now.getTime() + 85 * 60 * 1000).toISOString();
  const urgentPrep = new Date(now.getTime() - 90 * 60 * 1000).toISOString();

  // Expiring soon: expires in 3.5 hours from now
  const soonExpiry = new Date(now.getTime() + 210 * 60 * 1000).toISOString();
  const soonPrep = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  // Fresh: expires in 9 hours from now
  const freshExpiry = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString();
  const freshPrep = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

  // Active in-transit: expires in 4 hours
  const transitExpiry = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
  const transitPrep = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

  // Delivered yesterday
  const pastDeliveredExpiry = new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString();
  const pastDeliveredPrep = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Expired 3 hours ago
  const expiredPast = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
  const expiredPrep = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();

  const standardChecklist = JSON.stringify({
    food_covered: true,
    clean_containers: true,
    temperature_checked: true,
    prepared_within_safe_window: true
  });

  // 4. Donations across Bengaluru and Mumbai
  const insertDonation = db.prepare(`
    INSERT INTO donations (
      id, donor_id, food_name, food_type, quantity, quantity_unit,
      preparation_datetime, expiry_datetime, pickup_location, city,
      safety_checklist, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Bengaluru Donations
  // Item 1: URGENT (< 2 hrs remaining!)
  insertDonation.run(
    1, 2, 'Paneer Butter Masala & Jeera Rice', 'Cooked Food', 45, 'servings',
    urgentPrep, urgentExpiry, '14, 100 Feet Road, Indiranagar', 'Bengaluru',
    standardChecklist, 'posted', 'Freshly prepared for evening banquet. Sealed in insulated thermal containers.'
  );

  // Item 2: Expiring Soon (3.5 hours)
  insertDonation.run(
    2, 3, 'Fresh Milk Bread, Bun Maska & Veg Puffs', 'Bakery Items', 65, 'items',
    soonPrep, soonExpiry, '88, Commercial Street', 'Bengaluru',
    standardChecklist, 'posted', 'Baked early morning. Packed in hygienic food-grade paper packaging.'
  );

  // Item 3: Fresh (9 hours)
  insertDonation.run(
    3, 2, 'Crates of Fresh Seasonal Vegetables & Fruits', 'Raw Ingredients', 35, 'kg',
    freshPrep, freshExpiry, '14, 100 Feet Road, Indiranagar', 'Bengaluru',
    standardChecklist, 'posted', 'Sourced from wholesale mandi. Sorted, washed, and crates sanitized.'
  );

  // Item 4: Assigned / In-Transit to Rohan (Bengaluru)
  insertDonation.run(
    4, 2, 'Vegetable Pulao, Dal Tadka & Chapatis', 'Cooked Food', 50, 'servings',
    transitPrep, transitExpiry, '14, 100 Feet Road, Indiranagar', 'Bengaluru',
    standardChecklist, 'assigned', 'Pre-portioned meal packets. Volunteer collection in progress.'
  );

  // Item 5: Successfully Delivered (Bengaluru)
  insertDonation.run(
    5, 3, 'Special Indian Thali Meal Boxes', 'Packaged Food', 70, 'servings',
    pastDeliveredPrep, pastDeliveredExpiry, '88, Commercial Street', 'Bengaluru',
    standardChecklist, 'delivered', 'Corporate meeting excess. Successfully delivered to night shelter.'
  );

  // Item 6: Expired (Unclaimed)
  insertDonation.run(
    6, 2, 'Dosa Batter & Coconut Chutney', 'Cooked Food', 20, 'servings',
    expiredPrep, expiredPast, '14, 100 Feet Road, Indiranagar', 'Bengaluru',
    standardChecklist, 'expired', 'Perishable batter exceeded 4-hour safe room temperature threshold.'
  );

  // Item 7: Mumbai Donation (Available for Mumbai NGO Akshaya Trust)
  insertDonation.run(
    7, 8, 'Pav Bhaji & Veg Tawa Pulao', 'Cooked Food', 60, 'servings',
    soonPrep, soonExpiry, 'Taj Gateway, Apollo Bunder, Colaba', 'Mumbai',
    standardChecklist, 'posted', 'Prepared for luncheon conference. Packed in sealed warm containers.'
  );

  // 5. Assignments (with payout_amount: 250.0 and payout_status)
  const insertAssignment = db.prepare(`
    INSERT INTO donation_assignments (
      id, donation_id, ngo_id, volunteer_id, collection_type, beneficiaries_served, payout_amount, payout_status, accepted_at, picked_up_at, delivered_at, delivery_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Assignment for Item 4 (Assigned to Rohan)
  insertAssignment.run(
    1, 4, 1, 1, 'volunteer', 0, 250.0, 'pending',
    new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
    null, null, 'Volunteer Rohan en route to Indiranagar for pickup.'
  );

  // Assignment for Item 5 (Delivered by Rohan)
  insertAssignment.run(
    2, 5, 1, 1, 'volunteer', 70, 250.0, 'paid',
    new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString(),
    new Date(now.getTime() - 21 * 60 * 60 * 1000).toISOString(),
    new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
    'Distributed to 70 individuals at Shanti Nagar Community Center, Bengaluru.'
  );

  // 6. In-App Notifications with Simulated Email Dispatch
  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, email_sent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Notifications for Rohan (Volunteer)
  insertNotification.run(
    1, 6, '🛵 New Delivery Mission Assigned (₹250 Stipend)',
    'You have been assigned to pick up "Vegetable Pulao, Dal Tadka & Chapatis" from Indiranagar and deliver to Roti Bank Seva Foundation. Payout: ₹250 upon delivery.',
    'info', 0, 1, new Date(now.getTime() - 38 * 60 * 1000).toISOString()
  );
  insertNotification.run(
    2, 6, '💰 ₹250 Delivery Payout Credited via UPI!',
    'Mission complete for "Special Indian Thali Meal Boxes"! ₹250 delivery stipend has been processed to your registered UPI ID (rohan.iyer@okhdfcbank).',
    'success', 1, 1, new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString()
  );

  // Notifications for Annapoorna Caterers (Donor)
  insertNotification.run(
    3, 2, '✅ Donation Claimed by Verified NGO',
    'Great news! "Vegetable Pulao, Dal Tadka & Chapatis" has been accepted and claimed by Roti Bank Seva Foundation. Collection is underway.',
    'success', 0, 1, new Date(now.getTime() - 39 * 60 * 1000).toISOString()
  );

  // Notifications for Roti Bank Seva Foundation (NGO)
  insertNotification.run(
    4, 4, '🚨 New Food Surplus in Bengaluru!',
    'Fresh surplus available: "Paneer Butter Masala & Jeera Rice" (45 servings) posted at 14, 100 Feet Road, Indiranagar. Open Surplus Feed to claim.',
    'alert', 0, 1, new Date(now.getTime() - 85 * 60 * 1000).toISOString()
  );

  // Notification for Akshaya Trust (Mumbai NGO)
  insertNotification.run(
    5, 5, '🚨 New Food Surplus in Mumbai!',
    'Fresh surplus available: "Pav Bhaji & Veg Tawa Pulao" (60 servings) posted at Taj Gateway, Apollo Bunder, Colaba. Open Surplus Feed to claim.',
    'alert', 0, 1, new Date(now.getTime() - 50 * 60 * 1000).toISOString()
  );

  // 7. Activity Logs
  const insertLog = db.prepare(`
    INSERT INTO activity_logs (donation_id, user_id, action, details, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertLog.run(1, 2, 'DONATION_POSTED', 'Annapoorna Caterers posted 45 servings of Paneer Butter Masala in Bengaluru', urgentPrep);
  insertLog.run(2, 3, 'DONATION_POSTED', 'Iyengar Bakery posted 65 fresh bakery items in Bengaluru', soonPrep);
  insertLog.run(3, 2, 'DONATION_POSTED', 'Annapoorna Caterers posted 35 kg fresh mandi produce in Bengaluru', freshPrep);
  insertLog.run(4, 2, 'DONATION_POSTED', 'Posted 50 servings vegetable pulao and dal in Bengaluru', transitPrep);
  insertLog.run(4, 4, 'DONATION_ACCEPTED', 'Roti Bank Seva Foundation claimed donation & assigned volunteer Rohan (₹250 payout allocated)', new Date(now.getTime() - 40 * 60 * 1000).toISOString());
  insertLog.run(5, 4, 'DONATION_ACCEPTED', 'Claimed by Roti Bank Seva Foundation', pastDeliveredPrep);
  insertLog.run(5, 6, 'FOOD_DELIVERED', 'Volunteer Rohan confirmed delivery. 70 beneficiaries fed. ₹250 stipend credited.', new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString());
  insertLog.run(6, null, 'AUTO_EXPIRED', 'Marked as expired after exceeding 4-hour safe consumption window.', expiredPast);
  insertLog.run(7, 8, 'DONATION_POSTED', 'Taj Gateway posted 60 servings of Pav Bhaji & Veg Tawa Pulao in Mumbai', soonPrep);

  // 8. Research Evaluation Trials (Section 10 Dissertation Data)
  const insertEval = db.prepare(`
    INSERT INTO evaluation_records (scenario, task_name, participant_id, time_taken_seconds, errors_count, completed_successfully, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const evalData = [
    // Scenario A: Manual Coordination (Phone / WhatsApp / Spreadsheets)
    ['Scenario A (Manual Coordination)', 'Post Donation', 'P01-Rahul', 340, 2, 1, 'Had to send multiple WhatsApp messages with photos across groups'],
    ['Scenario A (Manual Coordination)', 'Post Donation', 'P02-Sneha', 410, 3, 1, 'Inconsistent columns on shared Google Sheet register'],
    ['Scenario A (Manual Coordination)', 'Claim Food', 'P03-Vikram', 520, 2, 0, 'Cooked food spoiled before volunteer could be reached via telephone'],
    ['Scenario A (Manual Coordination)', 'Claim Food', 'P04-Pooja', 460, 1, 1, 'Multiple phone calls required to verify exact street address'],
    ['Scenario A (Manual Coordination)', 'Assign Volunteer', 'P05-Amit', 380, 2, 1, 'WhatsApp group message confusion on who was available for pickup'],
    ['Scenario A (Manual Coordination)', 'Update Delivery', 'P06-Deepak', 290, 1, 1, 'Delayed logging on paper register at NGO gate'],
    ['Scenario A (Manual Coordination)', 'Generate Report', 'P07-Kavita', 720, 4, 1, 'Manual calculation of total kg and meals from Excel rows'],

    // Scenario B: Food Donation & Expiry Management System
    ['Scenario B (Digital Platform)', 'Post Donation', 'P01-Rahul', 62, 0, 1, 'Simple form with safety checklist and auto expiry countdown'],
    ['Scenario B (Digital Platform)', 'Post Donation', 'P02-Sneha', 55, 0, 1, 'Clear dropdowns for food type and servings'],
    ['Scenario B (Digital Platform)', 'Claim Food', 'P03-Vikram', 32, 0, 1, 'Urgent badge (< 2h) highlighted priority food for immediate claim'],
    ['Scenario B (Digital Platform)', 'Claim Food', 'P04-Pooja', 38, 0, 1, '1-click claim and volunteer selection with Google Map routing'],
    ['Scenario B (Digital Platform)', 'Assign Volunteer', 'P05-Amit', 25, 0, 1, 'Selected from available volunteer roster with 1 tap'],
    ['Scenario B (Digital Platform)', 'Update Delivery', 'P06-Deepak', 28, 0, 1, 'One-tap button to mark Picked Up & Delivered with beneficiary count'],
    ['Scenario B (Digital Platform)', 'Generate Report', 'P07-Kavita', 12, 0, 1, 'Real-time charts and exportable metrics generated instantly']
  ];

  for (const row of evalData) {
    insertEval.run(...row);
  }

  console.log('[Seed] Database successfully re-seeded with Indian multi-city data, notifications, and ₹250 volunteer stipends!');
}

if (require.main === module) {
  seed();
}

module.exports = seed;
