'use server';

import {
  calculateMonthlyFoodCostAndReduction,
  type MonthlyEssentialsOutput,
} from '@/ai/flows/calculate-monthly-food-cost-and-reduction';

export async function getAiSuggestions(items: string[]): Promise<{
  success: boolean;
  data?: MonthlyEssentialsOutput;
  error?: string;
}> {
  if (items.length === 0) {
    return {
      success: false,
      error: 'Please add at least one item to get suggestions.',
    };
  }
  try {
    const result = await calculateMonthlyFoodCostAndReduction({ items });
    return { success: true, data: result };
  } catch (error) {
    console.error('AI suggestion error:', error);
    return {
      success: false,
      error:
        'An error occurred while generating suggestions. Please try again later.',
    };
  }
}
