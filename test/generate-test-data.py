import numpy as np
import json
import os
import pathlib
from pathlib import Path

# Get the script's directory and create data directory relative to it
script_dir = Path(__file__).parent
data_dir = script_dir / "data"
data_dir.mkdir(parents=True, exist_ok=True)

# Load existing records if any
records_file = script_dir / "records.json"
if os.path.exists(records_file):
    with open(records_file) as f:
        print(f"Loading records from {records_file}")
        records = json.load(f)
else:
    records = {}


def serialize_tail_values(data, dtype):
    if dtype in ["complex64", "complex128"]:
        float_dtype = np.float32 if dtype == "complex64" else np.float64
        flat_view = data.ravel().view(float_dtype)
        return flat_view[-5:].tolist()
    else:
        return data.ravel()[-5:].tolist()


# Generate test data for each combination
for dimensions in [(10,), (65, 65), (100, 100, 100), (4, 4, 4, 4, 4)]:
    for dtype in ["int8", "int16", "int64", "float16", "float32", "float64", "complex64", "complex128"]:
        name = f"./data/{'x'.join(str(i) for i in dimensions)}-{dtype}"

        # Skip if file already exists
        if name in records:
            continue

        if dtype in ["complex64", "complex128"]:
            real_part = np.random.randint(-128, 128, dimensions).astype(np.float64)
            imag_part = np.random.randint(-128, 128, dimensions).astype(np.float64)
            data = (real_part + 1j * imag_part).astype(dtype)
        else:
            data = np.random.randint(0, 255, dimensions).astype(dtype)

        # Store the last 5 values consistently for all types
        records[name] = serialize_tail_values(data, dtype)

        # Save file using the correct path
        file_path = script_dir / name.lstrip("./")
        file_path.parent.mkdir(parents=True, exist_ok=True)
        np.save(file_path, data)

# Save records in a pretty, sorted format
with open(records_file, 'w') as f:
    json.dump(
        records,
        f,
        indent=4,
        sort_keys=True
    )
