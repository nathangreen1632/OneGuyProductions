import type { Order } from '../types/order';

export const mockOrders: Order[] = [
  {
    id: 1,
    customerId: 1001,
    name: 'Jordan Smith',
    email: 'jordan@example.com',
    businessName: 'PixelCraft Co.',
    projectType: 'Landing Page',
    budget: '$1,500',
    timeline: '2 weeks',
    description: 'Modern landing page for SaaS product launch.',
    status: 'in-progress',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    updatedAt: new Date().toISOString(),
    updates: [
      {
        user: 'engineer: dev@oneguy.com',
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        message: 'Initial wireframes delivered.',
      },
      {
        user: 'customer: jordan@example.com',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        message: 'Approved section layout and hero image.',
      },
    ],
  },
  {
    id: 2,
    customerId: 1002,
    name: 'Rachel Lee',
    email: 'rachel@example.com',
    businessName: 'Flourish Events',
    projectType: 'Portfolio Site',
    budget: '$2,000',
    timeline: '3 weeks',
    description: 'Elegant wedding planner portfolio with photo gallery.',
    status: 'needs-feedback',
    createdAt: new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString(), // ~4 days ago
    updatedAt: new Date().toISOString(),
    updates: [
      {
        user: 'engineer: dev@oneguy.com',
        timestamp: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString(),
        message: 'Submitted full prototype for review.',
      },
    ],
  },
  {
    id: 3,
    customerId: 1003,
    name: 'Anthony Rivera',
    email: 'anthony@example.com',
    businessName: 'Rivera Realty',
    projectType: 'Custom Web App',
    budget: '$5,000+',
    timeline: '6 weeks',
    description: 'Internal dashboard for real estate transactions.',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date().toISOString(),
    updates: [],
  },
  {
    id: 4,
    customerId: 1004,
    name: 'Maya Thompson',
    email: 'maya@example.com',
    businessName: 'Glow Studio',
    projectType: 'E-commerce',
    budget: '$3,500',
    timeline: '4 weeks',
    description: 'Complete redesign of beauty product storefront.',
    status: 'complete',
    createdAt: new Date(Date.now() - 300 * 60 * 60 * 1000).toISOString(), // ~12 days ago
    updatedAt: new Date(Date.now() - 260 * 60 * 60 * 1000).toISOString(),
    updates: [
      {
        user: 'engineer: dev@oneguy.com',
        timestamp: new Date(Date.now() - 290 * 60 * 60 * 1000).toISOString(),
        message: 'Launched site to production and verified payments.',
      },
    ],
  },
  {
    id: 5,
    customerId: 1005,
    name: 'Liam Johnson',
    email: 'admin@oneguyproductions.com',
    businessName: 'One Guy Productions',
    projectType: 'Video Portfolio',
    budget: '$4,000',
    timeline: '5 weeks',
    description: 'Showcase video production work with client testimonials.',
    status: 'in-progress',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updates: [
      {
        user: 'engineer: Nathan',
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        message: 'Draft video edits sent for review.',
      },
    ],
  },
];
