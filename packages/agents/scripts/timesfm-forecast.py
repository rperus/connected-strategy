import sys
import json
import logging
import torch

# Configure minimal logging
logging.basicConfig(level=logging.ERROR)

def main():
    try:
        from timesfm import TimesFm
    except ImportError as e:
        print(json.dumps({"error": f"Failed to import timesfm: {e}"}))
        sys.exit(1)

    # Read input JSON from stdin
    input_data = sys.stdin.read().strip()
    if not input_data:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)

    try:
        data = json.loads(input_data)
        metrics = data.get('metrics', {})
        horizon = data.get('horizon', 3)
        context_len = data.get('context_len', 32)
        
        # Initialize model (TimesFM-1.0-200m)
        tfm = TimesFm(
            context_len=context_len,
            horizon_len=horizon,
            input_patch_len=32,
            output_patch_len=128,
            num_layers=20,
            model_dims=1280,
            backend="cpu"  # Force CPU for local control tower reliability
        )
        
        # Load the checkpoint from Hugging Face
        # We silence warnings to avoid breaking JSON output
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            tfm.load_from_checkpoint(repo_id="google/timesfm-1.0-200m")

        results = {}
        for key, values in metrics.items():
            if len(values) < 2:
                # If there's less than 2 points, zero-shot forecasting is basically flat.
                # But TimesFM can still run if we pad it, but to be safe we might skip or duplicate
                if len(values) == 1:
                    values = [values[0], values[0]]
                elif len(values) == 0:
                    values = [0, 0]

            # TimesFM expects a list of arrays (batch dimension)
            forecast_result = tfm.forecast([values])
            
            # The result is a tuple (point_forecast, expected_tensor)
            # Or in newer versions, a tuple of arrays: forecast_values
            # Let's handle the return format carefully.
            # forecast() returns (point_forecast, experimental_quantiles)
            # point_forecast shape is (batch_size, horizon_len)
            point_forecast = forecast_result[0][0]
            
            results[key] = [float(x) for x in point_forecast]
            
        print(json.dumps({"success": True, "forecasts": results}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
