import sys
import json
import os
import warnings
warnings.filterwarnings('ignore')
import joblib
import numpy as np

def main():
    try:
        # Load model and scaler
        model_file = 'model.joblib'
        scaler_file = 'scaler.joblib'
        
        if not os.path.exists(model_file) or not os.path.exists(scaler_file):
            print(json.dumps({"error": "Model or scaler files not found. Please train the model first."}))
            sys.exit(1)
            
        model = joblib.load(model_file)
        scaler = joblib.load(scaler_file)

        # Read JSON input array from stdin
        input_str = sys.stdin.read()
        transactions = json.loads(input_str)
        
        if not isinstance(transactions, list):
            print(json.dumps({"error": "Input must be a JSON array of transactions."}))
            sys.exit(1)

        if len(transactions) == 0:
            print(json.dumps([]))
            return

        features_list = []
        for input_data in transactions:
            amount = float(input_data.get('amount', 0.0))
            time_input = input_data.get('time', '00:00')

            # Convert time to seconds
            if isinstance(time_input, str):
                try:
                    parts = time_input.split(':')
                    if len(parts) == 2:
                        hours, minutes = int(parts[0]), int(parts[1])
                        time_seconds = float(hours * 3600 + minutes * 60)
                    else:
                        time_seconds = float(time_input)
                except Exception:
                    time_seconds = 0.0
            else:
                time_seconds = float(time_input)

            # Get V1-V28 features
            v_features = input_data.get('features', [])
            if len(v_features) != 28:
                v_features = list(v_features) + [0.0] * (28 - len(v_features))
                v_features = v_features[:28]

            # Construct features in training order
            features = [time_seconds] + [float(v) for v in v_features] + [amount]
            features_list.append(features)

        # Convert to numpy array shape (N, 30)
        features_arr = np.array(features_list)

        # Scale all features at once
        features_scaled = scaler.transform(features_arr)

        # Run predictions
        probs = model.predict_proba(features_scaled)[:, 1]
        
        # Build results array
        results = []
        for prob in probs:
            p = float(prob)
            results.append({
                "fraud": bool(p > 0.5),
                "prob": p
            })

        print(json.dumps(results))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
