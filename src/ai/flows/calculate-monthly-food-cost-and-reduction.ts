'use server';
/**
 * @fileOverview This file defines a Genkit flow for calculating the estimated monthly food cost and providing a cost reduction plan.
 *
 * - calculateMonthlyFoodCostAndReduction - A function that takes a list of monthly essential items and returns the estimated cost and a cost reduction plan.
 * - MonthlyEssentialsInput - The input type for the calculateMonthlyFoodCostAndReduction function.
 * - MonthlyEssentialsOutput - The return type for the calculateMonthlyFoodCostAndReduction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MonthlyEssentialsInputSchema = z.object({
  items: z
    .array(z.string().describe('A monthly essential item'))
    .describe('List of monthly essential items'),
});
export type MonthlyEssentialsInput = z.infer<typeof MonthlyEssentialsInputSchema>;

const MonthlyEssentialsOutputSchema = z.object({
  estimatedCost: z
    .number()
    .describe('The estimated monthly food cost based on the provided items.'),
  costReductionPlan: z.string().describe(
    'A plan with suggestions for reducing costs by identifying duplications,
    opportunities for reduced expenses, without removing essential items.'
  ),
});
export type MonthlyEssentialsOutput = z.infer<typeof MonthlyEssentialsOutputSchema>;

export async function calculateMonthlyFoodCostAndReduction(
  input: MonthlyEssentialsInput
): Promise<MonthlyEssentialsOutput> {
  return calculateMonthlyFoodCostAndReductionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateMonthlyFoodCostAndReductionPrompt',
  input: {schema: MonthlyEssentialsInputSchema},
  output: {schema: MonthlyEssentialsOutputSchema},
  prompt: `You are a personal finance expert specializing in helping people save money on their monthly grocery bills.

You will receive a list of monthly essential items, estimate the total cost, and provide a detailed cost reduction plan. The cost reduction plan should focus on identifying potential duplications and opportunities for reduced expenses without removing essential items.

Monthly Essential Items:
{{#each items}}- {{{this}}}
{{/each}}


Output the estimated cost and cost reduction plan as a valid JSON object.
Ensure that the estimatedCost field is a number and the costReductionPlan is a string.
Follow the schema description in the output schema for formatting the response.
`,
});

const calculateMonthlyFoodCostAndReductionFlow = ai.defineFlow(
  {
    name: 'calculateMonthlyFoodCostAndReductionFlow',
    inputSchema: MonthlyEssentialsInputSchema,
    outputSchema: MonthlyEssentialsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
