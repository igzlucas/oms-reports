
'use server';

/**
 * @fileOverview A flow for providing intelligent profit analysis for store owners.
 *
 * - generateProfitAnalysis - A function that generates profit analysis based on product costs and market data.
 * - ProfitAnalysisInput - The input type for the generateProfitAnalysis function.
 * - ProfitAnalysisOutput - The return type for the generateProfitAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProfitAnalysisInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  costPrice: z.number().describe('The cost of acquiring one unit of the product (what the seller paid).'),
  sellingPrice: z.number().describe('The current selling price of one unit of the product.'),
  desiredProfitMargin: z
    .number()
    .describe('The desired profit margin in percentage (e.g., 20 for 20%).'),
  competitorPrice: z.number().optional().describe('The average price of the same product from competitors.'),
  demandAdjustment: z
    .number()
    .optional()
    .describe('A percentage adjustment based on seasonal demand (e.g., 15 for a 15% potential price increase).'),
});
export type ProfitAnalysisInput = z.infer<typeof ProfitAnalysisInputSchema>;

const ProfitAnalysisOutputSchema = z.object({
  suggestedSellingPrice: z.number().describe('The suggested selling price to achieve the desired profit margin and stay competitive.'),
  analysisMessage: z
    .string()
    .describe(
      'A detailed analysis and justification for the suggested price, considering all input factors.'
    ),
  projectedProfitPerUnit: z.number().describe('The projected profit per unit sold at the suggested price, calculated from the costPrice.'),
});
export type ProfitAnalysisOutput = z.infer<typeof ProfitAnalysisOutputSchema>;

export async function generateProfitAnalysis(
  input: ProfitAnalysisInput
): Promise<ProfitAnalysisOutput> {
  return profitAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'profitAnalysisPrompt',
  input: {schema: ProfitAnalysisInputSchema},
  output: {schema: ProfitAnalysisOutputSchema},
  prompt: `You are an expert business analyst AI specializing in retail pricing and profit maximization for small business owners.

  Analyze the following data for the product to suggest an optimal selling price:

  - Product Name: {{productName}}
  - Cost to Seller (Acquisition Cost): \${{costPrice}}
  - Current Selling Price: \${{sellingPrice}}
  - Desired Profit Margin: {{desiredProfitMargin}}%
  {{#if competitorPrice}}
  - Competitor's Price: \${{competitorPrice}}
  {{/if}}
  {{#if demandAdjustment}}
  - Potential Price Adjustment due to High Demand: {{demandAdjustment}}%
  {{/if}}

  Your goal is to calculate a 'suggestedSellingPrice' that meets the 'desiredProfitMargin' based on the 'costPrice'. You must also consider the market context (like competitor pricing and seasonal demand adjustments).

  Your 'analysisMessage' should be encouraging and insightful, in Spanish. Explain your reasoning clearly. For example, if the competitor's price is much lower, advise the user on whether matching it is feasible or if they should focus on other value propositions. If there's a demand adjustment, explain how the price could be increased to capitalize on it.

  Calculate the 'projectedProfitPerUnit' based on your suggested price and the original 'costPrice'.

  Example Output Structure:
  {
    "suggestedSellingPrice": 149.99,
    "analysisMessage": "Para alcanzar tu objetivo de ganancia del 50%, te sugiero un precio de venta de $149.99. Esto te da una ganancia sólida de $50.00 por unidad, basado en tu costo de $99.99. Este precio es competitivo, ya que se encuentra ligeramente por debajo del precio de tu competencia de $155.00, lo que podría atraer a más clientes.",
    "projectedProfitPerUnit": 50.00
  }
  
  Provide a detailed and actionable analysis.`,
});

const profitAnalysisFlow = ai.defineFlow(
  {
    name: 'profitAnalysisFlow',
    inputSchema: ProfitAnalysisInputSchema,
    outputSchema: ProfitAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
