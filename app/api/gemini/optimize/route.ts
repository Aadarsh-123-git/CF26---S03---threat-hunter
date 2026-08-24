import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cityName, scenarioName, comparisonMetrics, recommendedInterventions, totalCostINR } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are URBANPULSE's AI Emergency Response Coordinator.
Review the mathematically optimized intervention sequence produced by the URBANPULSE knapsack/graph solver and provide an operational tactical briefing for city incident commanders.

City: ${cityName}
Scenario: ${scenarioName}
Optimization Outcomes:
- Affected Services: Reduced from ${comparisonMetrics.affectedServicesBefore} to ${comparisonMetrics.affectedServicesAfter} (Saved: ${comparisonMetrics.affectedServicesDelta})
- City Resilience Score: Improved from ${comparisonMetrics.resilienceBefore} to ${comparisonMetrics.resilienceAfter} (+${comparisonMetrics.resilienceDelta} pts)
- Estimated Recovery Time: Reduced from ${comparisonMetrics.recoveryTimeBeforeMin}m to ${comparisonMetrics.recoveryTimeAfterMin}m (${comparisonMetrics.recoveryTimeImprovementPercent}% faster)
- Population Protected: ${comparisonMetrics.populationSaved?.toLocaleString()} citizens
- Total Allocated Budget: ₹${totalCostINR?.toLocaleString()}

Recommended Interventions:
${JSON.stringify(recommendedInterventions, null, 2)}

Provide:
1. Executive Incident Command Directive
2. Phased Action Plan (Priority 1 immediate dispatch, Priority 2 containment, Priority 3 secondary stabilization)
3. Justification for why upstream intervention outperforms conventional localized fixes.
Keep it crisp, actionable, and formatted in clear markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      });

      return NextResponse.json({
        strategy: response.text,
        source: 'Gemini 3.7 Flash Decision Support',
        generatedAt: new Date().toISOString(),
      });
    }

    // High-fidelity fallback
    const topAction = recommendedInterventions?.[0];
    const fallbackText = `### Tactical Response Directive: Coordinated Incident Response

**1. Primary Upstream Directive (Priority 1)**
Deploy emergency substation restoration crews immediately to **${topAction?.name || 'Upstream Power Substation'}** (Allocated: ₹${(topAction?.costINR || 500000).toLocaleString()}). By addressing the root-cause feeder at $t=15\\text{m}$, the system isolates downstream propagation to dependent hospitals and transit networks.

**2. Secondary Containment & Lifeline Protection (Priority 2 & 3)**
- **Priority 2:** Activate auxiliary diesel generation and prioritize hospital power grid connection to maintain Level-1 emergency trauma readiness.
- **Priority 3:** Dispatch municipal traffic controllers to key arterial bottlenecks to maintain dedicated emergency transit corridors.

**3. Quantitative Impact Synthesis**
- **Resilience Recovery:** +${comparisonMetrics.resilienceDelta} points improvement (${comparisonMetrics.resilienceBefore} $\\to$ ${comparisonMetrics.resilienceAfter}/100)
- **Time to Restoration:** ${comparisonMetrics.recoveryTimeImprovementPercent}% faster city-wide recovery (${comparisonMetrics.recoveryTimeBeforeMin} min $\\to$ ${comparisonMetrics.recoveryTimeAfterMin} min)
- **Citizen Exposure Reduction:** Protected ${(comparisonMetrics.populationSaved || 0).toLocaleString()} residents from prolonged outage.`;

    return NextResponse.json({
      strategy: fallbackText,
      source: 'URBANPULSE Optimization Intelligence',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating optimization strategy:', error);
    return NextResponse.json(
      { error: 'Failed to generate strategy', details: String(error) },
      { status: 500 }
    );
  }
}
