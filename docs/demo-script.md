# Demo Script

A ~5-minute walkthrough for presenting the project. Phrasing is suggested, not scripted word-for-word.

## 1. Open the landing page
"This is a Graph-Based Fraud Detection Visualizer built on the Elliptic Bitcoin dataset. Each node is a Bitcoin transaction and each edge is a transaction-flow relationship."

## 2. Explain the problem
"Fraud analysts can only review a limited number of flagged transactions, so what matters most is ranking — which transactions to inspect first — not just raw accuracy."

## 3. Open the dashboard
"The graph shows a fraud-focused sample of about 1,000 transactions. Red nodes are high predicted risk; dashed gray borders mark unknown — unlabeled — transactions."

## 4. Show the model comparison
"I trained two models offline: a Logistic Regression baseline on the transaction features, and a GraphSAGE GNN that also uses graph neighborhood structure."

## 5. Explain the ROC-AUC vs Precision@K tradeoff
"Honestly, Logistic Regression has the higher ROC-AUC — 0.855 vs 0.796. But GraphSAGE is far better where it counts: Average Precision 0.43 vs 0.20, and Precision@50 of 0.94 vs 0.06. In the top 50 flagged transactions, GraphSAGE finds ~94% truly illicit versus ~6% for the baseline."

## 6. Filter high-risk transactions
"Using the High-risk view mode, I can focus on just the high-risk nodes and their connections."

## 7. Click a suspicious transaction
"Clicking a node opens the detail panel: true label, predicted label, baseline and GraphSAGE probabilities, risk level, and a neighborhood summary."

## 8. Focus the 1-hop / 2-hop neighborhood
"I can focus the selected node's neighborhood at 1 or 2 hops to see the local transaction structure GraphSAGE aggregates over."

## 9. Explain the unknown-label warning
"If the transaction is unknown, the panel warns that unknown is unlabeled — not safe. We never treat unknown as licit."

## 10. Show the model-disagreement badge
"Where the baseline and GraphSAGE strongly disagree, the node is flagged 'needs analyst review' — a useful triage signal."

## 11. Open the suspicious-region view
"The suspicious-region mode centers the graph on the top transactions by GraphSAGE probability plus their neighbors."

## 12. Run a simulation
"In simulation mode I inject a hypothetical transaction and connect it to high-risk targets. It appears as a dashed purple diamond, and I get an estimated risk score from its neighborhood."

## 13. Explain that simulation is heuristic
"Important: this is a heuristic what-if score — a weighted blend of neighbor risk signals. It does not run or retrain GraphSAGE."

## 14. End with limitations and future work
"This is a portfolio project, not a production enforcement system — risk scores indicate patterns, not confirmed wrongdoing. Next steps include threshold tuning, attention-based and temporal GNNs, and an analyst feedback loop."
