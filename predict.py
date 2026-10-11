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

        # Read input from command line argument or stdin
        if len(sys.argv) > 1:
            input_str = sys.argv[1]
        else:
            input_str = sys.stdin.read()
            
        input_data = json.loads(input_str)

        amount = float(input_data.get('amount', 0.0))
        time_input = input_data.get('time', '00:00')

        # Convert time to seconds from start of day if string, or float directly
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
            # Pad with 0.0 if not exactly 28 features
            v_features = list(v_features) + [0.0] * (28 - len(v_features))
            v_features = v_features[:28]

        # Construct final features list in training order: Time, V1-V28, Amount
        features = [time_seconds] + [float(v) for v in v_features] + [amount]

        # Convert to numpy array and reshape for single prediction
        features_arr = np.array(features).reshape(1, -1)

        # Scale features using the saved scaler
        features_scaled = scaler.transform(features_arr)

        # Run prediction
        prob = float(model.predict_proba(features_scaled)[0][1])
        fraud = bool(prob > 0.5)

        # Output prediction as JSON
        print(json.dumps({
            "fraud": fraud,
            "prob": prob
        }))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
