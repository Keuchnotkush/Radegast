"""Majority vote across provider responses."""
from collections import Counter
from typing import List

from shared.types import RiskOutput, RiskLabel, ConsensusResult


def compute_consensus(outputs: List[RiskOutput]) -> ConsensusResult:
    """
    Majority vote on risk_label.
    Score = average of all risk_scores.
    Confidence = agreed / total.
    """
    total = len(outputs)
    assert total >= 2, f"Need at least 2 outputs, got {total}"

    # Majority vote on label
    labels = [o.risk_label for o in outputs]
    label_counts = Counter(labels)
    consensus_label, agreed = label_counts.most_common(1)[0]

    # Average score
    consensus_score = sum(o.risk_score for o in outputs) / total

    # Confidence
    confidence = round(agreed / total, 2)

    # Merge top_factors (deduplicated, ordered by frequency)
    all_factors = []
    for o in outputs:
        all_factors.extend(o.top_factors)
    factor_counts = Counter(all_factors)
    top_factors = [f for f, _ in factor_counts.most_common(3)]

    return ConsensusResult(
        consensus_label=consensus_label,
        consensus_score=round(consensus_score, 1),
        confidence=confidence,
        providers_agreed=f"{agreed}/{total}",
    )
