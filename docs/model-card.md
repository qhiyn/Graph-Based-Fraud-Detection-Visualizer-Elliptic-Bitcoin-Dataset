# Model Card

Two models are trained offline on the Elliptic Bitcoin dataset and evaluated on the same time-aware split (train time steps ≤ 34, validation 35–41, test ≥ 42). Metrics are computed on **known labels only**; `unknown` nodes are never used as ground truth.

## Logistic Regression Baseline

- **Input features:** the 165 anonymized node features only (no graph structure).
- **Training labels:** known nodes only — `illicit = 1`, `licit = 0`. `unknown` excluded.
- **Pipeline:** `StandardScaler` → `LogisticRegression(class_weight="balanced", max_iter=2000)`.
- **Time-aware split:** train ≤ 34, validation 35–41, test ≥ 42 (stratified fallback if a split is single-class; not needed here).
- **Strengths:** simple, fast, interpretable; strong overall ROC-AUC; a transparent reference point.
- **Weaknesses:** ignores graph structure; over-flags licit transactions at threshold 0.5 (low precision); weak at top-K prioritization.

**Test metrics:** ROC-AUC **0.855** · Average Precision 0.200 · F1 0.212 · Precision 0.123 · Recall 0.797 · Precision@50 0.06 · Precision@100 0.15.

## GraphSAGE GNN

- **Graph representation:** the full transaction graph (203,769 nodes, directed edges symmetrized for message passing).
- **Architecture:** 2 × `SAGEConv`, hidden dim 64, ReLU + dropout 0.4, 2-class output.
- **Message passing idea:** each transaction's representation aggregates information from its neighboring transactions, so risk signal propagates through transaction-flow structure that a feature-only model cannot see.
- **Training:** class-weighted cross-entropy on known training nodes; Adam (lr 0.005, weight decay 5e-4); early stopping on validation average precision.
- **Unknown-label handling:** `unknown` nodes (y = −1) **pass messages** through the graph but are **excluded from the loss and all metrics**. They still receive a probability for visualization, but their true label stays `unknown`.
- **Strengths:** much stronger ranking of the most suspicious transactions (Average Precision, Precision@K); uses relational structure.
- **Weaknesses:** slightly lower ROC-AUC than the baseline on this temporal split; full-batch training does not scale to very large graphs without neighbor sampling; sensitive to the split and hyperparameters.

**Test metrics:** ROC-AUC 0.796 · Average Precision **0.429** · F1 0.223 · Precision 0.135 · Recall 0.652 · Precision@50 **0.94** · Precision@100 **0.89**.

## Baseline vs GraphSAGE Interpretation

| Metric | Logistic Regression | GraphSAGE | Better |
|---|---|---|---|
| ROC-AUC | **0.855** | 0.796 | Baseline |
| Average Precision | 0.200 | **0.429** | GraphSAGE |
| Precision@50 | 0.06 | **0.94** | GraphSAGE |
| Precision@100 | 0.15 | **0.89** | GraphSAGE |

- **Logistic Regression has the better ROC-AUC**, and we report that honestly.
- **GraphSAGE has much better Average Precision and Precision@K** — it ranks the truly illicit transactions far higher.
- **Precision@K is the metric that matters for analyst workflows:** fraud analysts can only review a limited number of flagged transactions, so the quality of the top-K ranking is what drives real-world value. At the top 50, GraphSAGE finds ~94% truly illicit versus ~6% for the baseline.
- ROC-AUC is a weak signal on heavily imbalanced data, which is why a lower ROC-AUC can coincide with a far more useful model. **GraphSAGE is the better model for prioritizing top suspicious transactions.**

## Ethical note

Predictions indicate risk patterns in benchmark data. They are not proof of illegal activity and must not drive legal or enforcement decisions. See [limitations.md](limitations.md).
