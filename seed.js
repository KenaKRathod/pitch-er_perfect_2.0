import { db, collection, setDoc, doc } from './firebase-config.js';

const ALL_PS = [
  /* Design & Fashion */
  { id:'DF-01', domain:'design', premium:false, basePrice:5000, highestBid:5000,
    title:'Lack of Affordable Sustainable Fashion',
    desc:'Users browse, rent, and return clothes for events, reducing waste and saving money.',
    constraint:'Logistics (cleaning, delivery, and returns) can be expensive and complex.',
    advantage:'A popular fashion influencer promotes your platform, bringing a sudden spike in users and brand trust.',
    disadvantage:'Users hesitate due to cleanliness concerns, and a negative review about hygiene affects trust.' },
  { id:'DF-02', domain:'design', premium:false, basePrice:5000, highestBid:5000,
    title:'Small Designers Struggle to Get Visibility',
    desc:'Connects emerging designers to buyers without middlemen.',
    constraint:'Building trust and ensuring product quality consistency.',
    advantage:'You receive support or recognition under a startup or “vocal for local” initiative, boosting visibility and funding chances.',
    disadvantage:'Big platforms start promoting “indie creators” with better reach and marketing power, pulling your users away.' },
  { id:'DF-03', domain:'design', premium:true, basePrice:10000, highestBid:10000,
    title:'Lack of Customization in Affordable Fashion',
    desc:'Online platform where users tweak designs before production.',
    constraint:'Production time is longer than ready-made clothes.',
    advantage:'Users love expressing individuality, and your “design-it-yourself” feature becomes a major attraction. AI suggests perfect size and fit based on body input, reducing returns and improving comfort.',
    disadvantage:'Customized orders take longer to produce, and customers cancel due to slow delivery.' },

  /* Fintech */
  { id:'FT-01', domain:'fintech', premium:false, basePrice:5000, highestBid:5000,
    title:'Smart Contract-Based Freelance Payments',
    desc:'A platform that uses smart contracts to ensure secure and automatic payments for freelancers. Once the agreed work conditions are met and verified, the payment is released automatically without the need for intermediaries, reducing delays and trust issues between clients and freelancers.',
    constraint:'Requires blockchain infrastructure and technical implementation',
    advantage:'Companies start using your platform for contract-based hiring due to transparency and reduced legal/payment risks.',
    disadvantage:'If a client claims work is “not satisfactory,” smart contracts struggle to handle subjective disputes without human intervention.' },
  { id:'FT-02', domain:'fintech', premium:true, basePrice:10000, highestBid:10000,
    title:'Smart EMI Optimizer',
    desc:'A system that analyzes a user’s loans and suggests the most efficient EMI structure by adjusting tenure, interest, and repayment strategy to minimize total cost.',
    constraint:'Requires integration with financial institutions',
    advantage:'A bank or lending app integrates your system to offer “smart EMI plans,” boosting credibility and reach. The system not only suggests but auto-adjusts EMI plans via partner banks, making it effortless for users.',
    disadvantage:'Users hesitate to rely on automated financial advice, especially for large loans.' },
  { id:'FT-03', domain:'fintech', premium:false, basePrice:5000, highestBid:5000,
    title:'Goal-Based Micro Saving with Lock System',
    desc:'A savings platform where users set financial goals (like travel or gadgets) and their money is locked until the goal is achieved, preventing impulsive withdrawals.',
    constraint:'Funds are not easily accessible before goal completion',
    advantage:'You add milestones, rewards, or streaks, making saving feel like a game and increasing engagement.',
    disadvantage:'Users face emergencies and get frustrated due to locked funds, leading to negative feedback.' },
  { id:'FT-04', domain:'fintech', premium:false, basePrice:5000, highestBid:5000,
    title:'Scam Awareness + Protection App',
    desc:'A real-time financial safety app that detects fraudulent transactions, suspicious links, and scam activities, while also educating users about safe digital practices.',
    constraint:'Requires real-time monitoring permissions',
    advantage:'Your app blocks a fraudulent transaction or flags a scam link instantly, building strong trust and word-of-mouth growth.',
    disadvantage:'Banks and payment apps introduce their own fraud detection systems, reducing the need for a separate app.' },
  { id:'FT-05', domain:'fintech', premium:false, basePrice:5000, highestBid:5000,
    title:'Peer-to-Peer Insurance Pool',
    desc:'A community-based insurance system where users contribute to a shared pool, and claims are settled collectively, ensuring transparency and reduced dependency on traditional insurers.',
    constraint:'Requires strong trust and participation',
    advantage:'Specific groups (like college students or gig workers) adopt it widely, creating strong initial traction.',
    disadvantage:'Multiple users claim at once (e.g., during a disaster), draining the pool and creating financial instability.' },

  /* Sustainable Tech */
  { id:'ST-01', domain:'sustech', premium:false, basePrice:5000, highestBid:5000,
    title:'AI Upcycling Platform',
    desc:'Textile waste from unused clothes AI suggests how to redesign old clothes (DIY or via tailors)',
    constraint:'Skilled tailoring network needed',
    advantage:'The app suggests stylish redesign ideas (like turning jeans into bags/jackets), making it fun and shareable on social media.',
    disadvantage:'AI gives good ideas, but the final stitched product doesn’t match expectations due to skill differences in tailors.' },
  { id:'ST-02', domain:'sustech', premium:true, basePrice:10000, highestBid:10000,
    title:'Smart Fabric Recycling Machine',
    desc:'A compact machine that converts old clothes into reusable fabric or yarn',
    constraint:'Users or local centers can input old garments into the machine, which processes them into new fabric rolls or threads that can be reused for making new clothes or products.',
    advantage:'Malls or campuses install your machine, letting users recycle clothes instantly — creating a strong “experience factor.” Machine not only creates yarn but can output ready-to-use sheets or simple products (like tote bags).',
    disadvantage:'The machine is expensive to build and deploy, limiting early scalability.' },
  { id:'ST-03', domain:'sustech', premium:false, basePrice:5000, highestBid:5000,
    title:'Clothing Exchange Platform',
    desc:'Users exchange clothes using a credit system',
    constraint:'Quality control & logistics',
    advantage:'Users get “new” clothes without spending money, attracting students and budget users.',
    disadvantage:'Users hesitate due to doubts about cleanliness or condition of exchanged clothes.' },
  { id:'ST-04', domain:'sustech', premium:false, basePrice:5000, highestBid:5000,
    title:'QR Sustainability Tracker',
    desc:'QR code shows carbon footprint & fabric source',
    constraint:'Needs brand partnerships',
    advantage:'Buyers start preferring brands with visible sustainability data, increasing adoption of your QR system.',
    disadvantage:'Smaller brands hesitate to adopt due to additional tracking and verification costs.' },
  { id:'ST-05', domain:'sustech', premium:false, basePrice:5000, highestBid:5000,
    title:'Solar Charging Public Benches',
    desc:'Solar-powered benches with charging ports',
    constraint:'Installation cost & maintenance',
    advantage:'Municipal corporations install these benches in parks, bus stops, and public areas as part of smart city initiatives.',
    disadvantage:'Low sunlight during monsoons or cloudy days reduces charging efficiency.' },

  /* Healthtech */
  { id:'HT-01', domain:'health', premium:false, basePrice:5000, highestBid:5000,
    title:'AI Mental Health Companion',
    desc:'A mobile app that tracks user mood, stress, and daily behavior using AI and provides personalized suggestions, meditation, and chatbot support.',
    constraint:'Accuracy depends on user input; privacy concerns for sensitive data.',
    advantage:'More people openly seek help for stress and anxiety, increasing adoption of your app.',
    disadvantage:'Existing mental health apps with strong branding and expert backing dominate the space.' },
  { id:'HT-02', domain:'health', premium:false, basePrice:5000, highestBid:5000,
    title:'Smart Medicine Reminder System',
    desc:'A smart pillbox connected to a mobile app that reminds users to take medicines and tracks whether doses are missed.',
    constraint:'Requires device setup and may be costly for some users.',
    advantage:'Doctors recommend or provide the pillbox to patients with long-term prescriptions, increasing adoption.',
    disadvantage:'Device failure or battery drain can disrupt reminders and reduce reliability.' },
  { id:'HT-03', domain:'health', premium:true, basePrice:10000, highestBid:10000,
    title:'Portable Health Check Kiosk',
    desc:'A compact machine placed in colleges, malls, or villages that can measure BP, heart rate, oxygen level, and temperature, and generate instant reports.',
    constraint:'Initial setup cost and regular maintenance required.',
    advantage:'Health initiatives fund or deploy kiosks in public areas, accelerating scaling. After tests, AI gives early risk prediction (e.g., heart risk, stress level), not just raw data.',
    disadvantage:'Users doubt readings compared to hospital-grade equipment, reducing trust.' },

  /* Travel & Tourism */
  { id:'TT-01', domain:'travel', premium:true, basePrice:10000, highestBid:10000,
    title:'Local Experience Marketplace',
    desc:'A platform that connects travelers with local hosts to discover authentic experiences like food tours, cultural activities, and hidden spots, offering a more personalized and immersive way to explore a destination.',
    constraint:'Ensuring consistent quality and safety across all local experiences is challenging as it depends on different individual hosts.',
    advantage:'Unique experiences go viral on reels, bringing organic growth and curiosity-driven users. Platform creates full travel plans combining local experiences based on user preferences.',
    disadvantage:'Big travel platforms introduce similar “local experiences” features with wider reach.' },
  { id:'TT-02', domain:'travel', premium:false, basePrice:5000, highestBid:5000,
    title:'Smart Ride Sharing for Tourists',
    desc:'A platform that connects tourists traveling in the same direction, enabling them to share rides, reduce costs, and make travel more convenient.',
    constraint:'Ensuring safety and trust between unknown travelers is a major challenge.',
    advantage:'AI matches tourists going to the same destination (airport, attractions), making travel smoother.',
    disadvantage:'Tourists hesitate to share rides with strangers due to security risks.' },
  { id:'TT-03', domain:'travel', premium:false, basePrice:5000, highestBid:5000,
    title:'Local Transport Pass App',
    desc:'A unified app that provides access to multiple local transport services (bus, metro, rentals) through a single digital pass for seamless travel.',
    constraint:'Integration with different transport systems and regulations can be complex and difficult to implement.',
    advantage:'City transport authorities partner with you for digital ticketing, boosting scale and credibility.',
    disadvantage:'Cities or big apps launch their own unified transport systems, reducing your uniqueness.' },

  /* Edtech */
  { id:'ET-01', domain:'edtech', premium:true, basePrice:10000, highestBid:10000,
    title:'Career Exploration Platform',
    desc:'A platform offering short documentaries, real-life career stories, and interactive career paths so students can understand what a career actually feels like.',
    constraint:'High-quality content production is time-consuming and requires consistent storytelling standards.',
    advantage:'Institutions adopt your platform for career guidance programs, increasing reach. Interactive simulations where students experience a career virtually (decisions, tasks, challenges).',
    disadvantage:'Career guidance apps and YouTube already provide similar content, reducing uniqueness.' },
  { id:'ET-02', domain:'edtech', premium:false, basePrice:5000, highestBid:5000,
    title:'Study Abroad Guidance Platform',
    desc:'A platform offering transparent guidance, university matching, SOP assistance, and scholarship tracking at an affordable cost.',
    constraint:'Requires constantly updated international data and strong credibility.',
    advantage:'Students prefer your platform over expensive consultants, driving adoption.',
    disadvantage:'Established consultancies offer offline support and personal guidance, attracting users.' }
];

export async function uploadSeedData() {
  console.log("Starting seed upload...");
  let count = 0;
  for (const ps of ALL_PS) {
    try {
      await setDoc(doc(db, "ideas", ps.id), ps);
      console.log(`Uploaded ${ps.id}`);
      count++;
    } catch (e) {
      console.error(`Error uploading ${ps.id}:`, e);
    }
  }
  console.log(`Seed complete! Uploaded ${count} ideas.`);
  alert(`Successfully seeded ${count} ideas to Firestore!`);
}

window.uploadSeedData = uploadSeedData;
