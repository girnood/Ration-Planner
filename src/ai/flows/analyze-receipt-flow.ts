'use server';
/**
 * @fileOverview A Genkit flow for analyzing a receipt image and extracting line items.
 * 
 * - analyzeReceipt - A function that takes a receipt image and returns the extracted items.
 * - AnalyzeReceiptInput - The input type for the analyzeReceipt function.
 * - AnalyzeReceiptOutput - The return type for the analyzeReceipt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeReceiptInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeReceiptInput = z.infer<typeof AnalyzeReceiptInputSchema>;

const ExtractedItemSchema = z.object({
    name: z.string().describe('The name of the item purchased.'),
    quantity: z.number().describe('The quantity of the item purchased.'),
    price: z.number().optional().describe('The unit price of the item.'),
});

const AnalyzeReceiptOutputSchema = z.object({
    items: z.array(ExtractedItemSchema).describe('An array of items extracted from the receipt.')
});
export type AnalyzeReceiptOutput = z.infer<typeof AnalyzeReceiptOutputSchema>;


export async function analyzeReceipt(input: AnalyzeReceiptInput): Promise<AnalyzeReceiptOutput> {
  return analyzeReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeReceiptPrompt',
  input: {schema: AnalyzeReceiptInputSchema},
  output: {schema: AnalyzeReceiptOutputSchema},
  prompt: `You are an expert receipt reader. Your task is to analyze the provided receipt image and extract all line items, including their name, quantity, and price if available.

Please ignore taxes, discounts, totals, and any other information that is not a purchased item.

Analyze the following receipt:
{{media url=photoDataUri}}

Output the extracted items as a valid JSON object that adheres to the defined output schema.
`,
});

const analyzeReceiptFlow = ai.defineFlow(
  {
    name: 'analyzeReceiptFlow',
    inputSchema: AnalyzeReceiptInputSchema,
    outputSchema: AnalyzeReceiptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
