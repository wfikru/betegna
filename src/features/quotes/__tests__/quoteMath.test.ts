import { computeQuoteTotals, platformFee, proNetEarnings } from '../quoteMath';

describe('quote math', () => {
  it('sums lines, applies discount before tax', () => {
    const t = computeQuoteTotals(
      [
        { label: 'Labor', kind: 'labor', amount: 1000 },
        { label: 'Materials', kind: 'material', amount: 500 },
      ],
      200,
      15,
    );
    expect(t.subtotal).toBe(1500);
    expect(t.discount).toBe(200);
    expect(t.tax).toBe(195); // (1300 * 0.15)
    expect(t.total).toBe(1495);
  });

  it('ignores empty-label and zero/negative lines', () => {
    const t = computeQuoteTotals(
      [
        { label: '', kind: 'labor', amount: 999 },
        { label: 'Labor', kind: 'labor', amount: 0 },
        { label: 'Valid', kind: 'fee', amount: 300 },
      ],
      0,
      0,
    );
    expect(t.subtotal).toBe(300);
    expect(t.total).toBe(300);
  });

  it('caps discount at subtotal and tax at 30%', () => {
    const t = computeQuoteTotals([{ label: 'Labor', kind: 'labor', amount: 400 }], 1000, 90);
    expect(t.discount).toBe(400);
    expect(t.total).toBe(0);
  });

  it('handles garbage numeric input safely', () => {
    const t = computeQuoteTotals(
      [
        { label: 'A', kind: 'labor', amount: Number('x') },
        { label: 'B', kind: 'labor', amount: -50 },
      ],
      Number('q'),
      Number('z'),
    );
    expect(t.subtotal).toBe(0);
    expect(t.total).toBe(0);
  });

  it('computes platform fee and pro earnings', () => {
    expect(platformFee(1000, 12)).toBe(120);
    expect(proNetEarnings(1000, 12)).toBe(880);
  });
});
