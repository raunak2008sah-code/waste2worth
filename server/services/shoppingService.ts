// Section 13: Optional Product Recommendations Service Layer
// Cleanly isolates external commerce integrations. Purchases are ALWAYS optional.

export interface ProductRecommendationRequest {
  itemName: string;
  category: string;
  projectId?: string;
  userLocation?: string;
}

export interface ProductRecommendationOption {
  type: 'buy' | 'find_locally' | 'use_alternative' | 'ask_community';
  title: string;
  description: string;
  actionLabel: string;
  url?: string;
  priceEstimate?: string;
  providerName?: string;
}

export interface ItemSolution {
  itemName: string;
  options: ProductRecommendationOption[];
}

class ShoppingService {
  async getOptionsForItem(request: ProductRecommendationRequest): Promise<ItemSolution> {
    const item = request.itemName.toLowerCase();

    const options: ProductRecommendationOption[] = [
      {
        type: 'use_alternative',
        title: '🌱 Zero-Cost Sustainable Alternative (Recommended)',
        description: item.includes('glue')
          ? 'Use homemade flour-and-water starch paste, double-sided tape, or paper clips.'
          : item.includes('paint')
          ? 'Use natural coffee/tea stain, turmeric powder wash, or salvaged magazine collage.'
          : 'Check household drawers for repurposable items before purchasing anything new.',
        actionLabel: 'View Alternative Guide'
      },
      {
        type: 'ask_community',
        title: '👥 Ask the Community on Idea Hub',
        description: `Check if nearby members have leftover ${request.itemName} they can share or lend.`,
        actionLabel: 'Post to Idea Hub'
      },
      {
        type: 'find_locally',
        title: '🏪 Find at Neighborhood Hardware / Stationery Store',
        description: 'Support local mom-and-pop shops and save shipping transit carbon.',
        actionLabel: 'Locate Nearby Stores',
        priceEstimate: item.includes('glue') ? '₹30 – ₹60' : '₹50 – ₹120'
      },
      {
        type: 'buy',
        title: '🛒 Eco-Friendly Certified Online Retailer (Optional)',
        description: 'Order certified non-toxic, solvent-free supplies with minimal packaging.',
        actionLabel: 'Explore Online Options',
        priceEstimate: item.includes('glue') ? '₹75' : '₹150',
        providerName: 'GreenSupply Co.'
      }
    ];

    return {
      itemName: request.itemName,
      options
    };
  }
}

export const shoppingService = new ShoppingService();
