const sampleListings = [
  {
    title: "Cloud Kitchen Dinner Rush Packers",
    description:
      "Pack online food orders, label bags, coordinate with riders, and keep the dispatch counter clear during the 7 PM-10 PM dinner spike.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=70",
    },
    price: 150,
    roleType: "Order packer",
    workersNeeded: 3,
    shiftDate: new Date("2026-07-22"),
    startTime: "19:00",
    endTime: "22:00",
    skillTags: ["packing", "food safety", "dispatch"],
    location: "Indiranagar, Bengaluru",
    country: "India",
  },
  {
    title: "Cafe Morning Counter Support",
    description:
      "Help with order taking, table clearing, takeaway packing, and customer queue flow during the morning coffee rush.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=70",
    },
    price: 140,
    roleType: "Cafe helper",
    workersNeeded: 2,
    shiftDate: new Date("2026-07-23"),
    startTime: "08:00",
    endTime: "11:00",
    skillTags: ["counter", "queue handling", "cleaning"],
    location: "Koramangala, Bengaluru",
    country: "India",
  },
  {
    title: "Retail Weekend Billing Assistants",
    description:
      "Support the store team with billing queues, shelf restocking, trial room returns, and customer movement during weekend footfall.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=70",
    },
    price: 160,
    roleType: "Retail floor associate",
    workersNeeded: 4,
    shiftDate: new Date("2026-07-25"),
    startTime: "17:00",
    endTime: "21:00",
    skillTags: ["POS", "restocking", "customer support"],
    location: "Phoenix Marketcity, Mumbai",
    country: "India",
  },
  {
    title: "Pharmacy Evening Queue Support",
    description:
      "Organize pickup orders, manage customer queues, and assist the billing counter under the supervision of the pharmacy manager.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=70",
    },
    price: 145,
    roleType: "Pharmacy support",
    workersNeeded: 2,
    shiftDate: new Date("2026-07-24"),
    startTime: "18:00",
    endTime: "21:00",
    skillTags: ["queue handling", "billing support", "inventory"],
    location: "Aundh, Pune",
    country: "India",
  },
  {
    title: "Multiplex Showtime Crowd Crew",
    description:
      "Guide guests between screens, scan tickets, manage snack counter spillover, and support cleaning between back-to-back showtimes.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=70",
    },
    price: 155,
    roleType: "Cinema crew",
    workersNeeded: 5,
    shiftDate: new Date("2026-07-26"),
    startTime: "18:30",
    endTime: "22:30",
    skillTags: ["ticketing", "crowd flow", "cleaning"],
    location: "Noida Sector 18",
    country: "India",
  },
  {
    title: "College Fest Entry Desk Team",
    description:
      "Support registration, wristband distribution, guest directions, and stage-area queue control during the evening entry rush.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=70",
    },
    price: 180,
    roleType: "Event crew",
    workersNeeded: 8,
    shiftDate: new Date("2026-07-27"),
    startTime: "16:00",
    endTime: "20:00",
    skillTags: ["registration", "crowd control", "guest support"],
    location: "South Campus, Delhi",
    country: "India",
  },
];

module.exports = { data: sampleListings };
