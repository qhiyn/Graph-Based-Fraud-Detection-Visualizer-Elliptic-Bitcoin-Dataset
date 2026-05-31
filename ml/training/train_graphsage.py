"""Train GraphSAGE on the full Elliptic transaction graph (CPU-first).

Known labels only in the loss (illicit=1, licit=0); unknown nodes (y=-1) still
pass messages but never contribute to the loss. Early stopping on validation
average precision. Saves the best checkpoint and per-node GNN probabilities.

Usage:  python training/train_graphsage.py
"""

from __future__ import annotations

import os
import sys

import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from sklearn.metrics import average_precision_score

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "preprocessing"))
sys.path.insert(0, os.path.dirname(__file__))

import load_elliptic as le  # noqa: E402
import graphsage_config as cfg  # noqa: E402
from models import GraphSAGE  # noqa: E402

LABEL_TO_Y = {le.LABEL_ILLICIT: 1, le.LABEL_LICIT: 0, le.LABEL_UNKNOWN: -1}


def build_data(device):
    """Build node features, edge_index, labels and time-aware masks."""
    meta, X = le.load_full_node_matrix()
    classes = le.load_classes()
    label_of = dict(zip(classes["id"], classes["classLabel"]))
    y = np.array([LABEL_TO_Y.get(label_of.get(i, le.LABEL_UNKNOWN), -1) for i in meta["id"]], dtype=np.int64)

    id_to_idx = {node_id: k for k, node_id in enumerate(meta["id"])}
    edges = le.load_edges()
    src = edges["source"].map(id_to_idx)
    tgt = edges["target"].map(id_to_idx)
    valid = src.notna() & tgt.notna()
    ei = np.stack([src[valid].to_numpy(dtype=np.int64), tgt[valid].to_numpy(dtype=np.int64)])
    if cfg.UNDIRECTED_MESSAGE_PASSING:
        ei = np.concatenate([ei, ei[::-1]], axis=1)

    ts = meta["timeStep"].to_numpy()
    known = y >= 0
    train_mask = known & (ts <= cfg.TRAIN_TIME_MAX)
    val_mask = known & (ts >= cfg.VAL_TIME_RANGE[0]) & (ts <= cfg.VAL_TIME_RANGE[1])
    test_mask = known & (ts >= cfg.TEST_TIME_MIN)

    x = torch.tensor(X, dtype=torch.float32, device=device)
    edge_index = torch.tensor(ei, dtype=torch.long, device=device)
    y_t = torch.tensor(y, dtype=torch.long, device=device)
    masks = {k: torch.tensor(m, dtype=torch.bool, device=device)
             for k, m in (("train", train_mask), ("val", val_mask), ("test", test_mask))}
    return meta, x, edge_index, y_t, masks, y


def main() -> None:
    torch.manual_seed(cfg.RANDOM_SEED)
    np.random.seed(cfg.RANDOM_SEED)
    device = cfg.get_device()
    print(f"Device: {device}")

    meta, x, edge_index, y, masks, y_np = build_data(device)
    print(f"Graph: {x.shape[0]} nodes, {edge_index.shape[1]} edges (undirected={cfg.UNDIRECTED_MESSAGE_PASSING})")
    for k in ("train", "val", "test"):
        m = masks[k]
        ill = int((y[m] == 1).sum())
        print(f"  {k:5s}: {int(m.sum()):>6} known (illicit={ill}, licit={int(m.sum()) - ill})")

    # Class weights from the training split (handle imbalance)
    y_train = y[masks["train"]]
    counts = torch.bincount(y_train, minlength=2).float()
    class_weights = (counts.sum() / (2.0 * counts)).to(device)

    model = GraphSAGE(x.shape[1], cfg.HIDDEN_CHANNELS, 2, cfg.NUM_LAYERS, cfg.DROPOUT).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=cfg.LEARNING_RATE, weight_decay=cfg.WEIGHT_DECAY)

    best_ap, best_state, patience = -1.0, None, 0
    for epoch in range(1, cfg.EPOCHS + 1):
        model.train()
        optimizer.zero_grad()
        out = model(x, edge_index)
        loss = F.cross_entropy(out[masks["train"]], y[masks["train"]], weight=class_weights)
        loss.backward()
        optimizer.step()

        model.eval()
        with torch.no_grad():
            prob = F.softmax(model(x, edge_index), dim=1)[:, 1]
        val_prob = prob[masks["val"]].cpu().numpy()
        val_true = y[masks["val"]].cpu().numpy()
        val_ap = average_precision_score(val_true, val_prob)

        if val_ap > best_ap:
            best_ap, best_state, patience = val_ap, {k: v.cpu().clone() for k, v in model.state_dict().items()}, 0
        else:
            patience += 1
        if epoch % 10 == 0 or epoch == 1:
            print(f"  epoch {epoch:3d}  loss={loss.item():.4f}  val_AP={val_ap:.4f}  best={best_ap:.4f}")
        if patience >= cfg.PATIENCE:
            print(f"  early stop at epoch {epoch} (best val_AP={best_ap:.4f})")
            break

    model.load_state_dict(best_state)
    os.makedirs(os.path.dirname(cfg.MODEL_OUTPUT_PATH), exist_ok=True)
    torch.save({"state_dict": best_state, "in_channels": x.shape[1],
                "hidden": cfg.HIDDEN_CHANNELS, "num_layers": cfg.NUM_LAYERS}, cfg.MODEL_OUTPUT_PATH)
    print(f"Saved model -> {os.path.relpath(cfg.MODEL_OUTPUT_PATH)} (best val_AP={best_ap:.4f})")

    # Per-node GNN probabilities for all nodes (incl. unknown)
    model.eval()
    with torch.no_grad():
        prob_all = F.softmax(model(x, edge_index), dim=1)[:, 1].cpu().numpy()
    classes = le.load_classes()
    label_of = dict(zip(classes["id"], classes["classLabel"]))
    out_df = pd.DataFrame({
        "originalTxId": meta["originalTxId"].to_numpy(),
        "id": meta["id"].to_numpy(),
        "timeStep": meta["timeStep"].to_numpy(),
        "classLabel": [label_of.get(i, le.LABEL_UNKNOWN) for i in meta["id"]],
    })
    out_df["knownLabel"] = out_df["classLabel"].isin([le.LABEL_ILLICIT, le.LABEL_LICIT])
    out_df["gnnProbability"] = np.round(prob_all, 4)
    out_df["gnnPredictedLabel"] = np.where(out_df["gnnProbability"] >= cfg.THRESHOLD, le.LABEL_ILLICIT, le.LABEL_LICIT)
    os.makedirs(os.path.dirname(cfg.PREDICTIONS_PATH), exist_ok=True)
    out_df.to_csv(cfg.PREDICTIONS_PATH, index=False)
    print(f"Saved predictions -> {os.path.relpath(cfg.PREDICTIONS_PATH)} ({len(out_df)} nodes)")


if __name__ == "__main__":
    main()
