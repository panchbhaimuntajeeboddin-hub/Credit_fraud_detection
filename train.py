import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib
import os

def main():
    # 1. Load the dataset
    csv_path = 'creditcard.csv'
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found in current directory.")
        return

    print("Loading dataset...")
    df = pd.read_csv(csv_path)
    print(f"Dataset shape: {df.shape}")

    # 2. Extract features and target
    # The columns should be: Time, V1-V28, Amount, Class
    X = df.drop(columns=['Class'])
    y = df['Class']

    # Keep track of feature columns to ensure consistency
    feature_names = list(X.columns)
    print("Features in training:", feature_names)

    # 3. Scale features
    print("Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 4. Train-Test Split (stratified to maintain fraud/legit ratio)
    print("Splitting train and test sets...")
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, stratify=y, random_state=42
    )

    # 5. Train the Random Forest Classifier
    # We use class_weight='balanced' to handle the imbalanced dataset
    # We set max_depth and n_estimators to reasonable sizes for fast and accurate results
    print("Training Random Forest Classifier (class_weight='balanced')...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    print("Training completed.")

    # 6. Evaluate the model
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("\n--- Confusion Matrix ---")
    print(confusion_matrix(y_test, y_pred))

    print("\n--- Classification Report ---")
    print(classification_report(y_test, y_pred, digits=4))

    print("\n--- ROC-AUC Score ---")
    print(f"{roc_auc_score(y_test, y_prob):.4f}")

    # 7. Save model, scaler and metrics
    model_file = 'model.joblib'
    scaler_file = 'scaler.joblib'
    metrics_file = 'model_metrics.json'
    
    print(f"Saving model to {model_file}...")
    joblib.dump(model, model_file)
    
    print(f"Saving scaler to {scaler_file}...")
    joblib.dump(scaler, scaler_file)
    
    # Calculate values for metrics file
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    metrics_dict = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)) * 100, 2),
        "precision": round(float(precision_score(y_test, y_pred)) * 100, 2),
        "recall": round(float(recall_score(y_test, y_pred)) * 100, 2),
        "f1_score": round(float(f1_score(y_test, y_pred)) * 100, 2),
        "roc_auc": round(float(roc_auc_score(y_test, y_prob)) * 100, 2),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp)
        }
    }
    import json
    print(f"Saving metrics to {metrics_file}...")
    with open(metrics_file, 'w') as f:
        json.dump(metrics_dict, f, indent=2)
    
    # Save the feature names order for reference
    with open('feature_names.txt', 'w') as f:
        f.write('\n'.join(feature_names))

    print("All saved successfully!")

if __name__ == '__main__':
    main()
